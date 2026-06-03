"""
Security utilities for authentication, authorization, rate limiting, and data redaction
"""

import re
import time
from functools import wraps
from typing import Any

from flask import jsonify, request

from app.utils.http.client_ip import get_client_ip
from logger import log

from .rate_limit_backend import allow_request
from .secure_errors import SecureErrorHandler

# Sensitive keys that should be redacted from logs
SENSITIVE_KEYS = {
    "access_token",
    "refresh_token",
    "client_secret",
    "code",
    "state",
    "token",
}

# PII patterns for redaction
PII_PATTERNS = {
    "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
    "phone": r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",
    "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
}


class SecurityError:
    """Standardized security error codes and messages"""

    # Authentication errors
    UNAUTHORIZED = ("UNAUTHORIZED", "Authentication required", 401)
    INVALID_TOKEN = ("INVALID_TOKEN", "Authentication required", 401)
    TOKEN_EXPIRED = ("TOKEN_EXPIRED", "Authentication required", 401)

    # Authorization errors
    FORBIDDEN = ("FORBIDDEN", "Access denied", 403)
    INSUFFICIENT_PERMISSIONS = ("INSUFFICIENT_PERMISSIONS", "Access denied", 403)

    # Rate limiting
    RATE_LIMIT_EXCEEDED = ("RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later.", 429)

    # General errors
    INVALID_REQUEST = ("INVALID_REQUEST", "Invalid request format", 400)
    RESOURCE_NOT_FOUND = ("RESOURCE_NOT_FOUND", "Resource not found", 404)
    SERVER_ERROR = ("SERVER_ERROR", "Internal server error", 500)

    # Validation errors
    MISSING_FIELDS = ("MISSING_FIELDS", "Required fields are missing", 400)
    INVALID_INPUT = ("INVALID_INPUT", "Invalid input provided", 400)

    # Google OAuth errors
    GOOGLE_RECONNECT_REQUIRED = (
        "GOOGLE_RECONNECT_REQUIRED",
        "Google Calendar reconnection required. Please reconnect your Google Calendar account.",
        401,
    )


def security_error_response(error_type, additional_info=None):
    """
    Create standardized security error response that doesn't leak sensitive information

    Args:
        error_type: Tuple of (error_code, user_message, http_status)
        additional_info: Optional dict with non-sensitive additional info
    """
    error_code, user_message, status_code = error_type

    response = {
        "success": False,
        "error": error_code,
        "message": user_message,
        "error_id": SecureErrorHandler.generate_error_id(),
    }

    if additional_info and isinstance(additional_info, dict):
        # Only include non-sensitive additional info
        safe_keys = ["field_errors", "retry_after"]
        for key, value in additional_info.items():
            if key in safe_keys:
                response[key] = value

    return jsonify(response), status_code


def auth_error_response(message="Authentication required"):
    """Standardized authentication error response"""
    return security_error_response(SecurityError.UNAUTHORIZED)


