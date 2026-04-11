"""Add or update PropertyCache + UserPropertyLink records from search results."""

from __future__ import annotations

import copy
from typing import Any

from app import db
from app.models import UserPropertyLink
from app.services.property_cache import get_or_create_property
from app.utils.address_format import normalize_address
from app.utils.currency import format_currency, resolve_price

from ..helpers.geometry_helpers import geocode_address_google
from .search_db_sync import sync_to_home_likes


def add_or_update_home_basic(
    user_id: str,
    home: dict[str, Any],
    set_liked: bool = False,
    ranking: int | None = None,
) -> UserPropertyLink:
    """Add or update a property record for a user using search result fields.

    Creates/updates a shared PropertyCache row and a per-user UserPropertyLink.
    De-dupes by normalized address / zpid.  Optionally sets is_liked and ranking.
    """
    if not user_id:
        raise ValueError("user_id is required")

    # --- resolve address ---
    _addr_raw = home.get("address")
    if isinstance(_addr_raw, dict):
        addr = _addr_raw
        street = addr.get("streetAddress") or addr.get("street") or ""
        city = (addr.get("city") or home.get("city") or "").strip()
        state = (addr.get("state") or home.get("state") or "").strip()
        zipcode = (
            addr.get("zipcode")
            or addr.get("zipCode")
            or home.get("zipcode")
            or home.get("zipCode")
            or home.get("postalCode")
            or ""
        ).strip()
        address = f"{street}, {city}, {state} {zipcode or ''}".strip()
        if not address:
            address = street or ""
    else:
        address = (str(_addr_raw) if _addr_raw else "").strip()
        city = (home.get("city") or "").strip()
        state = (home.get("state") or "").strip()
        zipcode = (
            home.get("zipcode") or home.get("zipCode") or home.get("postalCode") or ""
        ).strip()

    if not address:
        raise ValueError("address is required")

    # --- resolve zpid ---
    zpid_val = home.get("zpid")
    zpid = str(zpid_val).strip() if zpid_val is not None else None

    # --- shared PropertyCache upsert ---
    prop = get_or_create_property(zpid=zpid, address=address)

    image_url = (
        home.get("image_url")
        or home.get("imageUrl")
        or home.get("imgSrc")
        or home.get("image")
        or ""
    )

    # --- parse score ---
    parsed_score = _parse_score(home)

    lot_area_value_raw = home.get("lotAreaValue") or home.get("lotSize") or ""
    lot_area_unit = home.get("lotAreaUnit") or ""
    lot_area_value = str(lot_area_value_raw) if lot_area_value_raw else ""

    mls_home_id_val = home.get("mls_home_id") or home.get("mlsHomeId")
    mls_home_id = str(mls_home_id_val).strip() if mls_home_id_val else None

    lat, lng = _resolve_coords(home, address)

    property_type = home.get("property_type") or home.get("propertyType") or home.get("homeType")
    property_type = str(property_type).strip() if property_type else None
    listing_status = home.get("listing_status") or home.get("listingStatus")
    listing_status = str(listing_status).strip() if listing_status else None

    raw_data = copy.deepcopy(home) if home else None

    # update shared PropertyCache fields
    _set_if(prop, "address", address)
    _set_if(prop, "city", city)
    _set_if(prop, "state", state)
    _set_if(prop, "zipcode", zipcode)
    _set_if(prop, "beds", str(home.get("bedrooms", home.get("beds", "")) or ""))
    _set_if(prop, "baths", str(home.get("bathrooms", home.get("baths", "")) or ""))
    _set_if(prop, "sqft", str(home.get("sqft", home.get("livingArea", "")) or ""))
    _set_if(prop, "lot_size", lot_area_value)
    _set_if(prop, "lot_area_value", lot_area_value if lot_area_value else None)
    _set_if(prop, "lot_area_unit", str(lot_area_unit) if lot_area_unit else None)
    _set_if(prop, "price", format_currency(resolve_price(home)))
    _set_if(prop, "primary_image_url", image_url)
    _set_if(prop, "zpid", zpid)
    _set_if(prop, "mls_home_id", mls_home_id)
    _set_if(prop, "latitude", lat)
    _set_if(prop, "longitude", lng)
    _set_if(prop, "property_type", property_type)
    _set_if(prop, "listing_status", listing_status)

    year_built = home.get("yearBuilt") or home.get("year_built")
    _set_if(prop, "year_built", str(year_built) if year_built else None)

    home_type = home.get("homeType") or home.get("home_type")
    _set_if(prop, "home_type", str(home_type).strip() if home_type else None)

    living_area = home.get("livingArea") or home.get("sqft") or home.get("living_area")
    _set_if(prop, "living_area", str(living_area) if living_area else None)

    prop.raw_data = raw_data

    try:
        norm = normalize_address(address)
    except Exception:
        norm = address.lower()
    prop.address_normalized = norm

    db.session.flush()

    # --- per-user UserPropertyLink upsert ---
    link = UserPropertyLink.query.filter_by(user_id=str(user_id), property_id=prop.id).first()

    if link:
        link.current = True
        if ranking is not None:
            link.ranking = ranking
        if set_liked:
            link.is_liked = True
        if parsed_score is not None:
            link.score = parsed_score
        db.session.commit()
        if set_liked:
            sync_to_home_likes(link, prop, action="liked")
        return link

    link = UserPropertyLink(
        user_id=str(user_id),
        property_id=prop.id,
        current=True,
        ranking=ranking,
        is_liked=set_liked,
        score=parsed_score,
    )
    db.session.add(link)
    db.session.commit()
    if set_liked:
        sync_to_home_likes(link, prop, action="liked")
    return link


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


