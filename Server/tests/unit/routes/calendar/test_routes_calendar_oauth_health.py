"""Tests for Google Calendar OAuth, health, and error-envelope routes."""

from unittest.mock import patch

from .calendar_route_test_helpers import auth_user


class TestCalendarOAuthHealthRoutes:
    """OAuth, health, auth, and secure error envelopes."""

    def test_oauth_start_endpoint(self, client):
        """Test GET /api/v1/google/oauth/start"""
        with patch("app.services.calendar.core.auth_helpers.get_current_user") as mock_get:
            mock_get.return_value = auth_user()

            with patch(
                "app.routes.calendar.handlers.oauth.google_calendar_service.build_auth_url",
                return_value=("https://accounts.google.com/o/oauth2/auth?...", "state-token"),
            ):
                response = client.get(
                    "/api/v1/google/oauth/start",
                    headers={"Authorization": "Bearer mock_access_token"},
                )

                assert response.status_code in [200, 302]

    def test_oauth_callback_endpoint(self, client):
        """Test GET /api/v1/google/oauth/callback"""
        with patch("app.services.calendar.core.auth_helpers.get_current_user") as mock_get:
            mock_get.return_value = auth_user()

            with (
                patch(
                    "app.routes.calendar.handlers.oauth.google_calendar_service.validate_state",
                    return_value=True,
                ),
                patch(
                    "app.routes.calendar.handlers.oauth.google_calendar_service.exchange_code_for_tokens",
                    return_value={"scope": "https://www.googleapis.com/auth/calendar.app.created"},
                ),
                patch(
                    "app.routes.calendar.handlers.oauth.google_calendar_service.get_or_create_silverkey_calendar",
                    return_value={"id": "sk-cal"},
                ),
            ):
                with client.session_transaction() as sess:
                    sess["google_calendar_oauth_state"] = "state_token"

                response = client.get(
                    "/api/v1/google/oauth/callback?code=oauth_code&state=state_token",
                    headers={"Authorization": "Bearer mock_access_token"},
                )

                assert response.status_code in [200, 302]

    def test_health_check_endpoint(self, client):
        """Test GET /api/v1/google/health"""
        with patch(
            "app.routes.calendar.handlers.health.google_calendar_service.is_healthy",
            return_value=True,
        ):
            response = client.get("/api/v1/google/health")

            assert response.status_code == 200
            data = response.get_json()
            assert "status" in data

    def test_unauthorized_access(self, client):
        """Test endpoints reject unauthorized requests"""
        response = client.get("/api/v1/google/me/events")
        assert response.status_code == 401

        response = client.get("/api/v1/google/me/calendars")
        assert response.status_code == 401

    def test_health_check_upstream_failure_returns_503_envelope(self, client):
        with patch(
            "app.routes.calendar.handlers.health.google_calendar_service.is_healthy",
            side_effect=RuntimeError("Google API unreachable"),
        ):
            response = client.get("/api/v1/google/health")

        assert response.status_code == 503
        body = response.get_json()
        assert body is not None
        assert body.get("success") is False
        assert body.get("error") == "external_api_error"
        assert "error_id" in body
        assert "Google API unreachable" not in str(body)

    def test_connection_status_failure_returns_server_error_envelope(self, client):
        with patch("app.services.calendar.core.auth_helpers.get_current_user") as mock_get:
            mock_get.return_value = auth_user()
            with patch(
                "app.routes.calendar.handlers.health.tokens_get",
                side_effect=RuntimeError("token store down"),
            ):
                response = client.get(
                    "/api/v1/google/connection-status",
                    headers={"Authorization": "Bearer mock_access_token"},
                )

        assert response.status_code == 500
        body = response.get_json()
        assert body is not None
        assert body.get("success") is False
        assert body.get("error") == "database_error"
        assert "error_id" in body
        assert "token store down" not in str(body)
