"""
Unit tests for agent calendar duplication logic when clients create events.
Tests the create_in_agent_calendars function.
"""

from datetime import datetime, timezone
from unittest.mock import patch

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
    @patch("app.services.calendar.events.creation.get_connected_agent_ids_for_client")
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
        mock_linked_agents,
        mock_db_session,
        mock_calendar_event,
        mock_event_data,
    ):
        """Client event should be created in agent's calendar with shared_with_user_ids"""
        user_id = "client-456"
        agent_id = "agent-123"
        calendar_id = "primary"
        event_type = "meeting"

        mock_linked_agents.return_value = {agent_id}
        mock_tokens_get.return_value = {"access_token": "mock_token"}

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

        start_dt = datetime(2026, 4, 15, 10, 0, 0, tzinfo=timezone.utc)
        end_dt = datetime(2026, 4, 15, 11, 0, 0, tzinfo=timezone.utc)
        mock_extract_datetimes.return_value = (start_dt, end_dt, "UTC")

        create_in_agent_calendars(
            user_id,
            mock_event_data,
            calendar_id,
            event_type,
            mock_calendar_event,
            should_create=True,
            is_agent=False,
        )

        mock_google_service.create_event.assert_called_once_with(
            user_id, mock_event_data, calendar_id, target_user_id=agent_id
        )
        assert mock_calendar_event_class.called
        assert mock_db_session.add.called
        assert agent_id in mock_calendar_event.shared_with_user_ids

    @patch("app.services.calendar.events.creation.get_connected_agent_ids_for_client")
    def test_skip_if_agent(self, mock_linked_agents, mock_event_data, mock_calendar_event):
        """Should not create in agent calendars when creator is agent"""
        create_in_agent_calendars(
            "agent-123",
            mock_event_data,
            "primary",
            "meeting",
            mock_calendar_event,
            should_create=True,
            is_agent=True,
        )
        mock_linked_agents.assert_not_called()

    @patch("app.services.calendar.events.creation.get_connected_agent_ids_for_client")
    def test_skip_if_should_create_false(
        self, mock_linked_agents, mock_event_data, mock_calendar_event
    ):
        """Should not create in agent calendars when should_create is False"""
        create_in_agent_calendars(
            "client-456",
            mock_event_data,
            "primary",
            "meeting",
            mock_calendar_event,
            should_create=False,
            is_agent=False,
        )
        mock_linked_agents.assert_not_called()

    @patch("app.services.calendar.events.creation.get_connected_agent_ids_for_client")
    def test_no_agent(self, mock_linked_agents, mock_event_data, mock_calendar_event):
        """Should handle client without linked agents gracefully"""
        mock_linked_agents.return_value = set()
        create_in_agent_calendars(
            "client-999",
            mock_event_data,
            "primary",
            "meeting",
            mock_calendar_event,
            should_create=True,
            is_agent=False,
        )

    @patch("app.services.calendar.events.creation.db.session")
    @patch("app.services.calendar.events.creation.get_connected_agent_ids_for_client")
    @patch("app.services.calendar.events.creation.tokens_get")
    @patch("app.services.calendar.events.creation.logger")
    def test_agent_no_calendar_connected(
        self,
        mock_logger,
        mock_tokens_get,
        mock_linked_agents,
        mock_db_session,
        mock_event_data,
        mock_calendar_event,
    ):
        """Should skip gracefully when agent doesn't have calendar connected"""
        mock_linked_agents.return_value = {"agent-123"}
        mock_tokens_get.return_value = None

        create_in_agent_calendars(
            "client-456",
            mock_event_data,
            "primary",
            "meeting",
            mock_calendar_event,
            should_create=True,
            is_agent=False,
        )

        mock_logger.warning.assert_called_once()
        warning_call = mock_logger.warning.call_args[0]
        assert "does not have Google Calendar connected" in warning_call[0]

    @patch("app.services.calendar.events.creation.db.session")
    @patch("app.services.calendar.events.creation.get_connected_agent_ids_for_client")
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
        mock_linked_agents,
        mock_db_session,
        mock_calendar_event,
        mock_event_data,
    ):
        """Client with multiple agents should create event in all agent calendars"""
        agent_id_1 = "agent-123"
        agent_id_2 = "agent-456"
        mock_linked_agents.return_value = [agent_id_1, agent_id_2]
        mock_tokens_get.return_value = {"access_token": "mock_token"}

        mock_google_event = {
            "id": "google-event-123",
            "summary": "Test Event",
            "start": {"dateTime": "2026-04-15T10:00:00Z"},
            "end": {"dateTime": "2026-04-15T11:00:00Z"},
            "status": "confirmed",
        }
        mock_google_service.create_event.return_value = mock_google_event
        mock_google_service.get_or_create_silverkey_calendar.return_value = {"id": "calendar-123"}

        start_dt = datetime(2026, 4, 15, 10, 0, 0, tzinfo=timezone.utc)
        end_dt = datetime(2026, 4, 15, 11, 0, 0, tzinfo=timezone.utc)
        mock_extract_datetimes.return_value = (start_dt, end_dt, "UTC")

        create_in_agent_calendars(
            "client-789",
            mock_event_data,
            "primary",
            "meeting",
            mock_calendar_event,
            should_create=True,
            is_agent=False,
        )

        assert mock_google_service.create_event.call_count == 2
        assert agent_id_1 in mock_calendar_event.shared_with_user_ids
        assert agent_id_2 in mock_calendar_event.shared_with_user_ids

    @patch("app.services.calendar.events.creation.db.session")
    @patch("app.services.calendar.events.creation.get_connected_agent_ids_for_client")
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
        mock_linked_agents,
        mock_db_session,
        mock_calendar_event,
        mock_event_data,
    ):
        """One agent calendar creation failure should not prevent others"""
        failing_agent = "agent-123"
        succeeding_agent = "agent-456"
        mock_linked_agents.return_value = [failing_agent, succeeding_agent]
        mock_tokens_get.return_value = {"access_token": "mock_token"}

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

        start_dt = datetime(2026, 4, 15, 10, 0, 0, tzinfo=timezone.utc)
        end_dt = datetime(2026, 4, 15, 11, 0, 0, tzinfo=timezone.utc)
        mock_extract_datetimes.return_value = (start_dt, end_dt, "UTC")

        create_in_agent_calendars(
            "client-789",
            mock_event_data,
            "primary",
            "meeting",
            mock_calendar_event,
            should_create=True,
            is_agent=False,
        )

        mock_logger.error.assert_called()
        error_call = mock_logger.error.call_args[0]
        assert "Error creating event in agent" in error_call[0]
        assert mock_google_service.create_event.call_count == 2
        assert succeeding_agent in mock_calendar_event.shared_with_user_ids
