"""Helpers for seeding ``user_roles`` in unit tests (replaces ``User(is_agent=...)``)."""

from __future__ import annotations

from typing import Any

from app import db
from app.models import User
from app.services.auth.user_role_helpers import (
    ensure_user_role,
    remove_user_role,
    set_user_is_agent,
)


def seed_user_roles(user_id: str, *roles: str) -> None:
    for role in roles:
        ensure_user_role(user_id, role)
    db.session.commit()


def create_user_with_roles(
    db_session,
    *,
    roles: tuple[str, ...] = (),
    commit: bool = True,
    **kwargs: Any,
) -> User:
    """Create a User and attach ``user_roles`` rows (no legacy ``is_agent`` kwarg)."""
    user = User(**kwargs)
    db_session.add(user)
    db_session.flush()
    for role in roles:
        ensure_user_role(str(user.id), role)
    if commit:
        db_session.commit()
    return user


def set_agent_role(user_id: str, *, is_agent: bool) -> None:
    """Grant or revoke the agent role for a user id."""
    set_user_is_agent(str(user_id), is_agent)


def clear_agent_role(user_id: str) -> None:
    remove_user_role(str(user_id), "agent")


def seed_brokerage_admin(db_session, *, user_id: str, org_id: str, email: str) -> User:
    """Create user with brokerage org admin membership (workspace messaging tests)."""
    from app.models import UserOrgMembership

    user = create_user_with_roles(
        db_session,
        id=user_id,
        email=email,
        name="Brokerage Admin",
        roles=(),
        cognito_id=f"cognito-{user_id}",
    )
    db_session.add(UserOrgMembership(user_id=user_id, brokerage_org_id=org_id, role="admin"))
    db_session.commit()
    return user


def seed_integrator_operator(db_session, *, user_id: str, partner_id: str, email: str) -> User:
    """Create user linked as partner operator (workspace messaging tests)."""
    from app.models.messaging import PartnerOperator

    user = create_user_with_roles(
        db_session,
        id=user_id,
        email=email,
        name="Integrator Operator",
        roles=(),
        cognito_id=f"cognito-{user_id}",
    )
    db_session.add(PartnerOperator(user_id=user_id, partner_id=partner_id))
    db_session.commit()
    return user
