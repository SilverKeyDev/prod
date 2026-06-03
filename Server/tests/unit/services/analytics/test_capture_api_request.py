"""Tests for PostHog api_request telemetry capture."""

from __future__ import annotations

import time
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from flask import g

from app.services.analytics import posthog_events


def _run_capture(app, path: str, *, method: str = "GET", status: int = 200, headers=None):
    mock_client = MagicMock()
    headers = headers or {}
    with patch.object(posthog_events, "get_posthog_client", return_value=mock_client):
        with patch(
            "app.services.auth.get_current_user",
            side_effect=Exception("unauthorized"),
        ):
            with app.test_request_context(path, method=method, headers=headers):
                app.preprocess_request()
                response = app.response_class(status=status)
                posthog_events.capture_api_request(None, response)
    return mock_client


def test_capture_api_request_2xx_properties(app):
    mock_client = _run_capture(app, "/api/v1/public/agent-profile/user-1", status=200)
    mock_client.capture.assert_called_once()
    props = mock_client.capture.call_args.kwargs["properties"]
    assert props["endpoint"] == "GET /api/v1/public/agent-profile/{user_id}"
    assert props["status_code"] == 200
    assert props["status_class"] == "2xx"
    assert props["is_error"] is False
    assert props["is_server_error"] is False
    assert "duration_ms" in props
    assert "latency_ms" in props
    assert props["duration_ms"] == props["latency_ms"]
    assert props["is_slow"] is False


def test_capture_api_request_4xx_properties(app):
    mock_client = _run_capture(app, "/api/v1/public/agent-profile/user-1", status=404)
    props = mock_client.capture.call_args.kwargs["properties"]
    assert props["status_class"] == "4xx"
    assert props["is_error"] is True
    assert props["is_server_error"] is False


def test_capture_api_request_5xx_properties(app):
    mock_client = _run_capture(app, "/api/v1/public/agent-profile/user-1", status=500)
    props = mock_client.capture.call_args.kwargs["properties"]
    assert props["status_class"] == "5xx"
    assert props["is_server_error"] is True


def test_capture_api_request_prefers_authenticated_user(app):
    user = SimpleNamespace(id="user-abc", user_roles=[], brokerage_org_ids=["org-1"])
    mock_client = MagicMock()
    with patch.object(posthog_events, "get_posthog_client", return_value=mock_client):
        with patch("app.services.auth.get_current_user", return_value=user):
            with patch.object(posthog_events, "user_role_names", return_value=["buyer"]):
                with app.test_request_context(
                    "/api/v1/public/agent-profile/user-1",
                    method="GET",
                    headers={posthog_events.POSTHOG_DISTINCT_ID_HEADER: "header-id"},
                ):
                    app.preprocess_request()
                    response = app.response_class(status=200)
                    posthog_events.capture_api_request(None, response)

    kwargs = mock_client.capture.call_args.kwargs
    assert kwargs["distinct_id"] == "user-abc"
    assert kwargs["properties"]["user_role"] == "buyer"
    assert kwargs["properties"]["brokerage_org_id"] == "org-1"
    assert kwargs["groups"] == {"brokerage": "org-1"}


def test_capture_api_request_falls_back_to_header(app):
    mock_client = _run_capture(
        app,
        "/api/v1/public/agent-profile/user-1",
        headers={posthog_events.POSTHOG_DISTINCT_ID_HEADER: "header-id"},
    )
    kwargs = mock_client.capture.call_args.kwargs
    assert kwargs["distinct_id"] == "header-id"
    assert "user_role" not in kwargs["properties"]


def test_capture_api_request_anonymous_without_header(app):
    mock_client = _run_capture(app, "/api/v1/public/agent-profile/user-1")
    kwargs = mock_client.capture.call_args.kwargs
    assert "distinct_id" not in kwargs
    assert kwargs["event"] == "api_request"


def test_capture_api_request_gpc_opt_out_strips_user_identity(app):
    user = SimpleNamespace(id="user-abc", user_roles=[], brokerage_org_ids=["org-1"])
    mock_client = MagicMock()
    with patch.object(posthog_events, "get_posthog_client", return_value=mock_client):
        with patch("app.services.auth.get_current_user", return_value=user):
            with app.test_request_context(
                "/api/v1/public/agent-profile/user-1",
                method="GET",
                headers={
                    posthog_events.POSTHOG_DISTINCT_ID_HEADER: "header-id",
                    "Sec-GPC": "1",
                },
            ):
                app.preprocess_request()
                g.gpc_opt_out = True
                response = app.response_class(status=200)
                posthog_events.capture_api_request(None, response)

    kwargs = mock_client.capture.call_args.kwargs
    assert kwargs["distinct_id"] == "header-id"
    assert "user_role" not in kwargs["properties"]
    assert "brokerage_org_id" not in kwargs["properties"]
    assert "groups" not in kwargs


def test_capture_api_request_noop_when_client_uninitialized(app):
    with patch.object(posthog_events, "get_posthog_client", return_value=None):
        with app.test_request_context("/api/v1/public/agent-profile/user-1", method="GET"):
            app.preprocess_request()
            posthog_events.capture_api_request(None, app.response_class(status=200))


def test_capture_api_request_swallows_posthog_errors(app):
    mock_client = MagicMock()
    mock_client.capture.side_effect = RuntimeError("posthog down")
    with patch.object(posthog_events, "get_posthog_client", return_value=mock_client):
        with patch(
            "app.services.auth.get_current_user",
            side_effect=Exception("unauthorized"),
        ):
            with app.test_request_context("/api/v1/public/agent-profile/user-1", method="GET"):
                app.preprocess_request()
                g._request_start_perf = time.perf_counter()
                posthog_events.capture_api_request(None, app.response_class(status=200))


def test_capture_api_request_slow_when_latency_over_one_second(app):
    mock_client = MagicMock()
    with patch.object(posthog_events, "get_posthog_client", return_value=mock_client):
        with patch(
            "app.services.auth.get_current_user",
            side_effect=Exception("unauthorized"),
        ):
            with app.test_request_context("/api/v1/public/agent-profile/user-1", method="GET"):
                app.preprocess_request()
                g._request_start_perf = time.perf_counter() - 1.5
                posthog_events.capture_api_request(None, app.response_class(status=200))

    assert mock_client.capture.call_args.kwargs["properties"]["is_slow"] is True
