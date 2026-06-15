"""Tests for Flask after_request API telemetry hook."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

MOCK_JWT_USER = "app.services.auth.get_current_user"
CAPTURE_PATH = "app.http.api_telemetry.capture_api_request"


def test_api_telemetry_fires_for_normal_request(client):
    with patch(CAPTURE_PATH) as mock_capture:
        response = client.get("/api/v1/public/agent-profile/test-user")
    assert response.status_code in (200, 404)
    mock_capture.assert_called_once()


def test_api_telemetry_skips_healthz(client):
    with patch(CAPTURE_PATH) as mock_capture:
        client.get("/healthz")
    mock_capture.assert_not_called()


def test_api_telemetry_skips_static(client):
    with patch(CAPTURE_PATH) as mock_capture:
        client.get("/static/foo.js")
    mock_capture.assert_not_called()


def test_api_telemetry_skips_options_preflight(client):
    with patch(CAPTURE_PATH) as mock_capture:
        client.open("/api/v1/public/agent-profile/test-user", method="OPTIONS")
    mock_capture.assert_not_called()


def test_api_telemetry_skips_unmatched_404(client):
    with patch(CAPTURE_PATH) as mock_capture:
        client.get("/no-such-route-xyz-404")
    mock_capture.assert_not_called()


def test_api_telemetry_skips_spa_catch_all(client):
    with patch(CAPTURE_PATH) as mock_capture:
        client.get("/login")
    mock_capture.assert_not_called()


def test_api_telemetry_skips_sse_response(client):
    request_data = {"address": "123 Main St"}

    with patch(CAPTURE_PATH) as mock_capture:
        with patch(MOCK_JWT_USER) as mock_user_fn:
            mock_user_fn.return_value = MagicMock(id="user-1")
            with patch(
                "app.services.search.property.property_stream.generate_property_stream"
            ) as mock_stream:

                def mock_generator():
                    yield 'data: {"type": "complete", "data": null}\n\n'

                mock_stream.return_value = mock_generator()
                response = client.post(
                    "/api/v1/research/property?stream=true",
                    json=request_data,
                )

    assert response.status_code == 200
    assert "text/event-stream" in (response.content_type or "")
    mock_capture.assert_not_called()


def test_api_telemetry_hook_never_raises_when_posthog_raises(client):
    mock_client = MagicMock()
    mock_client.capture.side_effect = RuntimeError("posthog down")
    with patch(
        "app.services.analytics.posthog_events.get_posthog_client", return_value=mock_client
    ):
        response = client.get("/api/v1/public/agent-profile/test-user")
    assert response.status_code in (200, 404)


def test_api_telemetry_captures_once_on_handled_route(client):
    with patch(CAPTURE_PATH) as mock_capture:
        response = client.get("/api/v1/public/agent-profile/test-user")
    assert response.status_code in (200, 404)
    mock_capture.assert_called_once()


def test_api_telemetry_teardown_captures_unhandled_exception(app):
    @app.route("/api/v1/test-telemetry-unhandled", methods=["GET"])
    def _raise_unhandled():
        raise RuntimeError("telemetry test boom")

    with patch(CAPTURE_PATH) as mock_capture:
        with app.test_request_context("/api/v1/test-telemetry-unhandled", method="GET"):
            app.preprocess_request()
            for func in reversed(app.teardown_request_funcs.get(None, [])):
                func(RuntimeError("telemetry test boom"))

    mock_capture.assert_called_once()
    captured_response = mock_capture.call_args[0][1]
    assert captured_response.status_code == 500
