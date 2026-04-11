"""
Service functions for managing agent-client conversations.
Re-exports from conversation_list, conversation_messages, event_request_handlers.
"""

import json
import os
import sys

from app import db
from app.models import AgentConnections, User

from .connection_request_service import get_connection_requests
from .conversation_list import get_conversation, get_conversations
from .conversation_messages import (
    get_conversation_history,
    get_unread_count,
    mark_messages_as_read,
    send_message,
)
from .event_request_handlers import (
    EVENT_REQUEST_PREFIX,
    VALID_EVENT_REQUEST_STATUSES,
    update_event_request_status,
)

server_dir = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)
from logger import (  # noqa: E402 -- logger requires Server on sys.path when run outside app context
    LOG_CATEGORIES,
    log,
)


def _sync_client_ids(agent: User, client_id: str) -> None:
    """Ensure client_id is present in agent.client_ids (JSON list stored as text)."""
    if agent.client_ids:
        try:
            client_ids = (
                json.loads(agent.client_ids)
                if isinstance(agent.client_ids, str)
                else agent.client_ids
            )
            if not isinstance(client_ids, list):
                client_ids = [client_ids] if client_ids else []
        except Exception:
            client_ids = [cid.strip() for cid in agent.client_ids.split(",") if cid.strip()]
        if client_id not in client_ids:
            client_ids.append(client_id)
            agent.client_ids = json.dumps(client_ids)
    else:
        agent.client_ids = json.dumps([client_id])


def _sync_agent_id(client: User, agent_id: str) -> None:
    """Ensure agent_id is present in client.agent_id (JSON list stored as text)."""
    if client.agent_id:
        try:
            agent_ids = (
                json.loads(client.agent_id) if isinstance(client.agent_id, str) else client.agent_id
            )
            if not isinstance(agent_ids, list):
                agent_ids = [agent_ids] if agent_ids else []
        except Exception:
            agent_ids = [aid.strip() for aid in client.agent_id.split(",") if aid.strip()]
        if agent_id not in agent_ids:
            agent_ids.append(agent_id)
            client.agent_id = json.dumps(agent_ids)
    else:
        client.agent_id = json.dumps([agent_id])


def create_conversation(agent_id: str, client_id: str) -> dict:
    """
    Create a new conversation between an agent and client.
    Also ensures client_ids/agent_id are in sync on both User records.
    Returns created conversation dictionary.
    """
    try:
        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent:
            raise ValueError(f"Agent {agent_id} not found or not an agent")
        client = User.query.filter_by(id=client_id).first()
        if not client:
            raise ValueError(f"Client {client_id} not found")

        existing = AgentConnections.query.filter_by(agent_id=agent_id, client_id=client_id).first()
        if existing:
            # Still sync user records in case they drifted
            _sync_client_ids(agent, client_id)
            _sync_agent_id(client, agent_id)
            db.session.commit()
            return existing.to_dict()

        conversation = AgentConnections(agent_id=agent_id, client_id=client_id)
        db.session.add(conversation)

        _sync_client_ids(agent, client_id)
        _sync_agent_id(client, agent_id)

        db.session.commit()
        return conversation.to_dict()

    except Exception as e:
        db.session.rollback()
        log.error(LOG_CATEGORIES["ERRORS"], "Error creating conversation", e)
        raise e from e


def get_notification_counter(user_id: str, is_agent: bool) -> int:
    """Get total notification count (unread messages + pending connection requests)."""
    try:
        if not user_id:
            log.warn(LOG_CATEGORIES["API"], "get_notification_counter called with empty user_id")
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
            LOG_CATEGORIES["ERRORS"],
            f"Error calculating notification counter for user {user_id}",
            e,
        )
        return 0


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
