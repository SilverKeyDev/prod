"""Secure HTTP error mapping for agent route handlers (no str(e) in responses)."""

from __future__ import annotations

from app.utils.route.http_errors import conflict, forbidden, invalid_request, not_found
from app.utils.security.secure_errors import SecureErrorHandler


def agent_value_error_response(exc: ValueError):
    """Map agent-domain ValueError to the correct status without leaking exception text."""
    detail = str(exc).lower()
    if "not found" in detail:
        return not_found()
    if any(
        phrase in detail
        for phrase in (
            "access denied",
            "not part of",
            "only the invited",
            "can only",
            "can respond",
            "not an agent",
            "recipient can accept",
        )
    ):
        return forbidden()
    if "already " in detail:
        return conflict("Request cannot be completed in its current state")
    if "linked" in detail or "connection request" in detail:
        return invalid_request("Connect with this client before starting a conversation.")
    return SecureErrorHandler.handle_validation_error(exc)
