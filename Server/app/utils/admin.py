"""Shared admin authorization utilities."""


def _role_names_for_user(user) -> list[str]:
    rel = getattr(user, "user_roles", None)
    if rel is None:
        return []
    return [row.role for row in rel]


def user_has_admin_role(user) -> bool:
    """
    True if the user may invoke admin-only HTTP handlers.

    Aligns with the web AdminGuard: ``admin``, ``super_admin``, or ``manager``
    in ``user_roles``, or ``user_admin.is_admin`` when that row exists.
    """
    roles = _role_names_for_user(user)
    if any(r in roles for r in ("admin", "super_admin", "manager")):
        return True
    user_admin = getattr(user, "user_admin", None)
    return bool(user_admin and getattr(user_admin, "is_admin", False))
