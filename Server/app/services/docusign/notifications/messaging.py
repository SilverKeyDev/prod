"""
Send SilverKey in-app messages when DocuSign agreement events occur.

Messages use the __AGREEMENT_EVENT__ prefix so the frontend can render
specialised agreement event cards in the messaging thread.
"""

import json
from datetime import datetime, timezone

from app import db
from app.models import AgentConnections, Agreement, ChatHistory
from logger import LOG_CATEGORIES, get_logger

logger = get_logger()

AGREEMENT_EVENT_PREFIX = "__AGREEMENT_EVENT__"


def _next_signer_user_id(agreement: Agreement) -> str | None:
    """First signer by routing order who has not yet completed signing."""

    def _is_signed(recipient_status: str | None) -> bool:
        st = (recipient_status or "").lower()
        return st in ("signed", "completed")

    participants_list = list(agreement.participants or [])  # pyright: ignore[reportArgumentType]
    signers = sorted(
        (p for p in participants_list if p.role == "signer" and p.user_id),
        key=lambda p: (p.routing_order or 999, p.user_id or ""),
    )
    for p in signers:
        if not _is_signed(p.recipient_status):
            return p.user_id
    return None


def _build_dedupe_key(agreement_id: str, event_type: str) -> str:
    """Deterministic key for idempotent message insertion."""
    return f"__AGREEMENT_EVENT__{agreement_id}__{event_type}"


def send_agreement_message(
    agreement: Agreement,
    event_type: str,
    *,
    auto_commit: bool = True,
) -> str | None:
    """
    Post a system message into the agent-client conversation when an
    agreement lifecycle event happens.

    Args:
        agreement: The Agreement instance (must have agent_id, buyer_id, title).
        event_type: One of "sent", "client_signed", "agent_signed", "completed".
        auto_commit: When True (default, used by Celery tasks), commit immediately.
            When False (webhook path), rows are flushed but the caller is
            responsible for committing as part of its own transaction.

    Returns:
        The ChatHistory.id of the created message, or None on failure.
    """
    try:
        if not agreement.agent_id or not agreement.buyer_id:
            logger.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "Cannot send agreement message - missing agent_id or buyer_id",
                {"agreement_id": agreement.id},
            )
            return None

        # Idempotency: skip if a message for this agreement+event already exists
        dedupe_key = _build_dedupe_key(agreement.id, event_type)
        existing = ChatHistory.query.filter(ChatHistory.message.like(f"%{dedupe_key}%")).first()
        if existing:
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Duplicate agreement event message skipped",
                {"agreement_id": agreement.id, "event_type": event_type},
            )
            return existing.id

        conversation = AgentConnections.query.filter_by(
            agent_id=agreement.agent_id,
            client_id=agreement.buyer_id,
        ).first()

        if not conversation:
            logger.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "No conversation found between agent and client for agreement notification",
                {
                    "agreement_id": agreement.id,
                    "agent_id": agreement.agent_id,
                    "buyer_id": agreement.buyer_id,
                },
            )
            return None

        sender_id = _resolve_sender(agreement, event_type)

        payload = {
            "agreement_id": agreement.id,
            "title": agreement.title,
            "status": agreement.status,
            "event": event_type,
            "dedupe_key": dedupe_key,
        }
        if event_type == "sent":
            next_uid = _next_signer_user_id(agreement)
            if next_uid:
                payload["next_signer_user_id"] = next_uid
        message_body = AGREEMENT_EVENT_PREFIX + json.dumps(payload)

        now_utc = datetime.now(timezone.utc)
        chat_message = ChatHistory(
            user_id=sender_id,
            conversation_id=conversation.id,
            sender_id=sender_id,
            role="agent" if sender_id == agreement.agent_id else "user",
            message=message_body,
            shared_document_id=agreement.id,
            timestamp=now_utc,
        )

        conversation.last_message_at = now_utc
        conversation.updated_at = now_utc

        db.session.add(chat_message)

        if auto_commit:
            db.session.commit()
        else:
            db.session.flush()

        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Agreement event message sent in conversation",
            {
                "agreement_id": agreement.id,
                "event_type": event_type,
                "conversation_id": conversation.id,
                "message_id": chat_message.id,
            },
        )

        return chat_message.id

    except Exception as e:
        if auto_commit:
            db.session.rollback()
        logger.error(
            LOG_CATEGORIES["ERRORS"],
            "Failed to send agreement event message",
            {"agreement_id": agreement.id, "event_type": event_type, "error": str(e)},
        )
        return None


def _resolve_sender(agreement: Agreement, event_type: str) -> str:
    """Pick the appropriate sender_id based on event semantics."""
    if event_type == "client_signed":
        return agreement.buyer_id
    # For "sent", "agent_signed", "completed" the agent is the actor
    return agreement.agent_id
