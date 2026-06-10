"""Tests for PostHog product analytics helpers."""

from unittest.mock import MagicMock, patch

from app.services.analytics import posthog_events


def test_capture_product_event_noop_when_client_uninitialized():
    with patch.object(posthog_events, "get_posthog_client", return_value=None):
        posthog_events.capture_product_event("user-1", "test_event", {"flag": True})


def test_capture_product_event_passes_session_header(app):
    mock_client = MagicMock()
    with patch.object(posthog_events, "get_posthog_client", return_value=mock_client):
        with app.test_request_context(
            headers={
                posthog_events.POSTHOG_DISTINCT_ID_HEADER: "ph-distinct",
                posthog_events.POSTHOG_SESSION_ID_HEADER: "ph-session",
            }
        ):
            posthog_events.capture_product_event("user-1", "test_event", {"flag": True})

    mock_client.capture.assert_called_once()
    kwargs = mock_client.capture.call_args.kwargs
    assert kwargs["distinct_id"] == "ph-distinct"
    assert kwargs["event"] == "test_event"
    assert kwargs["properties"]["flag"] is True
    assert kwargs["properties"]["$session_id"] == "ph-session"


def test_capture_backend_error_sends_sanitized_5xx_event(app):
    mock_client = MagicMock()
    with patch.object(posthog_events, "get_posthog_client", return_value=mock_client):
        with app.test_request_context("/api/v1/example/123", method="POST"):
            posthog_events.capture_backend_error(RuntimeError("secret detail"), status_code=500)

    mock_client.capture.assert_called_once()
    kwargs = mock_client.capture.call_args.kwargs
    assert kwargs["event"] == "backend_error"
    assert kwargs["properties"]["status_code"] == 500
    assert kwargs["properties"]["status_class"] == "5xx"
    assert kwargs["properties"]["error_type"] == "RuntimeError"
    assert kwargs["properties"]["path"] == "/api/v1/example/123"
    assert "secret detail" not in str(kwargs["properties"])


def test_capture_backend_error_ignores_non_5xx(app):
    mock_client = MagicMock()
    with patch.object(posthog_events, "get_posthog_client", return_value=mock_client):
        with app.test_request_context("/api/v1/example", method="GET"):
            posthog_events.capture_backend_error(RuntimeError("bad request"), status_code=400)

    mock_client.capture.assert_not_called()