def rate_limit(max_requests=60, window_seconds=60, per="ip"):
    """
    Rate limiting decorator

    Args:
        max_requests: Maximum requests allowed in the time window
        window_seconds: Time window in seconds
        per: Rate limit per 'ip' or 'user' (default: 'ip')
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = get_client_ip()
            if per == "ip":
                key = f"rate_limit:{client_ip}:{request.endpoint}"
            elif per == "user":
                auth_header = request.headers.get("Authorization", "")
                if auth_header.startswith("Bearer "):
                    import hashlib

                    token_hash = hashlib.sha256(auth_header.encode()).hexdigest()[:16]
                    key = f"rate_limit:user:{token_hash}:{request.endpoint}"
                else:
                    key = f"rate_limit:{client_ip}:{request.endpoint}"
            else:
                key = f"rate_limit:{client_ip}:{request.endpoint}"

            if not allow_request(key, max_requests, window_seconds):
                log.security(
                    "SECURITY",
                    "rate_limit_exceeded",
                    {"key": key, "endpoint": request.endpoint},
                )
                return security_error_response(
                    SecurityError.RATE_LIMIT_EXCEEDED, {"retry_after": window_seconds}
                )

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def log_security_event(event_type, details=None, user_id=None):
    """
    Log security events for monitoring

    Args:
        event_type: Type of security event (e.g., 'auth_failure', 'rate_limit_exceeded')
        details: Additional details (non-sensitive)
        user_id: User ID if available
    """
    log_data = {
        "event_type": event_type,
        "ip": get_client_ip(),
        "user_agent": request.headers.get("User-Agent", "Unknown"),
        "endpoint": request.endpoint,
        "method": request.method,
        "timestamp": time.time(),
    }

    if user_id:
        log_data["user_id"] = user_id

    if details:
        log_data["details"] = details

    log.security("SECURITY", event_type, log_data)


def safe_user_lookup_error():
    """
    Return a safe error response for user lookup failures
    This prevents user enumeration attacks
    """
    return security_error_response(SecurityError.UNAUTHORIZED)


def validate_required_fields(data, required_fields):
    """
    Validate required fields and return standardized error response

    Args:
        data: Request data dict
        required_fields: List of required field names

    Returns:
        None if valid, or error response tuple if invalid
    """
    if not data:
        return security_error_response(SecurityError.INVALID_REQUEST)

    missing_fields = [field for field in required_fields if field not in data or not data[field]]

    if missing_fields:
        return security_error_response(
            SecurityError.MISSING_FIELDS, {"field_errors": missing_fields}
        )

    return None


def redact_sensitive_data(data: dict[str, Any]) -> dict[str, Any]:
    """
    Redact sensitive data from dictionaries for safe logging.

    Args:
        data: Dictionary to redact

    Returns:
        Dictionary with sensitive values redacted
    """
    redacted = {}

    for key, value in data.items():
        if key.lower() in SENSITIVE_KEYS:
            redacted[key] = "[REDACTED]"
        elif isinstance(value, dict):
            redacted[key] = redact_sensitive_data(value)
        elif isinstance(value, str) and len(value) > 50:
            # Truncate long strings
            redacted[key] = value[:50] + "..."
        else:
            redacted[key] = value

    return redacted


def redact_pii(text: str) -> str:
    """
    Redact PII from text strings.

    Args:
        text: Text to redact

    Returns:
        Text with PII redacted
    """
    redacted_text = text

    for pii_type, pattern in PII_PATTERNS.items():
        redacted_text = re.sub(pattern, f"[{pii_type.upper()}_REDACTED]", redacted_text)

    return redacted_text


def sanitize_error_message(error: Exception) -> str:
    """
    Sanitize error messages to remove sensitive information.

    Args:
        error: Exception to sanitize

    Returns:
        Sanitized error message
    """
    error_msg = str(error)

    # Remove common sensitive patterns
    error_msg = re.sub(r"token=[^&\s]+", "token=[REDACTED]", error_msg)
    error_msg = re.sub(r"client_secret=[^&\s]+", "client_secret=[REDACTED]", error_msg)
    error_msg = re.sub(r"code=[^&\s]+", "code=[REDACTED]", error_msg)

    # Redact PII
    error_msg = redact_pii(error_msg)

    return error_msg


def log_oauth_event(event_type: str, user_id: str | None = None, **kwargs):
    """
    Log OAuth events with proper redaction.

    Args:
        event_type: Type of OAuth event
        user_id: User identifier (optional)
        **kwargs: Additional event data
    """
    # Skip logging for routine operations that happen frequently
    routine_events = [
        "events_listed",
        "calendars_listed",
        "freebusy_queried",
        "silverkey_calendar_found",
    ]
    if event_type in routine_events:
        return

    log_data = {"event_type": event_type, "user_id": user_id, **redact_sensitive_data(kwargs)}

    log.info("CALENDAR", f"GOOGLE_OAUTH_{event_type.upper()}", log_data)


def validate_event_data(event_data: dict[str, Any]) -> bool:
    """
    Validate Google Calendar event data.

    Args:
        event_data: Event data to validate

    Returns:
        True if valid, False otherwise
    """
    required_fields = ["summary", "start", "end"]

    for field in required_fields:
        if field not in event_data:
            log.warn(
                "CALENDAR",
                "Event validation failed: missing required field",
                {"field": field},
            )
            return False

    start = event_data["start"]
    end = event_data["end"]
    if not isinstance(start, dict) or not isinstance(end, dict):
        log.warn("CALENDAR", "Event validation failed: start/end must be objects")
        return False

    # All-day events: start.date / end.date (YYYY-MM-DD, end exclusive per Google)
    if "date" in start and "date" in end:
        date_pattern = re.compile(r"^\d{4}-\d{2}-\d{2}$")
        if not isinstance(start["date"], str) or not date_pattern.match(start["date"]):
            log.warn("CALENDAR", "Event validation failed: invalid all-day start date")
            return False
        if not isinstance(end["date"], str) or not date_pattern.match(end["date"]):
            log.warn("CALENDAR", "Event validation failed: invalid all-day end date")
            return False
        # Google requires exclusive end strictly after inclusive start (ISO dates compare lexicographically).
        if start["date"] >= end["date"]:
            log.warn(
                "CALENDAR",
                "Event validation failed: all-day end must be after start (exclusive end)",
            )
            return False
        return True

    # Timed events: dateTime on start/end
    if "dateTime" not in start or "dateTime" not in end:
        log.warn("CALENDAR", "Event validation failed: invalid start/end time structure")
        return False

    datetime_pattern = r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}"
    if not re.match(datetime_pattern, start["dateTime"]):
        log.warn("CALENDAR", "Event validation failed: invalid start datetime format")
        return False

    if not re.match(datetime_pattern, end["dateTime"]):
        log.warn("CALENDAR", "Event validation failed: invalid end datetime format")
        return False

    return True
