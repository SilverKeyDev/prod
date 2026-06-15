"""Dev-only per-role account session minting.

This intentionally avoids production impersonation: all entry points are disabled when
``FLASK_ENV=production`` and minted tokens are in-memory, short-lived, and single-use.
"""

from __future__ import annotations

import hashlib
import os
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Literal

from flask import current_app

from app import db
from app.models import User, UserDemographics, UserRole
from app.schemas.generated import DevWorkspacePersona
from app.services.auth.utils.token_creation import create_minimal_tokens
from logger import log

DevAccountRole = Literal["buyer", "seller", "agent", "brokerage", "integration_partner"]

DEV_ACCOUNT_ROLES: tuple[DevAccountRole, ...] = (
    "buyer",
    "seller",
    "agent",
    "brokerage",
    "integration_partner",
)

_DEV_TEST_ACCOUNT_ROLE = "dev_test_account"
_TOKEN_TTL = timedelta(minutes=2)


@dataclass
class DevSessionGrant:
    target_user_id: str
    target_email: str
    role: DevAccountRole
    minted_by_user_id: str
    expires_at: datetime
    used_at: datetime | None = None


def dev_sessions_enabled() -> bool:
    """Return true when dev session impersonation may run in this environment."""
    return os.getenv("FLASK_ENV", "development") != "production"


def _token_store() -> dict[str, DevSessionGrant]:
    return current_app.extensions.setdefault("dev_session_grants", {})


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _dev_key_for_actor(actor: User) -> str:
    email = (getattr(actor, "email", "") or "").strip().lower()
    local = email.split("@", 1)[0] if email else str(actor.id)
    safe = "".join(ch if ch.isalnum() else "-" for ch in local).strip("-")
    return safe or str(actor.id)


def dev_account_email(actor: User, role: DevAccountRole) -> str:
    """Deterministic per-dev, per-role email for local/non-prod test accounts."""
    domain = os.getenv("DEV_ACCOUNT_EMAIL_DOMAIN", "dev.usesilverkey.com")
    return f"dev+{_dev_key_for_actor(actor)}-{role}@{domain}"


def _role_for_dev_account(role: DevAccountRole) -> str:
    if role == "brokerage":
        return "brokerage_admin"
    return role


def _ensure_role(user: User, role: str) -> None:
    exists = UserRole.query.filter_by(user_id=user.id, role=role).first()
    if exists is None:
        db.session.add(UserRole(user_id=user.id, role=role))


def _ensure_demographics(user: User, role: DevAccountRole) -> None:
    why_join = {
        "buyer": '["buying_house"]',
        "seller": '["selling_house"]',
        "agent": "[]",
        "brokerage": "[]",
        "integration_partner": "[]",
    }[role]
    demo = UserDemographics.query.filter_by(user_id=user.id).first()
    if demo is None:
        demo = UserDemographics(user_id=user.id)
        db.session.add(demo)
    demo.why_joining_silverkey = why_join


def _ensure_dev_account(actor: User, role: DevAccountRole) -> User:
    email = dev_account_email(actor, role)
    user = User.query.filter_by(email=email).first()
    if user is None:
        user = User(
            cognito_id=f"dev-account:{_dev_key_for_actor(actor)}:{role}",
            email=email,
            name=f"Dev {_dev_key_for_actor(actor)} {role.replace('_', ' ').title()}",
            is_active=True,
            has_preferences=False,
        )
        db.session.add(user)
        db.session.flush()

    _ensure_role(user, _DEV_TEST_ACCOUNT_ROLE)
    _ensure_role(user, _role_for_dev_account(role))
    _ensure_demographics(user, role)
    return user


def ensure_dev_accounts_for_actor(actor: User) -> dict[DevAccountRole, User]:
    """Create/update the actor's full set of dev test accounts."""
    accounts = {role: _ensure_dev_account(actor, role) for role in DEV_ACCOUNT_ROLES}
    db.session.commit()
    return accounts


def is_dev_test_account(user: User) -> bool:
    return (
        UserRole.query.filter_by(user_id=user.id, role=_DEV_TEST_ACCOUNT_ROLE).first() is not None
    )


def mint_dev_session_token(actor: User, role: DevWorkspacePersona) -> tuple[str, User]:
    """Create a one-time token for the actor's target dev account role."""
    if not dev_sessions_enabled():
        raise PermissionError("dev_sessions_disabled")

    role_value = role.value
    if role_value not in DEV_ACCOUNT_ROLES:
        raise ValueError("unsupported_role")

    accounts = ensure_dev_accounts_for_actor(actor)
    target = accounts[role_value]  # type: ignore[index]
    if not is_dev_test_account(target):
        raise PermissionError("target_not_test_account")

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + _TOKEN_TTL
    _token_store()[_hash_token(token)] = DevSessionGrant(
        target_user_id=str(target.id),
        target_email=target.email,
        role=role_value,  # type: ignore[arg-type]
        minted_by_user_id=str(actor.id),
        expires_at=expires_at,
    )

    log.security(
        "SECURITY",
        "Dev account session token minted",
        {
            "actor_user_id": str(actor.id),
            "target_user_id": str(target.id),
            "target_role": role_value,
            "expires_at": expires_at.isoformat(),
        },
    )
    return token, target


def exchange_dev_session_token(token: str) -> tuple[User, str, str]:
    """Consume a one-time dev session token and return target user + minimal tokens."""
    if not dev_sessions_enabled():
        raise PermissionError("dev_sessions_disabled")

    grant = _token_store().get(_hash_token(token))
    now = datetime.now(timezone.utc)
    if grant is None:
        raise PermissionError("invalid_token")
    if grant.used_at is not None:
        raise PermissionError("token_used")
    if grant.expires_at < now:
        raise PermissionError("token_expired")

    grant.used_at = now
    target = User.query.filter_by(id=grant.target_user_id).first()
    if target is None or not is_dev_test_account(target):
        raise PermissionError("target_not_test_account")

    access_token, id_token = create_minimal_tokens(
        user_id=str(target.id),
        user_email=target.email,
        user_name=target.name,
        expires_in_hours=8,
    )
    if not access_token:
        raise RuntimeError("dev_session_token_create_failed")

    log.security(
        "SECURITY",
        "Dev account session token exchanged",
        {
            "actor_user_id": grant.minted_by_user_id,
            "target_user_id": str(target.id),
            "target_role": grant.role,
        },
    )
    return target, access_token, id_token
