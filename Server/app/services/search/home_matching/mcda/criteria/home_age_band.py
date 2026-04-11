"""Soft fit for home age (years since year built) vs preferred_home_age_min/max."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services.search.helpers.home_age_preference_filter import home_age_years_for_property


def soft_home_age_normalized(preferences: dict[str, Any], property_dict: dict[str, Any]) -> float:
    amin = preferences.get("preferred_home_age_min")
    amax = preferences.get("preferred_home_age_max")
    if amin is None and amax is None:
        return 0.5

    try:
        lo = int(amin) if amin is not None else None
    except (TypeError, ValueError):
        lo = None
    try:
        hi = int(amax) if amax is not None else None
    except (TypeError, ValueError):
        hi = None

    if lo is not None and hi is not None and hi < lo:
        lo, hi = hi, lo

    cy = datetime.now(tz=timezone.utc).year
    age_y = home_age_years_for_property(property_dict, cy)
    if age_y is None:
        return 0.5

    if lo is not None and hi is None:
        if age_y < lo:
            return max(0.0, min(1.0, age_y / max(lo, 1) * 0.45))
        return min(1.0, 0.5 + 0.5 * min(1.0, (age_y - lo) / max(lo, 1)))

    if lo is None and hi is not None:
        if age_y > hi:
            return max(0.15, min(1.0, hi / max(age_y, 1)))
        mid = hi * 0.65
        return max(0.0, min(1.0, 1.0 - abs(age_y - mid) / max(mid, 1)))

    assert lo is not None and hi is not None
    mid = (lo + hi) / 2.0
    half = (hi - lo) / 2.0
    if half < 1e-6:
        return 1.0 if abs(age_y - mid) < 1e-6 else 0.5
    dist = abs(age_y - mid)
    return max(0.0, min(1.0, 1.0 - dist / half))
