"""Listing type post-filter for polygon search."""

from app.services.search.helpers.listing_type_match import (
    listing_type_prefs_are_owner_posted_only,
    property_matches_listing_type_prefs,
)
from logger import log

_POLY = "POLYGON_SEARCH"


def apply_listing_type_filter(
    all_properties: list,
    listing_type_prefs: list,
    request_id: str,
    log_fn,
    strict_preference_filter: bool,
) -> list:
    """Apply listing type filter."""
    if not isinstance(listing_type_prefs, list) or len(listing_type_prefs) == 0:
        return all_properties

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

    pre_listing_type = list(all_properties)
    all_properties = [
        p for p in all_properties if property_matches_listing_type_prefs(p, listing_type_prefs)
    ]
    dropped_all_listing_type = len(all_properties) == 0 and _before_lt > 0
    if (
        dropped_all_listing_type
        and not strict_preference_filter
        and listing_type_prefs_are_owner_posted_only(listing_type_prefs)
    ):
        log.info(
            _POLY,
            "polygon_search post_filter listing_type_skipped_owner_posted_no_fsbo_signal",
            {
                "request_id": request_id,
                "before": _before_lt,
                "listing_type_pref_count": len(listing_type_prefs),
                "empty_listing_status_count": empty_status,
                "status_histogram_top": top_statuses,
            },
        )
        all_properties = pre_listing_type
    log_fn(
        request_id,
        "listing_type",
        _before_lt,
        len(all_properties),
        {"listing_type_pref_count": len(listing_type_prefs)},
    )
    if dropped_all_listing_type and len(all_properties) == 0:
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
    return all_properties
