"""Paginated conversation history reads."""

import json
from datetime import datetime
from typing import Any

from sqlalchemy import and_, exists, or_, select

from app import db
from app.dtos.agent import AgentConversationDTO
from app.models import AgentConnections, ChatHistory
from logger import log

from ._common import (
    DEFAULT_NEWER_PAGE_LIMIT,
    DEFAULT_OLDER_PAGE_LIMIT,
    MAX_HISTORY_PAGE_LIMIT,
    normalize_utc,
)


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
        timestamp_aware = normalize_utc(msg.timestamp)
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
    cts = normalize_utc(oldest_ts)
    return bool(
        db.session.scalar(
            select(
                exists().where(
                    ChatHistory.conversation_id == conversation_id,
                    or_(
                        ChatHistory.timestamp < cts,
                        and_(ChatHistory.timestamp == cts, ChatHistory.id < oldest_id),
                    ),
                )
            )
        )
    )


def _has_more_newer(
    conversation_id: str, newest_ts: datetime | None, newest_id: str | None
) -> bool:
    if newest_ts is None or newest_id is None:
        return False
    cts = normalize_utc(newest_ts)
    return bool(
        db.session.scalar(
            select(
                exists().where(
                    ChatHistory.conversation_id == conversation_id,
                    or_(
                        ChatHistory.timestamp > cts,
                        and_(ChatHistory.timestamp == cts, ChatHistory.id > newest_id),
                    ),
                )
            )
        )
    )


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
        conversation = db.session.scalar(
            select(AgentConnections).where(AgentConnections.id == conversation_id)
        )
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
            messages = db.session.scalars(
                select(ChatHistory)
                .where(ChatHistory.conversation_id == conversation_id)
                .order_by(ChatHistory.timestamp.asc(), ChatHistory.id.asc())
            ).all()
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

        base = select(ChatHistory).where(ChatHistory.conversation_id == conversation_id)

        if after_timestamp is not None and after_message_id is not None:
            page_limit = limit if limit is not None else DEFAULT_NEWER_PAGE_LIMIT
            page_limit = min(max(page_limit, 1), MAX_HISTORY_PAGE_LIMIT)
            ats = normalize_utc(after_timestamp)
            messages = db.session.scalars(
                base.where(
                    or_(
                        ChatHistory.timestamp > ats,
                        and_(ChatHistory.timestamp == ats, ChatHistory.id > after_message_id),
                    )
                )
                .order_by(ChatHistory.timestamp.asc(), ChatHistory.id.asc())
                .limit(page_limit)
            ).all()
        elif before_timestamp is not None and before_message_id is not None:
            page_limit = limit if limit is not None else DEFAULT_OLDER_PAGE_LIMIT
            page_limit = min(max(page_limit, 1), MAX_HISTORY_PAGE_LIMIT)
            bts = normalize_utc(before_timestamp)
            messages = db.session.scalars(
                base.where(
                    or_(
                        ChatHistory.timestamp < bts,
                        and_(ChatHistory.timestamp == bts, ChatHistory.id < before_message_id),
                    )
                )
                .order_by(ChatHistory.timestamp.desc(), ChatHistory.id.desc())
                .limit(page_limit)
            ).all()
            messages.reverse()
        else:
            page_limit = eff_limit
            messages = db.session.scalars(
                base.order_by(ChatHistory.timestamp.desc(), ChatHistory.id.desc()).limit(page_limit)
            ).all()
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
            "ERRORS",
            f"Error fetching conversation history for {conversation_id}",
            e,
        )
        raise
