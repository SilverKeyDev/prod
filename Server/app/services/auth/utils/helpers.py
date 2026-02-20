"""
General authentication helper utilities.
"""

import os
import time


def generate_request_id(prefix: str = "auth") -> str:
    """Generate a unique request ID for logging."""
    return f"{prefix}_{int(time.time() * 1000)}_{os.urandom(4).hex()}"


def validate_required_fields(data: dict, required_fields: list) -> tuple[bool, str | None]:
    """
    Validate that all required fields are present in data.
    Returns (is_valid, error_message).
    """
    if not data:
        return False, "No data provided"

    missing_fields = [
        field for field in required_fields if field not in data or not data.get(field)
    ]
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"

    return True, None


def mask_email(email: str) -> str:
    """Mask email for logging (shows first 3 and last 3 characters)."""
    if not email or len(email) < 7:
        return "***"
    return email[:3] + "***" + email[-3:]
