"""Helpers for ``user_roles`` — replaces legacy ``users.is_agent`` column."""

from __future__ import annotations

from sqlalchemy import delete, select

from app import db
from app.models import User, UserRole

_AGENT_ROLE = "agent"
_BUYER_ROLE = "buyer"


def user_role_names(user) -> list[str]:
    rel = getattr(user, "user_roles", None)
    if rel is None:
        return []
    rows = rel.all() if hasattr(rel, "all") else list(rel)
    return [row.role for row in rows]


def user_has_role(user, role: str) -> bool:
    return role in user_role_names(user)


def user_is_agent(user) -> bool:
    return user_has_role(user, _AGENT_ROLE)


def user_is_buyer(user) -> bool:
    return user_has_role(user, _BUYER_ROLE)


_BROKERAGE_ADMIN_ROLES = frozenset({"brokerage_admin", "brokerage_administrator", "broker_admin"})
_INTEGRATION_PARTNER_ROLES = frozenset(
    {"integration_partner", "partner_integration", "integration_partner_admin"}
)


def user_has_brokerage_admin(user) -> bool:
    names = user_role_names(user)
    return any(role in _BROKERAGE_ADMIN_ROLES for role in names)


def user_has_integration_partner(user) -> bool:
    names = user_role_names(user)
    return any(role in _INTEGRATION_PARTNER_ROLES for role in names)


def ensure_user_role(user_id: str, role: str) -> None:
    uid = str(user_id).strip()
    if not uid or not role:
        return
    existing = db.session.scalar(
        select(UserRole).where(UserRole.user_id == uid, UserRole.role == role)
    )
    if existing is None:
        db.session.add(UserRole(user_id=uid, role=role))


def remove_user_role(user_id: str, role: str) -> None:
    uid = str(user_id).strip()
    if not uid or not role:
        return
    db.session.execute(delete(UserRole).where(UserRole.user_id == uid, UserRole.role == role))


def get_user_if_agent(user_id: str) -> User | None:
    uid = str(user_id).strip()
    if not uid:
        return None
    return db.session.scalar(users_with_role_select(_AGENT_ROLE).where(User.id == uid))


def users_with_role_select(role: str):
    """SQLAlchemy select for users that have *role* in ``user_roles``."""
    return select(User).join(UserRole, User.id == UserRole.user_id).where(UserRole.role == role)


def users_without_role_select(role: str):
    """SQLAlchemy select for users that do not have *role* in ``user_roles``."""
    role_holders = select(UserRole.user_id).where(UserRole.role == role).subquery()
    return select(User).where(~User.id.in_(select(role_holders.c.user_id)))


# Backward-compatible aliases until all call sites use *select* names.
users_with_role_query = users_with_role_select
users_without_role_query = users_without_role_select


def set_user_is_agent(user_id: str, is_agent: bool) -> None:
    if is_agent:
        ensure_user_role(user_id, _AGENT_ROLE)
    else:
        remove_user_role(user_id, _AGENT_ROLE)
