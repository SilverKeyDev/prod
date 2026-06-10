"""
Service functions for managing agent-client conversations.
"""

import os
import sys

from sqlalchemy import select

from app import db
from app.dtos.agent import AgentConversationDTO
from app.models import AgentConnections, User
from app.services.agent.connection_request.service import get_connection_requests
from app.services.auth.user_role_helpers import get_user_if_agent
from logger import log

from .access import established_messaging_relationship
from .event_requests import (
    EVENT_REQUEST_PREFIX,
    VALID_EVENT_REQUEST_STATUSES,
    update_event_request_status,
)
from .history import get_conversation_history
from .list import get_conversation, get_conversations
from .messaging import send_message
from .read_state import get_unread_count, mark_messages_as_read

server_dir = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
)
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

__all__ = [
    "get_conversations",
    "get_conversation",
    "create_conversation",
    "get_conversation_history",
    "send_message",
    "update_event_request_status",
    "get_unread_count",
    "mark_messages_as_read",
    "get_notification_counter",
    "EVENT_REQUEST_PREFIX",
    "VALID_EVENT_REQUEST_STATUSES",
]


def create_conversation(agent_id: str, client_id: str) -> dict:
    """
    Create a new conversation between an agent and client.
    Returns created conversation dictionary.
    """
    try:
        agent = get_user_if_agent(agent_id)
        if not agent:
            raise ValueError(f"Agent {agent_id} not found or not an agent")
        client = db.session.scalar(select(User).where(User.id == client_id))
        if not client:
            raise ValueError(f"Client {client_id} not found")

        existing = db.session.scalar(
            select(AgentConnections).where(
                AgentConnections.agent_id == agent_id,
                AgentConnections.client_id == client_id,
            )
        )
        if existing:
            return AgentConversationDTO.from_orm(existing)

        if not established_messaging_relationship(agent_id, client_id):
            raise ValueError(
                "Agent is not linked to this client. Accept a connection request or assign "
                "the client before starting a conversation."
            )

        conversation = AgentConnections(agent_id=agent_id, client_id=client_id)
        db.session.add(conversation)
        db.session.commit()
        return AgentConversationDTO.from_orm(conversation)

    except Exception as e:
        db.session.rollback()
        log.error("ERRORS", "Error creating conversation", e)
        raise e from e


def get_notification_counter(user_id: str, is_agent: bool) -> int:
    """Get total notification count (unread messages + pending connection requests)."""
    try:
        if not user_id:
            log.warn("API", "get_notification_counter called with empty user_id")
            return 0
        conversations = get_conversations(user_id, is_agent)
        total_unread_messages = sum(conv.get("unread_count", 0) for conv in conversations)
        connection_requests = get_connection_requests(user_id, is_agent)
        pending_requests_count = len(
            [req for req in connection_requests if req.get("status") == "pending"]
        )
        return total_unread_messages + pending_requests_count
    except Exception as e:
        log.error(
            "ERRORS",
            f"Error calculating notification counter for user {user_id}",
            e,
        )
        return 0
