"""Sync ``user_roles`` client hats from onboarding / preferences demographics."""

from __future__ import annotations

import json
from typing import Any

from app import db
from app.models import UserRole

# SilverKey gate roles managed only via admin API — never touched here.
_GATE_ROLES = frozenset({"admin", "super_admin"})

# Client workspace / agent-client kinds driven by preferences.
_CLIENT_ROLES = frozenset({"buyer", "seller", "investor", "agent"})

_WHY_JOIN_TO_ROLE: dict[str, str] = {
    "buying_house": "buyer",
    "selling_house": "seller",
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


def desired_client_roles_from_why_join(
    why_joining_silverkey: list[str] | None,
    *,
    is_agent: bool,
) -> set[str]:
    """Map demographics tags (+ agent flag) to ``user_roles`` role strings."""
    out: set[str] = set()
    for tag in _normalize_why_join(why_joining_silverkey):
        role = _WHY_JOIN_TO_ROLE.get(tag)
        if role:
            out.add(role)
    if is_agent:
        out.add("agent")
    return out


def sync_client_roles_from_preferences(
    user_id: str,
    why_joining_silverkey: list[str] | None,
    *,
    is_agent: bool,
) -> list[str]:
    """
    Upsert client ``user_roles`` rows from preferences; preserve gate roles.

    Returns sorted list of all roles for the user after sync.
    """
    desired = desired_client_roles_from_why_join(why_joining_silverkey, is_agent=is_agent)

    existing_rows = UserRole.query.filter_by(user_id=user_id).all()
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
    return sorted({row.role for row in UserRole.query.filter_by(user_id=user_id).all()})
