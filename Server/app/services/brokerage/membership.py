"""Brokerage org membership helpers."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app import db
from app.models.brokerage import BrokerageOrg, UserOrgMembership
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID


def get_default_brokerage_org() -> BrokerageOrg | None:
    return db.session.scalar(select(BrokerageOrg).where(BrokerageOrg.slug == "silverkey-default"))


def brokerage_org_ids_for_user(user_id: str) -> list[str]:
    rows = db.session.scalars(
        select(UserOrgMembership).where(UserOrgMembership.user_id == str(user_id))
    ).all()
    return [str(r.brokerage_org_id) for r in rows if r.brokerage_org_id]


def ensure_org_membership(
    user_id: str,
    *,
    role: str,
    brokerage_org_id: str | None = None,
) -> UserOrgMembership:
    org_id = brokerage_org_id or DEFAULT_BROKERAGE_ORG_ID
    existing = db.session.scalar(
        select(UserOrgMembership).where(
            UserOrgMembership.user_id == str(user_id),
            UserOrgMembership.brokerage_org_id == org_id,
        )
    )
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
    admin_or_agent = db.session.scalar(
        select(UserOrgMembership)
        .where(
            UserOrgMembership.user_id == str(agent_id),
            UserOrgMembership.role.in_(("agent", "admin")),
        )
        .order_by(UserOrgMembership.created_at.asc())
    )
    if admin_or_agent:
        return str(admin_or_agent.brokerage_org_id)
    return DEFAULT_BROKERAGE_ORG_ID
