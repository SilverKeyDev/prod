"""Fetch a single property detail via Slipstream /ws/listings/get.

On success, the full parsed JSON body is logged at DEBUG (``LOG_CATEGORIES.API``).
Reference payload (anonymized): ``slipstream_response_reference.SLIPSTREAM_LISTINGS_GET_RESPONSE_EXAMPLE``.
"""

from __future__ import annotations

import uuid
from typing import Any

from logger import LOG_CATEGORIES, log

from ..client import slipstream_get
from ..config import SLIPSTREAM_MARKET
from ..normalizer import normalize_listing


def _slipstream_error_message(body: dict[str, Any]) -> str:
    """Best-effort user-facing message from Slipstream JSON error payload."""
    err = body.get("error")
    if isinstance(err, dict):
        msg = err.get("message")
        if isinstance(msg, str) and msg.strip():
            return msg.strip()
    if isinstance(err, str) and err.strip():
        return err.strip()
    return "Unknown error"


def _listing_id_probable_app_row_key(listing_id: str) -> bool:
    """True when ``listing_id`` is likely a DB/favorite row id, not a Slipstream listing key."""
    s = (listing_id or "").strip()
    if not s:
        return False
    sl = s.lower()
    if sl.startswith("fav-") or sl.startswith("temp_"):
        return True
    try:
        uuid.UUID(s)
    except ValueError:
        return False
    return True


def _fetch_property_detail_once(
    listing_id: str | None,
    address: str | None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """One Slipstream /ws/listings/get request (id XOR address in query params)."""
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
            log.warn(
                LOG_CATEGORIES["ERRORS"],
                "Slipstream /ws/listings/get HTTP error",
                {
                    "endpoint": "/ws/listings/get",
                    "listing_id": listing_id,
                    "address_query": address,
                    "http_status": resp.status_code,
                    "response_preview": (resp.text[:800] if resp.text else ""),
                },
            )
            return None, {
                "success": False,
                "error": "SLIPSTREAM_ERROR",
                "status_code": resp.status_code,
                "details": resp.text[:800],
            }

        body = resp.json() if resp.content else {}
        if not body.get("success"):
            slip_msg = _slipstream_error_message(body)
            log.warn(
                LOG_CATEGORIES["ERRORS"],
                "Slipstream /ws/listings/get returned success=false",
                {
                    "endpoint": "/ws/listings/get",
                    "listing_id": listing_id,
                    "address_query": address,
                    "http_status": resp.status_code,
                    "slipstream_message": slip_msg,
                    "slipstream_error": body.get("error"),
                },
            )
            return None, {
                "success": False,
                "error": "SLIPSTREAM_ERROR",
                "status_code": resp.status_code,
                "details": slip_msg,
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


def get_property_detail(
    listing_id: str | None = None,
    address: str | None = None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """Fetch property detail by MLS listing ID or address.

    If lookup by id returns no listings but ``listing_id`` looks like an app/database UUID
    and a real ``address`` was provided, retries once using address only (Slipstream does
    not resolve favorite-row ids).

    Returns:
        (normalized_data, error_dict)
        On success error_dict is None; on failure normalized_data is None.
    """
    lid = str(listing_id).strip() if listing_id else None
    addr = str(address).strip() if address else None

    if not lid and not addr:
        return None, {
            "success": False,
            "error": "MISSING_PARAM",
            "details": "Provide listing_id or address",
        }

    data, err = _fetch_property_detail_once(lid, addr)
    if (
        err
        and err.get("error") == "NOT_FOUND"
        and lid
        and addr
        and _listing_id_probable_app_row_key(lid)
    ):
        data, err = _fetch_property_detail_once(None, addr)
    return data, err
