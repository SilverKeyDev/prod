"""Fetch property images via Slipstream /ws/listings/get with details=true.

Slipstream embeds images in the listing detail response as an ``images`` array
of URL strings.  There is no separate images endpoint.

Full single-home JSON envelope: ``slipstream_response_reference.SLIPSTREAM_LISTINGS_GET_RESPONSE_EXAMPLE``.
"""

from __future__ import annotations

from typing import Any

from logger import LOG_CATEGORIES, log

from .client import slipstream_get
from .config import SLIPSTREAM_MARKET


def get_property_images(listing_id: str) -> list[str]:
    """Return image URLs for a listing.

    Falls back to an empty list on any error so callers can always iterate.
    """
    if not listing_id:
        return []

    try:
        params: dict[str, Any] = {
            "market": SLIPSTREAM_MARKET,
            "id": listing_id,
            "details": "true",
        }
        resp = slipstream_get("/ws/listings/get", params=params)
        if not resp.ok:
            return []

        body = resp.json() if resp.content else {}
        if not body.get("success"):
            return []

        listings = (body.get("result") or {}).get("listings") or []

        log.debug(
            LOG_CATEGORIES["API"],
            "Slipstream /ws/listings/get full response (property images)",
            {
                "caller": "get_property_images",
                "endpoint": "/ws/listings/get",
                "listing_id": listing_id,
                "response": body,
            },
        )

        if not listings:
            return []

        raw = listings[0]
        images = raw.get("images") or []
        return [img for img in images if isinstance(img, str)]

    except Exception:
        return []
