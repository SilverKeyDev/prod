"""Apply user-preference post-filters to polygon search property lists (backward compatibility)."""

# Re-export from new location for backward compatibility
from .polygon_post_filters import (
    PREFERENCE_POST_FILTER_LENIENT_MAX_COUNT,
    apply_polygon_search_post_filters,
)

__all__ = [
    "apply_polygon_search_post_filters",
    "PREFERENCE_POST_FILTER_LENIENT_MAX_COUNT",
]
