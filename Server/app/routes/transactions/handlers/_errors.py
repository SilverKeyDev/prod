"""Shared safe error responses for transaction checklist routes."""

from __future__ import annotations

from flask import jsonify

from app.utils.route.http_errors import forbidden, invalid_request, not_found, validation
from app.utils.security.secure_errors import SecureErrorHandler

# ValueError messages raised by FormsService that are safe for clients.
FORMS_CLIENT_SAFE_MESSAGES = frozenset(
    {
        "conversation_id is required",
        "client_id is required to create a conversation",
        "Failed to download form PDF from storage",
        "Failed to generate download URL",
    }
)


def forms_value_error_response(exc: ValueError):
    """Map FormsService ValueError to ErrorResponse without leaking raw exception text."""
    message = str(exc)
    if message == "Access denied":
        return forbidden()
    if message == "Conversation not found":
        return not_found()
    if message in FORMS_CLIENT_SAFE_MESSAGES:
        return invalid_request(message)
    return validation(message)


def partial_step_failure(step: str, exc: ValueError) -> dict[str, str]:
    """Structured partial failure entry for multi-step form send (no str(e) in error code)."""
    message = str(exc)
    if message == "Access denied":
        return {"step": step, "error": "FORBIDDEN", "message": "Access denied"}
    if message == "Conversation not found":
        return {"step": step, "error": "RESOURCE_NOT_FOUND", "message": "Resource not found"}
    if message in FORMS_CLIENT_SAFE_MESSAGES:
        return {"step": step, "error": "INVALID_REQUEST", "message": message}
    return {"step": step, "error": "VALIDATION_ERROR", "message": "Invalid input provided"}


def invalid_request_with_details(message: str, details: list) -> tuple:
    """400 ErrorResponse with optional details (e.g. partial send failures)."""
    error_id = SecureErrorHandler.generate_error_id()
    return (
        jsonify(
            {
                "success": False,
                "error": "INVALID_REQUEST",
                "message": message,
                "error_id": error_id,
                "details": details,
            }
        ),
        400,
    )
