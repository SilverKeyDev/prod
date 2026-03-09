"""Shared admin authorization utilities."""


def user_has_admin_role(user) -> bool:
    """Check if user has admin or super_admin role."""
    roles = [r.role for r in getattr(user, "user_roles", [])]
    return "admin" in roles or "super_admin" in roles
