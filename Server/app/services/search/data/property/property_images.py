"""Fetch property images via RapidAPI /images."""

from __future__ import annotations

from typing import Any

from logger import log

from ..client import rapidapi_get


def _extract_image_urls(payload: Any) -> list[str]:
    if not isinstance(payload, dict):
        return []

    out: list[str] = []
    for key in ("images", "photos", "imageList", "data"):
        items = payload.get(key)
        if not isinstance(items, list):
            continue
        for item in items:
            if isinstance(item, str) and item:
                out.append(item)
            elif isinstance(item, dict):
                for url_key in ("url", "src", "href", "link"):
                    val = item.get(url_key)
                    if isinstance(val, str) and val:
                        out.append(val)
                        break
        if out:
            break
    return out


def get_property_images(listing_id: str) -> list[str]:
    """Return image URLs for a zpid. Empty list on any error."""
    if not listing_id:
        return []

    try:
        resp = rapidapi_get("/images", params={"zpid": str(listing_id)})
        if not resp.ok:
            return []

        payload = resp.json() if resp.content else {}
        images = _extract_image_urls(payload)
        log.debug(
            "API",
            "RapidAPI /images response",
            {
                "caller": "get_property_images",
                "endpoint": "/images",
                "listing_id": listing_id,
                "image_count": len(images),
            },
        )
        return images
    except Exception:
        return []
