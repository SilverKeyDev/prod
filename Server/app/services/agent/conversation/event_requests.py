"""Calendar event request message status updates."""

import os
import sys

from sqlalchemy import select

from app import db
from app.models import AgentConnections, ChatHistory

server_dir = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
)
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)
from logger import (  # noqa: E402 -- logger requires Server on sys.path when run outside app context
    log,
)

EVENT_REQUEST_PREFIX = "__EVENT_REQUEST__"
VALID_EVENT_REQUEST_STATUSES = ("pending", "accepted", "cancelled")


def update_event_request_status(
    message_id: str,
    user_id: str,
    status: str,
) -> dict:
    """
    Update the event_request_status of a calendar event request message.
    Accept: only the recipient can set 'accepted'; status must be 'pending'.
    Cancel: either party can set 'cancelled'.
    """
    if status not in ("accepted", "cancelled"):
        raise ValueError("status must be 'accepted' or 'cancelled'")
    try:
        msg = db.session.scalar(select(ChatHistory).where(ChatHistory.id == message_id))
        if not msg:
            raise ValueError("Message not found")
        if not msg.conversation_id:
            raise ValueError("Message is not part of a conversation")
        conversation = db.session.scalar(
            select(AgentConnections).where(AgentConnections.id == msg.conversation_id)
        )
        if not conversation:
            raise ValueError("Conversation not found")
        if str(user_id) != str(conversation.agent_id) and str(user_id) != str(
            conversation.client_id
        ):
            raise ValueError("User is not part of this conversation")
        if not (msg.message and msg.message.strip().startswith(EVENT_REQUEST_PREFIX)):
            raise ValueError("Message is not an event request")
        current = msg.event_request_status or "pending"
        if status == "accepted":
            if str(msg.sender_id) == str(user_id):
                raise ValueError("Only the recipient can accept an event request")
            if current != "pending":
                raise ValueError("Event request is no longer pending")
        msg.event_request_status = status
        db.session.commit()
        return {"success": True}
    except ValueError:
        raise
    except Exception as e:
        db.session.rollback()
        log.error("ERRORS", "Error updating event request status", e)
        raise
