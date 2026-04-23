"""Client UI settings merge/sanitize (JSON document)."""

from .state import (
    assert_settings_size,
    default_settings,
    merge_and_sanitize,
    sanitize_settings,
)

__all__ = [
    "assert_settings_size",
    "default_settings",
    "merge_and_sanitize",
    "sanitize_settings",
]
