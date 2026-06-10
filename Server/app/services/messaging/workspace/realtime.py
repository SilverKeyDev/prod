"""Redis fan-out for workspace conversation participants."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select

from app import db
from app.models import WorkspaceConversationParticipant
from app.services.agent.conversation.messaging_realtime import publish_messaging_user_payload


def list_active_participant_user_ids(conversation_id: str) -> list[str]:
    rows = db.session.scalars(
        select(WorkspaceConversationParticipant).where(
            WorkspaceConversationParticipant.conversation_id == str(conversation_id),
            WorkspaceConversationParticipant.left_at.is_(None),
        )
    ).all()
    return [str(r.user_id) for r in rows]


def notify_workspace_conversation_participants(
    conversation_id: str,
    payload: dict[str, Any],
    *,
    exclude_user_id: str | None = None,
) -> None:
    for uid in list_active_participant_user_ids(conversation_id):
        if exclude_user_id and str(uid) == str(exclude_user_id):
            continue
        publish_messaging_user_payload(uid, payload)


def notify_workspace_new_message(
    conversation_id: str, message_id: str, *, conversation_kind: str
) -> None:
    notify_workspace_conversation_participants(
        conversation_id,
        {
            "kind": "new_message",
            "conversation_id": conversation_id,
            "message_id": message_id,
            "conversation_kind": conversation_kind,
            "stack": "workspace",
        },
    )


def notify_workspace_conversation_read(
    conversation_id: str, reader_id: str, *, conversation_kind: str
) -> None:
    notify_workspace_conversation_participants(
        conversation_id,
        {
            "kind": "conversation_read",
            "conversation_id": conversation_id,
            "reader_id": str(reader_id),
            "conversation_kind": conversation_kind,
            "stack": "workspace",
        },
        exclude_user_id=reader_id,
    )
