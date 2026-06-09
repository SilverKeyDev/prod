"""
Beds / baths soft scores: reward meeting minimum, diminishing returns above.
"""

from __future__ import annotations

import math
from typing import Any


def _parse_count(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, int | float):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.strip())
        except (ValueError, TypeError):
            return None
    return None


def _listing_beds(property_dict: dict[str, Any]) -> float | None:
    return _parse_count(
        property_dict.get("bedrooms")
        or property_dict.get("beds")
        or property_dict.get("bedroomsCount")
    )


def _listing_baths(property_dict: dict[str, Any]) -> float | None:
    return _parse_count(
        property_dict.get("bathrooms")
        or property_dict.get("baths")
        or property_dict.get("bathroomsCount")
    )


def _optional_float_pref(preferences: dict[str, Any], key: str) -> float | None:
    v = preferences.get(key)
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


_MEETS_MINIMUM_SIGNAL = 0.65


def soft_beds_normalized(
    preferences: dict[str, Any], property_dict: dict[str, Any], k: float
) -> float:
    """
    Uses preferred_bedrooms_min / preferred_bedrooms_max as an acceptable range.
    At minimum (within max when set) → positive signal (~0.65). Below floor → below 0.5.
    k controls steepness for excess above minimum (larger = faster saturation).
    """
    min_b = _optional_float_pref(preferences, "preferred_bedrooms_min")
    max_b = _optional_float_pref(preferences, "preferred_bedrooms_max")
    if min_b is None and max_b is None:
        return 0.5

    floor = min_b if min_b is not None else 0.0
    b = _listing_beds(property_dict)
    if b is None:
        return 0.5

    effective = min(b, max_b) if max_b is not None else b
    if effective < floor:
        shortfall = floor - effective
        penalty = 1.0 - math.exp(-k * shortfall)
        return max(0.0, min(0.49, 0.5 - 0.5 * penalty))

    excess = effective - floor
    if excess <= 0:
        return _MEETS_MINIMUM_SIGNAL

    bonus = 1.0 - math.exp(-k * excess)
    return max(0.0, min(1.0, _MEETS_MINIMUM_SIGNAL + (1.0 - _MEETS_MINIMUM_SIGNAL) * bonus))


def soft_baths_normalized(
    preferences: dict[str, Any], property_dict: dict[str, Any], k: float
) -> float:
    min_bt = _optional_float_pref(preferences, "preferred_bathrooms_min")
    max_bt = _optional_float_pref(preferences, "preferred_bathrooms_max")
    if min_bt is None and max_bt is None:
        return 0.5

    floor = min_bt if min_bt is not None else 0.0
    bt = _listing_baths(property_dict)
    if bt is None:
        return 0.5

    effective = min(bt, max_bt) if max_bt is not None else bt
    if effective < floor:
        shortfall = floor - effective
        penalty = 1.0 - math.exp(-k * shortfall)
        return max(0.0, min(0.49, 0.5 - 0.5 * penalty))

    excess = effective - floor
    if excess <= 0:
        return _MEETS_MINIMUM_SIGNAL

    bonus = 1.0 - math.exp(-k * excess)
    return max(0.0, min(1.0, _MEETS_MINIMUM_SIGNAL + (1.0 - _MEETS_MINIMUM_SIGNAL) * bonus))


def listing_beds_value(property_dict: dict[str, Any]) -> float | None:
    return _listing_beds(property_dict)


def listing_baths_value(property_dict: dict[str, Any]) -> float | None:
    return _listing_baths(property_dict)
