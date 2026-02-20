"""
PII Security Utilities for Logger
Reused patterns from frontend Client/logger/pii.ts
"""

import re
from typing import Any

# Comprehensive PII patterns - centralized to avoid duplication
PII_PATTERNS: list[re.Pattern] = [
    # Email addresses
    re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", re.IGNORECASE),
    # Phone numbers (various formats)
    re.compile(r"(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})"),
    # SSN patterns
    re.compile(r"\b\d{3}-?\d{2}-?\d{4}\b"),
    # Credit card numbers
    re.compile(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b"),
    # JWT tokens
    re.compile(r"eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+"),
    # API keys (common patterns)
    re.compile(r"[Aa][Pp][Ii][-_]?[Kk][Ee][Yy][-_]?[A-Za-z0-9]{16,}"),
    # Bearer tokens
    re.compile(r"[Bb]earer\s+[A-Za-z0-9-._~+/]+=*"),
    # Passwords in URLs or objects
    re.compile(r'password["\s]*[:=]["\s]*[^"\s&]+', re.IGNORECASE),
    # Common sensitive field patterns
    re.compile(
        r'("(?:password|token|key|secret|auth|credential|ssn|social)"\s*:\s*")[^"]*"', re.IGNORECASE
    ),
    # Long alphanumeric strings (potential keys/tokens)
    re.compile(r"[A-Za-z0-9]{32,}"),
]

# Sensitive keys that should be completely removed from objects
SENSITIVE_KEYS: list[str] = [
    "password",
    "token",
    "accessToken",
    "refreshToken",
    "idToken",
    "id_token",
    "access_token",
    "refresh_token",
    "authorization",
    "auth",
    "secret",
    "key",
    "apiKey",
    "api_key",
    "credential",
    "credentials",
    "ssn",
    "social_security_number",
    "credit_card",
    "creditCard",
    "cc",
    "cvv",
    "pin",
]


def contains_sensitive_data(text: str) -> bool:
    """
    Check if text contains sensitive data

    Args:
        text: Text to check

    Returns:
        True if sensitive data is detected
    """
    return any(pattern.search(text) for pattern in PII_PATTERNS)


def mask_sensitive_data(text: str) -> str:
    """
    Mask sensitive data in strings for logging

    Args:
        text: Text to mask

    Returns:
        Masked text with sensitive data redacted
    """
    masked = text

    for pattern in PII_PATTERNS:
        masked = pattern.sub(
            lambda m: (
                "[REDACTED]"
                if len(m.group()) <= 4
                else m.group()[0] + "*" * (len(m.group()) - 2) + m.group()[-1]
            ),
            masked,
        )

    return masked


def scrub_pii(value: Any) -> Any:
    """
    Scrub PII from any value (string, object, array)

    Args:
        value: Value to scrub (can be string, dict, list, etc.)

    Returns:
        Scrubbed value
    """
    if isinstance(value, str):
        return mask_sensitive_data(value)

    if isinstance(value, list):
        return [scrub_pii(item) for item in value]

    if isinstance(value, dict):
        return scrub_object_pii(value)

    return value


def scrub_object_pii(obj: Any) -> Any:
    """
    Scrub sensitive keys from objects

    Args:
        obj: Object to scrub

    Returns:
        Scrubbed object
    """
    if not isinstance(obj, dict):
        return obj

    scrubbed: dict[str, Any] = {}

    for key, value in obj.items():
        lower_key = key.lower()

        if any(sensitive_key in lower_key for sensitive_key in SENSITIVE_KEYS):
            scrubbed[key] = "[REDACTED]"
        else:
            scrubbed[key] = scrub_pii(value)

    return scrubbed


def is_sensitive_key(key: str) -> bool:
    """
    Check if a key is considered sensitive

    Args:
        key: Key to check

    Returns:
        True if key is sensitive
    """
    lower_key = key.lower()
    return any(sensitive_key in lower_key for sensitive_key in SENSITIVE_KEYS)


def redact_error_message(message: str) -> str:
    """
    Redact sensitive data from error messages

    Args:
        message: Error message to redact

    Returns:
        Redacted error message
    """
    return mask_sensitive_data(message)


def create_safe_log_object(obj: Any) -> Any:
    """
    Create a safe version of an object for logging

    Args:
        obj: Object to make safe

    Returns:
        Safe object with PII scrubbed
    """
    try:
        return scrub_pii(obj)
    except Exception:
        return {"error": "Failed to scrub PII", "original": "[OBJECT_SCRUB_ERROR]"}
