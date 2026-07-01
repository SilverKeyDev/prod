"""Map SkySlope API payloads to SkySlopeTransaction column dicts."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

_SIDE_ALIASES = {
    "buy": "buyer",
    "buyer": "buyer",
    "sell": "seller",
    "seller": "seller",
    "both": "both",
    "dual": "both",
}

_PROPERTY_TYPE_ALIASES = {
    "residential": "residential",
    "commercial": "commercial",
    "industrial": "industrial",
    "land": "land",
}


def _parse_dt(value: Any) -> datetime | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    text = str(value).strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _normalize_side(value: Any) -> str | None:
    if value is None:
        return None
    key = str(value).strip().lower()
    return _SIDE_ALIASES.get(key)


def _normalize_property_type(value: Any) -> str | None:
    if value is None:
        return None
    key = str(value).strip().lower()
    return _PROPERTY_TYPE_ALIASES.get(key)


def _to_decimal(value: Any) -> Decimal | None:
    if value is None or value == "":
        return None
    try:
        return Decimal(str(value))
    except Exception:
        return None


def map_skyslope_transaction(
    raw: dict[str, Any],
    *,
    brokerage_id: str,
    agent_id: str | None = None,
) -> dict[str, Any]:
    """
    Map one SkySlope record → kwargs for SkySlopeTransaction.

    Field names are placeholders — adjust when SIL-273 documents real API shape.
    """
    external_id = (
        raw.get("transactionId")
        or raw.get("saleGuid")
        or raw.get("listingGuid")
        or raw.get("fileGuid")
        or raw.get("guid")
        or raw.get("id")
    )
    if not external_id:
        raise ValueError("SkySlope transaction missing external id")

    return {
        "brokerage_id": brokerage_id,
        "skyslope_transaction_id": str(external_id),
        "agent_id": agent_id,
        "status": raw.get("status") or raw.get("stage"),
        "created_at": _parse_dt(
            raw.get("createdDate") or raw.get("dateCreated") or raw.get("created_at")
        ),
        "closed_at": _parse_dt(
            raw.get("closedDate") or raw.get("dateClosed") or raw.get("closed_at")
        ),
        "cancelled_at": _parse_dt(
            raw.get("cancelledDate") or raw.get("dateCancelled") or raw.get("cancelled_at")
        ),
        "is_cancelled": bool(
            raw.get("isCancelled") or raw.get("is_cancelled") or raw.get("cancelled")
        ),
        "sale_price": _to_decimal(
            raw.get("salePrice") or raw.get("contractPrice") or raw.get("sale_price")
        ),
        "list_price": _to_decimal(
            raw.get("listPrice") or raw.get("listingPrice") or raw.get("list_price")
        ),
        "address": raw.get("propertyAddress") or raw.get("streetAddress") or raw.get("address"),
        "city": raw.get("city"),
        "state": raw.get("state"),
        "zip": raw.get("zip") or raw.get("postalCode"),
        "latitude": raw.get("latitude"),
        "longitude": raw.get("longitude"),
        "side": _normalize_side(raw.get("side") or raw.get("transactionSide")),
        "property_type": _normalize_property_type(
            raw.get("propertyType") or raw.get("property_type")
        ),
        "title_vendor": raw.get("titleCompany") or raw.get("title_vendor"),
        "lender": raw.get("lender"),
        "escrow_company": raw.get("escrow") or raw.get("escrow_company"),
        "has_home_warranty": raw.get("hasHomeWarranty"),
        "raw_payload": raw,
    }
