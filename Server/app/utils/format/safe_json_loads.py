"""Safely parse JSON strings with fallback defaults."""

import json


def safe_json_loads(value, default=None):
    """
    Safely parse JSON string or return default value.
    Handles string parsing, type checking, and error cases.

    Args:
        value: Value to parse (string, dict, list, or None)
        default: Default value to return if parsing fails or value is None/empty

    Returns:
        Parsed JSON value or default
    """
    if not value:
        return default

    if isinstance(value, dict | list):
        return value

    if not isinstance(value, str):
        return default

    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError, ValueError):
        return default
