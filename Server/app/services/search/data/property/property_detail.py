"""Fetch a single property detail via RapidAPI /property."""

from __future__ import annotations

from typing import Any

from logger import log

from ..client import rapidapi_get
from ..normalizer import normalize_listing


def _normalize_payload(payload: Any) -> dict[str, Any] | None:
    """RapidAPI may return a dict or a one-item list."""
    if isinstance(payload, list):
        if not payload:
            return None
        first = payload[0]
        return first if isinstance(first, dict) else None
    if isinstance(payload, dict):
        return payload
    return None


def get_property_detail(
    listing_id: str | None = None,
    address: str | None = None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """Fetch property detail by zpid (listing_id) or address.

    Returns:
        (data, error_dict). On success error_dict is None.
    """
    lid = str(listing_id).strip() if listing_id else None
    addr = str(address).strip() if address else None

    if not lid and not addr:
        return None, {
            "success": False,
            "error": "MISSING_PARAM",
            "details": "Provide listing_id or address",
        }

    params: dict[str, Any] = {}
    if addr:
        params["address"] = addr
    elif lid:
        params["zpid"] = lid

    try:
        resp = rapidapi_get("/property", params=params)
        if not resp.ok:
            log.warn(
                "ERRORS",
                "RapidAPI /property HTTP error",
                {
                    "endpoint": "/property",
                    "listing_id": lid,
                    "address_query": addr,
                    "http_status": resp.status_code,
                    "response_preview": (resp.text[:800] if resp.text else ""),
                },
            )
            return None, {
                "success": False,
                "error": "RAPIDAPI_ERROR",
                "status_code": resp.status_code,
                "details": resp.text[:800],
            }

        payload = resp.json() if resp.content else {}
        data = _normalize_payload(payload)
        if not data:
            return None, {
                "success": False,
                "error": "NOT_FOUND",
                "details": f"No property found for zpid={lid} address={addr}",
            }

        log.debug(
            "API",
            "RapidAPI /property response (property detail)",
            {
                "caller": "get_property_detail",
                "endpoint": "/property",
                "listing_id": lid,
                "address_query": addr,
                "zpid": data.get("zpid"),
            },
        )
        return normalize_listing(data), None

    except Exception as exc:
        return None, {
            "success": False,
            "error": "RAPIDAPI_EXCEPTION",
            "details": str(exc)[:800],
        }
