"""Fetch comparable properties using Slipstream geographic proximity search.

Slipstream does not have a dedicated comps endpoint.  We approximate comps by:
1. Looking up the subject property to get its coordinates and attributes.
2. Searching inactive (sold) listings within a small radius, filtered to similar
   beds/baths/propertyType.

Subject property detail uses the same listing object as
``slipstream_response_reference.SLIPSTREAM_LISTINGS_GET_RESPONSE_EXAMPLE`` (see
``get_property_detail`` debug logs for a full ``/ws/listings/get`` body).
"""

from __future__ import annotations

from typing import Any

from logger import LOG_CATEGORIES, log

from .client import slipstream_get
from .config import SLIPSTREAM_MARKET
from .normalizer import normalize_listings
from .property_detail import get_property_detail


def get_property_comps(
    listing_id: str | None = None,
    address: str | None = None,
    radius_miles: float = 1.0,
    limit: int = 10,
) -> tuple[list[dict[str, Any]], dict[str, Any] | None]:
    """Return comparable (recently sold) properties near the subject.

    Returns:
        (normalized_comps_list, error_dict)
    """
    subject, err = get_property_detail(listing_id=listing_id, address=address)
    if err or not subject:
        return [], err

    lat = subject.get("latitude")
    lon = subject.get("longitude")
    if not lat or not lon:
        return [], {
            "success": False,
            "error": "NO_COORDINATES",
            "details": "Subject property has no coordinates for proximity search",
        }

    circle_param = f"{lat},{lon},{radius_miles}"

    params: dict[str, Any] = {
        "market": SLIPSTREAM_MARKET,
        "circle": circle_param,
        "limit": limit,
        "details": "true",
        "sortField": "salePrice",
        "sortOrder": "desc",
    }

    beds = subject.get("bedrooms")
    if beds is not None:
        bed_min = max(1, int(beds) - 1)
        bed_max = int(beds) + 1
        params["beds"] = f"{bed_min}:{bed_max}"

    prop_type = subject.get("propertyType")
    if prop_type:
        params["propertyType"] = prop_type

    try:
        resp = slipstream_get("/ws/listings/inactive/search", params=params)
        if not resp.ok:
            return [], {
                "success": False,
                "error": "SLIPSTREAM_ERROR",
                "status_code": resp.status_code,
                "details": resp.text[:500],
            }

        body = resp.json() if resp.content else {}
        if not body.get("success"):
            return [], {
                "success": False,
                "error": "SLIPSTREAM_ERROR",
                "details": (body.get("error") or {}).get("message", "Unknown error"),
            }

        raw_listings = (body.get("result") or {}).get("listings") or []

        log.debug(
            LOG_CATEGORIES["API"],
            "Slipstream /ws/listings/inactive/search full response (property comps)",
            {
                "caller": "get_property_comps",
                "endpoint": "/ws/listings/inactive/search",
                "subject_listing_id": listing_id,
                "subject_address": address,
                "radius_miles": radius_miles,
                "total_comps": len(raw_listings),
                "response": body,
            },
        )

        normalized = normalize_listings(raw_listings)

        subject_id = subject.get("zpid")
        if subject_id:
            normalized = [c for c in normalized if c.get("zpid") != subject_id]

        return normalized, None

    except Exception as exc:
        return [], {
            "success": False,
            "error": "SLIPSTREAM_EXCEPTION",
            "details": str(exc)[:500],
        }
