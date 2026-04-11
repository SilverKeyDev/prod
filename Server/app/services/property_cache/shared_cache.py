"""Shared PropertyCache CRUD — one row per physical property."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from app import db
from app.models import PropertyCache
from app.utils.address_format import normalize_address

logger = logging.getLogger(__name__)


def _normalize_safe(address: str) -> str:
    try:
        return normalize_address(address.strip())
    except Exception:
        return address.strip().lower()


def get_property_by_zpid_or_address(
    zpid: str | None = None, address: str | None = None
) -> PropertyCache | None:
    """Look up shared property record by zpid first, then normalized address."""
    if zpid:
        record = PropertyCache.query.filter_by(zpid=str(zpid)).first()
        if record:
            return record

    if address:
        target_norm = _normalize_safe(address)
        record = PropertyCache.query.filter_by(address_normalized=target_norm).first()
        if record:
            return record

    return None


def get_or_create_property(
    zpid: str | None = None,
    address: str | None = None,
) -> PropertyCache:
    """Return existing shared record or create a minimal stub.

    The caller is expected to populate fields (basic data, images, etc.) after
    creation and then call ``db.session.commit()``.
    """
    existing = get_property_by_zpid_or_address(zpid=zpid, address=address)
    if existing:
        return existing

    addr_norm = _normalize_safe(address) if address else None
    record = PropertyCache(
        zpid=str(zpid) if zpid else None,
        address=address,
        address_normalized=addr_norm,
    )
    db.session.add(record)
    db.session.flush()
    logger.info(
        "[PROPERTY_CACHE] Created shared PropertyCache id=%s zpid=%s addr=%s",
        record.id,
        zpid,
        address,
    )
    return record


def update_property_price(record: PropertyCache, price: str | None) -> None:
    """Update price and mark the timestamp."""
    record.price = price
    record.price_updated_at = datetime.now(timezone.utc)


def update_property_images(
    record: PropertyCache,
    images: list[str] | None,
    primary_image_url: str | None = None,
) -> None:
    record.images = images
    record.primary_image_url = primary_image_url or (images[0] if images else None)
    record.images_fetched_at = datetime.now(timezone.utc)


def update_property_basic_data(
    record: PropertyCache,
    data: dict[str, Any],
    address: str | None = None,
    params: dict[str, Any] | None = None,
) -> None:
    """Populate basic listing fields from a normalized property data dict."""
    params = params or {}

    addr = data.get("address") or {}
    if isinstance(addr, dict):
        street = (addr.get("streetAddress") or "").strip()
        city = (addr.get("city") or "").strip()
        state = (addr.get("state") or "").strip()
        zipcode = addr.get("zipcode") or addr.get("zipCode")
        zipcode = str(zipcode).strip() if zipcode else None
    else:
        street = (data.get("streetAddress") or "").strip()
        city = (data.get("city") or "").strip()
        state = (data.get("state") or "").strip()
        zipcode = str(data.get("zipcode") or data.get("zipCode") or "").strip() or None

    if street and city and state:
        full_address = f"{street}, {city}, {state} {zipcode or ''}".strip()
    else:
        full_address = (
            data.get("streetAddress") or address or (addr if isinstance(addr, str) else "")
        )

    record.address = full_address
    record.address_normalized = (
        _normalize_safe(full_address) if full_address else record.address_normalized
    )
    record.city = city or data.get("city")
    record.state = state or data.get("state")
    record.zipcode = zipcode or data.get("zipcode") or data.get("zipCode")
    record.beds = str(data.get("bedrooms", data.get("beds", "")) or "")
    record.baths = str(data.get("bathrooms", data.get("baths", "")) or "")
    record.sqft = str(data.get("livingArea", data.get("sqft", "")) or "")
    record.lot_size = str(data.get("lotAreaValue", "") or "")
    record.zpid = (
        str(data.get("zpid") or (params.get("zpid") if isinstance(params, dict) else "") or "")
        or record.zpid
    )
    record.mls_home_id = str(data.get("mls_home_id") or "") or record.mls_home_id
    record.listing_status = data.get("listingStatus") or record.listing_status
    record.property_type = data.get("propertyType", data.get("homeType")) or record.property_type
    record.home_type = data.get("homeType") or record.home_type
    record.year_built = str(data.get("yearBuilt") or "") or record.year_built
    record.latitude = data.get("latitude") or record.latitude
    record.longitude = data.get("longitude") or record.longitude
    record.living_area = str(data.get("livingArea", "") or "")
    record.lot_area_value = str(data.get("lotAreaValue", "") or "")
    record.lot_area_unit = data.get("lotAreaUnit") or record.lot_area_unit
    record.raw_data = data
    record.basic_data_updated_at = datetime.now(timezone.utc)
