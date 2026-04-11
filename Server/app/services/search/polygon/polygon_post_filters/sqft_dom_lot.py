"""Square footage, days on market, and lot size post-filters for polygon search."""

from logger import LOG_CATEGORIES, log

_POLY = LOG_CATEGORIES["POLYGON_SEARCH"]


def _get_sqft(prop):
    v = prop.get("livingArea") if prop.get("livingArea") is not None else prop.get("sqft")
    if v is None:
        return None
    try:
        return int(float(v)) if isinstance(v, int | float | str) else None
    except (TypeError, ValueError):
        return None


def apply_sqft_filter(
    all_properties: list,
    sqft_min: int | None,
    sqft_max: int | None,
    request_id: str,
    log_fn,
) -> list:
    """Apply square footage range filter."""
    if sqft_min is None and sqft_max is None:
        return all_properties

    _before_sq = len(all_properties)
    if _before_sq > 0:

        def _sqft_out_of_range(p):
            s = _get_sqft(p)
            if s is None:
                return False
            if sqft_min is not None and s < sqft_min:
                return True
            if sqft_max is not None and s > sqft_max:
                return True
            return False

        miss_sq = sum(1 for p in all_properties if _get_sqft(p) is None)
        out_sq = sum(1 for p in all_properties if _sqft_out_of_range(p))
    else:
        miss_sq = out_sq = 0

    all_properties = [
        p
        for p in all_properties
        if (
            _get_sqft(p) is None
            or (
                (sqft_min is None or _get_sqft(p) >= sqft_min)
                and (sqft_max is None or _get_sqft(p) <= sqft_max)
            )
        )
    ]
    log_fn(
        request_id,
        "sqft",
        _before_sq,
        len(all_properties),
        {"sqft_min": sqft_min, "sqft_max": sqft_max},
    )
    if len(all_properties) == 0 and _before_sq > 0:
        log.warn(
            _POLY,
            "polygon_search post_filter dropped all (sqft)",
            {
                "request_id": request_id,
                "before": _before_sq,
                "sqft_min": sqft_min,
                "sqft_max": sqft_max,
                "missing_sqft": miss_sq,
                "out_of_range_sqft": out_sq,
            },
        )
    return all_properties


def _get_dom(prop):
    v = prop.get("daysOnMarket") if prop.get("daysOnMarket") is not None else prop.get("dom")
    if v is None:
        return None
    try:
        return int(float(v)) if isinstance(v, int | float | str) else None
    except (TypeError, ValueError):
        return None


def apply_dom_filter(
    all_properties: list,
    dom_min: int | None,
    dom_max: int | None,
    request_id: str,
    log_fn,
) -> list:
    """Apply days on market range filter."""
    if dom_min is None and dom_max is None:
        return all_properties

    _before_dom = len(all_properties)
    if _before_dom > 0:

        def _dom_out_of_range(p):
            d = _get_dom(p)
            if d is None:
                return False
            if dom_min is not None and d < dom_min:
                return True
            if dom_max is not None and d > dom_max:
                return True
            return False

        miss_dom = sum(1 for p in all_properties if _get_dom(p) is None)
        out_dom = sum(1 for p in all_properties if _dom_out_of_range(p))
    else:
        miss_dom = out_dom = 0

    all_properties = [
        p
        for p in all_properties
        if (
            _get_dom(p) is None
            or (
                (dom_min is None or _get_dom(p) >= dom_min)
                and (dom_max is None or _get_dom(p) <= dom_max)
            )
        )
    ]
    log_fn(
        request_id,
        "days_on_market",
        _before_dom,
        len(all_properties),
        {"dom_min": dom_min, "dom_max": dom_max},
    )
    if len(all_properties) == 0 and _before_dom > 0:
        log.warn(
            _POLY,
            "polygon_search post_filter dropped all (days_on_market)",
            {
                "request_id": request_id,
                "before": _before_dom,
                "dom_min": dom_min,
                "dom_max": dom_max,
                "missing_dom": miss_dom,
                "out_of_range_dom": out_dom,
            },
        )
    return all_properties


def _get_lot_acres(prop):
    raw = prop.get("lotAreaValue") or prop.get("lotSize") or prop.get("lot_size")
    if raw is None or raw == "":
        return None
    unit = str(prop.get("lotAreaUnit") or "").lower()
    try:
        val = float(raw)
    except (TypeError, ValueError):
        return None
    if "acre" in unit:
        return val
    return val / 43560.0


def apply_lot_size_filter(
    all_properties: list,
    lot_min: float | None,
    lot_max: float | None,
    request_id: str,
    log_fn,
) -> list:
    """Apply lot size range filter (acres)."""
    if lot_min is None and lot_max is None:
        return all_properties

    _before_lot = len(all_properties)
    if _before_lot > 0:

        def _lot_out_of_range(p):
            a = _get_lot_acres(p)
            if a is None:
                return False
            if lot_min is not None and a < lot_min:
                return True
            if lot_max is not None and a > lot_max:
                return True
            return False

        miss_lot = sum(1 for p in all_properties if _get_lot_acres(p) is None)
        out_lot = sum(1 for p in all_properties if _lot_out_of_range(p))
    else:
        miss_lot = out_lot = 0

    all_properties = [
        p
        for p in all_properties
        if (
            _get_lot_acres(p) is None
            or (
                (lot_min is None or _get_lot_acres(p) >= lot_min)
                and (lot_max is None or _get_lot_acres(p) <= lot_max)
            )
        )
    ]
    log_fn(
        request_id,
        "lot_size",
        _before_lot,
        len(all_properties),
        {"lot_min": lot_min, "lot_max": lot_max},
    )
    if len(all_properties) == 0 and _before_lot > 0:
        log.warn(
            _POLY,
            "polygon_search post_filter dropped all (lot_size)",
            {
                "request_id": request_id,
                "before": _before_lot,
                "lot_min": lot_min,
                "lot_max": lot_max,
                "missing_lot_acres": miss_lot,
                "out_of_range_lot": out_lot,
            },
        )
    return all_properties
