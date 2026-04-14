"""
Tests for Google Calendar management and sharing
"""

from unittest.mock import Mock, patch

from flask import Flask


class TestCalendarManagement:
    """Test calendar management operations"""

    def test_list_calendars(self, app: Flask, mock_google_calendar):
        """Test listing user's calendars"""
        from app.services.calendar.calendars.management import list_calendars

        with app.app_context():
            with patch("app.services.calendar.core.credentials.load_credentials"):
                calendars = list_calendars(
                    user_id="user-123",
                    client_id="client-id",
                    client_secret="client-secret",
                    token_endpoint="https://oauth2.googleapis.com/token",
                    scopes=["https://www.googleapis.com/auth/calendar"],
                )

                assert isinstance(calendars, list)
                assert len(calendars) > 0
                assert calendars[0]["id"] == "primary"
                assert calendars[0]["summary"] == "Primary Calendar"

    def test_create_calendar(self, app: Flask, mock_google_calendar):
        """Test creating new calendar"""
        from app.services.calendar.calendars.management import create_calendar

        with app.app_context():
            with patch("app.services.calendar.core.credentials.load_credentials"):
                calendar_data = {
                    "summary": "SilverKey Calendar",
                    "description": "Calendar for SilverKey events",
                    "timeZone": "America/New_York",
                }

                result = create_calendar(
                    user_id="user-123",
                    calendar_data=calendar_data,
                    client_id="client-id",
                    client_secret="client-secret",
                    token_endpoint="https://oauth2.googleapis.com/token",
                    scopes=["https://www.googleapis.com/auth/calendar"],
                )

                assert result is not None
                assert result["id"] == "silverkey-calendar-123"
                assert result["summary"] == "SilverKey Calendar"

    def test_update_calendar(self, app: Flask, mock_google_calendar):
        """Test updating calendar settings"""
        from app.services.calendar.calendars.management import update_calendar

        with app.app_context():
            with patch("app.services.calendar.core.credentials.load_credentials"):
                calendar_data = {
                    "summary": "Updated Calendar Name",
                    "description": "Updated description",
                }

                result = update_calendar(
                    user_id="user-123",
                    calendar_id="calendar-123",
                    calendar_data=calendar_data,
                    client_id="client-id",
                    client_secret="client-secret",
                    token_endpoint="https://oauth2.googleapis.com/token",
                    scopes=["https://www.googleapis.com/auth/calendar"],
                )

                assert result is not None

    def test_delete_calendar(self, app: Flask, mock_google_calendar):
        """Test deleting calendar"""
        from app.services.calendar.calendars.management import delete_calendar

        with app.app_context():
            with patch("app.services.calendar.core.credentials.load_credentials"):
                result = delete_calendar(
                    user_id="user-123",
                    calendar_id="calendar-123",
                    client_id="client-id",
                    client_secret="client-secret",
                    token_endpoint="https://oauth2.googleapis.com/token",
                    scopes=["https://www.googleapis.com/auth/calendar"],
                )

                assert result is True


