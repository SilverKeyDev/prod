"""Apply exclusive dev workspace persona to an admin's own account (local QA)."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Literal

from app import db
from app.models import User, UserDemographics, UserRole
from app.schemas.generated import DevWorkspacePersona

DevWorkspacePersonaValue = Literal["buyer", "seller", "agent", "brokerage", "integration_partner"]

_GATE_ROLES = frozenset({"admin", "super_admin"})

# Roles managed exclusively by this dev persona switch (replaced on each apply).
_PERSONA_MANAGED_ROLES = frozenset(
    {
        "buyer",
        "seller",
        "investor",
        "agent",
        "brokerage_admin",
        "brokerage_administrator",
        "broker_admin",
        "integration_partner",
        "partner_integration",
        "integration_partner_admin",
    }
)


@dataclass(frozen=True)
class _PersonaConfig:
    is_agent: bool
    roles: frozenset[str]
    why_join: list[str] | None


_PERSONA_CONFIG: dict[DevWorkspacePersonaValue, _PersonaConfig] = {
    "buyer": _PersonaConfig(is_agent=False, roles=frozenset({"buyer"}), why_join=["buying_house"]),
    "seller": _PersonaConfig(
        is_agent=False, roles=frozenset({"seller"}), why_join=["selling_house"]
    ),
    "agent": _PersonaConfig(is_agent=True, roles=frozenset({"agent"}), why_join=[]),
    "brokerage": _PersonaConfig(is_agent=False, roles=frozenset({"brokerage_admin"}), why_join=[]),
    "integration_partner": _PersonaConfig(
        is_agent=False, roles=frozenset({"integration_partner"}), why_join=[]
    ),
}


def _persona_key(workspace: DevWorkspacePersona) -> DevWorkspacePersonaValue:
    return workspace.value  # type: ignore[return-value]


def _sync_demographics_why_join(user_id: str, why_join: list[str] | None) -> None:
    demo = UserDemographics.query.filter_by(user_id=user_id).first()
    if demo is None:
        demo = UserDemographics(user_id=user_id)
        db.session.add(demo)
    if why_join is None:
        demo.why_joining_silverkey = None
    else:
        demo.why_joining_silverkey = json.dumps(why_join)


def apply_dev_workspace_persona(user: User, workspace: DevWorkspacePersona) -> User:
    """
    Set exclusive workspace persona on the signed-in user.

    Preserves SilverKey gate roles (``admin``, ``super_admin``). Replaces all other
    persona-managed ``user_roles``, sets agent role via ``user_roles`` / ``is_agent`` property,
    and syncs demographics
    ``why_joining_silverkey`` so preferences role sync does not fight the choice.
    """
    key = _persona_key(workspace)
    config = _PERSONA_CONFIG[key]

    user.is_agent = config.is_agent
    if hasattr(user, "brokerage_org_ids"):
        user.brokerage_org_ids = None

    existing_rows = UserRole.query.filter_by(user_id=user.id).all()
    for row in existing_rows:
        if row.role in _GATE_ROLES:
            continue
        if row.role in _PERSONA_MANAGED_ROLES:
            db.session.delete(row)

    db.session.flush()

    for role in config.roles:
        db.session.add(UserRole(user_id=user.id, role=role))

    _sync_demographics_why_join(user.id, config.why_join)
    db.session.commit()

    db.session.refresh(user)
    return user
