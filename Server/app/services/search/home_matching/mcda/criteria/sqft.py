"""Sqft soft fit when user provides min/max band."""

from __future__ import annotations

from typing import Any


def _parse_sqft(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, int | float):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.replace(",", "").strip())
        except (ValueError, TypeError):
            return None
    return None


def listing_sqft(property_dict: dict[str, Any]) -> float | None:
    return _parse_sqft(
        property_dict.get("sqft")
        or property_dict.get("livingArea")
        or property_dict.get("LivingArea")
        or property_dict.get("squareFootage")
        or property_dict.get("living_area")
    )


def soft_sqft_normalized(preferences: dict[str, Any], property_dict: dict[str, Any]) -> float:
    lo = preferences.get("preferred_sqft_min")
    hi = preferences.get("preferred_sqft_max")
    try:
        lo_f = float(lo) if lo is not None else None
    except (TypeError, ValueError):
        lo_f = None
    try:
        hi_f = float(hi) if hi is not None else None
    except (TypeError, ValueError):
        hi_f = None

    if lo_f is None and hi_f is None:
        return 0.5

    if lo_f is not None and hi_f is not None and hi_f < lo_f:
        lo_f, hi_f = hi_f, lo_f

    sq = listing_sqft(property_dict)
    if sq is None or sq <= 0:
        return 0.5

    if lo_f is not None and hi_f is None:
        if sq < lo_f:
            return max(0.0, min(1.0, sq / lo_f * 0.45))
        return min(1.0, 0.5 + 0.5 * min(1.0, (sq - lo_f) / max(lo_f, 1.0)))

    if lo_f is None and hi_f is not None:
        if sq > hi_f:
            return max(0.15, min(1.0, hi_f / max(sq, 1.0)))
        mid = hi_f * 0.65
        return max(0.0, min(1.0, 1.0 - abs(sq - mid) / max(mid, 1.0)))

    assert lo_f is not None and hi_f is not None
    mid = (lo_f + hi_f) / 2.0
    half = (hi_f - lo_f) / 2.0
    if half < 1e-6:
        return 1.0 if abs(sq - mid) < 1e-6 else 0.5

    dist = abs(sq - mid)
    return max(0.0, min(1.0, 1.0 - dist / half))
