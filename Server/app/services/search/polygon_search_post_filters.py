"""Apply user-preference post-filters to polygon search property lists."""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime, timezone

from app.services.search.helpers.home_age_preference_filter import (
    home_age_years_for_property,
    property_kept_for_home_age_range,
)
from app.services.search.helpers.listing_type_match import property_matches_listing_type_prefs
from logger import LOG_CATEGORIES, log

_POLY = LOG_CATEGORIES["POLYGON_SEARCH"]


def _log_polygon_post_filter(
    request_id: str, step: str, before: int, after: int, extra: dict | None = None
) -> None:
    payload: dict = {"request_id": request_id, "step": step, "before": before, "after": after}
    if extra:
        payload.update(extra)
    log.info(_POLY, "polygon_search post_filter", payload)


def apply_polygon_search_post_filters(
    all_properties: list,
    user_preferences: dict,
    request_id: str,
    *,
    agent_debug_log: Callable[..., None],
) -> list:
    # Post-filter by max beds/baths
    beds_max = user_preferences.get("preferred_bedrooms_max")
    baths_max = user_preferences.get("preferred_bathrooms_max")
    if beds_max is not None or baths_max is not None:

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

        _before_bb = len(all_properties)
        if _before_bb > 0:
            miss_beds = sum(1 for p in all_properties if _get_beds(p) is None)
            miss_baths = sum(1 for p in all_properties if _get_baths(p) is None)
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
            miss_beds = miss_baths = over_bed = over_bath = 0

        all_properties = [
            p
            for p in all_properties
            if (beds_max is None or (_get_beds(p) is not None and _get_beds(p) <= beds_max))
            and (baths_max is None or (_get_baths(p) is not None and _get_baths(p) <= baths_max))
        ]
        _log_polygon_post_filter(
            request_id,
            "beds_baths",
            _before_bb,
            len(all_properties),
            {"beds_max": beds_max, "baths_max": baths_max},
        )
        if len(all_properties) == 0 and _before_bb > 0:
            log.warn(
                _POLY,
                "polygon_search post_filter dropped all (beds_baths)",
                {
                    "request_id": request_id,
                    "before": _before_bb,
                    "beds_max": beds_max,
                    "baths_max": baths_max,
                    "missing_beds": miss_beds,
                    "missing_baths": miss_baths,
                    "over_bed_max": over_bed,
                    "over_bath_max": over_bath,
                },
            )

    # Post-filter by sqft range
    sqft_min = user_preferences.get("preferred_sqft_min")
    sqft_max = user_preferences.get("preferred_sqft_max")
    if sqft_min is not None or sqft_max is not None:

        def _get_sqft(prop):
            v = prop.get("livingArea") if prop.get("livingArea") is not None else prop.get("sqft")
            if v is None:
                return None
            try:
                return int(float(v)) if isinstance(v, int | float | str) else None
            except (TypeError, ValueError):
                return None

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
        _log_polygon_post_filter(
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

    # Post-filter by days on market range (min <= dom <= max)
    dom_min = user_preferences.get("days_on_market_min")
    dom_max = user_preferences.get("days_on_market_max")
    if dom_min is not None or dom_max is not None:

        def _get_dom(prop):
            v = (
                prop.get("daysOnMarket")
                if prop.get("daysOnMarket") is not None
                else prop.get("dom")
            )
            if v is None:
                return None
            try:
                return int(float(v)) if isinstance(v, int | float | str) else None
            except (TypeError, ValueError):
                return None

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
        _log_polygon_post_filter(
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

    # Post-filter by lot size range (acres: preferred_lot_size_min <= acres <= preferred_lot_size_max)
    lot_min = user_preferences.get("preferred_lot_size_min")
    lot_max = user_preferences.get("preferred_lot_size_max")
    if lot_min is not None or lot_max is not None:

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
        _log_polygon_post_filter(
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

    # Post-filter by home age (years since build; keep listings with missing year built)
    age_min = user_preferences.get("preferred_home_age_min")
    age_max = user_preferences.get("preferred_home_age_max")
    if age_min is not None or age_max is not None:
        current_year = datetime.now(tz=timezone.utc).year

        _before_age = len(all_properties)
        if _before_age > 0:

            def _age_out_of_range(p):
                return not property_kept_for_home_age_range(
                    p,
                    age_min=age_min,
                    age_max=age_max,
                    current_year=current_year,
                )

            miss_age = sum(
                1 for p in all_properties if home_age_years_for_property(p, current_year) is None
            )
            out_age = sum(1 for p in all_properties if _age_out_of_range(p))
        else:
            miss_age = out_age = 0

        all_properties = [
            p
            for p in all_properties
            if property_kept_for_home_age_range(
                p,
                age_min=age_min,
                age_max=age_max,
                current_year=current_year,
            )
        ]
        _log_polygon_post_filter(
            request_id,
            "home_age",
            _before_age,
            len(all_properties),
            {"age_min": age_min, "age_max": age_max},
        )
        if len(all_properties) == 0 and _before_age > 0:
            log.warn(
                _POLY,
                "polygon_search post_filter dropped all (home_age)",
                {
                    "request_id": request_id,
                    "before": _before_age,
                    "age_min": age_min,
                    "age_max": age_max,
                    "missing_year_built": miss_age,
                    "out_of_range_age": out_age,
                },
            )

    # Post-filter by listing type
    listing_type_prefs = user_preferences.get("listing_type")
    if isinstance(listing_type_prefs, list) and len(listing_type_prefs) > 0:
        _before_lt = len(all_properties)
        empty_status = 0
        if _before_lt > 0:
            statuses: dict[str, int] = {}
            for p in all_properties:
                st = p.get("listingStatus") or p.get("listing_status") or ""
                if not st:
                    empty_status += 1
                else:
                    key = str(st).lower()[:48]
                    statuses[key] = statuses.get(key, 0) + 1
            top_statuses = sorted(statuses.items(), key=lambda x: -x[1])[:6]
        else:
            top_statuses = []

        all_properties = [
            p for p in all_properties if property_matches_listing_type_prefs(p, listing_type_prefs)
        ]
        _log_polygon_post_filter(
            request_id,
            "listing_type",
            _before_lt,
            len(all_properties),
            {"listing_type_pref_count": len(listing_type_prefs)},
        )
        if len(all_properties) == 0 and _before_lt > 0:
            log.warn(
                _POLY,
                "polygon_search post_filter dropped all (listing_type)",
                {
                    "request_id": request_id,
                    "before": _before_lt,
                    "listing_type_pref_count": len(listing_type_prefs),
                    "empty_listing_status_count": empty_status,
                    "status_histogram_top": top_statuses,
                },
            )

    agent_debug_log(
        "after_post_filters_before_scoring",
        {"request_id": request_id, "count": len(all_properties)},
        "A",
    )

    # Post-filter by must-have features
    must_have = user_preferences.get("must_have")
    if isinstance(must_have, list) and len(must_have) > 0:

        def _has_any_must_have(prop):
            facts = prop.get("homeFacts") or prop.get("features") or prop.get("resoFacts") or {}
            if isinstance(facts, dict):
                facts_str = " ".join(str(v).lower() for v in facts.values() if v)
            elif isinstance(facts, list):
                facts_str = " ".join(str(x).lower() for x in facts)
            else:
                facts_str = str(facts).lower()
            if not facts_str.strip():
                return True
            for need in must_have:
                need_lower = str(need).lower().replace("_", " ").replace("-", " ")
                if need_lower in facts_str or need_lower.replace(" ", "") in facts_str.replace(
                    " ", ""
                ):
                    return True
            return False

        _before_mh = len(all_properties)
        empty_facts = 0
        if _before_mh > 0:
            for p in all_properties:
                facts = p.get("homeFacts") or p.get("features") or p.get("resoFacts") or {}
                if isinstance(facts, dict):
                    fs = " ".join(str(v).lower() for v in facts.values() if v)
                elif isinstance(facts, list):
                    fs = " ".join(str(x).lower() for x in facts)
                else:
                    fs = str(facts).lower()
                if not fs.strip():
                    empty_facts += 1

        all_properties = [p for p in all_properties if _has_any_must_have(p)]
        _log_polygon_post_filter(
            request_id,
            "must_have",
            _before_mh,
            len(all_properties),
            {"must_have_count": len(must_have)},
        )
        if len(all_properties) == 0 and _before_mh > 0:
            log.warn(
                _POLY,
                "polygon_search post_filter dropped all (must_have)",
                {
                    "request_id": request_id,
                    "before": _before_mh,
                    "must_have_count": len(must_have),
                    "props_with_empty_facts": empty_facts,
                },
            )

    agent_debug_log(
        "after_must_have_filter",
        {"request_id": request_id, "count": len(all_properties)},
        "A",
    )
    return all_properties
