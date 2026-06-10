"""Refresh listing snapshots for persisted search results via Slipstream."""

from __future__ import annotations

from typing import Any

from app import db
from app.models import PropertyCache
from app.services.property_cache.shared_cache import (
    update_property_basic_data,
    update_property_price,
)
from app.services.search.data.property.property_detail import get_property_detail
from app.utils.db.orm_lookup import get_model
from app.utils.format.currency import format_currency, resolve_price
from logger import log

from .search_db_cache import _build_cached_property_dict


def _resolve_slipstream_listing_id(prop: PropertyCache) -> tuple[str | None, str | None]:
    """Slipstream listing key (zpid or MLS id), never the PropertyCache UUID."""
    listing_id: str | None = None
    if prop.zpid and str(prop.zpid).strip():
        listing_id = str(prop.zpid).strip()
    elif prop.mls_home_id and str(prop.mls_home_id).strip():
        listing_id = str(prop.mls_home_id).strip()
    address = (prop.address or "").strip() or None
    return listing_id, address


def _hydrate_one_row(row: dict[str, Any]) -> dict[str, Any]:
    """Refresh one cached row from Slipstream; preserve match score and ranking."""
    preserved_score = row.get("_score")
    preserved_ranking = row.get("ranking")
    home_id = row.get("home_id")
    if not home_id:
        return row

    prop = get_model(PropertyCache, str(home_id))
    if not prop:
        log.warn("SEARCH", "hydrate_cached_listing_missing_property", {"home_id": home_id})
        return row

    listing_id, address = _resolve_slipstream_listing_id(prop)
    if not listing_id and not address:
        log.warn("SEARCH", "hydrate_cached_listing_no_lookup_key", {"home_id": home_id})
        return row

    data, err = get_property_detail(listing_id=listing_id, address=address)
    if err or not data:
        log.warn(
            "SEARCH",
            "hydrate_cached_listing_api_failed",
            {"home_id": home_id, "listing_id": listing_id, "error": err},
        )
        return row

    try:
        update_property_basic_data(
            prop,
            data,
            address=address,
            params={"zpid": listing_id} if listing_id else None,
        )
        fresh_price = format_currency(resolve_price(data))
        if fresh_price:
            update_property_price(prop, fresh_price)
        db.session.commit()
        db.session.refresh(prop)
    except Exception as e:
        db.session.rollback()
        log.warn(
            "SEARCH",
            "hydrate_cached_listing_persist_failed",
            {"home_id": home_id, "error": str(e)},
        )
        return row

    rebuilt = _build_cached_property_dict(prop, preserved_score=preserved_score)
    if preserved_ranking is not None:
        rebuilt["ranking"] = preserved_ranking
    return rebuilt


def hydrate_cached_listings(cached_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Refresh listing fields for each cached row; scores and order stay unchanged."""
    if not cached_rows:
        return []

    hydrated: list[dict[str, Any]] = []
    for row in cached_rows:
        hydrated.append(_hydrate_one_row(row))

    log.info(
        "SEARCH",
        "hydrate_cached_listings_complete",
        {"count": len(hydrated)},
    )
    return hydrated