class TestCalendarSharing:
    """Test calendar sharing operations"""

    def test_share_calendar_with_user(self, app: Flask, mock_google_calendar):
        """Test sharing calendar with another user"""
        from app.services.calendar.calendars.sharing import share_calendar

        with app.app_context():
            with patch("app.services.calendar.core.credentials.load_credentials"):
                result = share_calendar(
                    owner_user_id="agent-123",
                    calendar_id="calendar-123",
                    share_with_email="client@example.com",
                    role="reader",
                    client_id="client-id",
                    client_secret="client-secret",
                    token_endpoint="https://oauth2.googleapis.com/token",
                    scopes=["https://www.googleapis.com/auth/calendar"],
                )

                assert result["success"] is True

    def test_share_calendar_agent_client(self, app: Flask, db_session):
        """Test sharing calendar between agent and client"""
        from app.models import User
        from app.services.calendar.calendars.sharing_agent_client import (
            share_agent_calendar_with_client,
        )

        with app.app_context():
            # Create test users
            agent = User(
                id="agent-123",
                cognito_id="cognito-agent",
                email="agent@example.com",
                name="Agent User",
                role="agent",
            )
            client = User(
                id="client-456",
                cognito_id="cognito-client",
                email="client@example.com",
                name="Client User",
                role="buyer",
            )
            db_session.add(agent)
            db_session.add(client)
            db_session.commit()

            with patch("app.services.calendar.calendars.sharing.share_calendar") as mock_share:
                mock_share.return_value = {"success": True}

                result = share_agent_calendar_with_client(
                    agent_id="agent-123", client_id="client-456", calendar_id="primary"
                )

                assert result["success"] is True
                mock_share.assert_called_once()

    def test_revoke_calendar_access(self, app: Flask, mock_google_calendar):
        """Test revoking calendar access"""
        from app.services.calendar.calendars.sharing import revoke_calendar_access

        with app.app_context():
            with patch("app.services.calendar.core.credentials.load_credentials"):
                result = revoke_calendar_access(
                    owner_user_id="agent-123",
                    calendar_id="calendar-123",
                    revoke_from_email="client@example.com",
                    client_id="client-id",
                    client_secret="client-secret",
                    token_endpoint="https://oauth2.googleapis.com/token",
                    scopes=["https://www.googleapis.com/auth/calendar"],
                )

                assert result["success"] is True

    def test_list_calendar_acl(self, app: Flask, mock_google_calendar):
        """Test listing calendar access control list"""
        from app.services.calendar.calendars.sharing import list_calendar_acl

        with app.app_context():
            with patch("app.services.calendar.core.credentials.load_credentials"):
                with patch("googleapiclient.discovery.build") as mock_build:
                    service_mock = Mock()
                    acl_mock = Mock()
                    acl_mock.list.return_value.execute.return_value = {
                        "items": [
                            {
                                "id": "user:client@example.com",
                                "role": "reader",
                                "scope": {
                                    "type": "user",
                                    "value": "client@example.com",
                                },
                            }
                        ]
                    }
                    service_mock.acl.return_value = acl_mock
                    mock_build.return_value = service_mock

                    result = list_calendar_acl(
                        user_id="agent-123",
                        calendar_id="calendar-123",
                        client_id="client-id",
                        client_secret="client-secret",
                        token_endpoint="https://oauth2.googleapis.com/token",
                        scopes=["https://www.googleapis.com/auth/calendar"],
                    )

                    assert isinstance(result, list)
                    assert len(result) > 0


class TestCalendarAvailability:
    """Test calendar availability/freebusy operations"""

    def test_get_freebusy(self, app: Flask, mock_google_calendar):
        """Test getting free/busy information"""
        from app.services.calendar.availability.freebusy import get_freebusy

        with app.app_context():
            with patch("app.services.calendar.core.credentials.load_credentials"):
                with patch("googleapiclient.discovery.build") as mock_build:
                    service_mock = Mock()
                    freebusy_mock = Mock()
                    freebusy_mock.query.return_value.execute.return_value = {
                        "calendars": {
                            "primary": {
                                "busy": [
                                    {
                                        "start": "2024-02-01T10:00:00Z",
                                        "end": "2024-02-01T11:00:00Z",
                                    }
                                ]
                            }
                        }
                    }
                    service_mock.freebusy.return_value = freebusy_mock
                    mock_build.return_value = service_mock

                    result = get_freebusy(
                        user_id="user-123",
                        calendar_ids=["primary"],
                        time_min="2024-02-01T00:00:00Z",
                        time_max="2024-02-01T23:59:59Z",
                        client_id="client-id",
                        client_secret="client-secret",
                        token_endpoint="https://oauth2.googleapis.com/token",
                        scopes=["https://www.googleapis.com/auth/calendar"],
                    )

                    assert "calendars" in result
                    assert "primary" in result["calendars"]
                    assert "busy" in result["calendars"]["primary"]

    def test_find_available_slots(self, app: Flask):
        """Test finding available time slots"""
        from app.services.calendar.availability.freebusy import find_available_slots

        with app.app_context():
            busy_periods = [
                {
                    "start": "2024-02-01T10:00:00Z",
                    "end": "2024-02-01T11:00:00Z",
                },
                {
                    "start": "2024-02-01T14:00:00Z",
                    "end": "2024-02-01T15:00:00Z",
                },
            ]

            available = find_available_slots(
                busy_periods=busy_periods,
                start_time="2024-02-01T09:00:00Z",
                end_time="2024-02-01T17:00:00Z",
                slot_duration_minutes=60,
            )

            assert isinstance(available, list)
            assert len(available) > 0
            # Should have slots between 9-10, 11-14, and 15-17
            assert any(slot["start"] == "2024-02-01T09:00:00Z" for slot in available)
