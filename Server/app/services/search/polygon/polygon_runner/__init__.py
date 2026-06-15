"""
Polygon search runner package.

Public entry: run_polygon_search. Submodule symbols are re-exported for tests that patch
app.services.search.polygon.polygon_runner.<name>.
"""

from .runner import (
    get_user_preferences_parsed,
    mark_past_search_results_as_not_current,
    persist_and_prune_search_results,
    resolve_strict_preference_filter,
    run_polygon_search,
    search_properties_paginated,
)

__all__ = [
    "run_polygon_search",
    "get_user_preferences_parsed",
    "search_properties_paginated",
    "mark_past_search_results_as_not_current",
    "persist_and_prune_search_results",
    "resolve_strict_preference_filter",
]
