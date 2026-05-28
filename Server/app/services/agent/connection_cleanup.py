"""Clear agent/client connection rows for a user without deleting the user."""

from __future__ import annotations

import json

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


def _strip_id_from_user_list_field(raw: str | None, deleted_id: str) -> tuple[str | None, bool]:
    """Parse legacy client_ids / agent_id text; remove deleted_id. Returns (new_value, changed)."""
    if not raw or not str(raw).strip():
        return raw, False
    s = str(raw).strip()
    ids: list[str] = []
    used_json = False
    try:
        parsed = json.loads(s)
        if isinstance(parsed, list):
            ids = [str(x) for x in parsed]
            used_json = True
        elif parsed is not None and parsed != "":
            ids = [str(parsed)]
            used_json = True
    except (json.JSONDecodeError, TypeError):
        ids = [p.strip() for p in s.split(",") if p.strip()]
    before = len(ids)
    ids = [x for x in ids if x != deleted_id]
    if len(ids) == before:
        return raw, False
    if not ids:
        return None, True
    return (json.dumps(ids) if used_json else ",".join(ids), True)


def _remove_user_from_peer_legacy_fields(user_id: str) -> None:
    uid = str(user_id).strip()
    for peer in User.query.filter(User.id != uid).all():
        changed = False
        new_c, ch = _strip_id_from_user_list_field(peer.client_ids, uid)
        if ch:
            peer.client_ids = new_c
            changed = True
        new_a, ch = _strip_id_from_user_list_field(peer.agent_id, uid)
        if ch:
            peer.agent_id = new_a
            changed = True
        if changed:
            db.session.add(peer)


def clear_agent_client_connections(user_id: str, user: User) -> None:
    """
    Remove agent/client links, chats, todos, and dispatch settings for a user.

    Clears the target user's legacy roster fields and strips their id from peers.
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

    user.client_ids = None
    user.agent_id = None
    db.session.add(user)

    _remove_user_from_peer_legacy_fields(uid)
