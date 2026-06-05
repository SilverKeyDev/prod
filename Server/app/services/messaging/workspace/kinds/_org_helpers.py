"""Helpers shared by workspace conversation kind policies."""

from __future__ import annotations

from sqlalchemy import select

from app import db
from app.models import UserOrgMembership


def user_is_org_admin(user_id: str, brokerage_org_id: str) -> bool:
    row = db.session.scalar(
        select(UserOrgMembership).where(
            UserOrgMembership.user_id == str(user_id),
            UserOrgMembership.brokerage_org_id == str(brokerage_org_id),
            UserOrgMembership.role == "admin",
        )
    )
    return row is not None


def user_is_org_agent(user_id: str, brokerage_org_id: str) -> bool:
    row = db.session.scalar(
        select(UserOrgMembership).where(
            UserOrgMembership.user_id == str(user_id),
            UserOrgMembership.brokerage_org_id == str(brokerage_org_id),
            UserOrgMembership.role == "agent",
        )
    )
    return row is not None


def user_is_org_member(user_id: str, brokerage_org_id: str) -> bool:
    row = db.session.scalar(
        select(UserOrgMembership).where(
            UserOrgMembership.user_id == str(user_id),
            UserOrgMembership.brokerage_org_id == str(brokerage_org_id),
            UserOrgMembership.role.in_(("admin", "agent")),
        )
    )
    return row is not None


def org_ids_for_user(user_id: str, *, role: str | None = None) -> list[str]:
    q = select(UserOrgMembership).where(UserOrgMembership.user_id == str(user_id))
    if role:
        q = q.where(UserOrgMembership.role == role)
    rows = db.session.scalars(q).all()
    return [str(r.brokerage_org_id) for r in rows if r.brokerage_org_id]
