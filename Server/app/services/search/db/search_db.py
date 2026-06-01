"""Search DB operations: sync, upsert, and cache. Re-exports for backward compatibility."""

from __future__ import annotations

from .search_db_cache import (
    get_cached_results_with_age,
    get_cached_search_results,
    mark_past_search_results_as_not_current,
)
from .search_db_sync import sync_to_home_likes, sync_to_home_not_interested
from .search_db_upsert import add_or_update_home_basic

__all__ = [
    "sync_to_home_likes",
    "sync_to_home_not_interested",
    "add_or_update_home_basic",
    "get_cached_search_results",
    "get_cached_results_with_age",
    "mark_past_search_results_as_not_current",
]
