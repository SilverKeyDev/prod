"""
Tests for Google Calendar management and sharing
"""

from unittest.mock import Mock, patch

from flask import Flask


class TestCalendarManagement:
    """Test calendar management operations"""

    def test_list_calendars(self, app: Flask, mock_google_calendar):
        """Test listing user's calendars"""
        from app.services.calendar.calendars.resolution import list_calendars

        with app.app_context():
            with patch("app.services.calendar.calendars.resolution.load_credentials"):
                calendars = list_calendars(
                    user_id="user-123",
                    client_id="client-id",
                    client_secret="client-secret",
                    token_endpoint="https://oauth2.googleapis.com/token",
                    scopes=["https://www.googleapis.com/auth/calendar.app.created"],
                )

                assert isinstance(calendars, list)
                assert len(calendars) > 0
                assert calendars[0]["id"] == "primary"
                assert calendars[0]["summary"] == "Primary Calendar"

    def test_create_calendar(self, app: Flask, mock_google_calendar):
        """Test creating new calendar"""
        from app.services.calendar.calendars.management import create_calendar

        with app.app_context():
            with patch("app.services.calendar.calendars.calendar_create.load_credentials"):
                result = create_calendar(
                    user_id="user-123",
                    calendar_name="SilverKey Calendar",
                    client_id="client-id",
                    client_secret="client-secret",
                    token_endpoint="https://oauth2.googleapis.com/token",
                    scopes=["https://www.googleapis.com/auth/calendar.app.created"],
                )

                assert result is not None
                assert result["id"] == "silverkey-calendar-123"
                assert result["summary"] == "SilverKey Calendar"

    def test_delete_calendar(self, app: Flask, mock_google_calendar):
        """Test deleting calendar"""
        from app.services.calendar.calendars.management import delete_calendar

        with app.app_context():
            with patch("app.services.calendar.calendars.calendar_delete.load_credentials"):
                result = delete_calendar(
                    user_id="user-123",
                    calendar_id="calendar-123",
                    client_id="client-id",
                    client_secret="client-secret",
                    token_endpoint="https://oauth2.googleapis.com/token",
                    scopes=["https://www.googleapis.com/auth/calendar.app.created"],
                )

                assert result is True


class TestCalendarSharing:
    """Test calendar sharing operations"""

    def test_add_calendar_acl(self, app: Flask, mock_google_calendar):
        """Test adding an ACL rule (grant access) on a calendar"""
        from app.services.calendar.calendars.sharing import add_calendar_acl

        with app.app_context():
            with patch("app.services.calendar.calendars.sharing.load_credentials"):
                result = add_calendar_acl(
                    user_id="agent-123",
                    calendar_id="calendar-123",
                    agent_email="client@example.com",
                    role="reader",
                    client_id="client-id",
                    client_secret="client-secret",
                    token_endpoint="https://oauth2.googleapis.com/token",
                    scopes=["https://www.googleapis.com/auth/calendar.app.created"],
                )

                assert result.get("id") == "acl-rule-123"
                assert result.get("role") == "reader"

    def test_setup_agent_client_calendar_sharing_requires_agent_tokens(self, app: Flask):
        """Agent without Google tokens should fail fast with a clear error."""
        from app.services.calendar.calendars.sharing_agent_client import (
            setup_agent_client_calendar_sharing,
        )

        with app.app_context():
            with patch(
                "app.services.auth.tokens.tokens_get",
                return_value=None,
            ):
                result = setup_agent_client_calendar_sharing(
                    agent_id="agent-123",
                    client_id="client-456",
                    agent_email="agent@example.com",
                    client_email="client@example.com",
                    client_id_oauth="client-id",
                    client_secret="client-secret",
                    token_endpoint="https://oauth2.googleapis.com/token",
                    scopes=["https://www.googleapis.com/auth/calendar.app.created"],
                    get_or_create_silverkey_calendar_func=Mock(),
                )

                assert result["success"] is False
                assert any(
                    "does not have Google Calendar connected" in err for err in result["errors"]
                )

    def test_revoke_calendar_access(self, app: Flask):
        """Revoke Google OAuth tokens for calendar (HTTP revoke + local token delete)."""
        from app.services.calendar.core.revoke import revoke_calendar_access

        session = Mock()
        session.post.return_value = Mock(status_code=200)

        with app.app_context():
            with patch("app.services.calendar.core.revoke.tokens_get") as mock_tokens_get:
                with patch("app.services.calendar.core.revoke.tokens_delete") as mock_tokens_delete:
                    mock_tokens_get.return_value = {"refresh_token": "rt"}

                    assert revoke_calendar_access("agent-123", session) is True

                    session.post.assert_called_once()
                    mock_tokens_delete.assert_called_once_with("agent-123")


class TestCalendarAvailability:
    """Test calendar availability/freebusy operations"""

    def test_query_freebusy(self, app: Flask, mock_google_calendar):
        """Test querying free/busy information (returns calendars map only)."""
        from app.services.calendar.availability.freebusy import query_freebusy

        with app.app_context():
            with patch("app.services.calendar.availability.freebusy.load_credentials"):
                result = query_freebusy(
                    user_id="user-123",
                    time_min="2024-02-01T00:00:00Z",
                    time_max="2024-02-01T23:59:59Z",
                    client_id="client-id",
                    client_secret="client-secret",
                    token_endpoint="https://oauth2.googleapis.com/token",
                    scopes=["https://www.googleapis.com/auth/calendar.app.created"],
                    calendar_ids=["primary"],
                )

                assert "primary" in result
                assert "busy" in result["primary"]
