"""Add or update HomeUniversal records from search results."""

from __future__ import annotations

import copy
from typing import Any

from app import db
from app.models import HomeUniversal
from app.utils.address_format import normalize_address
from app.utils.currency import format_currency

from ..helpers.geometry_helpers import geocode_address_google
from .search_db_sync import sync_to_home_likes


def add_or_update_home_basic(
    user_id: str,
    home: dict[str, Any],
    set_liked: bool = False,
    ranking: int | None = None,
) -> HomeUniversal:
    """
    Add or update a home record for a user using search result fields.
    De-dupes by normalized address per user. Optionally sets is_liked and ranking.

    Expected keys in `home`:
      address (string or dict), bedrooms/beds, bathrooms/baths, sqft/livingArea,
      lotSize/lotAreaValue, price, image_url/imageUrl/imgSrc, zpid, mls_home_id,
      latitude/lat, longitude/lng/lon, city, state, zipcode, property_type,
      listing_status. Full dict is stored in raw_data for retrieval merge.
    """
    if not user_id:
        raise ValueError("user_id is required")

    # Resolve address
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

    try:
        norm = normalize_address(address)
    except Exception:
        norm = address.lower()

    existing: HomeUniversal | None = None
    for rec in HomeUniversal.query.filter_by(user_id=str(user_id)).all():
        if not rec.address:
            continue
        try:
            rec_norm = normalize_address(rec.address)
        except Exception:
            rec_norm = rec.address.strip().lower()
        if rec_norm == norm:
            existing = rec
            break

    image_url = (
        home.get("image_url")
        or home.get("imageUrl")
        or home.get("imgSrc")
        or home.get("image")
        or ""
    )

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

    lot_area_value_raw = home.get("lotAreaValue") or home.get("lotSize") or ""
    lot_area_unit = home.get("lotAreaUnit") or ""
    lot_area_value = ""
    if lot_area_value_raw:
        try:
            lot_area_value = str(lot_area_value_raw)
        except Exception:
            lot_area_value = ""

    zpid_val = home.get("zpid")
    zpid = str(zpid_val).strip() if zpid_val is not None else None
    mls_home_id_val = home.get("mls_home_id") or home.get("mlsHomeId")
    mls_home_id = str(mls_home_id_val).strip() if mls_home_id_val else None

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
    latitude = None
    if lat_val is not None:
        try:
            latitude = float(lat_val)
        except (TypeError, ValueError):
            pass
    longitude = None
    if lng_val is not None:
        try:
            longitude = float(lng_val)
        except (TypeError, ValueError):
            pass

    if (latitude is None or longitude is None) and address:
        try:
            coords = geocode_address_google(address)
            if coords:
                geocoded_lat, geocoded_lng = coords
                if latitude is None:
                    latitude = geocoded_lat
                if longitude is None:
                    longitude = geocoded_lng
        except Exception:
            pass

    property_type = home.get("property_type") or home.get("propertyType") or home.get("homeType")
    property_type = str(property_type).strip() if property_type else None
    listing_status = home.get("listing_status") or home.get("listingStatus")
    listing_status = str(listing_status).strip() if listing_status else None

    raw_data = copy.deepcopy(home) if home else None

    fields = {
        "address": address,
        "beds": str(home.get("bedrooms", home.get("beds", "")) or ""),
        "baths": str(home.get("bathrooms", home.get("baths", "")) or ""),
        "sqft": str(home.get("sqft", home.get("livingArea", "")) or ""),
        "lot_size": lot_area_value,
        "lot_area_value": lot_area_value if lot_area_value else None,
        "lot_area_unit": str(lot_area_unit) if lot_area_unit else None,
        "price": format_currency(home.get("price", "")),
        "image_url": image_url,
        "score": parsed_score,
        "zpid": zpid,
        "mls_home_id": mls_home_id,
        "latitude": latitude,
        "longitude": longitude,
        "city": city if city else None,
        "state": state if state else None,
        "zipcode": zipcode if zipcode else None,
        "property_type": property_type,
        "listing_status": listing_status,
        "raw_data": raw_data,
    }

    if existing:
        for k, v in fields.items():
            if isinstance(v, str):
                if v.strip() != "":
                    setattr(existing, k, v)
            else:
                if v is not None:
                    setattr(existing, k, v)
        existing.current = True
        if ranking is not None:
            existing.ranking = ranking
        if set_liked:
            existing.is_liked = True
        db.session.commit()
        if set_liked:
            sync_to_home_likes(existing, action="liked")
        return existing

    record = HomeUniversal(user_id=str(user_id), current=True, ranking=ranking, **fields)
    if set_liked:
        record.is_liked = True
    db.session.add(record)
    db.session.commit()
    if set_liked:
        sync_to_home_likes(record, action="liked")
    return record
