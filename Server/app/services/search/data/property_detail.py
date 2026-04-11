"""Fetch a single property detail via Slipstream /ws/listings/get.

On success, the full parsed JSON body is logged at DEBUG (``LOG_CATEGORIES.API``).
Reference payload (anonymized): ``slipstream_response_reference.SLIPSTREAM_LISTINGS_GET_RESPONSE_EXAMPLE``.
"""

from __future__ import annotations

from typing import Any

from logger import LOG_CATEGORIES, log

from .client import slipstream_get
from .config import SLIPSTREAM_MARKET
from .normalizer import normalize_listing


def get_property_detail(
    listing_id: str | None = None,
    address: str | None = None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """Fetch property detail by MLS listing ID or address.

    Returns:
        (normalized_data, error_dict)
        On success error_dict is None; on failure normalized_data is None.
    """
    params: dict[str, Any] = {
        "market": SLIPSTREAM_MARKET,
        "details": "true",
    }

    if listing_id:
        params["id"] = listing_id
    elif address:
        params["address"] = address.strip()
    else:
        return None, {
            "success": False,
            "error": "MISSING_PARAM",
            "details": "Provide listing_id or address",
        }

    try:
        resp = slipstream_get("/ws/listings/get", params=params)

        if not resp.ok:
            return None, {
                "success": False,
                "error": "SLIPSTREAM_ERROR",
                "status_code": resp.status_code,
                "details": resp.text[:800],
            }

        body = resp.json() if resp.content else {}
        if not body.get("success"):
            return None, {
                "success": False,
                "error": "SLIPSTREAM_ERROR",
                "status_code": resp.status_code,
                "details": (body.get("error") or {}).get("message", "Unknown error"),
            }

        log.debug(
            LOG_CATEGORIES["API"],
            "Slipstream /ws/listings/get full response (property detail)",
            {
                "caller": "get_property_detail",
                "endpoint": "/ws/listings/get",
                "listing_id": listing_id,
                "address_query": address,
                "response": body,
            },
        )

        result = body.get("result") or {}
        listings = result.get("listings") or []
        if not listings:
            return None, {
                "success": False,
                "error": "NOT_FOUND",
                "details": f"No listing found for id={listing_id} address={address}",
            }

        raw = listings[0]
        return normalize_listing(raw), None

    except Exception as exc:
        return None, {
            "success": False,
            "error": "SLIPSTREAM_EXCEPTION",
            "details": str(exc)[:800],
        }
