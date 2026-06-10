"""Super_admin-only listing of users with SilverKey gate roles."""

from __future__ import annotations

from collections import defaultdict

from sqlalchemy import select

from app import db
from app.models import User, UserRole
from app.schemas import ListAdminGateUsersResponse
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_success_response,
)
from app.utils.security.admin_roles import user_has_super_admin_role
from app.utils.validation import validate_response
from logger import log

from ._errors import super_admin_access_denied

_GATE_ROLES = frozenset({"admin", "super_admin"})


@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(ListAdminGateUsersResponse)
def list_admin_gate_users(user):
    if not user_has_super_admin_role(user):
        log.security(
            "SECURITY",
            "Unauthorized admin gate user list attempt",
            {"actor_id": getattr(user, "id", None)},
        )
        return super_admin_access_denied()

    rows = db.session.execute(
        select(User.id, User.email, User.name, UserRole.role)
        .join(UserRole, User.id == UserRole.user_id)
        .where(UserRole.role.in_(_GATE_ROLES))
        .order_by(User.email.asc(), User.name.asc())
    ).all()

    grouped: dict[str, dict[str, object]] = {}
    roles_by_user: dict[str, set[str]] = defaultdict(set)

    for user_id, email, name, role in rows:
        uid = str(user_id)
        if uid not in grouped:
            grouped[uid] = {
                "user_id": uid,
                "email": email or "",
                "name": name or "",
            }
        roles_by_user[uid].add(role)

    admins = [
        {
            **grouped[uid],
            "gate_roles": sorted(roles_by_user[uid]),
        }
        for uid in grouped
    ]

    return standardize_success_response({"admins": admins})
