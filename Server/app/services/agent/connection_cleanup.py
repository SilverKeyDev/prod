"""Clear agent/client connection rows for a user without deleting the user."""

from __future__ import annotations

from sqlalchemy import delete, or_, select

from app import db
from app.models import (
    AgentConnectionRequest,
    AgentConnections,
    ChatHistory,
    ChecklistItemDispatchSetting,
    Todo,
    User,
)


def clear_agent_client_connections(user_id: str, user: User) -> None:
    """
    Remove agent/client links, chats, todos, and dispatch settings for a user.
    """
    uid = str(user_id).strip()

    db.session.execute(
        delete(AgentConnectionRequest).where(
            or_(
                AgentConnectionRequest.agent_id == uid,
                AgentConnectionRequest.client_id == uid,
            )
        )
    )

    conv_ids = list(
        db.session.scalars(
            select(AgentConnections.id).where(
                or_(AgentConnections.agent_id == uid, AgentConnections.client_id == uid)
            )
        ).all()
    )
    if conv_ids:
        db.session.execute(delete(ChatHistory).where(ChatHistory.conversation_id.in_(conv_ids)))
        db.session.execute(delete(AgentConnections).where(AgentConnections.id.in_(conv_ids)))

    db.session.execute(delete(Todo).where(or_(Todo.agent_id == uid, Todo.client_id == uid)))

    db.session.execute(
        delete(ChecklistItemDispatchSetting).where(
            or_(
                ChecklistItemDispatchSetting.agent_user_id == uid,
                ChecklistItemDispatchSetting.client_user_id == uid,
            )
        )
    )

    db.session.add(user)
