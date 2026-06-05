"""Workspace conversation orchestration."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import and_, func, select

from app import db
from app.dtos.messaging.workspace_conversation import WorkspaceConversationDTO
from app.models import ChatHistory, WorkspaceConversation, WorkspaceConversationParticipant
from app.services.messaging.workspace.access import user_may_access_workspace_conversation
from app.services.messaging.workspace.kinds import get_policy
from app.services.messaging.workspace.realtime import (
    notify_workspace_conversation_read,
    notify_workspace_new_message,
)
from app.utils.security.admin_roles import user_has_super_admin_role


def _update_last_read(conversation: WorkspaceConversation, user_id: str) -> None:
    if not conversation.last_read_at:
        last_read_dict: dict[str, str] = {}
    else:
        try:
            last_read_dict = (
                json.loads(conversation.last_read_at)
                if isinstance(conversation.last_read_at, str)
                else dict(conversation.last_read_at or {})
            )
        except Exception:
            last_read_dict = {}
    last_read_dict[str(user_id)] = datetime.now(timezone.utc).isoformat()
    conversation.last_read_at = json.dumps(last_read_dict)


def _conversation_ids_for_user(user_id: str) -> list[str]:
    rows = db.session.scalars(
        select(WorkspaceConversationParticipant.conversation_id).where(
            WorkspaceConversationParticipant.user_id == str(user_id),
            WorkspaceConversationParticipant.left_at.is_(None),
        )
    ).all()
    return [str(r) for r in rows]


def list_conversations(
    user: Any,
    *,
    kinds: list[str] | None = None,
    admin_scope: bool = False,
) -> list[dict]:
    uid = str(user.id)
    if admin_scope:
        if not user_has_super_admin_role(user):
            return []
        q = select(WorkspaceConversation).where(WorkspaceConversation.kind == "platform_support")
    else:
        conv_ids = _conversation_ids_for_user(uid)
        if not conv_ids:
            return []
        q = select(WorkspaceConversation).where(WorkspaceConversation.id.in_(conv_ids))

    if kinds:
        q = q.where(WorkspaceConversation.kind.in_(kinds))

    conversations = db.session.scalars(q.order_by(WorkspaceConversation.updated_at.desc())).all()
    if not conversations:
        return []

    conv_ids = [c.id for c in conversations]
    subq = (
        select(
            ChatHistory.workspace_conversation_id,
            func.max(ChatHistory.timestamp).label("max_timestamp"),
        )
        .where(ChatHistory.workspace_conversation_id.in_(conv_ids))
        .group_by(ChatHistory.workspace_conversation_id)
        .subquery()
    )
    last_messages = db.session.scalars(
        select(ChatHistory).join(
            subq,
            and_(
                ChatHistory.workspace_conversation_id == subq.c.workspace_conversation_id,
                ChatHistory.timestamp == subq.c.max_timestamp,
            ),
        )
    ).all()
    last_by_conv = {m.workspace_conversation_id: m for m in last_messages}

    out: list[dict] = []
    for conv in conversations:
        policy = get_policy(conv.kind)
        item = WorkspaceConversationDTO.from_orm(conv, user_id=uid)
        item = policy.enrich_list_item(conv, item)
        last_msg = last_by_conv.get(conv.id)
        item["last_message"] = last_msg.message if last_msg else None
        item["unread_count"] = _unread_count(conv, uid, last_msg)
        out.append(item)
    return out


def _unread_count(conv: WorkspaceConversation, user_id: str, last_msg: ChatHistory | None) -> int:
    last_read = None
    if conv.last_read_at:
        try:
            d = (
                json.loads(conv.last_read_at)
                if isinstance(conv.last_read_at, str)
                else conv.last_read_at
            )
            read_str = d.get(str(user_id)) if isinstance(d, dict) else None
            if read_str:
                if read_str.endswith("Z"):
                    read_str = read_str.replace("Z", "+00:00")
                last_read = datetime.fromisoformat(read_str)
        except Exception:
            last_read = None
    q = (
        select(func.count())
        .select_from(ChatHistory)
        .where(
            ChatHistory.workspace_conversation_id == conv.id,
            ChatHistory.sender_id != str(user_id),
        )
    )
    if last_read:
        q = q.where(ChatHistory.timestamp > last_read)
    return int(db.session.scalar(q) or 0)


def get_conversation(conversation_id: str) -> WorkspaceConversation | None:
    return db.session.scalar(
        select(WorkspaceConversation).where(WorkspaceConversation.id == str(conversation_id))
    )


def create_conversation(user: Any, payload: dict[str, Any]) -> dict:
    kind = payload.get("kind")
    if kind == "group":
        raise ValueError("Group conversations are not available yet")
    if not kind:
        raise ValueError("kind is required")

    policy = get_policy(str(kind))
    if kind == "platform_support" and not payload.get("support_category"):
        category = policy._support_category_for_user(user)  # type: ignore[attr-defined]
        if category:
            payload = {**payload, "support_category": category}

    if not policy.may_create(user, payload):
        raise ValueError("Not authorized to create this conversation")

    existing = _find_existing_conversation(kind, payload, user)
    if existing:
        return WorkspaceConversationDTO.from_orm(existing, user_id=str(user.id))

    if kind == "platform_support":
        category = payload.get("support_category")
        if not category and hasattr(policy, "_support_category_for_user"):
            category = policy._support_category_for_user(user)  # type: ignore[attr-defined]
        conv = WorkspaceConversation(
            id=str(uuid.uuid4()),
            kind=str(kind),
            subject_user_id=str(user.id),
            support_category=category,
            created_by_user_id=str(user.id),
        )
    else:
        conv = WorkspaceConversation(
            id=str(uuid.uuid4()),
            kind=str(kind),
            brokerage_org_id=payload.get("brokerage_org_id"),
            partner_id=payload.get("partner_id"),
            subject_user_id=payload.get("subject_user_id"),
            support_category=payload.get("support_category"),
            agent_user_id=payload.get("agent_user_id"),
            created_by_user_id=str(user.id),
        )
    db.session.add(conv)
    db.session.flush()

    specs = policy.resolve_participants_on_create(user, payload)
    for spec in specs:
        db.session.add(
            WorkspaceConversationParticipant(
                id=str(uuid.uuid4()),
                conversation_id=conv.id,
                user_id=spec.user_id,
                participant_role=spec.participant_role,
                added_by_user_id=str(user.id),
            )
        )
    conv.participant_count = len(specs)
    db.session.commit()
    db.session.refresh(conv)
    return WorkspaceConversationDTO.from_orm(conv, user_id=str(user.id))


def _find_existing_conversation(
    kind: str, payload: dict[str, Any], user: Any | None = None
) -> WorkspaceConversation | None:
    if kind == "platform_support":
        uid = str(user.id) if user else str(payload.get("subject_user_id") or "")
        return db.session.scalar(
            select(WorkspaceConversation).where(
                WorkspaceConversation.kind == kind,
                WorkspaceConversation.subject_user_id == uid,
                WorkspaceConversation.support_category == payload.get("support_category"),
            )
        )
    if kind == "brokerage_agent":
        return db.session.scalar(
            select(WorkspaceConversation).where(
                WorkspaceConversation.kind == kind,
                WorkspaceConversation.brokerage_org_id == str(payload.get("brokerage_org_id")),
                WorkspaceConversation.agent_user_id == str(payload.get("agent_user_id")),
            )
        )
    if kind == "integrator_brokerage":
        return db.session.scalar(
            select(WorkspaceConversation).where(
                WorkspaceConversation.kind == kind,
                WorkspaceConversation.partner_id == str(payload.get("partner_id")),
                WorkspaceConversation.brokerage_org_id == str(payload.get("brokerage_org_id")),
            )
        )
    return None


def get_conversation_history(
    conversation_id: str,
    user: Any,
    *,
    limit: int = 50,
    before_timestamp: datetime | None = None,
) -> list[dict]:
    conv = get_conversation(conversation_id)
    if not conv or not user_may_access_workspace_conversation(user, conv):
        raise ValueError("Access denied")

    q = (
        select(ChatHistory)
        .where(ChatHistory.workspace_conversation_id == str(conversation_id))
        .order_by(ChatHistory.timestamp.desc())
        .limit(limit)
    )
    if before_timestamp:
        q = q.where(ChatHistory.timestamp < before_timestamp)
    messages = db.session.scalars(q).all()
    messages = list(reversed(messages))
    return [_message_to_dict(m) for m in messages]


def _message_to_dict(m: ChatHistory) -> dict:
    return {
        "id": m.id,
        "conversation_id": m.workspace_conversation_id,
        "sender_id": m.sender_id,
        "role": m.role,
        "message": m.message,
        "timestamp": m.timestamp.isoformat() if m.timestamp else None,
        "shared_home_id": m.shared_home_id,
        "shared_document_id": m.shared_document_id,
    }


def _role_for_user(user: Any, conv: WorkspaceConversation) -> str:
    uid = str(user.id)
    if user_has_super_admin_role(user) and conv.kind == "platform_support":
        return "support"
    row = db.session.scalar(
        select(WorkspaceConversationParticipant).where(
            WorkspaceConversationParticipant.conversation_id == conv.id,
            WorkspaceConversationParticipant.user_id == uid,
            WorkspaceConversationParticipant.left_at.is_(None),
        )
    )
    if row:
        role = row.participant_role
        if role == "brokerage_admin":
            return "brokerage_admin"
        if role == "integrator":
            return "integrator"
        if role == "agent":
            return "agent"
    return "user"


def send_message(
    user: Any,
    *,
    conversation_id: str,
    message: str,
) -> dict:
    conv = get_conversation(conversation_id)
    if not conv or not user_may_access_workspace_conversation(user, conv):
        raise ValueError("Access denied")
    if not (message or "").strip():
        raise ValueError("message is required")

    chat = ChatHistory(
        id=str(uuid.uuid4()),
        user_id=str(user.id),
        workspace_conversation_id=conv.id,
        sender_id=str(user.id),
        role=_role_for_user(user, conv),
        message=message.strip(),
        timestamp=datetime.now(timezone.utc),
    )
    now = datetime.now(timezone.utc)
    conv.last_message_at = now
    conv.updated_at = now
    db.session.add(chat)
    db.session.commit()

    notify_workspace_new_message(conv.id, chat.id, conversation_kind=conv.kind)
    return {"message_id": chat.id}


def mark_messages_as_read(user: Any, conversation_id: str) -> None:
    conv = get_conversation(conversation_id)
    if not conv or not user_may_access_workspace_conversation(user, conv):
        raise ValueError("Access denied")
    uid = str(user.id)
    messages = db.session.scalars(
        select(ChatHistory).where(
            ChatHistory.workspace_conversation_id == conv.id,
            ChatHistory.sender_id != uid,
        )
    ).all()
    for msg in messages:
        msg.mark_as_read(uid)
    _update_last_read(conv, uid)
    db.session.commit()
    notify_workspace_conversation_read(conv.id, uid, conversation_kind=conv.kind)


def list_eligible_contacts(user: Any, kinds: list[str] | None = None) -> list[dict]:
    kind_list = kinds or ["brokerage_agent", "integrator_brokerage"]
    contacts: list[dict] = []
    seen: set[str] = set()
    for kind in kind_list:
        policy = get_policy(kind)
        for c in policy.list_eligible_contacts(user):
            key = f"{c.contact_type}:{c.contact_id}"
            if key in seen:
                continue
            seen.add(key)
            contacts.append(
                {
                    "contact_id": c.contact_id,
                    "contact_type": c.contact_type,
                    "display_name": c.display_name,
                    "kind": kind,
                    "metadata": c.metadata,
                }
            )
    return contacts
