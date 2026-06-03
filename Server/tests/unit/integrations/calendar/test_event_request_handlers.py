"""
Unit tests for event request status updates and validation.
Tests the update_event_request_status function.
"""

from unittest.mock import Mock, patch

import pytest

from app.services.agent.event_request_handlers import (
    EVENT_REQUEST_PREFIX,
    update_event_request_status,
)

_SCALAR = "app.services.agent.event_request_handlers.db.session.scalar"
_COMMIT = "app.services.agent.event_request_handlers.db.session.commit"
_ROLLBACK = "app.services.agent.event_request_handlers.db.session.rollback"


@pytest.fixture(autouse=True)
def _app_context_for_event_request_handlers(app):
    with app.app_context():
        yield


@pytest.fixture
def mock_agent_conversation():
    conversation = Mock()
    conversation.id = "conv-123"
    conversation.agent_id = "agent-123"
    conversation.client_id = "client-456"
    return conversation


@pytest.fixture
def mock_event_request_message():
    message = Mock()
    message.id = "msg-123"
    message.conversation_id = "conv-123"
    message.sender_id = "agent-123"
    message.message = f"{EVENT_REQUEST_PREFIX}{{...}}"
    message.event_request_status = "pending"
    return message


@pytest.mark.unit
class TestUpdateEventRequestStatus:
    @patch(_COMMIT)
    @patch(_SCALAR)
    def test_accept_pending_request_valid(
        self, mock_scalar, mock_commit, mock_event_request_message, mock_agent_conversation
    ):
        mock_scalar.side_effect = [mock_event_request_message, mock_agent_conversation]
        result = update_event_request_status("msg-123", "client-456", "accepted")
        assert result["success"] is True
        assert mock_event_request_message.event_request_status == "accepted"
        mock_commit.assert_called_once()

    @patch(_SCALAR)
    def test_accept_sender_forbidden(
        self, mock_scalar, mock_event_request_message, mock_agent_conversation
    ):
        mock_scalar.side_effect = [mock_event_request_message, mock_agent_conversation]
        with pytest.raises(ValueError, match="Only the recipient can accept an event request"):
            update_event_request_status("msg-123", "agent-123", "accepted")

    @patch(_SCALAR)
    def test_accept_already_accepted(
        self, mock_scalar, mock_event_request_message, mock_agent_conversation
    ):
        mock_event_request_message.event_request_status = "accepted"
        mock_scalar.side_effect = [mock_event_request_message, mock_agent_conversation]
        with pytest.raises(ValueError, match="Event request is no longer pending"):
            update_event_request_status("msg-123", "client-456", "accepted")

    @patch(_COMMIT)
    @patch(_SCALAR)
    def test_cancel_by_sender(
        self, mock_scalar, mock_commit, mock_event_request_message, mock_agent_conversation
    ):
        mock_scalar.side_effect = [mock_event_request_message, mock_agent_conversation]
        result = update_event_request_status("msg-123", "agent-123", "cancelled")
        assert result["success"] is True
        assert mock_event_request_message.event_request_status == "cancelled"
        mock_commit.assert_called_once()

    @patch(_COMMIT)
    @patch(_SCALAR)
    def test_cancel_by_recipient(
        self, mock_scalar, mock_commit, mock_event_request_message, mock_agent_conversation
    ):
        mock_scalar.side_effect = [mock_event_request_message, mock_agent_conversation]
        result = update_event_request_status("msg-123", "client-456", "cancelled")
        assert result["success"] is True
        assert mock_event_request_message.event_request_status == "cancelled"
        mock_commit.assert_called_once()

    @patch(_SCALAR)
    def test_message_not_found(self, mock_scalar):
        mock_scalar.return_value = None
        with pytest.raises(ValueError, match="Message not found"):
            update_event_request_status("msg-not-found", "user-123", "accepted")

    @patch(_SCALAR)
    def test_message_not_in_conversation(self, mock_scalar):
        mock_message = Mock()
        mock_message.id = "msg-123"
        mock_message.conversation_id = None
        mock_scalar.return_value = mock_message
        with pytest.raises(ValueError, match="Message is not part of a conversation"):
            update_event_request_status("msg-123", "user-123", "accepted")

    @patch(_SCALAR)
    def test_conversation_not_found(self, mock_scalar, mock_event_request_message):
        mock_scalar.side_effect = [mock_event_request_message, None]
        with pytest.raises(ValueError, match="Conversation not found"):
            update_event_request_status("msg-123", "user-123", "accepted")

    @patch(_SCALAR)
    def test_user_not_in_conversation(
        self, mock_scalar, mock_event_request_message, mock_agent_conversation
    ):
        mock_scalar.side_effect = [mock_event_request_message, mock_agent_conversation]
        with pytest.raises(ValueError, match="User is not part of this conversation"):
            update_event_request_status("msg-123", "user-999", "accepted")

    @patch(_SCALAR)
    def test_invalid_message_type(self, mock_scalar, mock_agent_conversation):
        mock_message = Mock()
        mock_message.id = "msg-123"
        mock_message.conversation_id = "conv-123"
        mock_message.sender_id = "agent-123"
        mock_message.message = "Regular message without prefix"
        mock_message.event_request_status = "pending"
        mock_scalar.side_effect = [mock_message, mock_agent_conversation]
        with pytest.raises(ValueError, match="Message is not an event request"):
            update_event_request_status("msg-123", "client-456", "accepted")

    def test_invalid_status(self):
        with pytest.raises(ValueError, match="status must be 'accepted' or 'cancelled'"):
            update_event_request_status("msg-123", "user-123", "invalid_status")

    @patch(_COMMIT)
    @patch(_SCALAR)
    def test_default_pending_status(self, mock_scalar, mock_commit, mock_agent_conversation):
        mock_message = Mock()
        mock_message.id = "msg-123"
        mock_message.conversation_id = "conv-123"
        mock_message.sender_id = "agent-123"
        mock_message.message = f"{EVENT_REQUEST_PREFIX}{{...}}"
        mock_message.event_request_status = None
        mock_scalar.side_effect = [mock_message, mock_agent_conversation]
        result = update_event_request_status("msg-123", "client-456", "accepted")
        assert result["success"] is True
        assert mock_message.event_request_status == "accepted"

    @patch("app.services.agent.event_request_handlers.log")
    @patch(_ROLLBACK)
    @patch(_COMMIT)
    @patch(_SCALAR)
    def test_database_error_rollback(
        self,
        mock_scalar,
        mock_commit,
        mock_rollback,
        mock_log,
        mock_event_request_message,
        mock_agent_conversation,
    ):
        mock_scalar.side_effect = [mock_event_request_message, mock_agent_conversation]

        class _SimulatedCommitError(Exception):
            pass

        mock_commit.side_effect = _SimulatedCommitError("Database error")
        with pytest.raises(_SimulatedCommitError):
            update_event_request_status("msg-123", "client-456", "accepted")
        mock_rollback.assert_called_once()
        mock_log.error.assert_called()
