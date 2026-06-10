"""Send chat messages in agent-client conversations."""

from datetime import datetime, timezone

from sqlalchemy import select

from app import db
from app.models import AgentConnections, ChatHistory
from logger import log


def send_message(
    conversation_id: str,
    sender_id: str,
    message: str,
    role: str,
    shared_home_id: str | None = None,
    shared_document_id: str | None = None,
) -> dict:
    """Send a message in a conversation. Returns dict with message_id."""
    try:
        if not conversation_id:
            raise ValueError("conversation_id is required")
        if not sender_id:
            raise ValueError("sender_id is required")
        has_attachment = bool(shared_home_id or shared_document_id)
        if not (message or "").strip() and not has_attachment:
            raise ValueError("message is required unless sharing a home or document")

        conversation = db.session.scalar(
            select(AgentConnections).where(AgentConnections.id == conversation_id)
        )
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
        log.error("ERRORS", "Error sending message", e)
        raise
