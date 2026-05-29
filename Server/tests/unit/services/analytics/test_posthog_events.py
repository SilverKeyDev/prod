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
