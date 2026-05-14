"""
Tests for Google Calendar event operations
"""

from unittest.mock import Mock, patch

import pytest
from flask import Flask


class TestCalendarEvents:
    """Test calendar event operations"""

    def test_list_events(self, app: Flask, mock_google_calendar):
        """Test listing events from calendar"""
        from app.services.calendar.events.operations import list_events

        with app.app_context():
            with patch("app.services.calendar.events.operations_list_events.load_credentials"):
                with patch(
                    "app.services.calendar.calendars.resolution.resolve_calendar_id"
                ) as mock_resolve:
                    mock_resolve.return_value = "primary"

                    events = list_events(
                        user_id="user-123",
                        calendar_id="primary",
                        client_id="client-id",
                        client_secret="client-secret",
                        token_endpoint="https://oauth2.googleapis.com/token",
                        scopes=["https://www.googleapis.com/auth/calendar.app.created"],
                        resolve_calendar_id_func=mock_resolve,
                        time_min="2024-01-01T00:00:00Z",
                        time_max="2024-01-31T23:59:59Z",
                    )

                    assert isinstance(events, list)
                    assert len(events) > 0
                    assert events[0]["id"] == "event-123"
                    assert events[0]["summary"] == "Test Event"

    def test_list_events_empty_response(self, app: Flask, mock_google_calendar):
        """Test listing events with no results"""
        from app.services.calendar.events.operations import list_events

        with app.app_context():
            with patch("app.services.calendar.events.operations_list_events.load_credentials"):
                with patch(
                    "app.services.calendar.calendars.resolution.resolve_calendar_id"
                ) as mock_resolve:
                    mock_resolve.return_value = "primary"

                    # Mock empty response
                    mock_google_calendar.return_value.events.return_value.list.return_value.execute.return_value = {
                        "items": []
                    }

                    events = list_events(
                        user_id="user-123",
                        calendar_id="primary",
                        client_id="client-id",
                        client_secret="client-secret",
                        token_endpoint="https://oauth2.googleapis.com/token",
                        scopes=["https://www.googleapis.com/auth/calendar.app.created"],
                        resolve_calendar_id_func=mock_resolve,
                    )

                    assert isinstance(events, list)
                    assert len(events) == 0

    def test_create_event(self, app: Flask, mock_google_calendar):
        """Test creating new calendar event"""
        from app.services.calendar.events.operations import create_event

        with app.app_context():
            with patch("app.services.calendar.events.operations.load_credentials"):
                with patch(
                    "app.services.calendar.calendars.resolution.resolve_calendar_id"
                ) as mock_resolve:
                    mock_resolve.return_value = "primary"

                    event_data = {
                        "summary": "New Meeting",
                        "description": "Discuss project updates",
                        "start": {"dateTime": "2024-02-01T10:00:00Z"},
                        "end": {"dateTime": "2024-02-01T11:00:00Z"},
                    }

                    result = create_event(
                        user_id="user-123",
                        calendar_id="primary",
                        event_data=event_data,
                        client_id="client-id",
                        client_secret="client-secret",
                        token_endpoint="https://oauth2.googleapis.com/token",
                        scopes=["https://www.googleapis.com/auth/calendar.app.created"],
                        resolve_calendar_id_func=mock_resolve,
                    )

                    assert result is not None
                    assert result["id"] == "new-event-123"
                    assert result["summary"] == "New Event"

    def test_update_event(self, app: Flask, mock_google_calendar):
        """Test updating existing event"""
        from app.services.calendar.events.operations import update_event

        with app.app_context():
            with patch("app.services.calendar.events.operations.load_credentials"):
                with patch(
                    "app.services.calendar.calendars.resolution.resolve_calendar_id"
                ) as mock_resolve:
                    mock_resolve.return_value = "primary"

                    event_data = {
                        "summary": "Updated Meeting",
                        "description": "Updated description",
                        "start": {"dateTime": "2024-02-15T10:00:00"},
                        "end": {"dateTime": "2024-02-15T11:00:00"},
                    }

                    result = update_event(
                        user_id="user-123",
                        event_id="event-123",
                        event_data=event_data,
                        calendar_id="primary",
                        client_id="client-id",
                        client_secret="client-secret",
                        token_endpoint="https://oauth2.googleapis.com/token",
                        scopes=["https://www.googleapis.com/auth/calendar.app.created"],
                        resolve_calendar_id_func=mock_resolve,
                    )

                    assert result is not None
                    assert result["id"] == "event-123"

    def test_delete_event(self, app: Flask, mock_google_calendar):
        """Test deleting event"""
        from app.services.calendar.events.operations import delete_event

        with app.app_context():
            with patch("app.services.calendar.events.operations.load_credentials"):
                with patch(
                    "app.services.calendar.calendars.resolution.resolve_calendar_id"
                ) as mock_resolve:
                    mock_resolve.return_value = "primary"

                    result = delete_event(
                        user_id="user-123",
                        calendar_id="primary",
                        event_id="event-123",
                        client_id="client-id",
                        client_secret="client-secret",
                        token_endpoint="https://oauth2.googleapis.com/token",
                        scopes=["https://www.googleapis.com/auth/calendar.app.created"],
                        resolve_calendar_id_func=mock_resolve,
                    )

                    assert result is True

    def test_list_events_with_time_range(self, app: Flask, mock_google_calendar):
        """Test listing events with specific time range"""
        from app.services.calendar.events.operations import list_events

        with app.app_context():
            with patch("app.services.calendar.events.operations_list_events.load_credentials"):
                with patch(
                    "app.services.calendar.calendars.resolution.resolve_calendar_id"
                ) as mock_resolve:
                    mock_resolve.return_value = "primary"

                    events = list_events(
                        user_id="user-123",
                        calendar_id="primary",
                        client_id="client-id",
                        client_secret="client-secret",
                        token_endpoint="https://oauth2.googleapis.com/token",
                        scopes=["https://www.googleapis.com/auth/calendar.app.created"],
                        resolve_calendar_id_func=mock_resolve,
                        time_min="2024-02-01T00:00:00Z",
                        time_max="2024-02-28T23:59:59Z",
                        max_results=50,
                    )

                    assert isinstance(events, list)
                    # Verify time range was passed to API
                    call_args = mock_google_calendar.return_value.events.return_value.list.call_args
                    assert call_args[1]["timeMin"] == "2024-02-01T00:00:00Z"
                    assert call_args[1]["timeMax"] == "2024-02-28T23:59:59Z"

    def test_create_event_with_add_google_meet_passes_conference_data_version(self, app: Flask):
        from app.services.calendar.events import operations as calendar_operations

        mock_service = Mock()
        insert_mock = Mock(
            return_value=Mock(
                execute=Mock(
                    return_value={
                        "id": "new-event-123",
                        "summary": "Video call",
                    }
                )
            )
        )
        events_resource = Mock()
        events_resource.insert = insert_mock
        mock_service.events = Mock(return_value=events_resource)

        with app.app_context():
            with patch.object(calendar_operations, "build", return_value=mock_service):
                with patch.object(calendar_operations, "load_credentials"):
                    with patch(
                        "app.services.calendar.calendars.resolution.resolve_calendar_id"
                    ) as mock_resolve:
                        mock_resolve.return_value = "primary"
                        from app.services.calendar.events.operations import create_event

                        event_data = {
                            "summary": "Video call",
                            "start": {"dateTime": "2024-02-01T10:00:00Z", "timeZone": "UTC"},
                            "end": {"dateTime": "2024-02-01T11:00:00Z", "timeZone": "UTC"},
                        }

                        create_event(
                            user_id="user-123",
                            event_data=event_data,
                            calendar_id="primary",
                            client_id="client-id",
                            client_secret="client-secret",
                            token_endpoint="https://oauth2.googleapis.com/token",
                            scopes=["https://www.googleapis.com/auth/calendar.app.created"],
                            resolve_calendar_id_func=mock_resolve,
                            add_google_meet=True,
                        )

                        insert_mock.assert_called_once()
                        _args, kwargs = insert_mock.call_args
                        assert kwargs["conferenceDataVersion"] == 1
                        assert "createRequest" in kwargs["body"]["conferenceData"]
                        assert kwargs["body"]["conferenceData"]["createRequest"]["requestId"]

    def test_create_event_all_day_skips_meet_when_flag_true(self, app: Flask):
        from app.services.calendar.events import operations as calendar_operations

        mock_service = Mock()
        insert_mock = Mock(
            return_value=Mock(
                execute=Mock(
                    return_value={
                        "id": "new-event-456",
                        "summary": "All day",
                    }
                )
            )
        )
        events_resource = Mock()
        events_resource.insert = insert_mock
        mock_service.events = Mock(return_value=events_resource)

        with app.app_context():
            with patch.object(calendar_operations, "build", return_value=mock_service):
                with patch.object(calendar_operations, "load_credentials"):
                    with patch(
                        "app.services.calendar.calendars.resolution.resolve_calendar_id"
                    ) as mock_resolve:
                        mock_resolve.return_value = "primary"
                        from app.services.calendar.events.operations import create_event

                        event_data = {
                            "summary": "All day",
                            "start": {"date": "2024-02-01"},
                            "end": {"date": "2024-02-02"},
                        }

                        create_event(
                            user_id="user-123",
                            event_data=event_data,
                            calendar_id="primary",
                            client_id="client-id",
                            client_secret="client-secret",
                            token_endpoint="https://oauth2.googleapis.com/token",
                            scopes=["https://www.googleapis.com/auth/calendar.app.created"],
                            resolve_calendar_id_func=mock_resolve,
                            add_google_meet=True,
                        )

                        insert_mock.assert_called_once()
                        _args, kwargs = insert_mock.call_args
                        assert "conferenceData" not in kwargs["body"]
                        assert "conferenceDataVersion" not in kwargs

    def test_event_validation(self, app: Flask):
        """Test event data validation"""
        from app.utils.security.security import validate_event_data

        with app.app_context():
            # Valid event data
            valid_event = {
                "summary": "Meeting",
                "start": {"dateTime": "2024-02-01T10:00:00Z"},
                "end": {"dateTime": "2024-02-01T11:00:00Z"},
            }
            assert validate_event_data(valid_event) is True

            # Missing required fields
            invalid_event = {"summary": "Meeting"}
            assert validate_event_data(invalid_event) is False

    def test_list_events_handles_api_errors(self, app: Flask, mock_google_calendar):
        """Test listing events handles Google Calendar API errors"""
        from app.services.calendar.events.operations import list_events

        with app.app_context():
            with patch("app.services.calendar.events.operations_list_events.load_credentials"):
                with patch(
                    "app.services.calendar.calendars.resolution.resolve_calendar_id"
                ) as mock_resolve:
                    mock_resolve.return_value = "primary"

                    # Mock API error
                    class _SimulatedCalendarApiError(Exception):
                        """Raised by test mock for Google Calendar list failure."""

                    mock_google_calendar.return_value.events.return_value.list.return_value.execute.side_effect = _SimulatedCalendarApiError(
                        "API Error"
                    )

                    with pytest.raises(_SimulatedCalendarApiError):
                        list_events(
                            user_id="user-123",
                            calendar_id="primary",
                            client_id="client-id",
                            client_secret="client-secret",
                            token_endpoint="https://oauth2.googleapis.com/token",
                            scopes=["https://www.googleapis.com/auth/calendar.app.created"],
                            resolve_calendar_id_func=mock_resolve,
                        )
