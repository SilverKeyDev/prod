"""Property research cache and fetch helpers.

Fast-path cache checks use shared PropertyCache (cross-user).
"""

import time
import traceback
import uuid
from typing import Any

from app.services.property_cache import get_property_by_zpid_or_address
from app.services.search.data import get_property_detail
from logger import log

from .property_cache import (
    find_cached_property,
    get_cached_data,
    get_cached_details,
)


def check_cache_fast_path(
    params: dict[str, Any],
    address: str | None,
    start_time: float,
    log_prefix: str = "[PROPERTY]",
    remove_pros_cons: bool = False,
    analysis_cache_signature: str | None = None,
) -> tuple[dict[str, Any], int] | None:
    """Check shared PropertyCache. Returns (cached_response, status_code) on hit, None otherwise."""
    try:
        zpid_param = params.get("zpid") if isinstance(params, dict) else None

        cached_property = find_cached_property(zpid=zpid_param, address=address)

        if cached_property:
            cached_response = get_cached_data(
                cached_property,
                params,
                analysis_cache_signature=analysis_cache_signature,
            )
            if cached_response:
                if remove_pros_cons:
                    pa = cached_response.get("property_analysis")
                    if pa and isinstance(pa, dict):
                        cached_response["property_analysis"] = {
                            k: v
                            for k, v in pa.items()
                            if k not in ["pros", "cons", "neighborhood_overview", "neighborhood"]
                        }

                elapsed = time.time() - start_time
                log.info(
                    "PROPERTY_DETAILS",
                    "Returning cached data",
                    {
                        "log_prefix": log_prefix,
                        "elapsed_ms": round(elapsed * 1000, 2),
                        "zpid": cached_property.zpid,
                    },
                )
                return (cached_response, 200)
    except Exception as cache_err:
        log.warn(
            "PROPERTY_DETAILS",
            "Cache fast-path failed, proceeding to fetch",
            {"log_prefix": log_prefix, "error": str(cache_err)},
        )
    return None


def fetch_property_detail_for_research(
    params: dict[str, Any],
) -> tuple[dict[str, Any] | None, tuple[dict[str, Any], int] | None]:
    """Fetch property data from Slipstream for research flows."""
    listing_id = params.get("zpid") or params.get("id")
    address = params.get("address")

    data, err = get_property_detail(
        listing_id=str(listing_id) if listing_id else None,
        address=address,
    )
    if err:
        error_id = str(uuid.uuid4())
        status_code = err.get("status_code", 500)
        log.error(
            "PROPERTY_DETAILS",
            "fetch_property_detail_for_research failed",
            {
                "error_id": error_id,
                "status": status_code,
                "listing_id": listing_id,
                "address": address,
                "err": err,
                "traceback": traceback.format_exc(),
            },
        )
        err["error_id"] = error_id
        return None, (err, status_code)

    return data, None


def get_cached_details_with_pros_cons_removal(
    params: dict[str, Any],
    address: str | None,
    log_prefix: str = "[PROPERTY]",
    remove_pros_cons: bool = False,
    analysis_cache_signature: str | None = None,
) -> tuple[dict | None, dict | None, dict | None]:
    """Get cached details (commute_data, property_analysis, features) from shared cache."""
    cached_commute_data = None
    cached_property_analysis = None
    cached_features = None

    try:
        zpid_param = params.get("zpid") if isinstance(params, dict) else None
        cached_record = find_cached_property(zpid=zpid_param, address=address)

        if cached_record:
            cached_commute_data, cached_property_analysis, cached_features = get_cached_details(
                cached_record, analysis_cache_signature=analysis_cache_signature
            )

            if (
                remove_pros_cons
                and cached_property_analysis
                and isinstance(cached_property_analysis, dict)
            ):
                cached_property_analysis = {
                    k: v
                    for k, v in cached_property_analysis.items()
                    if k not in ["pros", "cons", "neighborhood_overview", "neighborhood"]
                }
    except Exception as cache_check_err:
        log.debug(
            "PROPERTY_DETAILS",
            "Error checking cache for commute/analysis",
            {"log_prefix": log_prefix, "error": str(cache_check_err)},
        )

    return cached_commute_data, cached_property_analysis, cached_features


def get_recent_property_analysis_sections(
    user_id: str, address: str | None, zpid: str | None, days_back: int = 14
) -> dict[str, dict[str, Any]]:
    """Get property analysis sections generated in the last N days from shared cache."""
    from datetime import datetime, timedelta, timezone

    from app.services.property_cache.section_cache import get_cached_sections

    try:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_back)

        shared_prop = get_property_by_zpid_or_address(zpid=zpid, address=address)
        if shared_prop:
            sections_rows = get_cached_sections(shared_prop.id)
            result: dict[str, dict[str, Any]] = {}
            for s in sections_rows:
                if s.generated_at and s.generated_at >= cutoff_date and s.data:
                    result[s.section_name] = {
                        "data": s.data,
                        "generated_at": s.generated_at.isoformat() if s.generated_at else None,
                        "is_recent": True,
                    }
            if result:
                return result

        return {}

    except Exception as e:
        log.warn(
            "PROPERTY_DETAILS",
            "Error checking recent analysis sections",
            {"error": str(e)},
        )
        return {}
