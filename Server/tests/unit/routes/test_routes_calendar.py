"""
Tests for Google Calendar API routes
"""

from contextlib import ExitStack, contextmanager
from unittest.mock import Mock, patch

from app.models import User

# Consumers bind `load_credentials` / `resolve_calendar_id` at import time; patch use sites.
_CALENDAR_LOAD_CREDENTIALS_TARGETS = (
    "app.services.calendar.events.operations.load_credentials",
    "app.services.calendar.calendars.management.load_credentials",
    "app.services.calendar.calendars.sharing.load_credentials",
    "app.services.calendar.calendars.resolution.load_credentials",
    "app.services.calendar.availability.freebusy.load_credentials",
)


@contextmanager
def _patch_google_calendar_load_credentials():
    mock_creds = Mock()
    with ExitStack() as stack:
        for target in _CALENDAR_LOAD_CREDENTIALS_TARGETS:
            stack.enter_context(patch(target, return_value=mock_creds))
        yield


def _auth_user(user_id: str = "user-123", *, is_agent: bool = False) -> Mock:
    user = Mock()
    user.id = user_id
    user.is_agent = is_agent
    user.email = "user@example.com"
    return user


class TestCalendarRoutes:
    """Test Google Calendar API endpoints (blueprint url_prefix /api/v1/google)."""

    def test_list_events_endpoint(self, client, mock_google_calendar):
        """Test GET /api/v1/google/me/events"""
        with patch("app.services.calendar.core.auth_helpers.get_current_user") as mock_get:
            mock_get.return_value = _auth_user()

            with _patch_google_calendar_load_credentials():
                with patch(
                    "app.services.calendar.core.service.resolve_calendar_id",
                    return_value="primary",
                ):
                    response = client.get(
                        "/api/v1/google/me/events",
                        headers={"Authorization": "Bearer mock_access_token"},
                        query_string={
                            "calendarId": "primary",
                            "timeMin": "2024-01-01T00:00:00Z",
                            "timeMax": "2024-01-31T23:59:59Z",
                        },
                    )

                    assert response.status_code == 200
                    data = response.get_json()
                    assert data.get("success") is True
                    assert "items" in data.get("data", {})

    def test_create_event_endpoint(self, client, mock_google_calendar, db_session):
        """Test POST /api/v1/google/me/events"""
        db_session.session.add(
            User(
                id="user-123",
                cognito_id="cognito-cal-1",
                email="caluser@example.com",
                name="Cal User",
                is_agent=False,
            )
        )
        db_session.session.commit()

        with patch("app.services.calendar.core.auth_helpers.get_current_user") as mock_get:
            mock_get.return_value = _auth_user()

            with _patch_google_calendar_load_credentials():
                with patch(
                    "app.services.calendar.core.service.resolve_calendar_id",
                    return_value="primary",
                ):
                    with patch(
                        "app.routes.calendar.handlers.events.require_permission",
                        return_value=(True, None),
                    ):
                        event_data = {
                            "calendarId": "primary",
                            "summary": "New Meeting",
                            "description": "Discuss project",
                            "start": {"dateTime": "2024-02-01T10:00:00Z"},
                            "end": {"dateTime": "2024-02-01T11:00:00Z"},
                        }

                        response = client.post(
                            "/api/v1/google/me/events",
                            headers={"Authorization": "Bearer mock_access_token"},
                            json=event_data,
                        )

                        assert response.status_code == 201
                        data = response.get_json()
                        assert data.get("success") is True
                        assert "data" in data
                        assert data["data"].get("id")

    def test_update_event_endpoint(self, client, mock_google_calendar):
        """Test PATCH /api/v1/google/me/events/:event_id"""
        with patch("app.services.calendar.core.auth_helpers.get_current_user") as mock_get:
            mock_get.return_value = _auth_user()

            with _patch_google_calendar_load_credentials():
                with patch(
                    "app.services.calendar.core.service.resolve_calendar_id",
                    return_value="primary",
                ):
                    with patch(
                        "app.routes.calendar.handlers.events.require_permission",
                        return_value=(True, None),
                    ):
                        event_data = {
                            "calendarId": "primary",
                            "summary": "Updated Meeting",
                            "start": {"dateTime": "2024-02-01T10:00:00Z"},
                            "end": {"dateTime": "2024-02-01T11:00:00Z"},
                        }

                        response = client.patch(
                            "/api/v1/google/me/events/event-123",
                            headers={"Authorization": "Bearer mock_access_token"},
                            json=event_data,
                        )

                        assert response.status_code == 200
                        data = response.get_json()
                        assert data.get("success") is True
                        assert data.get("data", {}).get("id") == "event-123"

    def test_delete_event_endpoint(self, client, mock_google_calendar):
        """Test DELETE /api/v1/google/me/events/:event_id"""
        with patch("app.services.calendar.core.auth_helpers.get_current_user") as mock_get:
            mock_get.return_value = _auth_user()

            with _patch_google_calendar_load_credentials():
                with patch(
                    "app.services.calendar.core.service.resolve_calendar_id",
                    return_value="primary",
                ):
                    with patch(
                        "app.routes.calendar.handlers.events.require_permission",
                        return_value=(True, None),
                    ):
                        response = client.delete(
                            "/api/v1/google/me/events/event-123",
                            headers={"Authorization": "Bearer mock_access_token"},
                            query_string={"calendarId": "primary"},
                        )

                        assert response.status_code == 200
                        data = response.get_json()
                        assert data["success"] is True

    def test_list_calendars_endpoint(self, client, mock_google_calendar):
        """Test GET /api/v1/google/me/calendars"""
        with patch("app.services.calendar.core.auth_helpers.get_current_user") as mock_get:
            mock_get.return_value = _auth_user()

            with _patch_google_calendar_load_credentials():
                response = client.get(
                    "/api/v1/google/me/calendars",
                    headers={"Authorization": "Bearer mock_access_token"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data.get("success") is True
                assert "items" in data.get("data", {})

    def test_create_calendar_endpoint(self, client, mock_google_calendar):
        """Test POST /api/v1/google/calendars"""
        with patch("app.services.calendar.core.auth_helpers.get_current_user") as mock_get:
            mock_get.return_value = _auth_user()

            with _patch_google_calendar_load_credentials():
                calendar_data = {
                    "summary": "SilverKey Calendar",
                    "description": "Calendar for SilverKey events",
                    "timeZone": "America/New_York",
                }

                response = client.post(
                    "/api/v1/google/calendars",
                    headers={"Authorization": "Bearer mock_access_token"},
                    json=calendar_data,
                )

                assert response.status_code == 201
                data = response.get_json()
                assert data.get("success") is True
                assert data.get("data", {}).get("id")

    def test_add_calendar_acl_endpoint(self, client, mock_google_calendar):
        """Test POST /api/v1/google/calendars/:calendar_id/acl"""
        with patch("app.services.calendar.core.auth_helpers.get_current_user") as mock_get:
            mock_get.return_value = _auth_user("agent-123")

            with _patch_google_calendar_load_credentials():
                response = client.post(
                    "/api/v1/google/calendars/calendar-123/acl",
                    headers={"Authorization": "Bearer mock_access_token"},
                    json={"agent_email": "agent@example.com", "role": "reader"},
                )

                assert response.status_code == 201
                data = response.get_json()
                assert data.get("success") is True

    def test_get_freebusy_endpoint(self, client, mock_google_calendar):
        """Test POST /api/v1/google/me/freebusy"""
        with patch("app.services.calendar.core.auth_helpers.get_current_user") as mock_get:
            mock_get.return_value = _auth_user()

            with _patch_google_calendar_load_credentials():
                with patch(
                    "app.routes.calendar.handlers.availability.check_permission",
                    return_value=True,
                ):
                    with patch(
                        "app.routes.calendar.handlers.availability.google_calendar_service.query_freebusy",
                        return_value={
                            "primary": {
                                "busy": [
                                    {
                                        "start": "2024-02-01T10:00:00Z",
                                        "end": "2024-02-01T11:00:00Z",
                                    }
                                ]
                            }
                        },
                    ):
                        response = client.post(
                            "/api/v1/google/me/freebusy",
                            headers={"Authorization": "Bearer mock_access_token"},
                            json={
                                "timeMin": "2024-02-01T00:00:00Z",
                                "timeMax": "2024-02-01T23:59:59Z",
                                "items": [{"id": "primary"}],
                            },
                        )

                        assert response.status_code == 200
                        data = response.get_json()
                        assert "calendars" in data.get("data", {})

    def test_oauth_start_endpoint(self, client):
        """Test GET /api/v1/google/oauth/start"""
        with patch("app.services.calendar.core.auth_helpers.get_current_user") as mock_get:
            mock_get.return_value = _auth_user()

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
            mock_get.return_value = _auth_user()

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
