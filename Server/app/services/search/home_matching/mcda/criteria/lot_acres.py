"""Soft fit for lot size (acres) vs preferred_lot_size_min/max (aligned with polygon post-filters)."""

from __future__ import annotations

from typing import Any


def _listing_lot_acres(property_dict: dict[str, Any]) -> float | None:
    raw = (
        property_dict.get("lotAreaValue")
        or property_dict.get("lotSize")
        or property_dict.get("lot_size")
    )
    if raw is None or raw == "":
        return None
    unit = str(property_dict.get("lotAreaUnit") or "").lower()
    try:
        val = float(raw)
    except (TypeError, ValueError):
        return None
    if "acre" in unit:
        return val
    return val / 43560.0


def soft_lot_acres_normalized(preferences: dict[str, Any], property_dict: dict[str, Any]) -> float:
    lo = preferences.get("preferred_lot_size_min")
    hi = preferences.get("preferred_lot_size_max")
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

    acres = _listing_lot_acres(property_dict)
    if acres is None or acres < 0:
        return 0.5

    if lo_f is not None and hi_f is None:
        if acres < lo_f:
            return max(0.0, min(1.0, acres / max(lo_f, 1e-6) * 0.45))
        return min(1.0, 0.5 + 0.5 * min(1.0, (acres - lo_f) / max(lo_f, 1e-6)))

    if lo_f is None and hi_f is not None:
        if acres > hi_f:
            return max(0.15, min(1.0, hi_f / max(acres, 1e-6)))
        mid = hi_f * 0.65
        return max(0.0, min(1.0, 1.0 - abs(acres - mid) / max(mid, 1e-6)))

    assert lo_f is not None and hi_f is not None
    mid = (lo_f + hi_f) / 2.0
    half = (hi_f - lo_f) / 2.0
    if half < 1e-6:
        return 1.0 if abs(acres - mid) < 1e-6 else 0.5
    dist = abs(acres - mid)
    return max(0.0, min(1.0, 1.0 - dist / half))
