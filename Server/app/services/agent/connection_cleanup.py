"""Clear agent/client connection rows for a user without deleting the user."""

from __future__ import annotations

from sqlalchemy import or_

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

    AgentConnectionRequest.query.filter(
        or_(
            AgentConnectionRequest.agent_id == uid,
            AgentConnectionRequest.client_id == uid,
        )
    ).delete(synchronize_session=False)

    conv_ids = [
        row[0]
        for row in db.session.query(AgentConnections.id).filter(
            or_(AgentConnections.agent_id == uid, AgentConnections.client_id == uid)
        )
    ]
    if conv_ids:
        ChatHistory.query.filter(ChatHistory.conversation_id.in_(conv_ids)).delete(
            synchronize_session=False
        )
        AgentConnections.query.filter(AgentConnections.id.in_(conv_ids)).delete(
            synchronize_session=False
        )

    Todo.query.filter(or_(Todo.agent_id == uid, Todo.client_id == uid)).delete(
        synchronize_session=False
    )

    ChecklistItemDispatchSetting.query.filter(
        or_(
            ChecklistItemDispatchSetting.agent_user_id == uid,
            ChecklistItemDispatchSetting.client_user_id == uid,
        )
    ).delete(synchronize_session=False)

    db.session.add(user)
