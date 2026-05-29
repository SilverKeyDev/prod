"""Conversation message operations: history, send, unread count, mark read."""

import json
import os
import sys
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import and_, or_

from app import db
from app.dtos.agent_conversation import AgentConversationDTO
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

MAX_HISTORY_PAGE_LIMIT = 100
DEFAULT_OLDER_PAGE_LIMIT = 10
DEFAULT_NEWER_PAGE_LIMIT = 50


def _normalize_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _chat_message_to_dict(
    msg: ChatHistory, conversation: AgentConnections, user_id: str | None
) -> dict[str, Any]:
    other_user_id = None
    if user_id and conversation:
        if str(user_id) == str(conversation.agent_id):
            other_user_id = conversation.client_id
        elif str(user_id) == str(conversation.client_id):
            other_user_id = conversation.agent_id

    is_read = False
    read_at_val = None
    if other_user_id:
        is_read = msg.is_read_by(other_user_id)
        if msg.read_at:
            try:
                read_at_dict = (
                    msg.read_at
                    if isinstance(msg.read_at, dict)
                    else (json.loads(msg.read_at) if isinstance(msg.read_at, str) else {})
                )
                read_at_val = read_at_dict.get(other_user_id)
            except Exception:
                pass

    timestamp_str = None
    if msg.timestamp:
        timestamp_aware = _normalize_utc(msg.timestamp)
        timestamp_str = timestamp_aware.isoformat()

    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender_id": msg.sender_id,
        "role": msg.role,
        "message": msg.message,
        "shared_home_id": msg.shared_home_id,
        "shared_document_id": msg.shared_document_id,
        "timestamp": timestamp_str,
        "is_read": is_read,
        "read_at": read_at_val,
        "event_request_status": msg.event_request_status,
    }


def _has_more_older(
    conversation_id: str, oldest_ts: datetime | None, oldest_id: str | None
) -> bool:
    if oldest_ts is None or oldest_id is None:
        return False
    cts = _normalize_utc(oldest_ts)
    q = ChatHistory.query.filter(
        ChatHistory.conversation_id == conversation_id,
        or_(
            ChatHistory.timestamp < cts,
            and_(ChatHistory.timestamp == cts, ChatHistory.id < oldest_id),
        ),
    )
    return db.session.query(q.exists()).scalar() or False


def _has_more_newer(
    conversation_id: str, newest_ts: datetime | None, newest_id: str | None
) -> bool:
    if newest_ts is None or newest_id is None:
        return False
    cts = _normalize_utc(newest_ts)
    q = ChatHistory.query.filter(
        ChatHistory.conversation_id == conversation_id,
        or_(
            ChatHistory.timestamp > cts,
            and_(ChatHistory.timestamp == cts, ChatHistory.id > newest_id),
        ),
    )
    return db.session.query(q.exists()).scalar() or False


def get_conversation_history(
    conversation_id: str,
    user_id: str | None = None,
    *,
    limit: int | None = None,
    before_timestamp: datetime | None = None,
    before_message_id: str | None = None,
    after_timestamp: datetime | None = None,
    after_message_id: str | None = None,
) -> dict:
    """
    Get chat history for a conversation.
    Without limit and without cursors: returns full history (legacy).

    With limit and/or cursors: returns a page plus has_more_older / has_more_newer.
    """
    try:
        conversation = AgentConnections.query.filter_by(id=conversation_id).first()
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        use_page = (
            limit is not None
            or before_timestamp is not None
            or before_message_id is not None
            or after_timestamp is not None
            or after_message_id is not None
        )

        if not use_page:
            messages = (
                ChatHistory.query.filter_by(conversation_id=conversation_id)
                .order_by(ChatHistory.timestamp.asc(), ChatHistory.id.asc())
                .all()
            )
            message_list = [_chat_message_to_dict(m, conversation, user_id) for m in messages]
            return {
                "messages": message_list,
                "conversation": AgentConversationDTO.from_orm(conversation, user_id=user_id),
                "has_more_older": False,
                "has_more_newer": False,
            }

        if (before_timestamp is None) != (before_message_id is None):
            raise ValueError("before_timestamp and before_message_id must be provided together")
        if (after_timestamp is None) != (after_message_id is None):
            raise ValueError("after_timestamp and after_message_id must be provided together")
        if before_timestamp is not None and after_timestamp is not None:
            raise ValueError("Cannot combine before_* and after_* cursors")

        eff_limit = limit if limit is not None else MAX_HISTORY_PAGE_LIMIT
        if eff_limit < 1:
            raise ValueError("limit must be at least 1")
        eff_limit = min(eff_limit, MAX_HISTORY_PAGE_LIMIT)

        base = ChatHistory.query.filter_by(conversation_id=conversation_id)

        if after_timestamp is not None and after_message_id is not None:
            page_limit = limit if limit is not None else DEFAULT_NEWER_PAGE_LIMIT
            page_limit = min(max(page_limit, 1), MAX_HISTORY_PAGE_LIMIT)
            ats = _normalize_utc(after_timestamp)
            messages = (
                base.filter(
                    or_(
                        ChatHistory.timestamp > ats,
                        and_(ChatHistory.timestamp == ats, ChatHistory.id > after_message_id),
                    )
                )
                .order_by(ChatHistory.timestamp.asc(), ChatHistory.id.asc())
                .limit(page_limit)
                .all()
            )
        elif before_timestamp is not None and before_message_id is not None:
            page_limit = limit if limit is not None else DEFAULT_OLDER_PAGE_LIMIT
            page_limit = min(max(page_limit, 1), MAX_HISTORY_PAGE_LIMIT)
            bts = _normalize_utc(before_timestamp)
            messages = (
                base.filter(
                    or_(
                        ChatHistory.timestamp < bts,
                        and_(ChatHistory.timestamp == bts, ChatHistory.id < before_message_id),
                    )
                )
                .order_by(ChatHistory.timestamp.desc(), ChatHistory.id.desc())
                .limit(page_limit)
                .all()
            )
            messages.reverse()
        else:
            page_limit = eff_limit
            messages = (
                base.order_by(ChatHistory.timestamp.desc(), ChatHistory.id.desc())
                .limit(page_limit)
                .all()
            )
            messages.reverse()

        message_list = [_chat_message_to_dict(m, conversation, user_id) for m in messages]

        oldest_ts: datetime | None = None
        oldest_id: str | None = None
        newest_ts: datetime | None = None
        newest_id: str | None = None
        if messages:
            oldest = messages[0]
            newest = messages[-1]
            oldest_ts = oldest.timestamp
            oldest_id = oldest.id
            newest_ts = newest.timestamp
            newest_id = newest.id

        has_more_older = _has_more_older(conversation_id, oldest_ts, oldest_id)
        has_more_newer = _has_more_newer(conversation_id, newest_ts, newest_id)

        return {
            "messages": message_list,
            "conversation": AgentConversationDTO.from_orm(conversation, user_id=user_id),
            "has_more_older": has_more_older,
            "has_more_newer": has_more_newer,
        }

    except ValueError:
        raise
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
        from .messaging_realtime import notify_conversation_participants_new_message

        notify_conversation_participants_new_message(
            str(conversation.agent_id),
            str(conversation.client_id),
            str(conversation_id),
            str(chat_message.id),
        )
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
        log.error(LOG_CATEGORIES["ERRORS"], "Error marking messages as read", e)
        raise
