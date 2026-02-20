"""
Client error reporting endpoint.
Accepts frontend error reports and logs them server-side with PII scrubbing.
"""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.utils.security import rate_limit
from app.utils.security.security import SecurityError, security_error_response

# Centralized logger (category-based, PII scrubbing)
from logger import LOG_CATEGORIES, log

client_errors_bp = Blueprint("client_errors", __name__, url_prefix="/api/v1/client")

# Max body size for error payload (avoid abuse)
MAX_BODY_BYTES = 16 * 1024

# Allowed keys in payload (ignore rest to avoid logging arbitrary client data)
ALLOWED_KEYS = frozenset(
    {
        "message",
        "name",
        "stack",
        "componentStack",
        "url",
        "userAgent",
        "timestamp",
        "type",
        "sessionId",
        "environment",
        "buildVersion",
        "filename",
        "lineno",
        "colno",
        "errorBoundary",
        "routeError",
    }
)


def _sanitize_payload(data: dict) -> dict:
    """Keep only allowed keys and string-length cap for safety."""
    out = {}
    for k, v in data.items():
        if k not in ALLOWED_KEYS:
            continue
        if isinstance(v, str) and len(v) > 4096:
            out[k] = v[:4096] + "..."
        else:
            out[k] = v
    return out


@client_errors_bp.route("/errors", methods=["POST"])
@rate_limit(max_requests=30, window_seconds=60, per="ip")
def report_client_error():
    """
    POST /api/v1/client/errors
    Body (JSON): client error report. At least one of 'message' or 'name' expected.
    Unauthenticated allowed so pre-login errors can be reported.
    """
    if not request.is_json:
        return security_error_response(SecurityError.INVALID_REQUEST)

    # Enforce body size
    content_length = request.content_length
    if content_length is not None and content_length > MAX_BODY_BYTES:
        return security_error_response(SecurityError.INVALID_REQUEST)

    try:
        body = request.get_json(force=True, silent=False)
    except Exception:
        return security_error_response(SecurityError.INVALID_REQUEST)

    if not isinstance(body, dict):
        return security_error_response(SecurityError.INVALID_REQUEST)

    # Require at least message or name
    message = body.get("message")
    name = body.get("name")
    if not message and not name:
        return security_error_response(SecurityError.MISSING_FIELDS)

    payload = _sanitize_payload(body)
    # Log with centralized logger (PII scrubbing happens in logger)
    log.error(
        LOG_CATEGORIES["ERRORS"],
        "Client error reported",
        payload,
    )

    return jsonify({"success": True}), 200
