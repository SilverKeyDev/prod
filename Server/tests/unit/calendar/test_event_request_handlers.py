"""
Unit tests for event request status updates and validation.
Tests the update_event_request_status function.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock

from app.models import ChatHistory, AgentConnections
from app.services.agent.event_request_handlers import (
    update_event_request_status,
    EVENT_REQUEST_PREFIX,
)


@pytest.fixture
def mock_agent_conversation():
    """Create a mock agent-client conversation"""
    conversation = Mock()
    conversation.id = "conv-123"
    conversation.agent_id = "agent-123"
    conversation.client_id = "client-456"
    return conversation


@pytest.fixture
def mock_event_request_message():
    """Create a mock event request message"""
    message = Mock()
    message.id = "msg-123"
    message.conversation_id = "conv-123"
    message.sender_id = "agent-123"
    message.message = f"{EVENT_REQUEST_PREFIX}{{...}}"
    message.event_request_status = "pending"
    return message


@pytest.mark.unit
class TestUpdateEventRequestStatus:
    """Test event request status updates and validation"""

    @patch("app.services.agent.event_request_handlers.db.session")
    @patch("app.services.agent.event_request_handlers.ChatHistory.query")
    @patch("app.services.agent.event_request_handlers.AgentConnections.query")
    def test_accept_pending_request_valid(
        self,
        mock_connection_query,
        mock_chat_query,
        mock_db_session,
        mock_event_request_message,
        mock_agent_conversation,
    ):
        """Recipient should successfully accept a pending event request"""
        message_id = "msg-123"
        user_id = "client-456"  # Recipient
        status = "accepted"

        # Mock query chains
        mock_chat_filter = Mock()
        mock_chat_query.filter_by.return_value = mock_chat_filter
        mock_chat_filter.first.return_value = mock_event_request_message

        mock_conn_filter = Mock()
        mock_connection_query.filter_by.return_value = mock_conn_filter
        mock_conn_filter.first.return_value = mock_agent_conversation

        result = update_event_request_status(message_id, user_id, status)

        assert result["success"] is True
        assert mock_event_request_message.event_request_status == "accepted"
        mock_db_session.commit.assert_called_once()

    @patch("app.services.agent.event_request_handlers.ChatHistory.query")
    @patch("app.services.agent.event_request_handlers.AgentConnections.query")
    def test_accept_sender_forbidden(
        self,
        mock_connection_query,
        mock_chat_query,
        mock_event_request_message,
        mock_agent_conversation,
    ):
        """Sender should not be able to accept their own event request"""
        message_id = "msg-123"
        user_id = "agent-123"  # Sender
        status = "accepted"

        # Mock query chains
        mock_chat_filter = Mock()
        mock_chat_query.filter_by.return_value = mock_chat_filter
        mock_chat_filter.first.return_value = mock_event_request_message

        mock_conn_filter = Mock()
        mock_connection_query.filter_by.return_value = mock_conn_filter
        mock_conn_filter.first.return_value = mock_agent_conversation

        with pytest.raises(ValueError, match="Only the recipient can accept an event request"):
            update_event_request_status(message_id, user_id, status)

    @patch("app.services.agent.event_request_handlers.ChatHistory.query")
    @patch("app.services.agent.event_request_handlers.AgentConnections.query")
    def test_accept_already_accepted(
        self,
        mock_connection_query,
        mock_chat_query,
        mock_event_request_message,
        mock_agent_conversation,
    ):
        """Should not accept an event request that is not pending"""
        message_id = "msg-123"
        user_id = "client-456"
        status = "accepted"

        # Set current status to accepted
        mock_event_request_message.event_request_status = "accepted"

        # Mock query chains
        mock_chat_filter = Mock()
        mock_chat_query.filter_by.return_value = mock_chat_filter
        mock_chat_filter.first.return_value = mock_event_request_message

        mock_conn_filter = Mock()
        mock_connection_query.filter_by.return_value = mock_conn_filter
        mock_conn_filter.first.return_value = mock_agent_conversation

        with pytest.raises(ValueError, match="Event request is no longer pending"):
            update_event_request_status(message_id, user_id, status)

    @patch("app.services.agent.event_request_handlers.db.session")
    @patch("app.services.agent.event_request_handlers.ChatHistory.query")
    @patch("app.services.agent.event_request_handlers.AgentConnections.query")
    def test_cancel_by_sender(
        self,
        mock_connection_query,
        mock_chat_query,
        mock_db_session,
        mock_event_request_message,
        mock_agent_conversation,
    ):
        """Sender should be able to cancel their own event request"""
        message_id = "msg-123"
        user_id = "agent-123"  # Sender
        status = "cancelled"

        # Mock query chains
        mock_chat_filter = Mock()
        mock_chat_query.filter_by.return_value = mock_chat_filter
        mock_chat_filter.first.return_value = mock_event_request_message

        mock_conn_filter = Mock()
        mock_connection_query.filter_by.return_value = mock_conn_filter
        mock_conn_filter.first.return_value = mock_agent_conversation

        result = update_event_request_status(message_id, user_id, status)

        assert result["success"] is True
        assert mock_event_request_message.event_request_status == "cancelled"
        mock_db_session.commit.assert_called_once()

    @patch("app.services.agent.event_request_handlers.db.session")
    @patch("app.services.agent.event_request_handlers.ChatHistory.query")
    @patch("app.services.agent.event_request_handlers.AgentConnections.query")
    def test_cancel_by_recipient(
        self,
        mock_connection_query,
        mock_chat_query,
        mock_db_session,
        mock_event_request_message,
        mock_agent_conversation,
    ):
        """Recipient should be able to cancel an event request"""
        message_id = "msg-123"
        user_id = "client-456"  # Recipient
        status = "cancelled"

        # Mock query chains
        mock_chat_filter = Mock()
        mock_chat_query.filter_by.return_value = mock_chat_filter
        mock_chat_filter.first.return_value = mock_event_request_message

        mock_conn_filter = Mock()
        mock_connection_query.filter_by.return_value = mock_conn_filter
        mock_conn_filter.first.return_value = mock_agent_conversation

        result = update_event_request_status(message_id, user_id, status)

        assert result["success"] is True
        assert mock_event_request_message.event_request_status == "cancelled"
        mock_db_session.commit.assert_called_once()

    @patch("app.services.agent.event_request_handlers.ChatHistory.query")
    def test_message_not_found(self, mock_chat_query):
        """Should raise ValueError when message is not found"""
        message_id = "msg-not-found"
        user_id = "user-123"
        status = "accepted"

        mock_chat_filter = Mock()
        mock_chat_query.filter_by.return_value = mock_chat_filter
        mock_chat_filter.first.return_value = None

        with pytest.raises(ValueError, match="Message not found"):
            update_event_request_status(message_id, user_id, status)

    @patch("app.services.agent.event_request_handlers.ChatHistory.query")
    def test_message_not_in_conversation(self, mock_chat_query):
        """Should raise ValueError when message is not part of a conversation"""
        message_id = "msg-123"
        user_id = "user-123"
        status = "accepted"

        mock_message = Mock()
        mock_message.id = "msg-123"
        mock_message.conversation_id = None

        mock_chat_filter = Mock()
        mock_chat_query.filter_by.return_value = mock_chat_filter
        mock_chat_filter.first.return_value = mock_message

        with pytest.raises(ValueError, match="Message is not part of a conversation"):
            update_event_request_status(message_id, user_id, status)

    @patch("app.services.agent.event_request_handlers.ChatHistory.query")
    @patch("app.services.agent.event_request_handlers.AgentConnections.query")
    def test_conversation_not_found(
        self, mock_connection_query, mock_chat_query, mock_event_request_message
    ):
        """Should raise ValueError when conversation is not found"""
        message_id = "msg-123"
        user_id = "user-123"
        status = "accepted"

        # Mock query chains
        mock_chat_filter = Mock()
        mock_chat_query.filter_by.return_value = mock_chat_filter
        mock_chat_filter.first.return_value = mock_event_request_message

        mock_conn_filter = Mock()
        mock_connection_query.filter_by.return_value = mock_conn_filter
        mock_conn_filter.first.return_value = None

        with pytest.raises(ValueError, match="Conversation not found"):
            update_event_request_status(message_id, user_id, status)

    @patch("app.services.agent.event_request_handlers.ChatHistory.query")
    @patch("app.services.agent.event_request_handlers.AgentConnections.query")
    def test_user_not_in_conversation(
        self,
        mock_connection_query,
        mock_chat_query,
        mock_event_request_message,
        mock_agent_conversation,
    ):
        """Should raise ValueError when user is not part of the conversation"""
        message_id = "msg-123"
        user_id = "user-999"  # Not in conversation
        status = "accepted"

        # Mock query chains
        mock_chat_filter = Mock()
        mock_chat_query.filter_by.return_value = mock_chat_filter
        mock_chat_filter.first.return_value = mock_event_request_message

        mock_conn_filter = Mock()
        mock_connection_query.filter_by.return_value = mock_conn_filter
        mock_conn_filter.first.return_value = mock_agent_conversation

        with pytest.raises(ValueError, match="User is not part of this conversation"):
            update_event_request_status(message_id, user_id, status)

    @patch("app.services.agent.event_request_handlers.ChatHistory.query")
    @patch("app.services.agent.event_request_handlers.AgentConnections.query")
    def test_invalid_message_type(
        self, mock_connection_query, mock_chat_query, mock_agent_conversation
    ):
        """Should raise ValueError when message is not an event request"""
        message_id = "msg-123"
        user_id = "client-456"
        status = "accepted"

        # Create message without EVENT_REQUEST_PREFIX
        mock_message = Mock()
        mock_message.id = "msg-123"
        mock_message.conversation_id = "conv-123"
        mock_message.sender_id = "agent-123"
        mock_message.message = "Regular message without prefix"
        mock_message.event_request_status = "pending"

        # Mock query chains
        mock_chat_filter = Mock()
        mock_chat_query.filter_by.return_value = mock_chat_filter
        mock_chat_filter.first.return_value = mock_message

        mock_conn_filter = Mock()
        mock_connection_query.filter_by.return_value = mock_conn_filter
        mock_conn_filter.first.return_value = mock_agent_conversation

        with pytest.raises(ValueError, match="Message is not an event request"):
            update_event_request_status(message_id, user_id, status)

    def test_invalid_status(self):
        """Should raise ValueError for invalid status values"""
        message_id = "msg-123"
        user_id = "user-123"
        status = "invalid_status"

        with pytest.raises(ValueError, match="status must be 'accepted' or 'cancelled'"):
            update_event_request_status(message_id, user_id, status)

    @patch("app.services.agent.event_request_handlers.db.session")
    @patch("app.services.agent.event_request_handlers.ChatHistory.query")
    @patch("app.services.agent.event_request_handlers.AgentConnections.query")
    def test_default_pending_status(
        self,
        mock_connection_query,
        mock_chat_query,
        mock_db_session,
        mock_agent_conversation,
    ):
        """Should treat None event_request_status as 'pending'"""
        message_id = "msg-123"
        user_id = "client-456"
        status = "accepted"

        # Create message with None event_request_status
        mock_message = Mock()
        mock_message.id = "msg-123"
        mock_message.conversation_id = "conv-123"
        mock_message.sender_id = "agent-123"
        mock_message.message = f"{EVENT_REQUEST_PREFIX}{{...}}"
        mock_message.event_request_status = None  # Should be treated as "pending"

        # Mock query chains
        mock_chat_filter = Mock()
        mock_chat_query.filter_by.return_value = mock_chat_filter
        mock_chat_filter.first.return_value = mock_message

        mock_conn_filter = Mock()
        mock_connection_query.filter_by.return_value = mock_conn_filter
        mock_conn_filter.first.return_value = mock_agent_conversation

        result = update_event_request_status(message_id, user_id, status)

        assert result["success"] is True
        assert mock_message.event_request_status == "accepted"

    @patch("app.services.agent.event_request_handlers.db.session")
    @patch("app.services.agent.event_request_handlers.ChatHistory.query")
    @patch("app.services.agent.event_request_handlers.AgentConnections.query")
    @patch("app.services.agent.event_request_handlers.log")
    def test_database_error_rollback(
        self,
        mock_log,
        mock_connection_query,
        mock_chat_query,
        mock_db_session,
        mock_event_request_message,
        mock_agent_conversation,
    ):
        """Should rollback and raise on database errors"""
        message_id = "msg-123"
        user_id = "client-456"
        status = "accepted"

        # Mock query chains
        mock_chat_filter = Mock()
        mock_chat_query.filter_by.return_value = mock_chat_filter
        mock_chat_filter.first.return_value = mock_event_request_message

        mock_conn_filter = Mock()
        mock_connection_query.filter_by.return_value = mock_conn_filter
        mock_conn_filter.first.return_value = mock_agent_conversation

        # Mock commit to raise an exception
        mock_db_session.commit.side_effect = Exception("Database error")

        with pytest.raises(Exception):
            update_event_request_status(message_id, user_id, status)

        mock_db_session.rollback.assert_called_once()
        mock_log.error.assert_called()
