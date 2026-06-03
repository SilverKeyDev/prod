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
)


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
