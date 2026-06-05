"""
Run polygon search: without forceSearch, return stored property rows only; with forceSearch,
run isochrone, upstream search, post-filters, score, and persist.
Returns (response_data, status_code) or (None, (flask_response, status_code)) for pref error.
"""

import time

from app.services.search.data.normalizer import slim_properties_for_search_response
from app.services.search.helpers.persistence_helpers import persist_and_prune_search_results
from app.services.search.helpers.preferences_helpers import get_user_preferences_parsed
from app.services.search.helpers.search_loop_helpers import search_properties_paginated
from app.utils.http.pagination import build_pagination
from logger import log

from ...db import (
    get_cached_results_with_age,
    mark_past_search_results_as_not_current,
)
from .constants import _POLY, TOP_N
from .debug_logging import agent_debug_log
from .preferences_helpers import resolve_strict_preference_filter

# Re-exported on package for tests that patch polygon_runner.*
__all__ = [
    "run_polygon_search",
    "get_user_preferences_parsed",
    "search_properties_paginated",
    "mark_past_search_results_as_not_current",
    "persist_and_prune_search_results",
    "resolve_strict_preference_filter",
]


def _resolve_polygon_request_id(correlation_id: str | None, start_time: float) -> str:
    """Prefer client X-Request-Id when safe; otherwise time-based id."""
    fallback = f"poly_{int(start_time * 1000)}"
    if correlation_id is None:
        return fallback
    s = str(correlation_id).strip()
    if not s:
        return fallback
    cleaned = "".join(ch for ch in s[:80] if ch.isalnum() or ch in "-_")
    return cleaned or fallback


def _cached_only_response(
    user_id: str,
    *,
    request_id: str,
    start_time: float,
):
    """Return stored DB rows when forceSearch is false."""
    db_results, cache_age_days = get_cached_results_with_age(user_id)
    total_time = time.time() - start_time
    if db_results:
        log.info(
            _POLY,
            "polygon_search db_read_hit",
            {
                "request_id": request_id,
                "user_id": user_id,
                "count": len(db_results),
                "cache_age_days": cache_age_days,
            },
        )
        n_results = len(db_results)
        response_data = {
            "success": True,
            "properties": slim_properties_for_search_response(db_results),
            "total_count": n_results,
            "has_more": False,
            "pagination": build_pagination(page=1, per_page=TOP_N, total=n_results),
            "meta": {
                "cached": True,
                "cacheAge": f"{cache_age_days} days" if cache_age_days is not None else "unknown",
                "requestsMade": 0,
                "deduped": len(db_results),
                "errors": [],
                "status_type": "ForSale",
                "pagesTried": 0,
                "searchTime": round(total_time, 2),
                "scored": len(db_results) > 0 and db_results[0].get("_score", 0.0) > 0,
                "requestId": request_id,
                "limit": TOP_N,
            },
        }
        agent_debug_log(
            "db_read_hit",
            {"properties_out": len(db_results), "request_id": request_id},
            "B",
        )
        return (response_data, 200)

    response_data = {
        "success": True,
        "properties": [],
        "total_count": 0,
        "has_more": False,
        "pagination": build_pagination(page=1, per_page=TOP_N, total=0),
        "meta": {
            "cached": True,
            "cacheAge": f"{cache_age_days} days" if cache_age_days is not None else "unknown",
            "requestsMade": 0,
            "deduped": 0,
            "errors": [],
            "status_type": "ForSale",
            "pagesTried": 0,
            "searchTime": round(total_time, 2),
            "scored": False,
            "requestId": request_id,
            "limit": TOP_N,
        },
    }
    agent_debug_log(
        "db_read_empty",
        {"properties_out": 0, "request_id": request_id},
        "B",
    )
    return (response_data, 200)


def run_polygon_search(
    user_id: str,
    data: dict,
    *,
    preferences_subject_user_id: str | None = None,
    correlation_id: str | None = None,
):
    """
    Run polygon search: if forceSearch, recompute and persist; otherwise return stored DB rows only.
    Returns (response_data, status_code) for JSON response, or (None, (response, status_code))
    when preferences error (caller should return the tuple).

    user_id: authenticated viewer (cache/persist owner).
    preferences_subject_user_id: whose preferences drive filters/scoring when set; else user_id.
    correlation_id: optional client-provided X-Request-Id (sanitized) for log correlation.
    """
    from .pipeline import run_force_search_pipeline

    start_time = time.time()
    request_id = _resolve_polygon_request_id(correlation_id, start_time)

    only_cached_flag = data.get("onlyCached", False)
    force_search = data.get("forceSearch", False)

    if not force_search:
        return _cached_only_response(
            user_id,
            request_id=request_id,
            start_time=start_time,
        )

    return run_force_search_pipeline(
        user_id,
        data,
        preferences_subject_user_id=preferences_subject_user_id,
        request_id=request_id,
        start_time=start_time,
        force_search=force_search,
        only_cached_flag=only_cached_flag,
    )
