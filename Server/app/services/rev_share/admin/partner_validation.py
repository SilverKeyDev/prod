"""Partner payload validation and normalization for admin CRUD."""

from __future__ import annotations

from app.models.partners.partner import (
    CHECKLIST_WORKSPACES,
    DEFAULT_INTEGRATION_DISPLAY_MODE,
    VALID_INTEGRATION_DISPLAY_MODES,
    VALID_PAYOUT_TYPES,
    VALID_TARGET_ROLES,
)
from app.services.rev_share.admin.checklist_steps import list_partner_eligible_checklist_steps

_ELIGIBLE_STEP_IDS: set[str] | None = None


def _eligible_step_ids() -> set[str]:
    global _ELIGIBLE_STEP_IDS
    if _ELIGIBLE_STEP_IDS is None:
        _ELIGIBLE_STEP_IDS = {s["step_id"] for s in list_partner_eligible_checklist_steps()}
    return _ELIGIBLE_STEP_IDS


def normalize_target_roles(raw) -> list[str] | None:
    if raw is None:
        return None
    if not isinstance(raw, list):
        return None
    roles = [str(r).strip() for r in raw if str(r).strip()]
    if not roles:
        return None
    if any(r not in VALID_TARGET_ROLES for r in roles):
        return None
    return roles


def normalize_step_ids(raw) -> list[str] | None:
    if raw is None:
        return None
    if not isinstance(raw, list):
        return None
    ids = [str(s).strip() for s in raw if str(s).strip()]
    eligible = _eligible_step_ids()
    if any(sid not in eligible for sid in ids):
        return None
    return ids


def normalize_payout_type(raw) -> str | None:
    if raw is None:
        return None
    val = str(raw).strip()
    if val not in VALID_PAYOUT_TYPES:
        return None
    return val


def normalize_integration_display_mode(raw) -> str:
    if raw is None:
        return DEFAULT_INTEGRATION_DISPLAY_MODE
    val = str(raw).strip()
    if val not in VALID_INTEGRATION_DISPLAY_MODES:
        return DEFAULT_INTEGRATION_DISPLAY_MODE
    return val


def validate_partner_fields(
    *,
    target_roles: list[str] | None,
    step_ids: list[str] | None,
    payout_type: str | None,
    destination_url_template: str | None = None,
    name: str | None = None,
) -> str | None:
    if name is not None and not name.strip():
        return "missing_required_fields"
    if destination_url_template is not None and not destination_url_template.strip():
        return "missing_required_fields"
    if target_roles is not None and not target_roles:
        return "invalid_target_roles"
    if payout_type is not None and payout_type not in VALID_PAYOUT_TYPES:
        return "invalid_payout_type"
    if target_roles:
        needs_steps = bool(CHECKLIST_WORKSPACES.intersection(target_roles))
        if needs_steps and (not step_ids or len(step_ids) == 0):
            return "missing_step_ids"
    return None


def sync_step_id_from_step_ids(step_ids: list[str]) -> str:
    return step_ids[0] if step_ids else ""
