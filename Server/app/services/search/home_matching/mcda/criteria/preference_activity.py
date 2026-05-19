"""
Detect which MCDA preference dimensions are active for a user (vs. objective-only fallback).
"""

from __future__ import annotations

from typing import Any

from .commute import has_commute_preference
from .price import effective_budget_bounds


def _non_empty_str(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _has_float_pref(preferences: dict[str, Any], key: str) -> bool:
    v = preferences.get(key)
    if v is None:
        return False
    try:
        return float(v) > 0 or float(v) == 0
    except (TypeError, ValueError):
        return False


def normalize_preferences_for_mcda(preferences: dict[str, Any] | None) -> dict[str, Any]:
    """
    Align aggregated profile keys with MCDA dimension detectors (e.g. preferred_bedrooms → _min).
    """
    out = dict(preferences or {})
    if out.get("preferred_bedrooms_min") is None and out.get("preferred_bedrooms") is not None:
        out["preferred_bedrooms_min"] = out["preferred_bedrooms"]
    if out.get("preferred_bathrooms_min") is None and out.get("preferred_bathrooms") is not None:
        out["preferred_bathrooms_min"] = out["preferred_bathrooms"]
    if not out.get("preferred_housing_type") and out.get("housing_type"):
        ht = out.get("housing_type")
        if isinstance(ht, str) and ht.strip():
            out["preferred_housing_type"] = ht
    return out


def has_budget_preference(preferences: dict[str, Any], status_type: str = "ForSale") -> bool:
    lo, hi = effective_budget_bounds(preferences, status_type)
    return hi is not None and hi > 0


def has_beds_preference(preferences: dict[str, Any]) -> bool:
    return _has_float_pref(preferences, "preferred_bedrooms_min") or _has_float_pref(
        preferences, "preferred_bedrooms_max"
    )


def has_baths_preference(preferences: dict[str, Any]) -> bool:
    return _has_float_pref(preferences, "preferred_bathrooms_min") or _has_float_pref(
        preferences, "preferred_bathrooms_max"
    )


def has_sqft_preference(preferences: dict[str, Any]) -> bool:
    return _has_float_pref(preferences, "preferred_sqft_min") or _has_float_pref(
        preferences, "preferred_sqft_max"
    )


def has_amenities_preference(preferences: dict[str, Any]) -> bool:
    must = preferences.get("must_have")
    nice = preferences.get("preferred_home_features")
    must_list = must if isinstance(must, list) else []
    nice_list = nice if isinstance(nice, list) else []
    return bool(must_list or nice_list)


def has_lot_preference(preferences: dict[str, Any]) -> bool:
    return _has_float_pref(preferences, "preferred_lot_size_min") or _has_float_pref(
        preferences, "preferred_lot_size_max"
    )


def has_home_age_preference(preferences: dict[str, Any]) -> bool:
    amin = preferences.get("preferred_home_age_min")
    amax = preferences.get("preferred_home_age_max")
    return amin is not None or amax is not None


def has_dom_preference(preferences: dict[str, Any]) -> bool:
    return (
        preferences.get("days_on_market_min") is not None
        or preferences.get("days_on_market_max") is not None
    )


def has_walkability_preference(preferences: dict[str, Any]) -> bool:
    imp = preferences.get("walkability_importance")
    if imp is None or not str(imp).strip():
        return False
    s = str(imp).lower().strip()
    return s not in ("neutral", "not_important", "")


def has_housing_type_preference(preferences: dict[str, Any]) -> bool:
    ht = preferences.get("preferred_housing_type") or preferences.get("housing_type")
    return _non_empty_str(ht)


def count_active_preference_dimensions(
    preferences: dict[str, Any], *, status_type: str = "ForSale"
) -> int:
    checks = (
        has_budget_preference(preferences, status_type),
        has_beds_preference(preferences),
        has_baths_preference(preferences),
        has_sqft_preference(preferences),
        has_commute_preference(preferences),
        has_amenities_preference(preferences),
        has_lot_preference(preferences),
        has_home_age_preference(preferences),
        has_dom_preference(preferences),
        has_walkability_preference(preferences),
        has_housing_type_preference(preferences),
    )
    return sum(1 for c in checks if c)


def preference_strength_multiplier(
    preferences: dict[str, Any],
    *,
    status_type: str = "ForSale",
    per_dimension: float = 0.05,
    max_boost: float = 0.40,
) -> float:
    """
    Scale preference-driven soft contributions when the user has filled in more dimensions.
    """
    n = count_active_preference_dimensions(preferences, status_type=status_type)
    return 1.0 + min(max_boost, n * per_dimension)
