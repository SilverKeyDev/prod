"""Tests for PostHog endpoint sync validation helpers."""

from __future__ import annotations

import os
from unittest.mock import MagicMock, patch

import pytest

from scripts.endpoints.github_actions_log import fail
from scripts.endpoints.posthog_sync_validate import (
    validate_batch_response,
    validate_key_prefix,
    validate_observed_traffic,
    validate_secret_present,
    verify_inventory_sync_ingested,
)


def _verify_query_response(inventory_syncs: int, dead_route_events: int) -> MagicMock:
    response = MagicMock()
    response.raise_for_status = MagicMock()
    response.json.return_value = {"results": [[inventory_syncs, dead_route_events]]}
    return response


def test_validate_secret_present_rejects_empty():
    with pytest.raises(SystemExit) as exc:
        validate_secret_present("POSTHOG_QUERY_API_KEY", "")
    assert exc.value.code == 1


def test_validate_secret_present_rejects_placeholder():
    with pytest.raises(SystemExit) as exc:
        validate_secret_present("POSTHOG_PROJECT_TOKEN", "pytest-stub-posthog-not-for-production")
    assert exc.value.code == 1


def test_validate_secret_present_accepts_key():
    assert (
        validate_secret_present("POSTHOG_PROJECT_TOKEN", "phc_test_key_123") == "phc_test_key_123"
    )


def test_validate_key_prefix_rejects_bad_format():
    with pytest.raises(SystemExit):
        validate_key_prefix("POSTHOG_PROJECT_TOKEN", "sk_live_abc", prefixes=("phc_",))


def test_validate_observed_traffic_fails_in_ci_when_zero_observed():
    with patch.dict(os.environ, {"GITHUB_ACTIONS": "true"}, clear=False):
        with pytest.raises(SystemExit):
            validate_observed_traffic(0, 100)


def test_validate_observed_traffic_allows_zero_observed_locally():
    with patch.dict(os.environ, {}, clear=False):
        os.environ.pop("GITHUB_ACTIONS", None)
        validate_observed_traffic(0, 100)


def test_validate_batch_response_accepts_ok_status():
    response = MagicMock()
    response.ok = True
    response.status_code = 200
    response.json.return_value = {"status": "Ok"}
    response.raise_for_status = MagicMock()
    validate_batch_response(response, expected_events=3)


def test_verify_inventory_sync_skips_outside_ci():
    with patch.dict(os.environ, {}, clear=False):
        os.environ.pop("GITHUB_ACTIONS", None)
        with patch("scripts.endpoints.posthog_sync_validate.requests.post") as post:
            verify_inventory_sync_ingested(
                "phx_key",
                posthog_query_url="https://example/query/",
                deploy_sha="abc123",
                expected_dead_count=0,
            )
    post.assert_not_called()


def test_verify_inventory_sync_tolerates_ingest_lag():
    """Event absent on early polls, then lands — should succeed without failing."""
    responses = [
        _verify_query_response(0, 0),
        _verify_query_response(0, 0),
        _verify_query_response(1, 5),
    ]
    with patch.dict(os.environ, {"GITHUB_ACTIONS": "true"}, clear=False):
        with (
            patch("scripts.endpoints.posthog_sync_validate.requests.post", side_effect=responses),
            patch("scripts.endpoints.posthog_sync_validate.time.sleep") as sleep,
        ):
            verify_inventory_sync_ingested(
                "phx_key",
                posthog_query_url="https://example/query/",
                deploy_sha="abc123",
                expected_dead_count=5,
            )
    assert sleep.call_count == 2


def test_verify_inventory_sync_uses_capped_exponential_backoff():
    never_lands = _verify_query_response(0, 0)
    with patch.dict(os.environ, {"GITHUB_ACTIONS": "true"}, clear=False):
        with (
            patch(
                "scripts.endpoints.posthog_sync_validate.requests.post",
                return_value=never_lands,
            ),
            patch("scripts.endpoints.posthog_sync_validate.time.sleep") as sleep,
            pytest.raises(SystemExit),
        ):
            verify_inventory_sync_ingested(
                "phx_key",
                posthog_query_url="https://example/query/",
                deploy_sha="abc123",
                expected_dead_count=0,
                max_attempts=5,
                sleep_seconds=5.0,
                backoff_factor=1.6,
                max_sleep_seconds=30.0,
            )
    delays = [call.args[0] for call in sleep.call_args_list]
    assert delays == pytest.approx([5.0, 8.0, 12.8, 20.48])
    assert all(delay <= 30.0 for delay in delays)


def test_fail_exits_with_code_1(capsys):
    with pytest.raises(SystemExit) as exc:
        fail("boom", hint="fix secrets")
    assert exc.value.code == 1
    err = capsys.readouterr().err
    assert "boom" in err
    assert "fix secrets" in err


def test_fail_emits_github_error_annotation(capsys):
    with patch.dict(os.environ, {"GITHUB_ACTIONS": "true"}, clear=False):
        with pytest.raises(SystemExit):
            fail("missing query key", hint="add POSTHOG_QUERY_API_KEY")
    err = capsys.readouterr().err
    assert "::error::" in err
    assert "missing query key" in err
