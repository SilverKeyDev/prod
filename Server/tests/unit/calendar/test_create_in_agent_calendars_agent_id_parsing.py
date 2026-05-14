"""Agent ID parsing edge cases for create_in_agent_calendars."""

import json
from unittest.mock import Mock, patch

import pytest

from app.services.calendar.events.creation import create_in_agent_calendars


@pytest.fixture(autouse=True)
def _app_context_for_agent_id_parsing_tests(app):
    with app.app_context():
        yield


@pytest.mark.unit
class TestCreateInAgentCalendarsAgentIdParsing:
    @patch("app.services.calendar.events.creation.User.query")
    def test_agent_id_json_string_parsing(
        self, mock_user_query, mock_event_data, mock_calendar_event
    ):
        """Should parse JSON string format for agent_id"""
        user_id = "client-456"
        calendar_id = "primary"
        event_type = "meeting"

        mock_client = Mock()
        mock_client.id = "client-456"
        mock_client.is_agent = False
        mock_client.agent_id = json.dumps(["agent-123", "agent-456"])

        mock_filter = Mock()
        mock_user_query.filter_by.return_value = mock_filter
        mock_filter.first.return_value = mock_client

        with patch("app.services.calendar.events.creation.tokens_get") as mock_tokens:
            mock_tokens.return_value = None

            create_in_agent_calendars(
                user_id,
                mock_event_data,
                calendar_id,
                event_type,
                mock_calendar_event,
                should_create=True,
                is_agent=False,
            )

            assert mock_tokens.call_count == 2

    @patch("app.services.calendar.events.creation.User.query")
    def test_agent_id_comma_separated_parsing(
        self, mock_user_query, mock_event_data, mock_calendar_event
    ):
        """Should parse comma-separated string format for agent_id"""
        user_id = "client-456"
        calendar_id = "primary"
        event_type = "meeting"

        mock_client = Mock()
        mock_client.id = "client-456"
        mock_client.is_agent = False
        mock_client.agent_id = "agent-123, agent-456"

        mock_filter = Mock()
        mock_user_query.filter_by.return_value = mock_filter
        mock_filter.first.return_value = mock_client

        with patch("app.services.calendar.events.creation.tokens_get") as mock_tokens:
            mock_tokens.return_value = None

            create_in_agent_calendars(
                user_id,
                mock_event_data,
                calendar_id,
                event_type,
                mock_calendar_event,
                should_create=True,
                is_agent=False,
            )

            assert mock_tokens.call_count == 2
