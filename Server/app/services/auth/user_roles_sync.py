"""Sync ``user_roles`` client hats from onboarding / preferences demographics."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy import select

from app import db
from app.models import UserRole

# SilverKey gate roles managed only via admin API — never touched here.
_GATE_ROLES = frozenset({"admin", "super_admin"})

# Client workspace / agent-client kinds driven by preferences.
_CLIENT_ROLES = frozenset({"buyer", "seller", "renter", "investor", "agent"})

_WHY_JOIN_TO_ROLE: dict[str, str] = {
    "buying_house": "buyer",
    "selling_house": "seller",
    "renting_house": "renter",
    "investor": "investor",
}


def _normalize_why_join(raw: Any) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, list):
        return [str(x).strip() for x in raw if str(x).strip()]
    if isinstance(raw, str):
        text = raw.strip()
        if not text:
            return []
        if text.startswith("["):
            try:
                parsed = json.loads(text)
                if isinstance(parsed, list):
                    return [str(x).strip() for x in parsed if str(x).strip()]
            except json.JSONDecodeError:
                pass
        return [text]
    return []


def primary_onboarding_role_is_agent(data: dict[str, Any]) -> bool:
    role = data.get("primary_onboarding_role")
    return isinstance(role, str) and role.strip().lower() == "agent"


def normalized_primary_onboarding_role(data: dict[str, Any]) -> str | None:
    role = data.get("primary_onboarding_role")
    if not isinstance(role, str):
        return None
    normalized = role.strip().lower()
    return normalized or None


def primary_onboarding_role_is_brokerage(data: dict[str, Any]) -> bool:
    return normalized_primary_onboarding_role(data) == "brokerage"


def primary_onboarding_role_is_integration_partner(data: dict[str, Any]) -> bool:
    return normalized_primary_onboarding_role(data) == "integration_partner"


def desired_client_roles_from_why_join(
    why_joining_silverkey: list[str] | None,
    *,
    grant_agent_role: bool,
) -> set[str]:
    """Map demographics tags (+ agent selection) to ``user_roles`` role strings."""
    out: set[str] = set()
    for tag in _normalize_why_join(why_joining_silverkey):
        role = _WHY_JOIN_TO_ROLE.get(tag)
        if role:
            out.add(role)
    if grant_agent_role:
        out.add("agent")
    return out


def sync_client_roles_from_preferences(
    user_id: str,
    why_joining_silverkey: list[str] | None,
    *,
    grant_agent_role: bool,
) -> list[str]:
    """
    Upsert client ``user_roles`` rows from preferences; preserve gate roles.

    Returns sorted list of all roles for the user after sync.
    """
    desired = desired_client_roles_from_why_join(
        why_joining_silverkey, grant_agent_role=grant_agent_role
    )

    existing_rows = db.session.scalars(select(UserRole).where(UserRole.user_id == user_id)).all()
    existing_by_role = {row.role: row for row in existing_rows}

    for role in desired:
        if role not in existing_by_role:
            db.session.add(UserRole(user_id=user_id, role=role))

    for row in existing_rows:
        if row.role in _GATE_ROLES:
            continue
        if row.role in _CLIENT_ROLES and row.role not in desired:
            db.session.delete(row)

    db.session.flush()
    return sorted(
        {
            row.role
            for row in db.session.scalars(select(UserRole).where(UserRole.user_id == user_id)).all()
        }
    )
