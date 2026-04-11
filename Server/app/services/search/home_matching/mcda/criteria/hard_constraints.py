"""
Combined multiplicative hard constraint factor in ~[floor, 1.0].
"""

from __future__ import annotations

from typing import Any

from .beds_baths import listing_baths_value, listing_beds_value
from .price import effective_budget_bounds, listing_price
from .property_type import listing_matches_preferred_housing_type
from .sqft import listing_sqft


def hard_constraint_multiplier(
    preferences: dict[str, Any],
    property_dict: dict[str, Any],
    status_type: str,
    hard_multipliers: dict[str, float],
) -> float:
    """
    Multiply all applicable violation factors (each in (0, 1]).
    Keys in hard_multipliers (defaults filled by caller):
      over_budget_moderate, over_budget_severe, over_budget_extreme,
      below_min_beds, below_min_baths, above_max_beds, above_max_baths,
      wrong_property_type, below_min_sqft,
      multiplier_floor
    """
    floor = float(hard_multipliers.get("multiplier_floor", 0.15))
    m = 1.0

    lo, hi = effective_budget_bounds(preferences, status_type)
    p = listing_price(property_dict)
    if hi is not None and hi > 0 and p is not None and p > hi:
        ratio = p / hi
        if ratio >= 1.2:
            m *= float(hard_multipliers.get("over_budget_extreme", 0.3))
        elif ratio >= 1.1:
            m *= float(hard_multipliers.get("over_budget_severe", 0.45))
        else:
            m *= float(hard_multipliers.get("over_budget_moderate", 0.55))

    got_beds = listing_beds_value(property_dict)
    if got_beds is not None:
        nmin = preferences.get("preferred_bedrooms_min")
        if nmin is not None:
            try:
                need_b = float(nmin)
            except (TypeError, ValueError):
                need_b = None
            if need_b is not None and got_beds + 1e-6 < need_b:
                m *= float(hard_multipliers.get("below_min_beds", 0.35))
        nmax = preferences.get("preferred_bedrooms_max")
        if nmax is not None:
            try:
                max_b = float(nmax)
            except (TypeError, ValueError):
                max_b = None
            if max_b is not None and got_beds > max_b + 1e-6:
                m *= float(hard_multipliers.get("above_max_beds", 0.35))

    got_baths = listing_baths_value(property_dict)
    if got_baths is not None:
        nmin = preferences.get("preferred_bathrooms_min")
        if nmin is not None:
            try:
                need_bt = float(nmin)
            except (TypeError, ValueError):
                need_bt = None
            if need_bt is not None and got_baths + 1e-6 < need_bt:
                m *= float(hard_multipliers.get("below_min_baths", 0.35))
        nmax = preferences.get("preferred_bathrooms_max")
        if nmax is not None:
            try:
                max_bt = float(nmax)
            except (TypeError, ValueError):
                max_bt = None
            if max_bt is not None and got_baths > max_bt + 1e-6:
                m *= float(hard_multipliers.get("above_max_baths", 0.35))

    match = listing_matches_preferred_housing_type(preferences, property_dict, status_type)
    if match is False:
        m *= float(hard_multipliers.get("wrong_property_type", 0.45))

    sq_min = preferences.get("preferred_sqft_min")
    if sq_min is not None:
        try:
            sq_need = float(sq_min)
        except (TypeError, ValueError):
            sq_need = None
        if sq_need is not None and sq_need > 0:
            sq = listing_sqft(property_dict)
            if sq is not None and sq + 1e-6 < sq_need:
                m *= float(hard_multipliers.get("below_min_sqft", 0.5))

    sq_max = preferences.get("preferred_sqft_max")
    if sq_max is not None:
        try:
            sq_hi = float(sq_max)
        except (TypeError, ValueError):
            sq_hi = None
        if sq_hi is not None and sq_hi > 0:
            sq = listing_sqft(property_dict)
            if sq is not None and sq > sq_hi + 1e-6:
                m *= float(hard_multipliers.get("above_max_sqft", 0.52))

    return max(floor, min(1.0, m))
