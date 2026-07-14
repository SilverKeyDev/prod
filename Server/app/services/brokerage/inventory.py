"""Brokerage inventory listings for map portfolio (SIL-310)."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select

from app import db
from app.models import SkySlopeTransaction

# Demo metro pins when SkySlope rows lack lat/lng (SIL-285 metros)
_DEMO_PINS = [
    {"lat": 33.7490, "lng": -84.3880, "city": "Atlanta"},
    {"lat": 33.7756, "lng": -84.3963, "city": "Midtown Atlanta"},
    {"lat": 33.8487, "lng": -84.3733, "city": "Buckhead"},
    {"lat": 33.9519, "lng": -84.5499, "city": "Marietta"},
    {"lat": 33.9526, "lng": -84.5499, "city": "Sandy Springs"},
    {"lat": 34.0234, "lng": -84.3616, "city": "Alpharetta"},
    {"lat": 33.7748, "lng": -84.2963, "city": "Decatur"},
    {"lat": 33.5801, "lng": -85.0766, "city": "Newnan"},
]


def get_brokerage_inventory_listings(
    brokerage_org_id: str,
    *,
    status_filter: str | None = None,
) -> dict[str, Any]:
    """Return map-ready inventory from SkySlope transactions or demo fixtures."""
    rows = db.session.scalars(
        select(SkySlopeTransaction)
        .where(SkySlopeTransaction.brokerage_id == brokerage_org_id)
        .limit(200)
    ).all()

    listings: list[dict[str, Any]] = []
    if rows:
        for i, tx in enumerate(rows):
            status = _map_status(tx)
            if status_filter and status_filter not in ("all", None):
                if status != status_filter:
                    continue
            pin = _DEMO_PINS[i % len(_DEMO_PINS)]
            lat = float(tx.latitude) if tx.latitude is not None else pin["lat"] + (i % 7) * 0.01
            lng = float(tx.longitude) if tx.longitude is not None else pin["lng"] + (i % 5) * 0.012
            price = tx.sale_price if tx.sale_price is not None else tx.list_price
            listings.append(
                {
                    "id": tx.id,
                    "external_id": tx.skyslope_transaction_id or tx.id,
                    "address": _format_address(tx),
                    "status": status,
                    "price": float(price) if price is not None else None,
                    "lat": lat,
                    "lng": lng,
                    "agent_name": None,
                    "property_type": tx.property_type,
                }
            )
    else:
        # Demo fallback so Inventory never blanks without SkySlope load
        listings = _demo_listings(status_filter)

    active_count = sum(1 for L in listings if L["status"] == "active")
    sold_count = sum(1 for L in listings if L["status"] == "sold")
    prices = [L["price"] for L in listings if isinstance(L.get("price"), int | float)]
    median_price = sorted(prices)[len(prices) // 2] if prices else None

    return {
        "success": True,
        "brokerage_org_id": brokerage_org_id,
        "listings": listings,
        "summary": {
            "active_count": active_count,
            "sold_count": sold_count,
            "total_count": len(listings),
            "median_price": median_price,
        },
    }


def _map_status(tx: SkySlopeTransaction) -> str:
    raw = (getattr(tx, "status", None) or getattr(tx, "transaction_status", None) or "").lower()
    if any(x in raw for x in ("close", "sold", "completed")):
        return "sold"
    if any(x in raw for x in ("pend", "under contract")):
        return "pending"
    return "active"


def _format_address(tx: SkySlopeTransaction) -> str:
    parts = [tx.address, tx.city, tx.state]
    return ", ".join(p for p in parts if p) or "Listing"


def _demo_listings(status_filter: str | None) -> list[dict[str, Any]]:
    out = []
    for i, pin in enumerate(_DEMO_PINS * 3):
        status = "sold" if i % 3 == 0 else ("pending" if i % 5 == 0 else "active")
        if status_filter and status_filter not in ("all", None) and status != status_filter:
            continue
        out.append(
            {
                "id": f"demo-listing-{i}",
                "external_id": f"mls-{1000 + i}",
                "address": f"{100 + i} Demo St, {pin['city']}",
                "status": status,
                "price": 350000 + i * 25000,
                "lat": pin["lat"] + (i % 4) * 0.008,
                "lng": pin["lng"] + (i % 3) * 0.01,
                "agent_name": ["Marcus Williams", "James Carter", "Tanya Brooks"][i % 3],
                "property_type": "single_family",
            }
        )
    return out
