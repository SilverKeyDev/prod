"""Shared HTTP error responses for admin route handlers."""

from app.utils.route.http_errors import (
    configuration_unavailable,
    forbidden,
    not_found,
    server_error,
    validation,
)
from app.utils.route.response_helpers import standardize_error_response
from app.utils.security.security import SecurityError


def admin_access_denied():
    """Non-admin caller (403, FORBIDDEN envelope)."""
    return forbidden()


def super_admin_access_denied(message: str = "Super admin access required"):
    """Non-super_admin caller (403, safe message)."""
    return standardize_error_response(
        message,
        status_code=403,
        error_code=SecurityError.FORBIDDEN[0],
    )


def authorization_denied(message: str):
    """Authenticated but action not allowed (403)."""
    return standardize_error_response(
        message,
        status_code=403,
        error_code=SecurityError.FORBIDDEN[0],
    )


__all__ = [
    "admin_access_denied",
    "authorization_denied",
    "configuration_unavailable",
    "not_found",
    "server_error",
    "super_admin_access_denied",
    "validation",
]
