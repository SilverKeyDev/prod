"""Conversation message operations: history, send, unread count, mark read."""

import json
import os
import sys
from datetime import datetime, timezone

from app import db
from app.models import AgentConnections, ChatHistory

server_dir = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)
from logger import (  # noqa: E402 -- logger requires Server on sys.path when run outside app context
    LOG_CATEGORIES,
    log,
)


def get_conversation_history(conversation_id: str, user_id: str | None = None) -> dict:
    """
    Get chat history for a conversation.
    Returns dictionary with messages array and conversation info.
    """
    try:
        conversation = AgentConnections.query.filter_by(id=conversation_id).first()
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        messages = (
            ChatHistory.query.filter_by(conversation_id=conversation_id)
            .order_by(ChatHistory.timestamp.asc())
            .all()
        )

        message_list = []
        for msg in messages:
            other_user_id = None
            if user_id and conversation:
                if str(user_id) == str(conversation.agent_id):
                    other_user_id = conversation.client_id
                elif str(user_id) == str(conversation.client_id):
                    other_user_id = conversation.agent_id

            is_read = False
            read_at = None
            if other_user_id:
                is_read = msg.is_read_by(other_user_id)
                if msg.read_at:
                    try:
                        read_at_dict = (
                            msg.read_at
                            if isinstance(msg.read_at, dict)
                            else (json.loads(msg.read_at) if isinstance(msg.read_at, str) else {})
                        )
                        read_at = read_at_dict.get(other_user_id)
                    except Exception:
                        pass

            timestamp_str = None
            if msg.timestamp:
                if msg.timestamp.tzinfo is None:
                    timestamp_aware = msg.timestamp.replace(tzinfo=timezone.utc)
                else:
                    timestamp_aware = msg.timestamp.astimezone(timezone.utc)
                timestamp_str = timestamp_aware.isoformat()

            message_dict = {
                "id": msg.id,
                "conversation_id": msg.conversation_id,
                "sender_id": msg.sender_id,
                "role": msg.role,
                "message": msg.message,
                "shared_home_id": msg.shared_home_id,
                "shared_document_id": msg.shared_document_id,
                "timestamp": timestamp_str,
                "is_read": is_read,
                "read_at": read_at,
                "event_request_status": msg.event_request_status,
            }
            message_list.append(message_dict)

        return {
            "messages": message_list,
            "conversation": conversation.to_dict(user_id=user_id),
        }

    except Exception as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            f"Error fetching conversation history for {conversation_id}",
            e,
        )
        raise


def send_message(
    conversation_id: str,
    sender_id: str,
    message: str,
    role: str,
    shared_home_id: str | None = None,
    shared_document_id: str | None = None,
) -> dict:
    """
    Send a message in a conversation. Returns dict with message_id.
    """
    try:
        if not conversation_id:
            raise ValueError("conversation_id is required")
        if not sender_id:
            raise ValueError("sender_id is required")
        has_attachment = bool(shared_home_id or shared_document_id)
        if not (message or "").strip() and not has_attachment:
            raise ValueError("message is required unless sharing a home or document")

        conversation = AgentConnections.query.filter_by(id=conversation_id).first()
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")
        if str(sender_id) != str(conversation.agent_id) and str(sender_id) != str(
            conversation.client_id
        ):
            raise ValueError(f"User {sender_id} is not part of conversation {conversation_id}")

        event_request_status = None
        if message and message.strip().startswith("__EVENT_REQUEST__"):
            event_request_status = "pending"

        chat_message = ChatHistory(
            user_id=sender_id,
            conversation_id=conversation_id,
            sender_id=sender_id,
            role=role,
            message=message,
            shared_home_id=shared_home_id,
            shared_document_id=shared_document_id,
            timestamp=datetime.now(timezone.utc),
            event_request_status=event_request_status,
        )

        now_utc = datetime.now(timezone.utc)
        conversation.last_message_at = now_utc
        conversation.updated_at = now_utc

        db.session.add(chat_message)
        db.session.commit()
        return {"message_id": chat_message.id}

    except Exception as e:
        db.session.rollback()
        log.error(LOG_CATEGORIES["ERRORS"], "Error sending message", e)
        raise


def get_unread_count(conversation_id: str, user_id: str) -> int:
    """Get the number of unread messages for a user in a conversation."""
    try:
        conversation = AgentConnections.query.filter_by(id=conversation_id).first()
        if not conversation:
            return 0

        last_read = conversation.get_last_read(user_id)

        if str(user_id) == str(conversation.agent_id):
            other_user_id = conversation.client_id
        elif str(user_id) == str(conversation.client_id):
            other_user_id = conversation.agent_id
        else:
            return 0

        query = ChatHistory.query.filter_by(
            conversation_id=conversation_id, sender_id=other_user_id
        )
        if last_read:
            query = query.filter(ChatHistory.timestamp > last_read)
        return query.count()

    except Exception as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            f"Error calculating unread count for conversation {conversation_id}, user {user_id}",
            e,
        )
        return 0


def mark_messages_as_read(conversation_id: str, user_id: str) -> dict:
    """Mark all messages in a conversation as read by a user. Returns success and marked_count."""
    try:
        conversation = AgentConnections.query.filter_by(id=conversation_id).first()
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

        messages = ChatHistory.query.filter_by(
            conversation_id=conversation_id, sender_id=other_user_id
        ).all()

        marked_count = 0
        for msg in messages:
            if not msg.is_read_by(user_id):
                msg.mark_as_read(user_id)
                marked_count += 1

        conversation.update_last_read(user_id)
        db.session.commit()
        return {"success": True, "marked_count": marked_count}

    except Exception as e:
        db.session.rollback()
        log.error(LOG_CATEGORIES["ERRORS"], "Error marking messages as read", e)
        raise
