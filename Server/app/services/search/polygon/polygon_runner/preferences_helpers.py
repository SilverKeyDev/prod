"""Preferences resolution helpers for polygon search."""

from app.models.user.user_search_display import UserSearchDisplaySettings
from logger import LOG_CATEGORIES, log

_POLY = LOG_CATEGORIES["POLYGON_SEARCH"]

# Preference keys for polygon debug logs (numeric / enums only; no addresses)
PREF_LOG_KEYS = (
    "preferred_bedrooms_min",
    "preferred_bedrooms_max",
    "preferred_bathrooms_min",
    "preferred_bathrooms_max",
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

REQUEST_PREF_MERGE_KEYS = (
    "preferred_bedrooms_min",
    "preferred_bedrooms_max",
    "preferred_bathrooms_min",
    "preferred_bathrooms_max",
    "home_budget_min",
    "home_budget_max",
    "preferred_housing_type",
    "housing_type",
    "listing_type",
    "listing_status",
    "preferred_sqft_min",
    "preferred_sqft_max",
    "preferred_lot_size_min",
    "preferred_lot_size_max",
    "preferred_home_age_min",
    "preferred_home_age_max",
)


def resolve_strict_preference_filter(user_id: str, data: dict) -> bool:
    """Resolve strict_preference_filter from request body or user settings."""
    if "preferences_strict_filter" in data:
        return bool(data.get("preferences_strict_filter"))
    row = UserSearchDisplaySettings.query.filter_by(user_id=user_id).first()
    if row is None:
        return False
    return bool(getattr(row, "preferences_strict_filter", False))


def log_polygon_prefs_snapshot(
    request_id: str,
    user_id: str,
    user_preferences: dict,
    request_prefs: dict,
    filters: dict,
) -> None:
    """Log preference snapshot for debugging."""
    pref_subset = {
        k: user_preferences.get(k) for k in PREF_LOG_KEYS if user_preferences.get(k) is not None
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
        for k in (
            "preferred_bedrooms_min",
            "preferred_bedrooms_max",
            "preferred_bathrooms_min",
            "preferred_bathrooms_max",
        )
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
