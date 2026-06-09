"""Force-search polygon pipeline: upstream fetch, filter, score, persist."""

import time

from app.services.search.data.normalizer import slim_properties_for_search_response
from app.services.search.helpers.geometry_helpers import (
    simplify_polygon,
    to_geojson_polygon,
)
from app.services.search.helpers.preferences_helpers import map_user_preferences_to_filters
from app.services.search.helpers.scoring_helpers import score_and_sort_properties
from app.utils.http.pagination import build_pagination
from logger import log

from ..polygon_post_filters import apply_polygon_search_post_filters
from ..resolve_search_polygon import resolve_search_polygon
from .constants import _POLY, COLLECTION_LIMIT, TOP_N
from .debug_logging import agent_debug_log
from .preferences_helpers import REQUEST_PREF_MERGE_KEYS, log_polygon_prefs_snapshot


def _runner_pkg():
    """Resolve symbols via package so tests can patch polygon_runner.*."""
    import app.services.search.polygon.polygon_runner as polygon_runner

    return polygon_runner


def run_force_search_pipeline(
    user_id: str,
    data: dict,
    *,
    preferences_subject_user_id: str | None,
    request_id: str,
    start_time: float,
    force_search: bool,
    only_cached_flag: bool,
):
    """
    Run isochrone/upstream search when forceSearch is true.
    Returns (response_data, status_code) or (None, (flask_response, status_code)) for pref error.
    """
    runner_pkg = _runner_pkg()
    runner_pkg.mark_past_search_results_as_not_current(user_id)

    if force_search:
        log.info(
            _POLY,
            "polygon_search force_search_start",
            {"request_id": request_id, "user_id": user_id},
        )

    pref_source_id = (
        preferences_subject_user_id
        if preferences_subject_user_id is not None
        and str(preferences_subject_user_id).strip() != ""
        else user_id
    )
    user_preferences, pref_error = runner_pkg.get_user_preferences_parsed(pref_source_id)
    if pref_error is not None:
        return (None, pref_error)

    user_preferences = user_preferences or {}

    request_prefs = data.get("user_preferences") or {}
    if isinstance(request_prefs, dict):
        for key in REQUEST_PREF_MERGE_KEYS:
            if request_prefs.get(key) is not None:
                user_preferences[key] = request_prefs[key]
        if "must_have" in request_prefs and isinstance(request_prefs["must_have"], list):
            user_preferences["must_have"] = list(request_prefs["must_have"])
        if "preferred_home_features" in request_prefs and isinstance(
            request_prefs["preferred_home_features"], list
        ):
            user_preferences["preferred_home_features"] = list(
                request_prefs["preferred_home_features"]
            )

    status_type = "ForSale"
    _raw_per_bucket = data.get("perBucketPages", 30)
    per_pages = max(0, min(int(30 if _raw_per_bucket is None else _raw_per_bucket), 50))

    viewport_raw = data.get("viewport_polygon")
    polygon, search_area_mode, vp_err = resolve_search_polygon(data, user_preferences)

    if vp_err:
        return (
            {
                "success": False,
                "error": vp_err,
                "message": "Invalid or oversized map viewport for search",
            },
            400,
        )

    if not polygon:
        total_time = time.time() - start_time
        log.info(
            _POLY,
            "polygon_search no_search_area",
            {
                "request_id": request_id,
                "user_id": user_id,
                "had_viewport": viewport_raw is not None,
            },
        )
        response_data = {
            "success": True,
            "properties": [],
            "total_count": 0,
            "has_more": False,
            "pagination": build_pagination(page=1, per_page=TOP_N, total=0),
            "meta": {
                "cached": False,
                "requestsMade": 0,
                "deduped": 0,
                "errors": [],
                "status_type": status_type,
                "pagesTried": 0,
                "searchTime": round(total_time, 2),
                "scored": False,
                "requestId": request_id,
                "limit": TOP_N,
                "searchArea": search_area_mode,
                "message": "No search area could be resolved; send viewport_polygon from the client.",
            },
        }
        return (response_data, 200)

    assert polygon is not None
    if polygon[0] != polygon[-1]:
        polygon.append(polygon[0])
    polygon = simplify_polygon(polygon, max_points=50)
    polygon_param = to_geojson_polygon(polygon)

    filters = map_user_preferences_to_filters(user_preferences, status_type)
    log_polygon_prefs_snapshot(request_id, pref_source_id, user_preferences, request_prefs, filters)
    filter_keys = sorted(filters.keys()) if isinstance(filters, dict) else []
    agent_debug_log(
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
    all_properties, requests_made, errors = runner_pkg.search_properties_paginated(
        polygon_param=polygon_param,
        filters=filters,
        status_type=status_type,
        per_pages=per_pages,
        target_limit=COLLECTION_LIMIT,
        request_id=request_id,
    )
    agent_debug_log(
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

    strict_pref = runner_pkg.resolve_strict_preference_filter(user_id, data)
    log.info(
        _POLY,
        "polygon_search preference_filter_mode",
        {
            "request_id": request_id,
            "strict_preference_filter": strict_pref,
            "from_request_body": "preferences_strict_filter" in data,
        },
    )
    pre_filter_count = len(all_properties)
    all_properties = apply_polygon_search_post_filters(
        all_properties,
        user_preferences,
        request_id,
        agent_debug_log=agent_debug_log,
        strict_preference_filter=strict_pref,
    )
    post_filter_count = len(all_properties)
    filters_too_tight = pre_filter_count > 0 and post_filter_count == 0

    user_data = {"user_id": user_id, "preferences": user_preferences}
    scored_all = score_and_sort_properties(
        properties=all_properties,
        user_data=user_data,
        request_id=request_id,
        status_type=status_type,
    )
    scored_properties = scored_all[:TOP_N]
    agent_debug_log(
        "after_scoring_and_top_n",
        {
            "request_id": request_id,
            "scored_all_count": len(scored_all),
            "returned_count": len(scored_properties),
            "top_n": TOP_N,
        },
        "A",
    )

    runner_pkg.persist_and_prune_search_results(user_id, scored_properties)

    if scored_properties:
        sample_scores = [(p.get("zpid"), p.get("_score", 0.0)) for p in scored_properties[:3]]
        rounded_scores = [
            round(float(p.get("_score", 0.0)), 1)
            for p in scored_properties
            if p.get("_score") is not None
        ]
        unique_rounded = len(set(rounded_scores))
        if len(scored_properties) > 3 and unique_rounded <= 1:
            from app.services.search.home_matching.mcda.score import preference_coverage_count

            sample = scored_properties[0]
            log.warn(
                _POLY,
                "polygon_search uniform_match_scores",
                {
                    "request_id": request_id,
                    "count": len(scored_properties),
                    "rounded_score": rounded_scores[0] if rounded_scores else None,
                    "preference_coverage": preference_coverage_count(
                        user_preferences, status_type=status_type
                    ),
                    "sample_has_price": sample.get("price") is not None,
                    "sample_has_bedrooms": sample.get("bedrooms") is not None,
                    "sample_has_living_area": sample.get("livingArea") is not None
                    or sample.get("sqft") is not None,
                    "pref_source_id": pref_source_id,
                    "search_area_mode": search_area_mode,
                },
            )
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
    n_scored = len(scored_properties)
    response_data = {
        "success": True,
        "properties": slim_properties_for_search_response(scored_properties),
        "total_count": n_scored,
        "has_more": False,
        "pagination": build_pagination(page=1, per_page=TOP_N, total=n_scored),
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
            "searchArea": search_area_mode,
            "filtersTooTight": filters_too_tight,
            "preFilterCount": pre_filter_count,
            "postFilterCount": post_filter_count,
        },
    }
    return (response_data, 200)
