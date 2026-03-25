"""
Run polygon search: without forceSearch, return stored HomeUniversal rows only; with forceSearch,
run isochrone, upstream search, post-filters, score, and persist.
Returns (response_data, status_code) or (None, (flask_response, status_code)) for pref error.
"""

import json
import time

from flask import current_app

from app.services.search.db.search_db import (
    get_cached_results_with_age,
    mark_past_search_results_as_not_current,
)
from app.services.search.helpers.geometry_helpers import simplify_polygon, to_polygon_param
from app.services.search.helpers.persistence_helpers import persist_and_prune_search_results
from app.services.search.helpers.preferences_helpers import (
    generate_isochrone_polygon_from_preferences,
    get_user_preferences_parsed,
    map_user_preferences_to_filters,
)
from app.services.search.helpers.scoring_helpers import score_and_sort_properties
from app.services.search.helpers.search_loop_helpers import search_properties_paginated
from app.services.search.polygon_search_post_filters import apply_polygon_search_post_filters
from logger import LOG_CATEGORIES, log

_AGENT_DEBUG_LOG_PRIMARY = "/Users/jaycewalzer/Desktop/SilverKey/.cursor/debug-8adfea.log"
_AGENT_DEBUG_LOG_FALLBACK = "/tmp/silverkey-debug-8adfea.log"


def _agent_debug_log(message: str, data: dict, hypothesis_id: str) -> None:
    """Append one NDJSON line for Cursor debug session (no PII); mirror to Flask log for Docker/HTTPS."""
    payload = {
        "sessionId": "8adfea",
        "timestamp": int(time.time() * 1000),
        "location": "polygon_search_runner.run_polygon_search",
        "message": message,
        "data": data,
        "hypothesisId": hypothesis_id,
    }
    line = json.dumps(payload, default=str) + "\n"
    try:
        current_app.logger.info("SILVERKEY_AGENT_DEBUG %s", line.strip())
    except RuntimeError:
        pass
    for path in (_AGENT_DEBUG_LOG_PRIMARY, _AGENT_DEBUG_LOG_FALLBACK):
        try:
            with open(path, "a", encoding="utf-8") as f:
                f.write(line)
            break
        except OSError:
            continue


COLLECTION_LIMIT = 500
TOP_N = 100

_POLY = LOG_CATEGORIES["POLYGON_SEARCH"]

# Preference keys for polygon debug logs (numeric / enums only; no addresses).
_PREF_LOG_KEYS = (
    "preferred_bedrooms_max",
    "preferred_bathrooms_max",
    "preferred_bedrooms",
    "preferred_bathrooms",
    "preferred_sqft_min",
    "preferred_sqft_max",
    "home_budget_min",
    "home_budget_max",
    "days_on_market_min",
    "days_on_market_max",
    "preferred_lot_size_min",
    "preferred_lot_size_max",
    "preferred_home_age_min",
    "preferred_home_age_max",
)

_REQUEST_PREF_MERGE_KEYS = (
    "preferred_bedrooms_max",
    "preferred_bathrooms_max",
    "preferred_lot_size_min",
    "preferred_lot_size_max",
    "preferred_home_age_min",
    "preferred_home_age_max",
)


def _log_polygon_prefs_snapshot(
    request_id: str,
    user_id: str,
    user_preferences: dict,
    request_prefs: dict,
    filters: dict,
) -> None:
    pref_subset = {
        k: user_preferences.get(k) for k in _PREF_LOG_KEYS if user_preferences.get(k) is not None
    }
    iloc = user_preferences.get("important_locations")
    important_count = len(iloc) if isinstance(iloc, list) else None
    listing_type = user_preferences.get("listing_type")
    listing_type_summary = None
    if isinstance(listing_type, list):
        listing_type_summary = {
            "count": len(listing_type),
            "sample": [str(x)[:40] for x in listing_type[:5]],
        }
    must_have = user_preferences.get("must_have")
    must_have_count = len(must_have) if isinstance(must_have, list) else None
    override_keys = [
        k
        for k in ("preferred_bedrooms_max", "preferred_bathrooms_max")
        if isinstance(request_prefs, dict) and request_prefs.get(k) is not None
    ]
    filter_vals: dict = {}
    if isinstance(filters, dict):
        for fk in (
            "minPrice",
            "maxPrice",
            "bedsMin",
            "bathsMin",
            "home_type",
            "minSqft",
            "maxSqft",
        ):
            if filters.get(fk) is not None:
                filter_vals[fk] = filters.get(fk)
    log.info(
        _POLY,
        "polygon_search prefs_snapshot",
        {
            "request_id": request_id,
            "user_id": user_id,
            "request_override_keys": override_keys,
            "pref_subset": pref_subset,
            "important_locations_count": important_count,
            "listing_type": listing_type_summary,
            "must_have_count": must_have_count,
            "api_filters": filter_vals,
        },
    )


