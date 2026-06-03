"""Detect pytest/CI runs that must not require production secrets from .env.example."""

import os


def is_testing() -> bool:
    """True when the process is running the test suite (see tests/conftest.py)."""
    return os.getenv("TESTING", "").strip().lower() in ("true", "1", "yes")
