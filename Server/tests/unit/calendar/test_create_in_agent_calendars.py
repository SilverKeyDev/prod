"""
Unit tests for agent calendar duplication logic when clients create events.
Tests the create_in_agent_calendars function.
"""

from datetime import datetime, timezone
from unittest.mock import Mock, patch

import pytest

from app.services.calendar.events.creation import create_in_agent_calendars


@pytest.fixture(autouse=True)
def _app_context_for_creation_tests(app):
    with app.app_context():
        yield


@pytest.mark.unit
class TestCreateInAgentCalendars:
    """Test agent calendar duplication logic"""

    @patch("app.services.calendar.events.creation.db.session")
    @patch("app.services.calendar.events.creation.User.query")
    @patch("app.services.calendar.events.creation.tokens_get")
    @patch("app.services.calendar.events.creation.google_calendar_service")
    @patch("app.services.calendar.events.creation.CalendarEvent")
    @patch("app.services.calendar.events.creation.extract_event_datetimes")
    def test_create_in_agent_calendar_success(
        self,
        mock_extract_datetimes,
        mock_calendar_event_class,
        mock_google_service,
        mock_tokens_get,
        mock_user_query,
        mock_db_session,
        mock_client_user_single_agent,
        mock_calendar_event,
        mock_event_data,
    ):
        """Client event should be created in agent's calendar with shared_with_user_ids"""
        user_id = "client-456"
        agent_id = "agent-123"
        calendar_id = "primary"
        event_type = "meeting"

        # Mock query chain
        mock_filter = Mock()
        mock_user_query.filter_by.return_value = mock_filter
        mock_filter.first.return_value = mock_client_user_single_agent

        # Mock tokens_get to simulate agent has calendar connected
        mock_tokens_get.return_value = {"access_token": "mock_token"}

        # Mock Google Calendar service
        mock_google_event = {
            "id": "google-event-123",
            "summary": "Test Event",
            "description": "Test Description",
            "location": "Test Location",
            "start": {"dateTime": "2026-04-15T10:00:00Z"},
            "end": {"dateTime": "2026-04-15T11:00:00Z"},
            "status": "confirmed",
            "attendees": [],
            "reminders": {},
        }
        mock_google_service.create_event.return_value = mock_google_event
        mock_google_service.get_or_create_silverkey_calendar.return_value = {"id": "calendar-123"}

        # Mock datetime extraction
        start_dt = datetime(2026, 4, 15, 10, 0, 0, tzinfo=timezone.utc)
        end_dt = datetime(2026, 4, 15, 11, 0, 0, tzinfo=timezone.utc)
        mock_extract_datetimes.return_value = (start_dt, end_dt, "UTC")

        # Execute
        create_in_agent_calendars(
            user_id,
            mock_event_data,
            calendar_id,
            event_type,
            mock_calendar_event,
            should_create=True,
            is_agent=False,
        )

        # Verify Google service was called with correct parameters
        mock_google_service.create_event.assert_called_once_with(
            user_id, mock_event_data, calendar_id, target_user_id=agent_id
        )

        # Verify CalendarEvent was instantiated
        assert mock_calendar_event_class.called

        # Verify db.session.add was called
        assert mock_db_session.add.called

        # Verify shared_with_user_ids was updated
        assert agent_id in mock_calendar_event.shared_with_user_ids

    @patch("app.services.calendar.events.creation.User.query")
    def test_skip_if_agent(self, mock_user_query, mock_event_data, mock_calendar_event):
        """Should not create in agent calendars when creator is agent"""
        user_id = "agent-123"
        calendar_id = "primary"
        event_type = "meeting"

        create_in_agent_calendars(
            user_id,
            mock_event_data,
            calendar_id,
            event_type,
            mock_calendar_event,
            should_create=True,
            is_agent=True,
        )

        # Verify User.query was never called
        mock_user_query.filter_by.assert_not_called()

    @patch("app.services.calendar.events.creation.User.query")
    def test_skip_if_should_create_false(
        self, mock_user_query, mock_event_data, mock_calendar_event
    ):
        """Should not create in agent calendars when should_create is False"""
        user_id = "client-456"
        calendar_id = "primary"
        event_type = "meeting"

        create_in_agent_calendars(
            user_id,
            mock_event_data,
            calendar_id,
            event_type,
            mock_calendar_event,
            should_create=False,
            is_agent=False,
        )

        # Verify User.query was never called
        mock_user_query.filter_by.assert_not_called()

    @patch("app.services.calendar.events.creation.User.query")
    def test_no_agent(
        self, mock_user_query, mock_client_user_no_agent, mock_event_data, mock_calendar_event
    ):
        """Should handle client without agent gracefully"""
        user_id = "client-999"
        calendar_id = "primary"
        event_type = "meeting"

        # Mock query chain
        mock_filter = Mock()
        mock_user_query.filter_by.return_value = mock_filter
        mock_filter.first.return_value = mock_client_user_no_agent

        create_in_agent_calendars(
            user_id,
            mock_event_data,
            calendar_id,
            event_type,
            mock_calendar_event,
            should_create=True,
            is_agent=False,
        )

        # Should complete without error
        # No agents to process

    @patch("app.services.calendar.events.creation.db.session")
    @patch("app.services.calendar.events.creation.User.query")
    @patch("app.services.calendar.events.creation.tokens_get")
    @patch("app.services.calendar.events.creation.logger")
    def test_agent_no_calendar_connected(
        self,
        mock_logger,
        mock_tokens_get,
        mock_user_query,
        mock_db_session,
        mock_client_user_single_agent,
        mock_event_data,
        mock_calendar_event,
    ):
        """Should skip gracefully when agent doesn't have calendar connected"""
        user_id = "client-456"
        calendar_id = "primary"
        event_type = "meeting"

        # Mock query chain
        mock_filter = Mock()
        mock_user_query.filter_by.return_value = mock_filter
        mock_filter.first.return_value = mock_client_user_single_agent

        # Mock tokens_get to return None (no calendar connected)
        mock_tokens_get.return_value = None

        create_in_agent_calendars(
            user_id,
            mock_event_data,
            calendar_id,
            event_type,
            mock_calendar_event,
            should_create=True,
            is_agent=False,
        )

        # Verify warning was logged
        mock_logger.warning.assert_called_once()
        warning_call = mock_logger.warning.call_args[0]
        assert "does not have Google Calendar connected" in warning_call[0]

    @patch("app.services.calendar.events.creation.db.session")
    @patch("app.services.calendar.events.creation.User.query")
    @patch("app.services.calendar.events.creation.tokens_get")
    @patch("app.services.calendar.events.creation.google_calendar_service")
    @patch("app.services.calendar.events.creation.CalendarEvent")
    @patch("app.services.calendar.events.creation.extract_event_datetimes")
    def test_multiple_agents(
        self,
        mock_extract_datetimes,
        mock_calendar_event_class,
        mock_google_service,
        mock_tokens_get,
        mock_user_query,
        mock_db_session,
        mock_client_user_multiple_agents,
        mock_calendar_event,
        mock_event_data,
    ):
        """Client with multiple agents should create event in all agent calendars"""
        user_id = "client-789"
        agent_id_1 = "agent-123"
        agent_id_2 = "agent-456"
        calendar_id = "primary"
        event_type = "meeting"

        # Mock query chain
        mock_filter = Mock()
        mock_user_query.filter_by.return_value = mock_filter
        mock_filter.first.return_value = mock_client_user_multiple_agents

        # Mock tokens_get to simulate both agents have calendar connected
        mock_tokens_get.return_value = {"access_token": "mock_token"}

        # Mock Google Calendar service
        mock_google_event = {
            "id": "google-event-123",
            "summary": "Test Event",
            "start": {"dateTime": "2026-04-15T10:00:00Z"},
            "end": {"dateTime": "2026-04-15T11:00:00Z"},
            "status": "confirmed",
        }
        mock_google_service.create_event.return_value = mock_google_event
        mock_google_service.get_or_create_silverkey_calendar.return_value = {"id": "calendar-123"}

        # Mock datetime extraction
        start_dt = datetime(2026, 4, 15, 10, 0, 0, tzinfo=timezone.utc)
        end_dt = datetime(2026, 4, 15, 11, 0, 0, tzinfo=timezone.utc)
        mock_extract_datetimes.return_value = (start_dt, end_dt, "UTC")

        # Execute
        create_in_agent_calendars(
            user_id,
            mock_event_data,
            calendar_id,
            event_type,
            mock_calendar_event,
            should_create=True,
            is_agent=False,
        )

        # Verify Google service was called twice (once for each agent)
        assert mock_google_service.create_event.call_count == 2

        # Verify both agents are in shared_with_user_ids
        assert agent_id_1 in mock_calendar_event.shared_with_user_ids
        assert agent_id_2 in mock_calendar_event.shared_with_user_ids

    @patch("app.services.calendar.events.creation.db.session")
    @patch("app.services.calendar.events.creation.User.query")
    @patch("app.services.calendar.events.creation.tokens_get")
    @patch("app.services.calendar.events.creation.google_calendar_service")
    @patch("app.services.calendar.events.creation.logger")
    @patch("app.services.calendar.events.creation.CalendarEvent")
    @patch("app.services.calendar.events.creation.extract_event_datetimes")
    def test_partial_failure_continues(
        self,
        mock_extract_datetimes,
        mock_calendar_event_class,
        mock_logger,
        mock_google_service,
        mock_tokens_get,
        mock_user_query,
        mock_db_session,
        mock_client_user_multiple_agents,
        mock_calendar_event,
        mock_event_data,
    ):
        """One agent calendar creation failure should not prevent others"""
        user_id = "client-789"
        agent_id_2 = "agent-456"
        calendar_id = "primary"
        event_type = "meeting"

        # Mock query chain
        mock_filter = Mock()
        mock_user_query.filter_by.return_value = mock_filter
        mock_filter.first.return_value = mock_client_user_multiple_agents

        # Mock tokens_get to simulate both agents have calendar connected
        mock_tokens_get.return_value = {"access_token": "mock_token"}

        # Mock Google Calendar service to fail on first call, succeed on second
        mock_google_event = {
            "id": "google-event-456",
            "summary": "Test Event",
            "start": {"dateTime": "2026-04-15T10:00:00Z"},
            "end": {"dateTime": "2026-04-15T11:00:00Z"},
            "status": "confirmed",
        }
        mock_google_service.create_event.side_effect = [
            Exception("Calendar API error"),
            mock_google_event,
        ]
        mock_google_service.get_or_create_silverkey_calendar.return_value = {"id": "calendar-123"}

        # Mock datetime extraction
        start_dt = datetime(2026, 4, 15, 10, 0, 0, tzinfo=timezone.utc)
        end_dt = datetime(2026, 4, 15, 11, 0, 0, tzinfo=timezone.utc)
        mock_extract_datetimes.return_value = (start_dt, end_dt, "UTC")

        # Execute
        create_in_agent_calendars(
            user_id,
            mock_event_data,
            calendar_id,
            event_type,
            mock_calendar_event,
            should_create=True,
            is_agent=False,
        )

        # Verify error was logged for first agent
        mock_logger.error.assert_called()
        error_call = mock_logger.error.call_args[0]
        assert "Error creating event in agent" in error_call[0]

        # Verify second agent's event was still created
        assert mock_google_service.create_event.call_count == 2

        # Verify at least second agent is in shared_with_user_ids
        assert agent_id_2 in mock_calendar_event.shared_with_user_ids
