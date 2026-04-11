"""Soft fit for days on market vs user range (aligned with polygon post-filters)."""

from __future__ import annotations

from typing import Any


def _listing_dom(property_dict: dict[str, Any]) -> int | None:
    v = (
        property_dict.get("daysOnMarket")
        if property_dict.get("daysOnMarket") is not None
        else property_dict.get("dom")
    )
    if v is None:
        return None
    try:
        return int(float(v)) if isinstance(v, int | float | str) else None
    except (TypeError, ValueError):
        return None


def soft_days_on_market_normalized(
    preferences: dict[str, Any], property_dict: dict[str, Any]
) -> float:
    dom_min = preferences.get("days_on_market_min")
    dom_max = preferences.get("days_on_market_max")
    if dom_min is None and dom_max is None:
        return 0.5

    try:
        lo = int(dom_min) if dom_min is not None else None
    except (TypeError, ValueError):
        lo = None
    try:
        hi = int(dom_max) if dom_max is not None else None
    except (TypeError, ValueError):
        hi = None

    if lo is not None and hi is not None and hi < lo:
        lo, hi = hi, lo

    dom = _listing_dom(property_dict)
    if dom is None:
        return 0.5

    if lo is not None and hi is None:
        if dom < lo:
            return max(0.0, min(1.0, dom / max(lo, 1) * 0.45))
        return min(1.0, 0.5 + 0.5 * min(1.0, (dom - lo) / max(lo, 1)))

    if lo is None and hi is not None:
        if dom > hi:
            return max(0.15, min(1.0, hi / max(dom, 1)))
        mid = hi * 0.65
        return max(0.0, min(1.0, 1.0 - abs(dom - mid) / max(mid, 1)))

    assert lo is not None and hi is not None
    mid = (lo + hi) / 2.0
    half = (hi - lo) / 2.0
    if half < 1e-6:
        return 1.0 if abs(dom - mid) < 1e-6 else 0.5
    dist = abs(dom - mid)
    return max(0.0, min(1.0, 1.0 - dist / half))