def run_polygon_search(user_id: str, data: dict):
    """
    Run polygon search: if forceSearch, recompute and persist; otherwise return stored DB rows only.
    Returns (response_data, status_code) for JSON response, or (None, (response, status_code))
    when preferences error (caller should return the tuple).
    """
    start_time = time.time()
    request_id = f"poly_{int(start_time * 1000)}"

    only_cached_flag = data.get("onlyCached", False)
    force_search = data.get("forceSearch", False)

    if not force_search:
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
            response_data = {
                "success": True,
                "properties": db_results,
                "total_count": len(db_results),
                "has_more": False,
                "meta": {
                    "cached": True,
                    "cacheAge": f"{cache_age_days} days"
                    if cache_age_days is not None
                    else "unknown",
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
            _agent_debug_log(
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
        _agent_debug_log(
            "db_read_empty",
            {"properties_out": 0, "request_id": request_id},
            "B",
        )
        return (response_data, 200)

    mark_past_search_results_as_not_current(user_id)

    if force_search:
        log.info(
            _POLY,
            "polygon_search force_search_start",
            {"request_id": request_id, "user_id": user_id},
        )

    user_preferences, pref_error = get_user_preferences_parsed(user_id)
    if pref_error is not None:
        return (None, pref_error)

    user_preferences = user_preferences or {}

    request_prefs = data.get("user_preferences") or {}
    if isinstance(request_prefs, dict):
        for key in _REQUEST_PREF_MERGE_KEYS:
            if request_prefs.get(key) is not None:
                user_preferences[key] = request_prefs[key]

    status_type = "ForSale"
    per_pages = max(0, min(int(data.get("perBucketPages", 30)), 50))

    polygon = generate_isochrone_polygon_from_preferences(user_preferences)
    if not polygon:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "polygon_search isochrone_polygon_failed",
            {"request_id": request_id, "user_id": user_id},
        )
        return (
            {
                "success": False,
                "error": "ISOCHRONE_FAILED",
                "message": "Failed to generate search area",
            },
            400,
        )

    assert polygon is not None
    if polygon[0] != polygon[-1]:
        polygon.append(polygon[0])
    polygon = simplify_polygon(polygon, max_points=50)
    polygon_param = to_polygon_param(polygon)

    filters = map_user_preferences_to_filters(user_preferences, status_type)
    _log_polygon_prefs_snapshot(request_id, user_id, user_preferences, request_prefs, filters)
    filter_keys = sorted(filters.keys()) if isinstance(filters, dict) else []
    _agent_debug_log(
        "filters_mapped",
        {
            "request_id": request_id,
            "filter_key_count": len(filter_keys),
            "filter_keys": filter_keys[:40],
            "per_pages": per_pages,
            "force_search": force_search,
            "only_cached": only_cached_flag,
        },
        "A",
    )
    all_properties, requests_made, errors = search_properties_paginated(
        polygon_param=polygon_param,
        filters=filters,
        status_type=status_type,
        per_pages=per_pages,
        target_limit=COLLECTION_LIMIT,
        request_id=request_id,
    )
    _agent_debug_log(
        "after_paginated_search",
        {
            "request_id": request_id,
            "collected_count": len(all_properties),
            "requests_made": requests_made,
            "errors_count": len(errors),
        },
        "C",
    )
    if errors:
        err_sample = []
        for e in errors[:8]:
            err_sample.append(str(e)[:240])
        log.info(
            _POLY,
            "polygon_search pagination_errors",
            {
                "request_id": request_id,
                "errors_count": len(errors),
                "sample": err_sample,
            },
        )

    all_properties = apply_polygon_search_post_filters(
        all_properties,
        user_preferences,
        request_id,
        agent_debug_log=_agent_debug_log,
    )

    user_data = {"user_id": user_id, "preferences": user_preferences}
    scored_all = score_and_sort_properties(
        properties=all_properties,
        user_data=user_data,
        request_id=request_id,
    )
    scored_properties = scored_all[:TOP_N]
    _agent_debug_log(
        "after_scoring_and_top_n",
        {
            "request_id": request_id,
            "scored_all_count": len(scored_all),
            "returned_count": len(scored_properties),
            "top_n": TOP_N,
        },
        "A",
    )

    persist_and_prune_search_results(user_id, scored_properties)

    if scored_properties:
        sample_scores = [(p.get("zpid"), p.get("_score", 0.0)) for p in scored_properties[:3]]
        log.info(
            _POLY,
            "polygon_search sample_scores",
            {"request_id": request_id, "sample": sample_scores},
        )
    elif len(scored_all) == 0 and len(all_properties) > 0:
        log.warn(
            _POLY,
            "polygon_search scoring_returned_empty",
            {
                "request_id": request_id,
                "input_properties": len(all_properties),
            },
        )

    total_time = time.time() - start_time
    response_data = {
        "success": True,
        "properties": scored_properties,
        "total_count": len(scored_properties),
        "has_more": False,
        "meta": {
            "cached": False,
            "requestsMade": requests_made,
            "deduped": len(scored_properties),
            "errors": errors[:20],
            "status_type": status_type,
            "pagesTried": per_pages + 1,
            "searchTime": round(total_time, 2),
            "scored": len(scored_properties) > 0 and scored_properties[0].get("_score", 0.0) > 0,
            "requestId": request_id,
            "limit": TOP_N,
        },
    }
    return (response_data, 200)
