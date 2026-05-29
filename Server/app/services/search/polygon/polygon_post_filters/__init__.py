"""Polygon search post-filters orchestrator."""

from collections.abc import Callable

from logger import LOG_CATEGORIES, log

from .beds_baths import apply_beds_baths_filter
from .home_age import apply_home_age_filter
from .listing_status import property_kept_for_listing_status_pref
from .listing_type import apply_listing_type_filter
from .must_haves import apply_must_have_filter
from .price_type import apply_price_filter, apply_property_type_filter
from .sqft_dom_lot import apply_dom_filter, apply_lot_size_filter, apply_sqft_filter

_POLY = LOG_CATEGORIES["POLYGON_SEARCH"]

# Retained as a compatibility constant for callers/tests that imported the old threshold.
PREFERENCE_POST_FILTER_LENIENT_MAX_COUNT = 100


def _log_polygon_post_filter(
    request_id: str, step: str, before: int, after: int, extra: dict | None = None
) -> None:
    payload: dict = {"request_id": request_id, "step": step, "before": before, "after": after}
    if extra:
        payload.update(extra)
    log.info(_POLY, "polygon_search post_filter", payload)


def apply_polygon_search_post_filters(
    all_properties: list,
    user_preferences: dict,
    request_id: str,
    *,
    agent_debug_log: Callable[..., None],
    strict_preference_filter: bool = False,
) -> list:
    """Apply all polygon search post-filters based on user preferences."""
    # Apply price filter
    all_properties = apply_price_filter(
        all_properties,
        user_preferences.get("home_budget_min"),
        user_preferences.get("home_budget_max"),
        request_id,
        _log_polygon_post_filter,
    )

    # Apply property type filter
    all_properties = apply_property_type_filter(
        all_properties,
        user_preferences.get("preferred_housing_type"),
        user_preferences.get("housing_type"),
        request_id,
        _log_polygon_post_filter,
    )

    # Apply beds/baths filter
    all_properties = apply_beds_baths_filter(
        all_properties,
        user_preferences.get("preferred_bedrooms_min"),
        user_preferences.get("preferred_bedrooms_max"),
        user_preferences.get("preferred_bathrooms_min"),
        user_preferences.get("preferred_bathrooms_max"),
        request_id,
        _log_polygon_post_filter,
    )

    # Apply sqft filter
    all_properties = apply_sqft_filter(
        all_properties,
        user_preferences.get("preferred_sqft_min"),
        user_preferences.get("preferred_sqft_max"),
        request_id,
        _log_polygon_post_filter,
    )

    # Apply days on market filter
    all_properties = apply_dom_filter(
        all_properties,
        user_preferences.get("days_on_market_min"),
        user_preferences.get("days_on_market_max"),
        request_id,
        _log_polygon_post_filter,
    )

    # Apply lot size filter
    all_properties = apply_lot_size_filter(
        all_properties,
        user_preferences.get("preferred_lot_size_min"),
        user_preferences.get("preferred_lot_size_max"),
        request_id,
        _log_polygon_post_filter,
    )

    # Apply home age filter
    all_properties = apply_home_age_filter(
        all_properties,
        user_preferences.get("preferred_home_age_min"),
        user_preferences.get("preferred_home_age_max"),
        request_id,
        _log_polygon_post_filter,
    )

    # Apply listing type filter
    all_properties = apply_listing_type_filter(
        all_properties,
        user_preferences.get("listing_type"),
        request_id,
        _log_polygon_post_filter,
        strict_preference_filter,
    )

    # Apply listing status filter
    status_pref = user_preferences.get("listing_status")
    if isinstance(status_pref, str) and status_pref.strip():
        pref_norm = status_pref.strip().lower()
        _before_mls = len(all_properties)
        all_properties = [
            p for p in all_properties if property_kept_for_listing_status_pref(p, pref_norm)
        ]
        _log_polygon_post_filter(
            request_id,
            "listing_status",
            _before_mls,
            len(all_properties),
            {"listing_status": pref_norm},
        )
        if len(all_properties) == 0 and _before_mls > 0:
            log.warn(
                _POLY,
                "polygon_search post_filter dropped all (listing_status)",
                {"request_id": request_id, "before": _before_mls, "listing_status": pref_norm},
            )

    agent_debug_log(
        "after_post_filters_before_scoring",
        {"request_id": request_id, "count": len(all_properties)},
        "A",
    )

    # Apply must-have features filter
    all_properties = apply_must_have_filter(
        all_properties,
        user_preferences.get("must_have"),
        request_id,
        _log_polygon_post_filter,
        strict_preference_filter,
    )

    agent_debug_log(
        "after_must_have_filter",
        {"request_id": request_id, "count": len(all_properties)},
        "A",
    )
    return all_properties
