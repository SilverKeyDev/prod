"""Shared admin authorization utilities."""

# Admin HTTP handlers: only ``admin`` and ``super_admin`` in ``user_roles``.


def _role_names_for_user(user) -> list[str]:
    rel = getattr(user, "user_roles", None)
    if rel is None:
        return []
    return [row.role for row in rel]


def user_has_admin_role(user) -> bool:
    """True if the user may invoke admin-only HTTP handlers (admin or super_admin role only)."""
    roles = _role_names_for_user(user)
    return any(r in roles for r in ("admin", "super_admin"))


def user_has_super_admin_role(user) -> bool:
    """True if the actor may invoke super_admin-only operations (grant gate roles, hard-delete, etc.)."""
    return "super_admin" in _role_names_for_user(user)
