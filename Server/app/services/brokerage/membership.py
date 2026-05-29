"""Brokerage org membership helpers."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app import db
from app.models.brokerage import BrokerageOrg, UserOrgMembership
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID


def get_default_brokerage_org() -> BrokerageOrg | None:
    return BrokerageOrg.query.filter_by(slug="silverkey-default").first()


def brokerage_org_ids_for_user(user_id: str) -> list[str]:
    rows = UserOrgMembership.query.filter_by(user_id=str(user_id)).all()
    return [str(r.brokerage_org_id) for r in rows if r.brokerage_org_id]


def ensure_org_membership(
    user_id: str,
    *,
    role: str,
    brokerage_org_id: str | None = None,
) -> UserOrgMembership:
    org_id = brokerage_org_id or DEFAULT_BROKERAGE_ORG_ID
    existing = UserOrgMembership.query.filter_by(
        user_id=str(user_id), brokerage_org_id=org_id
    ).first()
    if existing:
        return existing
    row = UserOrgMembership(
        id=str(uuid.uuid4()),
        user_id=str(user_id),
        brokerage_org_id=org_id,
        role=role,
        created_at=datetime.now(timezone.utc),
    )
    db.session.add(row)
    db.session.flush()
    return row


def primary_brokerage_org_id_for_user(user_id: str) -> str | None:
    ids = brokerage_org_ids_for_user(user_id)
    return ids[0] if ids else None


def primary_brokerage_org_id_for_agent(agent_id: str) -> str | None:
    admin_or_agent = (
        UserOrgMembership.query.filter(
            UserOrgMembership.user_id == str(agent_id),
            UserOrgMembership.role.in_(("agent", "admin")),
        )
        .order_by(UserOrgMembership.created_at.asc())
        .first()
    )
    if admin_or_agent:
        return str(admin_or_agent.brokerage_org_id)
    return DEFAULT_BROKERAGE_ORG_ID
