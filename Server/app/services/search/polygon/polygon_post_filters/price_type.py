"""Price and home type post-filters for polygon search."""

from __future__ import annotations

from typing import Any

from app.services.search.home_matching.mcda.criteria.property_type import (
    listing_matches_preferred_housing_type,
)
from logger import LOG_CATEGORIES, log

_POLY = LOG_CATEGORIES["POLYGON_SEARCH"]


def _as_float(raw: Any) -> float | None:
    if raw is None or raw == "":
        return None
    try:
        if isinstance(raw, str):
            raw = raw.replace("$", "").replace(",", "").strip()
        return float(raw)
    except (TypeError, ValueError):
        return None


def _get_price(prop: dict[str, Any]) -> float | None:
    return _as_float(prop.get("price") if prop.get("price") is not None else prop.get("listPrice"))


def apply_price_filter(
    all_properties: list,
    price_min: int | float | None,
    price_max: int | float | None,
    request_id: str,
    log_fn,
) -> list:
    """Apply budget range filter; unknown prices are kept."""
    min_v = _as_float(price_min)
    max_v = _as_float(price_max)
    if min_v is None and max_v is None:
        return all_properties

    before = len(all_properties)
    missing_price = sum(1 for p in all_properties if _get_price(p) is None)

    def _price_ok(prop: dict[str, Any]) -> bool:
        price = _get_price(prop)
        if price is None:
            return True
        if min_v is not None and price < min_v:
            return False
        if max_v is not None and price > max_v:
            return False
        return True

    filtered = [p for p in all_properties if _price_ok(p)]
    log_fn(
        request_id,
        "price",
        before,
        len(filtered),
        {"price_min": min_v, "price_max": max_v},
    )
    if len(filtered) == 0 and before > 0:
        log.warn(
            _POLY,
            "polygon_search post_filter dropped all (price)",
            {
                "request_id": request_id,
                "before": before,
                "price_min": min_v,
                "price_max": max_v,
                "missing_price": missing_price,
            },
        )
    return filtered


def apply_property_type_filter(
    all_properties: list,
    preferred_housing_type: Any,
    housing_type: Any,
    request_id: str,
    log_fn,
    status_type: str = "ForSale",
) -> list:
    """Apply multi-value home type filter; unknown listing types are kept."""
    raw_pref = preferred_housing_type or housing_type
    if raw_pref is None or not str(raw_pref).strip():
        return all_properties

    prefs = {"preferred_housing_type": raw_pref}
    before = len(all_properties)
    unknown_type = 0

    def _type_ok(prop: dict[str, Any]) -> bool:
        nonlocal unknown_type
        match = listing_matches_preferred_housing_type(prefs, prop, status_type)
        if match is None:
            unknown_type += 1
            return True
        return match

    filtered = [p for p in all_properties if _type_ok(p)]
    log_fn(
        request_id,
        "property_type",
        before,
        len(filtered),
        {"preferred_housing_type": str(raw_pref)[:120]},
    )
    if len(filtered) == 0 and before > 0:
        log.warn(
            _POLY,
            "polygon_search post_filter dropped all (property_type)",
            {
                "request_id": request_id,
                "before": before,
                "preferred_housing_type": str(raw_pref)[:120],
                "unknown_type": unknown_type,
            },
        )
    return filtered
