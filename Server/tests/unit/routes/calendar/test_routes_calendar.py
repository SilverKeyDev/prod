"""
Tests for Google Calendar API routes (events, calendars, freebusy).
"""

from unittest.mock import patch

from app.models import User

from .calendar_route_test_helpers import auth_user, patch_google_calendar_load_credentials


class TestCalendarRoutes:
    """Test Google Calendar API endpoints (blueprint url_prefix /api/v1/google)."""

    def test_list_events_endpoint(self, client, mock_google_calendar):
        """Test GET /api/v1/google/me/events"""
        with patch("app.services.calendar.core.auth_helpers.get_current_user") as mock_get:
            mock_get.return_value = auth_user()

            with patch_google_calendar_load_credentials():
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
            )
        )
        db_session.session.commit()

        with patch("app.services.calendar.core.auth_helpers.get_current_user") as mock_get:
            mock_get.return_value = auth_user()

            with patch_google_calendar_load_credentials():
                with patch(
                    "app.services.calendar.core.service.resolve_calendar_id",
                    return_value="primary",
                ):
                    with patch(
                        "app.routes.calendar.handlers.events.create_event.require_permission",
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
            mock_get.return_value = auth_user()

            with patch_google_calendar_load_credentials():
                with patch(
                    "app.services.calendar.core.service.resolve_calendar_id",
                    return_value="primary",
                ):
                    with patch(
                        "app.routes.calendar.handlers.events.update_event.require_permission",
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
            mock_get.return_value = auth_user()

            with patch_google_calendar_load_credentials():
                with patch(
                    "app.services.calendar.core.service.resolve_calendar_id",
                    return_value="primary",
                ):
                    with patch(
                        "app.routes.calendar.handlers.events.delete_event.require_permission",
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
            mock_get.return_value = auth_user()

            with patch_google_calendar_load_credentials():
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
            mock_get.return_value = auth_user()

            with patch_google_calendar_load_credentials():
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
            mock_get.return_value = auth_user("agent-123")

            with patch_google_calendar_load_credentials():
                with patch(
                    "app.routes.calendar.handlers.calendars.require_permission",
                    return_value=(True, None),
                ):
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
            mock_get.return_value = auth_user()

            with patch_google_calendar_load_credentials():
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
