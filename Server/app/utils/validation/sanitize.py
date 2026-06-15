"""Input sanitization helpers for non-JSON request fields."""

import re

_ADDRESS_MAX_LEN = 500
_CONTROL_CHAR_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def sanitize_optional_address(
    address: str | None, *, max_length: int = _ADDRESS_MAX_LEN
) -> str | None:
    """
    Normalize and bound an optional property address from multipart form data.

    Raises ValueError when the value is present but invalid.
    """
    if address is None:
        return None
    trimmed = address.strip()
    if not trimmed:
        return None
    if len(trimmed) > max_length:
        raise ValueError(f"address exceeds maximum length ({max_length})")
    if _CONTROL_CHAR_RE.search(trimmed):
        raise ValueError("address contains invalid control characters")
    return trimmed
