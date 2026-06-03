"""Search active listings via Slipstream /ws/listings/search.

Each element of ``result.listings`` uses the same raw listing shape as in
``slipstream_response_reference.SLIPSTREAM_LISTINGS_GET_RESPONSE_EXAMPLE`` (when ``details=true``).
"""

from __future__ import annotations

import json
from typing import Any

from logger import log

from ..client import slipstream_get
from ..config import SLIPSTREAM_MARKET
from ..normalizer import normalize_listings


def search_active_listings(
    polygon_geojson: dict | None = None,
    filters: dict[str, Any] | None = None,
    page_number: int = 1,
    page_size: int = 200,
) -> tuple[list[dict], dict, list[dict]]:
    """Search active listings with optional polygon and filters.

    Returns:
        (normalized_listings, paging_info, errors)
    """
    params: dict[str, Any] = {
        "market": SLIPSTREAM_MARKET,
        "pageNumber": page_number,
        "pageSize": page_size,
        "details": "true",
    }

    if polygon_geojson:
        params["polygon"] = json.dumps(polygon_geojson)

    if filters:
        params.update(filters)

    errors: list[dict] = []
    try:
        resp = slipstream_get("/ws/listings/search", params=params)

        if not resp.ok:
            errors.append(
                {
                    "status": resp.status_code,
                    "text": resp.text[:500],
                }
            )
            return [], {}, errors

        body = resp.json() if resp.content else {}
        if not body.get("success"):
            errors.append(
                {
                    "status": resp.status_code,
                    "text": (body.get("error") or {}).get("message", "Unknown error"),
                }
            )
            return [], {}, errors

        result = body.get("result") or {}
        raw_listings = result.get("listings") or []
        paging = result.get("paging") or {}

        log.debug(
            "API",
            "Slipstream /ws/listings/search response (active, first home only)",
            {
                "caller": "search_active_listings",
                "endpoint": "/ws/listings/search",
                "total_listings": len(raw_listings),
                "paging": paging,
                "first_listing": raw_listings[0] if raw_listings else None,
            },
        )

        return normalize_listings(raw_listings), paging, errors

    except Exception as exc:
        errors.append({"error": str(exc)[:500]})
        return [], {}, errors
