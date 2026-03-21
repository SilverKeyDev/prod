"""List and get conversation metadata."""

import os
import sys
from datetime import timezone

from app.models import AgentConnections, ChatHistory, User

from .conversation_messages import get_unread_count

server_dir = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)
from logger import (  # noqa: E402 -- logger requires Server on sys.path when run outside app context
    LOG_CATEGORIES,
    log,
)


def _format_timestamp(dt):
    if not dt:
        return None
    if dt.tzinfo is None:
        dt_aware = dt.replace(tzinfo=timezone.utc)
    else:
        dt_aware = dt.astimezone(timezone.utc)
    return dt_aware.isoformat()


def get_conversations(user_id: str, is_agent: bool) -> list[dict]:
    """
    Get all conversations for a user (agent or client).
    Returns list of conversation dicts with metadata.
    """
    try:
        if not user_id:
            log.warn(LOG_CATEGORIES["API"], "get_conversations called with empty user_id")
            return []

        if is_agent:
            conversations = AgentConnections.query.filter_by(agent_id=user_id).all()
        else:
            conversations = AgentConnections.query.filter_by(client_id=user_id).all()

        result = []
        for conv in conversations:
            client = User.query.filter_by(id=conv.client_id).first()
            client_name = client.name if client else "Unknown"
            client_email = client.email if client else ""

            agent = User.query.filter_by(id=conv.agent_id).first()
            agent_name = agent.name if agent else "Unknown"
            agent_email = agent.email if agent else ""

            last_message_obj = (
                ChatHistory.query.filter_by(conversation_id=conv.id)
                .order_by(ChatHistory.timestamp.desc())
                .first()
            )

            unread_count = get_unread_count(conv.id, user_id)
            last_read = conv.get_last_read(user_id)

            conv_dict = {
                "id": conv.id,
                "agent_id": conv.agent_id,
                "client_id": conv.client_id,
                "client_name": client_name,
                "client_email": client_email,
                "client_profile_picture": client.profile_picture if client else None,
                "agent_name": agent_name,
                "agent_email": agent_email,
                "agent_profile_picture": agent.profile_picture if agent else None,
                "last_message": last_message_obj.message if last_message_obj else None,
                "last_message_at": _format_timestamp(
                    last_message_obj.timestamp if last_message_obj else None
                ),
                "created_at": _format_timestamp(conv.created_at),
                "updated_at": _format_timestamp(conv.updated_at),
                "unread_count": unread_count,
                "last_read_at": _format_timestamp(last_read),
            }
            result.append(conv_dict)
        return result

    except Exception as e:
        log.error(LOG_CATEGORIES["ERRORS"], f"Error fetching conversations for user {user_id}", e)
        raise


def get_conversation(conversation_id: str, user_id: str | None = None) -> dict | None:
    """Get a specific conversation by ID. Returns conversation dict or None."""
    try:
        conv = AgentConnections.query.filter_by(id=conversation_id).first()
        if not conv:
            return None
        return conv.to_dict(user_id=user_id)
    except Exception as e:
        log.error(LOG_CATEGORIES["ERRORS"], f"Error fetching conversation {conversation_id}", e)
        raise
