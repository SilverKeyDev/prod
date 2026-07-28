"""Fetch comparable properties via RapidAPI /propertyComps."""

from __future__ import annotations

from typing import Any

from logger import log

from ..client import rapidapi_get
from ..normalizer import normalize_listings


def _extract_comps_list(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [p for p in payload if isinstance(p, dict)]
    if isinstance(payload, dict):
        for key in ("data", "comps", "comparables", "props"):
            maybe = payload.get(key)
            if isinstance(maybe, list):
                return [p for p in maybe if isinstance(p, dict)]
    return []


def get_property_comps(
    listing_id: str | None = None,
    address: str | None = None,
    radius_miles: float = 1.0,  # kept for call-site compatibility
    limit: int = 10,
) -> tuple[list[dict[str, Any]], dict[str, Any] | None]:
    """Return comps from RapidAPI. Signature kept for existing callers."""
    _ = radius_miles  # unused for RapidAPI direct comps endpoint

    lid = str(listing_id).strip() if listing_id else None
    addr = str(address).strip() if address else None
    if not lid and not addr:
        return [], {
            "success": False,
            "error": "MISSING_PARAM",
            "details": "Provide listing_id or address",
        }

    params: dict[str, Any] = {}
    if addr:
        params["address"] = addr
    else:
        params["zpid"] = lid

    try:
        resp = rapidapi_get("/propertyComps", params=params)
        if not resp.ok:
            return [], {
                "success": False,
                "error": "RAPIDAPI_ERROR",
                "status_code": resp.status_code,
                "details": resp.text[:500],
            }

        payload = resp.json() if resp.content else []
        comps = normalize_listings(_extract_comps_list(payload))

        if lid:
            comps = [c for c in comps if str(c.get("zpid") or "") != lid]

        log.debug(
            "API",
            "RapidAPI /propertyComps response",
            {
                "caller": "get_property_comps",
                "endpoint": "/propertyComps",
                "listing_id": lid,
                "address": addr,
                "total_comps": len(comps),
            },
        )
        return comps[:limit], None

    except Exception as exc:
        return [], {
            "success": False,
            "error": "RAPIDAPI_EXCEPTION",
            "details": str(exc)[:500],
        }
