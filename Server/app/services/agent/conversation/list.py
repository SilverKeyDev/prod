"""List and get conversation metadata."""

import os
import sys
from datetime import timezone

from sqlalchemy import and_, func, select

from app import db
from app.dtos.agent import AgentConversationDTO
from app.models import AgentConnections, ChatHistory, User

server_dir = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
)
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)
from logger import (  # noqa: E402 -- logger requires Server on sys.path when run outside app context
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
            log.warn("API", "get_conversations called with empty user_id")
            return []

        if is_agent:
            conversations = db.session.scalars(
                select(AgentConnections).where(AgentConnections.agent_id == user_id)
            ).all()
        else:
            conversations = db.session.scalars(
                select(AgentConnections).where(AgentConnections.client_id == user_id)
            ).all()

        if not conversations:
            log.info(
                "API",
                "get_conversations",
                {"user_id": user_id, "has_agent_role": is_agent, "count": 0},
            )
            return []

        # Batch load all users
        all_user_ids = set()
        for conv in conversations:
            all_user_ids.add(conv.client_id)
            all_user_ids.add(conv.agent_id)

        users = db.session.scalars(select(User).where(User.id.in_(all_user_ids))).all()
        users_by_id = {str(u.id): u for u in users}

        # Batch load last messages for all conversations
        conversation_ids = [conv.id for conv in conversations]

        # Get last message per conversation using a subquery
        subq = (
            select(
                ChatHistory.conversation_id,
                func.max(ChatHistory.timestamp).label("max_timestamp"),
            )
            .where(ChatHistory.conversation_id.in_(conversation_ids))
            .group_by(ChatHistory.conversation_id)
            .subquery()
        )

        last_messages = db.session.scalars(
            select(ChatHistory).join(
                subq,
                and_(
                    ChatHistory.conversation_id == subq.c.conversation_id,
                    ChatHistory.timestamp == subq.c.max_timestamp,
                ),
            )
        ).all()
        last_messages_by_conv = {msg.conversation_id: msg for msg in last_messages}

        # Batch calculate unread counts
        last_reads = {conv.id: conv.get_last_read(user_id) for conv in conversations}

        # Build unread count query with aggregation
        unread_counts = {}
        for conv in conversations:
            if is_agent:
                other_user_id = conv.client_id
            else:
                other_user_id = conv.agent_id

            unread_stmt = (
                select(ChatHistory.conversation_id, func.count(ChatHistory.id).label("count"))
                .where(
                    ChatHistory.conversation_id == conv.id,
                    ChatHistory.sender_id == other_user_id,
                )
                .group_by(ChatHistory.conversation_id)
            )

            last_read = last_reads.get(conv.id)
            if last_read:
                unread_stmt = unread_stmt.where(ChatHistory.timestamp > last_read)

            result_row = db.session.execute(unread_stmt).first()
            unread_counts[conv.id] = result_row.count if result_row else 0

        result = []
        for conv in conversations:
            client = users_by_id.get(str(conv.client_id))
            client_name = client.name if client else "Unknown"
            client_email = client.email if client else ""
            client_profile_picture = client.profile_picture if client else None

            agent = users_by_id.get(str(conv.agent_id))
            agent_name = agent.name if agent else "Unknown"
            agent_email = agent.email if agent else ""
            agent_profile_picture = agent.profile_picture if agent else None

            last_message_obj = last_messages_by_conv.get(conv.id)
            unread_count = unread_counts.get(conv.id, 0)
            last_read = last_reads.get(conv.id)

            conv_dict = {
                "id": conv.id,
                "agent_id": conv.agent_id,
                "client_id": conv.client_id,
                "client_name": client_name,
                "client_email": client_email,
                "client_profile_picture": client_profile_picture,
                "agent_name": agent_name,
                "agent_email": agent_email,
                "agent_profile_picture": agent_profile_picture,
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
        log.info(
            "API",
            "get_conversations",
            {"user_id": user_id, "has_agent_role": is_agent, "count": len(result)},
        )
        return result

    except Exception as e:
        log.error("ERRORS", f"Error fetching conversations for user {user_id}", e)
        raise


def get_conversation(conversation_id: str, user_id: str | None = None) -> dict | None:
    """Get a specific conversation by ID. Returns conversation dict or None."""
    try:
        conv = db.session.scalar(
            select(AgentConnections).where(AgentConnections.id == conversation_id)
        )
        if not conv:
            return None
        return AgentConversationDTO.from_orm(conv, user_id=user_id)
    except Exception as e:
        log.error("ERRORS", f"Error fetching conversation {conversation_id}", e)
        raise
