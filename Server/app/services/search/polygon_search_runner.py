"""
Run polygon search: cache check, preferences, isochrone, search loop, post-filters, score, persist.
Returns (response_data, status_code) or (None, (flask_response, status_code)) for pref error.
"""

import time

from flask import current_app

from app.services.search.db.search_db import (
    get_cached_results_for_only_cached,
    get_cached_results_with_age,
    is_search_cache_valid,
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

COLLECTION_LIMIT = 500
TOP_N = 100


def run_polygon_search(user_id: str, data: dict):
    """
    Run polygon search: cache, preferences, isochrone, search, post-filters, score, persist.
    Returns (response_data, status_code) for JSON response, or (None, (response, status_code))
    when preferences error (caller should return the tuple).
    """
    start_time = time.time()
    request_id = f"poly_{int(start_time * 1000)}"

    only_cached = data.get("onlyCached", False)
    force_search = data.get("forceSearch", False)

    if not force_search:
        cache_valid, cached_results = is_search_cache_valid(user_id)
        if cache_valid and cached_results:
            total_time = time.time() - start_time
            _, cache_age_days = get_cached_results_with_age(user_id)
            current_app.logger.info(
                f"[POLYGON_SEARCH] ✅ {request_id} - Cache HIT for user {user_id}. "
                f"Returning {len(cached_results)} cached results (age: {cache_age_days} days)"
            )
            response_data = {
                "success": True,
                "properties": cached_results,
                "total_count": len(cached_results),
                "has_more": False,
                "meta": {
                    "cached": True,
                    "cacheAge": f"{cache_age_days} days"
                    if cache_age_days is not None
                    else "unknown",
                    "requestsMade": 0,
                    "deduped": len(cached_results),
                    "errors": [],
                    "status_type": "ForSale",
                    "pagesTried": 0,
                    "searchTime": round(total_time, 2),
                    "scored": len(cached_results) > 0 and cached_results[0].get("_score", 0.0) > 0,
                    "requestId": request_id,
                    "limit": TOP_N,
                },
            }
            return (response_data, 200)

        if only_cached:
            db_results, cache_age_days = get_cached_results_for_only_cached(user_id)
            if db_results:
                total_time = time.time() - start_time
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
                return (response_data, 200)

    mark_past_search_results_as_not_current(user_id)

    if force_search:
        current_app.logger.info(
            f"[POLYGON_SEARCH] 🔄 {request_id} - Force search requested for user {user_id}. Performing new search (ignoring cache)"
        )

    user_preferences, pref_error = get_user_preferences_parsed(user_id)
    if pref_error is not None:
        return (None, pref_error)

    user_preferences = user_preferences or {}

    request_prefs = data.get("user_preferences") or {}
    if isinstance(request_prefs, dict):
        for key in ("preferred_bedrooms_max", "preferred_bathrooms_max"):
            if request_prefs.get(key) is not None:
                user_preferences[key] = request_prefs[key]

    status_type = "ForSale"
    per_pages = max(0, min(int(data.get("perBucketPages", 30)), 50))

    polygon = generate_isochrone_polygon_from_preferences(user_preferences)
    if not polygon:
        current_app.logger.error(
            f"[POLYGON_SEARCH] ❌ {request_id} - Failed to generate isochrone polygon"
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
    all_properties, requests_made, errors = search_properties_paginated(
        polygon_param=polygon_param,
        filters=filters,
        status_type=status_type,
        per_pages=per_pages,
        target_limit=COLLECTION_LIMIT,
        request_id=request_id,
    )

    # Post-filter by max beds/baths
    beds_max = user_preferences.get("preferred_bedrooms_max")
    baths_max = user_preferences.get("preferred_bathrooms_max")
    if beds_max is not None or baths_max is not None:

        def _get_beds(p):
            v = p.get("bedrooms") if p.get("bedrooms") is not None else p.get("beds")
            if v is None:
                return None
            try:
                return int(float(v))
            except (TypeError, ValueError):
                return None

        def _get_baths(p):
            v = p.get("bathrooms") if p.get("bathrooms") is not None else p.get("baths")
            if v is None:
                return None
            try:
                return int(float(v))
            except (TypeError, ValueError):
                return None

        all_properties = [
            p
            for p in all_properties
            if (beds_max is None or (_get_beds(p) is not None and _get_beds(p) <= beds_max))
            and (baths_max is None or (_get_baths(p) is not None and _get_baths(p) <= baths_max))
        ]

    # Post-filter by sqft range
    sqft_min = user_preferences.get("preferred_sqft_min")
    sqft_max = user_preferences.get("preferred_sqft_max")
    if sqft_min is not None or sqft_max is not None:

        def _get_sqft(prop):
            v = prop.get("livingArea") if prop.get("livingArea") is not None else prop.get("sqft")
            if v is None:
                return None
            try:
                return int(float(v)) if isinstance(v, int | float | str) else None
            except (TypeError, ValueError):
                return None

        all_properties = [
            p
            for p in all_properties
            if (
                _get_sqft(p) is None
                or (
                    (sqft_min is None or _get_sqft(p) >= sqft_min)
                    and (sqft_max is None or _get_sqft(p) <= sqft_max)
                )
            )
        ]

    # Post-filter by days on market max
    dom_max = user_preferences.get("days_on_market_max")
    if dom_max is not None:

        def _get_dom(prop):
            v = (
                prop.get("daysOnMarket")
                if prop.get("daysOnMarket") is not None
                else prop.get("dom")
            )
            if v is None:
                return None
            try:
                return int(float(v)) if isinstance(v, int | float | str) else None
            except (TypeError, ValueError):
                return None

        all_properties = [
            p for p in all_properties if _get_dom(p) is None or _get_dom(p) <= dom_max
        ]

    # Post-filter by listing type
    listing_type_prefs = user_preferences.get("listing_type")
    if isinstance(listing_type_prefs, list) and len(listing_type_prefs) > 0:

        def _matches_listing_type(prop):
            status = prop.get("listingStatus") or prop.get("listing_status") or ""
            if not status:
                return True
            status_lower = str(status).lower().replace(" ", "_").replace("-", "_")
            for pref in listing_type_prefs:
                pref_lower = str(pref).lower().replace(" ", "_").replace("-", "_")
                if pref_lower in status_lower or status_lower in pref_lower:
                    return True
            return False

        all_properties = [p for p in all_properties if _matches_listing_type(p)]

    # Post-filter by must-have features
    must_have = user_preferences.get("must_have")
    if isinstance(must_have, list) and len(must_have) > 0:

        def _has_any_must_have(prop):
            facts = prop.get("homeFacts") or prop.get("features") or prop.get("resoFacts") or {}
            if isinstance(facts, dict):
                facts_str = " ".join(str(v).lower() for v in facts.values() if v)
            elif isinstance(facts, list):
                facts_str = " ".join(str(x).lower() for x in facts)
            else:
                facts_str = str(facts).lower()
            if not facts_str.strip():
                return True
            for need in must_have:
                need_lower = str(need).lower().replace("_", " ").replace("-", " ")
                if need_lower in facts_str or need_lower.replace(" ", "") in facts_str.replace(
                    " ", ""
                ):
                    return True
            return False

        all_properties = [p for p in all_properties if _has_any_must_have(p)]

    user_data = {"user_id": user_id, "preferences": user_preferences}
    scored_all = score_and_sort_properties(
        properties=all_properties,
        user_data=user_data,
        request_id=request_id,
    )
    scored_properties = scored_all[:TOP_N]

    persist_and_prune_search_results(user_id, scored_properties)

    if scored_properties:
        sample_scores = [(p.get("zpid"), p.get("_score", 0.0)) for p in scored_properties[:3]]
        current_app.logger.info(
            f"[POLYGON_SEARCH] 📊 {request_id} - Sample scores (first 3): {sample_scores}"
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
