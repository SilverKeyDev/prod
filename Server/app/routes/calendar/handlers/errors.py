"""HTTP error helpers for Google Calendar route handlers."""

from __future__ import annotations

from typing import Any

from app.utils.route.response_helpers import standardize_error_response


def calendar_permission_response(perm_err: dict[str, Any]):
    """403 for require_permission payloads (stable code + safe user message)."""
    return standardize_error_response(
        perm_err.get("message", "Access denied"),
        status_code=403,
        error_code=perm_err.get("error", "permission_required"),
    )
