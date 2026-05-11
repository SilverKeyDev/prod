"""Data persistence utilities for property research endpoints.

Persists data to shared PropertyCache + per-user UserPropertyLink.
"""

from typing import Any

from flask import current_app

from app import db
from app.models import PropertyCache, UserPropertyLink
from app.services.property_cache import get_or_create_property, update_property_basic_data
from app.utils.format.address_format import normalize_address
from app.utils.format.currency import format_currency, resolve_price


def build_update_fields(
    data: dict[str, Any],
    params: dict[str, Any],
    full_address: str,
    primary_image: str | None,
    zillow_api_images: list[str],
    features: dict[str, Any],
    property_analysis: dict[str, Any],
    commute_data: dict[str, Any],
) -> dict[str, Any]:
    """Build update fields dict (kept for compatibility with callers)."""
    street = city = state = ""
    zipcode = None
    addr = data.get("address") or {}
    if isinstance(addr, dict):
        street = (addr.get("streetAddress") or "").strip()
        city = (addr.get("city") or "").strip()
        state = (addr.get("state") or "").strip()
        zipcode = addr.get("zipcode") or addr.get("zipCode") or None
        zipcode = str(zipcode).strip() if zipcode else None
    street = street or (data.get("streetAddress") or "").strip()
    city = city or (data.get("city") or "").strip()
    state = state or (data.get("state") or "").strip()
    zipcode = zipcode or (str(data.get("zipcode") or data.get("zipCode") or "").strip() or None)

    return {
        "address": full_address,
        "city": city or data.get("city"),
        "state": state or data.get("state"),
        "zipcode": zipcode or data.get("zipcode") or data.get("zipCode"),
        "beds": str(data.get("bedrooms", data.get("beds", "")) or ""),
        "baths": str(data.get("bathrooms", data.get("baths", "")) or ""),
        "sqft": str(data.get("livingArea", data.get("sqft", "")) or ""),
        "lot_size": str(data.get("lotAreaValue", "") or ""),
        "price": format_currency(resolve_price(data)),
        "image_url": primary_image or "",
        "image_urls": zillow_api_images or [],
        "zpid": str(
            data.get("zpid") or (params.get("zpid") if isinstance(params, dict) else "") or ""
        ),
        "listing_status": data.get("listingStatus"),
        "property_type": data.get("propertyType", data.get("homeType")),
        "home_type": data.get("homeType"),
        "year_built": str(data.get("yearBuilt") or ""),
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "living_area": str(data.get("livingArea", "") or ""),
        "lot_area_value": str(data.get("lotAreaValue", "") or ""),
        "lot_area_unit": data.get("lotAreaUnit"),
        "features": features,
        "property_analysis": property_analysis,
        "commute_data": commute_data,
        "raw_data": data,
    }


def find_existing_record(user_id: str, full_address: str) -> PropertyCache | None:
    """Find existing shared PropertyCache record by normalized address."""
    if not full_address:
        return None

    try:
        target_norm = normalize_address(full_address)
    except Exception:
        target_norm = full_address.strip().lower()

    return PropertyCache.query.filter_by(address_normalized=target_norm).first()


def persist_property_data(
    user_id: str,
    data: dict[str, Any],
    params: dict[str, Any],
    address: str | None,
    zillow_api_images: list[str],
    features: dict[str, Any],
    property_analysis: dict[str, Any],
    commute_data: dict[str, Any],
    primary_image: str | None,
) -> None:
    """Persist property data to PropertyCache + UserPropertyLink."""
    try:
        street = city = state = ""
        zipcode = None
        addr = data.get("address") or {}
        if isinstance(addr, dict):
            street = (addr.get("streetAddress") or "").strip()
            city = (addr.get("city") or "").strip()
            state = (addr.get("state") or "").strip()
            zipcode = addr.get("zipcode") or addr.get("zipCode") or None
            zipcode = str(zipcode).strip() if zipcode else None
        street = street or (data.get("streetAddress") or "").strip()
        city = city or (data.get("city") or "").strip()
        state = state or (data.get("state") or "").strip()
        zipcode = zipcode or (str(data.get("zipcode") or data.get("zipCode") or "").strip() or None)

        if street and city and state:
            full_address = f"{street}, {city}, {state} {zipcode or ''}".strip()
        else:
            full_address = data.get("streetAddress") or address or ""

        if not full_address:
            current_app.logger.warning("[PROPERTY] No address found, skipping persistence")
            return

        zpid = (
            str(data.get("zpid") or (params.get("zpid") if isinstance(params, dict) else "") or "")
            or None
        )
        prop = get_or_create_property(zpid=zpid, address=full_address)
        update_property_basic_data(prop, data, address=full_address, params=params)
        prop.listing_features = features
        prop.primary_image_url = primary_image or ""
        prop.images = zillow_api_images or []
        prop.raw_data = data

        # Ensure UserPropertyLink row
        link = UserPropertyLink.query.filter_by(user_id=str(user_id), property_id=prop.id).first()
        if not link:
            link = UserPropertyLink(user_id=str(user_id), property_id=prop.id, current=True)
            db.session.add(link)
        else:
            link.current = True

        db.session.commit()

    except Exception as persist_err:
        current_app.logger.error(
            "[PROPERTY] Failed to persist property details: %s",
            persist_err,
            exc_info=True,
        )
        db.session.rollback()
