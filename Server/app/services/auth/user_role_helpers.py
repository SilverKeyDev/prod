"""Helpers for ``user_roles`` — replaces legacy ``users.is_agent`` column."""

from __future__ import annotations

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


def ensure_user_role(user_id: str, role: str) -> None:
    uid = str(user_id).strip()
    if not uid or not role:
        return
    existing = UserRole.query.filter_by(user_id=uid, role=role).first()
    if existing is None:
        db.session.add(UserRole(user_id=uid, role=role))


def remove_user_role(user_id: str, role: str) -> None:
    uid = str(user_id).strip()
    if not uid or not role:
        return
    UserRole.query.filter_by(user_id=uid, role=role).delete(synchronize_session=False)


def get_user_if_agent(user_id: str) -> User | None:
    uid = str(user_id).strip()
    if not uid:
        return None
    return users_with_role_query(_AGENT_ROLE).filter(User.id == uid).first()


def users_with_role_query(role: str):
    """SQLAlchemy query for users that have *role* in ``user_roles``."""
    return User.query.join(UserRole, User.id == UserRole.user_id).filter(UserRole.role == role)


def users_without_role_query(role: str):
    """SQLAlchemy query for users that do not have *role* in ``user_roles``."""
    role_holders = db.session.query(UserRole.user_id).filter(UserRole.role == role).subquery()
    return User.query.filter(~User.id.in_(role_holders))  # pyright: ignore[reportAttributeAccessIssue]


def set_user_is_agent(user_id: str, is_agent: bool) -> None:
    if is_agent:
        ensure_user_role(user_id, _AGENT_ROLE)
    else:
        remove_user_role(user_id, _AGENT_ROLE)