def _set_if(obj: Any, attr: str, value: Any) -> None:
    """Set attribute only if value is a non-empty string or non-None."""
    if isinstance(value, str):
        if value.strip():
            setattr(obj, attr, value)
    elif value is not None:
        setattr(obj, attr, value)


def _parse_score(home: dict[str, Any]) -> float | None:
    parsed_score: float | None = None
    for _key in ("score", "_score", "rankingScore", "ranking_score", "matchScore", "match_score"):
        if _key in home:
            _val = home.get(_key)
            if isinstance(_val, int | float):
                try:
                    parsed_score = float(_val)
                except Exception:
                    parsed_score = None
            elif isinstance(_val, str):
                _s = _val.strip()
                if _s.endswith("%"):
                    _s = _s[:-1].strip()
                    try:
                        parsed_score = float(_s) / 100.0
                    except Exception:
                        parsed_score = None
                else:
                    try:
                        parsed_score = float(_s)
                    except Exception:
                        parsed_score = None
            if parsed_score is not None:
                break

    if parsed_score is None:
        _ranking = home.get("ranking") or {}
        if isinstance(_ranking, dict) and "score" in _ranking:
            _val = _ranking.get("score")
            if _val is not None:
                try:
                    parsed_score = (
                        float(_val)
                        if not (isinstance(_val, str) and _val.endswith("%"))
                        else float(_val[:-1].strip()) / 100.0
                    )
                except Exception:
                    parsed_score = None

    if parsed_score is None:
        _analysis = home.get("property_analysis") or home.get("propertyAnalysis") or {}
        if isinstance(_analysis, dict):
            for _key in ("score", "matchScore", "match_score"):
                if _key in _analysis:
                    _val = _analysis.get(_key)
                    if _val is not None:
                        try:
                            parsed_score = (
                                float(_val)
                                if not (isinstance(_val, str) and _val.endswith("%"))
                                else float(_val[:-1].strip()) / 100.0
                            )
                        except Exception:
                            parsed_score = None
                    if parsed_score is not None:
                        break

    if parsed_score is not None:
        try:
            parsed_score = round(float(parsed_score), 1)
        except Exception:
            parsed_score = None
    return parsed_score


def _resolve_coords(home: dict[str, Any], address: str) -> tuple[float | None, float | None]:
    addr_obj = home.get("address")
    lat_val = (
        home.get("latitude")
        or home.get("lat")
        or (addr_obj.get("latitude") if isinstance(addr_obj, dict) else None)
        or (addr_obj.get("lat") if isinstance(addr_obj, dict) else None)
    )
    lng_val = (
        home.get("longitude")
        or home.get("lng")
        or home.get("lon")
        or (addr_obj.get("longitude") if isinstance(addr_obj, dict) else None)
        or (addr_obj.get("lng") if isinstance(addr_obj, dict) else None)
        or (addr_obj.get("lon") if isinstance(addr_obj, dict) else None)
    )
    latitude = _safe_float(lat_val)
    longitude = _safe_float(lng_val)

    if (latitude is None or longitude is None) and address:
        try:
            coords = geocode_address_google(address)
            if coords:
                if latitude is None:
                    latitude = coords[0]
                if longitude is None:
                    longitude = coords[1]
        except Exception:
            pass
    return latitude, longitude


def _safe_float(val: Any) -> float | None:
    if val is None:
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None
