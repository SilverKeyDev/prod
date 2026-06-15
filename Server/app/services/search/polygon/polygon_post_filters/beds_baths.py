"""Beds and baths post-filter for polygon search."""

from logger import log

_POLY = "POLYGON_SEARCH"


def _get_beds(p):
    v = p.get("bedrooms") if p.get("bedrooms") is not None else p.get("beds")
    if v is None:
        return None
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def _get_baths(p):
    v = p.get("bathrooms") if p.get("bathrooms") is not None else p.get("baths")
    if v is None:
        return None
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def apply_beds_baths_filter(
    all_properties: list,
    beds_min: int | None,
    beds_max: int | None,
    baths_min: int | None,
    baths_max: int | None,
    request_id: str,
    log_fn,
) -> list:
    """Apply beds and baths range filter (min/max); unknown counts are kept."""
    if beds_min is None and beds_max is None and baths_min is None and baths_max is None:
        return all_properties

    _before_bb = len(all_properties)
    if _before_bb > 0:
        miss_beds = sum(1 for p in all_properties if _get_beds(p) is None)
        miss_baths = sum(1 for p in all_properties if _get_baths(p) is None)
        under_bed = sum(
            1
            for p in all_properties
            if beds_min is not None and _get_beds(p) is not None and _get_beds(p) < beds_min
        )
        under_bath = sum(
            1
            for p in all_properties
            if baths_min is not None and _get_baths(p) is not None and _get_baths(p) < baths_min
        )
        over_bed = sum(
            1
            for p in all_properties
            if beds_max is not None and _get_beds(p) is not None and _get_beds(p) > beds_max
        )
        over_bath = sum(
            1
            for p in all_properties
            if baths_max is not None and _get_baths(p) is not None and _get_baths(p) > baths_max
        )
    else:
        miss_beds = miss_baths = under_bed = under_bath = over_bed = over_bath = 0

    def _beds_ok(p) -> bool:
        b = _get_beds(p)
        if b is None:
            return True
        if beds_min is not None and b < beds_min:
            return False
        if beds_max is not None and b > beds_max:
            return False
        return True

    def _baths_ok(p) -> bool:
        b = _get_baths(p)
        if b is None:
            return True
        if baths_min is not None and b < baths_min:
            return False
        if baths_max is not None and b > baths_max:
            return False
        return True

    all_properties = [p for p in all_properties if _beds_ok(p) and _baths_ok(p)]
    log_fn(
        request_id,
        "beds_baths",
        _before_bb,
        len(all_properties),
        {
            "beds_min": beds_min,
            "beds_max": beds_max,
            "baths_min": baths_min,
            "baths_max": baths_max,
        },
    )
    if len(all_properties) == 0 and _before_bb > 0:
        log.warn(
            _POLY,
            "polygon_search post_filter dropped all (beds_baths)",
            {
                "request_id": request_id,
                "before": _before_bb,
                "beds_min": beds_min,
                "beds_max": beds_max,
                "baths_min": baths_min,
                "baths_max": baths_max,
                "missing_beds": miss_beds,
                "missing_baths": miss_baths,
                "under_bed_min": under_bed,
                "under_bath_min": under_bath,
                "over_bed_max": over_bed,
                "over_bath_max": over_bath,
            },
        )
    return all_properties
