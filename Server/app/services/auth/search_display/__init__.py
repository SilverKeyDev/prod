"""Search display settings persistence."""

from .service import (
    SearchDisplayPatchError,
    apply_search_display_patch,
    get_or_create_search_display,
    row_to_dict,
    sanitize_last_search_context,
)

__all__ = [
    "SearchDisplayPatchError",
    "apply_search_display_patch",
    "get_or_create_search_display",
    "row_to_dict",
    "sanitize_last_search_context",
]
