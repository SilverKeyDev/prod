"""Super_admin-only gate role management (SilverKey ``admin`` / ``super_admin`` in ``user_roles``)."""

from __future__ import annotations

from sqlalchemy import delete, func, select

from app import db
from app.models import User, UserRole
from app.schemas import UpdateUserSystemRolesRequest, UpdateUserSystemRolesResponse
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_success_response,
)
from app.utils.security.admin_roles import user_has_super_admin_role
from app.utils.validation import validate_request, validate_response
from logger import log

from ._errors import authorization_denied, not_found, super_admin_access_denied, validation

_GATE_ROLES = frozenset({"admin", "super_admin"})


def _gate_roles_for_user(user_id: str) -> list[str]:
    rows = db.session.scalars(
        select(UserRole.role).where(
            UserRole.user_id == user_id,
            UserRole.role.in_(_GATE_ROLES),
        )
    ).all()
    return sorted(set(rows))


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(UpdateUserSystemRolesRequest)
@validate_response(UpdateUserSystemRolesResponse)
def update_user_system_roles(user, data: UpdateUserSystemRolesRequest):
    if not user_has_super_admin_role(user):
        log.security(
            "SECURITY",
            "Unauthorized admin user role update attempt",
            {"actor_id": getattr(user, "id", None)},
        )
        return super_admin_access_denied()

    actor_id = str(getattr(user, "id", "") or "").strip()
    target_id = (data.user_id or "").strip()

    grants = sorted({x.value if hasattr(x, "value") else str(x) for x in data.grant})
    revokes = sorted({x.value if hasattr(x, "value") else str(x) for x in data.revoke})

    for r in grants + revokes:
        if r not in _GATE_ROLES:
            return validation("Invalid gate role in payload")

    overlap = frozenset(grants) & frozenset(revokes)
    if overlap:
        return validation("Cannot grant and revoke the same role in one request")

    tgt = db.session.get(User, target_id)
    if tgt is None:
        return not_found("User not found")

    current = set(_gate_roles_for_user(target_id))

    if actor_id == target_id and "super_admin" in revokes:
        return authorization_denied(
            "You cannot remove your own super_admin role here",
        )

    if "super_admin" in revokes and "super_admin" in current:
        total_sa = int(
            db.session.scalar(
                select(func.count()).select_from(UserRole).where(UserRole.role == "super_admin")
            )
            or 0
        )
        if total_sa <= 1:
            return authorization_denied(
                "Refusing to remove the last remaining super_admin",
            )

    for role in grants:
        if role not in current:
            db.session.add(UserRole(user_id=target_id, role=role))

    for role in revokes:
        db.session.execute(
            delete(UserRole).where(UserRole.user_id == target_id, UserRole.role == role)
        )

    db.session.commit()

    gate_roles = _gate_roles_for_user(target_id)

    log.security(
        "SECURITY",
        "Super admin updated user gate roles",
        {
            "actor_id": actor_id,
            "target_user_id": target_id,
            "granted": grants,
            "revoked": revokes,
            "result_gate_roles": gate_roles,
        },
    )

    return standardize_success_response({"user_id": target_id, "gate_roles": gate_roles})
