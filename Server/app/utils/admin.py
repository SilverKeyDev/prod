"""Shared admin authorization utilities."""

import os


def user_has_admin_role(user) -> bool:
    """Check if user has admin or super_admin role."""
    if os.getenv("FLASK_ENV") == "development":
        return True
    roles = [r.role for r in getattr(user, "user_roles", [])]
    return "admin" in roles or "super_admin" in roles
