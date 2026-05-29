"""Linked-agent resolution for create_in_agent_calendars."""

from unittest.mock import patch

import pytest

from app.services.calendar.events.creation import create_in_agent_calendars


@pytest.fixture(autouse=True)
def _app_context_for_agent_id_parsing_tests(app):
    with app.app_context():
        yield


@pytest.mark.unit
class TestCreateInAgentCalendarsLinkedAgents:
    @patch("app.services.calendar.events.creation.get_connected_agent_ids_for_client")
    def test_multiple_linked_agents(self, mock_linked_agents, mock_event_data, mock_calendar_event):
        """Should attempt calendar creation for each agent in agent_conversations."""
        mock_linked_agents.return_value = {"agent-123", "agent-456"}

        with patch("app.services.calendar.events.creation.tokens_get") as mock_tokens:
            mock_tokens.return_value = None

            create_in_agent_calendars(
                "client-456",
                mock_event_data,
                "primary",
                "meeting",
                mock_calendar_event,
                should_create=True,
                is_agent=False,
            )

            assert mock_tokens.call_count == 2
            mock_linked_agents.assert_called_once_with("client-456")

    @patch("app.services.calendar.events.creation.get_connected_agent_ids_for_client")
    def test_no_linked_agents_is_noop(
        self, mock_linked_agents, mock_event_data, mock_calendar_event
    ):
        mock_linked_agents.return_value = set()

        with patch("app.services.calendar.events.creation.tokens_get") as mock_tokens:
            create_in_agent_calendars(
                "client-456",
                mock_event_data,
                "primary",
                "meeting",
                mock_calendar_event,
                should_create=True,
                is_agent=False,
            )

            mock_tokens.assert_not_called()
