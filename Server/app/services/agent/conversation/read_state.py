"""Unread counts and mark-read for conversation messages."""

from sqlalchemy import func, select

from app import db
from app.models import AgentConnections, ChatHistory
from logger import log


def get_unread_count(conversation_id: str, user_id: str) -> int:
    """Get the number of unread messages for a user in a conversation."""
    try:
        conversation = db.session.scalar(
            select(AgentConnections).where(AgentConnections.id == conversation_id)
        )
        if not conversation:
            return 0

        last_read = conversation.get_last_read(user_id)

        if str(user_id) == str(conversation.agent_id):
            other_user_id = conversation.client_id
        elif str(user_id) == str(conversation.client_id):
            other_user_id = conversation.agent_id
        else:
            return 0

        count_stmt = (
            select(func.count())
            .select_from(ChatHistory)
            .where(
                ChatHistory.conversation_id == conversation_id,
                ChatHistory.sender_id == other_user_id,
            )
        )
        if last_read:
            count_stmt = count_stmt.where(ChatHistory.timestamp > last_read)
        return db.session.scalar(count_stmt) or 0

    except Exception as e:
        log.error(
            "ERRORS",
            f"Error calculating unread count for conversation {conversation_id}, user {user_id}",
            e,
        )
        return 0


def mark_messages_as_read(conversation_id: str, user_id: str) -> dict:
    """Mark all messages in a conversation as read by a user."""
    try:
        conversation = db.session.scalar(
            select(AgentConnections).where(AgentConnections.id == conversation_id)
        )
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")
        if str(user_id) != str(conversation.agent_id) and str(user_id) != str(
            conversation.client_id
        ):
            raise ValueError(f"User {user_id} is not part of conversation {conversation_id}")

        if str(user_id) == str(conversation.agent_id):
            other_user_id = conversation.client_id
        else:
            other_user_id = conversation.agent_id

        messages = db.session.scalars(
            select(ChatHistory).where(
                ChatHistory.conversation_id == conversation_id,
                ChatHistory.sender_id == other_user_id,
            )
        ).all()

        marked_count = 0
        for msg in messages:
            if not msg.is_read_by(user_id):
                msg.mark_as_read(user_id)
                marked_count += 1

        conversation.update_last_read(user_id)
        db.session.commit()
        from .messaging_realtime import notify_conversation_participants_read

        notify_conversation_participants_read(
            str(conversation.agent_id),
            str(conversation.client_id),
            str(conversation_id),
            str(user_id),
        )
        return {"success": True, "marked_count": marked_count}

    except Exception as e:
        db.session.rollback()
        log.error("ERRORS", "Error marking messages as read", e)
        raise
