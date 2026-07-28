"""Normalize upstream listing dicts into the internal property shape.

Primary input: RapidAPI / Zillow-shaped props (zpid, streetAddress, bedrooms, ...).
Optional fallback: legacy Slipstream-shaped listings (id, address{}, listPrice, ...).
"""

from __future__ import annotations

from typing import Any


def _csv_to_list(val: str | list | None) -> list[str]:
    if val is None:
        return []
    if isinstance(val, list):
        return [str(v).strip() for v in val if v]
    if isinstance(val, str):
        return [s.strip() for s in val.split(",") if s.strip()]
    return []


def _looks_like_rapidapi(raw: dict[str, Any]) -> bool:
    """Heuristic: RapidAPI props use zpid / streetAddress / bedrooms."""
    return (
        raw.get("zpid") is not None
        or raw.get("streetAddress") is not None
        or raw.get("bedrooms") is not None
        or raw.get("unformattedPrice") is not None
        or raw.get("imgSrc") is not None
    )


def _compose_address(
    street: str,
    city: str,
    state: str,
    zipcode: str,
    fallback: str | None = None,
) -> str:
    if street and city and state:
        return f"{street}, {city}, {state} {zipcode}".strip()
    if isinstance(fallback, str) and fallback.strip():
        return fallback.strip()
    parts = [p for p in (street, city, f"{state} {zipcode}".strip()) if p]
    return ", ".join(parts)


def _normalize_rapidapi(raw: dict[str, Any]) -> dict[str, Any]:
    street = str(raw.get("streetAddress") or "").strip()
    city = str(raw.get("city") or "").strip()
    state = str(raw.get("state") or "").strip()
    zipcode = str(raw.get("zipcode") or raw.get("zipCode") or "").strip()
    addr_fallback = raw.get("address") if isinstance(raw.get("address"), str) else None
    full_address = _compose_address(street, city, state, zipcode, addr_fallback)

    price = raw.get("price")
    if price is None:
        price = raw.get("unformattedPrice")
    if price is None:
        price = raw.get("listPrice")

    living_area = raw.get("livingArea")
    if living_area is None:
        living_area = raw.get("sqft")

    lot_sqft = raw.get("lotAreaValue")
    lot_unit = raw.get("lotAreaUnit") or "sqft"
    days = raw.get("daysOnZillow")
    if days is None:
        days = raw.get("daysOnMarket")

    images = raw.get("images") if isinstance(raw.get("images"), list) else []
    images = [i for i in images if isinstance(i, str) and i]
    img_src = raw.get("imgSrc") or (images[0] if images else None)
    if img_src and img_src not in images:
        images = [img_src] + images

    zpid = raw.get("zpid")
    if zpid is not None:
        zpid = str(zpid)

    home_type = raw.get("homeType") or raw.get("propertyType")
    listing_status = raw.get("listingStatus") or raw.get("homeStatus") or raw.get("status")

    price_per_sqft = raw.get("pricePerSquareFoot")
    if (
        price_per_sqft is None
        and isinstance(price, int | float)
        and isinstance(living_area, int | float)
        and living_area > 0
    ):
        price_per_sqft = round(price / living_area)

    return {
        "zpid": zpid,
        "mls_home_id": raw.get("mls_home_id") or zpid,
        "address": full_address,
        "streetAddress": street,
        "city": city,
        "state": state,
        "zipcode": zipcode,
        "bedrooms": raw.get("bedrooms") if raw.get("bedrooms") is not None else raw.get("beds"),
        "bathrooms": raw.get("bathrooms") if raw.get("bathrooms") is not None else raw.get("baths"),
        "livingArea": living_area,
        "sqft": living_area,
        "price": price,
        "salePrice": raw.get("salePrice"),
        "latitude": raw.get("latitude"),
        "longitude": raw.get("longitude"),
        "imgSrc": img_src,
        "propertyType": raw.get("propertyType") or home_type,
        "listingType": raw.get("listingType"),
        "listingStatus": listing_status,
        "lotAreaValue": lot_sqft,
        "lotAreaUnit": lot_unit,
        "lotAcres": raw.get("lotAcres"),
        "lotSize": raw.get("lotSize"),
        "yearBuilt": raw.get("yearBuilt"),
        "imageCount": raw.get("imageCount") or (len(images) if images else None),
        "homeType": home_type,
        "daysOnMarket": days,
        "daysOnZillow": days,
        "pricePerSquareFoot": price_per_sqft,
        "description": raw.get("description"),
        "county": raw.get("county"),
        "subdivision": raw.get("subdivision"),
        "newConstruction": (
            raw["newConstruction"] if "newConstruction" in raw else raw.get("isNewConstruction")
        ),
        "style": raw.get("style"),
        "associationFee": raw.get("associationFee") or raw.get("hoaFee"),
        "images": images,
        "listingAgent": raw.get("listingAgent"),
        "listingOffice": raw.get("listingOffice"),
        "schools": raw.get("schools") if isinstance(raw.get("schools"), list) else [],
        "floors": raw.get("floors") or raw.get("stories"),
        "previousListPrice": raw.get("previousListPrice"),
        "priceChangeTimestamp": raw.get("priceChangeTimestamp"),
        "pool": _csv_to_list(raw.get("pool")),
        "roof": raw.get("roof"),
        "propertyCondition": raw.get("propertyCondition"),
        "interiorFeatures": _csv_to_list(raw.get("interiorFeatures")),
        "communityFeatures": _csv_to_list(raw.get("communityFeatures")),
        "cooling": _csv_to_list(raw.get("cooling")),
        "heating": _csv_to_list(raw.get("heating")),
        "parkingFeatures": _csv_to_list(raw.get("parkingFeatures")),
        "lotFeatures": _csv_to_list(raw.get("lotFeatures")),
        "constructionMaterials": _csv_to_list(raw.get("constructionMaterials")),
        "fireplaceFeatures": _csv_to_list(raw.get("fireplaceFeatures")),
        "fencing": raw.get("fencing"),
        "securityFeatures": _csv_to_list(raw.get("securityFeatures")),
    }


def _normalize_slipstream_legacy(raw: dict[str, Any]) -> dict[str, Any]:
    """Legacy path for Slipstream-shaped fixtures still used in older tests."""
    addr = raw.get("address") or {}
    coords = raw.get("coordinates") or {}
    baths_obj = raw.get("baths") or {}
    lot = raw.get("lotSize") or {}
    raw_images = raw.get("images") or []
    images = [i for i in raw_images if isinstance(i, str)]

    street = ""
    city = ""
    state = ""
    zipcode = ""
    if isinstance(addr, dict):
        street = str(addr.get("deliveryLine") or addr.get("street") or "").strip()
        city = str(addr.get("city") or "").strip()
        state = str(addr.get("state") or "").strip()
        zipcode = str(addr.get("zip") or "").strip()

    living_area = raw.get("size")
    lot_sqft = lot.get("sqft") if isinstance(lot, dict) else lot
    price_val = raw.get("listPrice")
    days = raw.get("daysOnMarket")
    listing_id = raw.get("id")
    if listing_id is not None:
        listing_id = str(listing_id)

    return {
        "zpid": listing_id,
        "mls_home_id": listing_id,
        "address": _compose_address(street, city, state, zipcode),
        "streetAddress": street,
        "city": city,
        "state": state,
        "zipcode": zipcode,
        "bedrooms": raw.get("beds"),
        "bathrooms": baths_obj.get("total") if isinstance(baths_obj, dict) else baths_obj,
        "livingArea": living_area,
        "sqft": living_area,
        "price": price_val,
        "salePrice": raw.get("salePrice"),
        "latitude": coords.get("latitude") if isinstance(coords, dict) else None,
        "longitude": coords.get("longitude") if isinstance(coords, dict) else None,
        "imgSrc": images[0] if images else None,
        "propertyType": raw.get("propertyType"),
        "listingType": raw.get("listingType"),
        "listingStatus": raw.get("status"),
        "lotAreaValue": lot_sqft,
        "lotAreaUnit": "sqft",
        "lotAcres": lot.get("acres") if isinstance(lot, dict) else None,
        "lotSize": None,
        "yearBuilt": raw.get("yearBuilt"),
        "imageCount": raw.get("imageCount"),
        "homeType": raw.get("propertyType"),
        "daysOnMarket": days,
        "daysOnZillow": days,
        "pricePerSquareFoot": None,
        "description": raw.get("description"),
        "county": raw.get("county"),
        "subdivision": raw.get("subdivision"),
        "newConstruction": raw.get("newConstruction"),
        "style": raw.get("style"),
        "associationFee": raw.get("associationFee"),
        "images": images,
        "listingAgent": raw.get("listingAgent"),
        "listingOffice": raw.get("listingOffice"),
        "schools": raw.get("schools") if isinstance(raw.get("schools"), list) else [],
        "floors": raw.get("floors"),
        "previousListPrice": raw.get("previousListPrice"),
        "priceChangeTimestamp": raw.get("priceChangeTimestamp"),
        "pool": _csv_to_list(raw.get("pool")),
        "roof": raw.get("roof"),
        "propertyCondition": raw.get("propertyCondition"),
        "interiorFeatures": _csv_to_list(raw.get("interiorFeatures")),
        "communityFeatures": _csv_to_list(raw.get("communityFeatures")),
        "cooling": _csv_to_list(raw.get("cooling")),
        "heating": _csv_to_list(raw.get("heating")),
        "parkingFeatures": _csv_to_list(raw.get("parkingFeatures")),
        "lotFeatures": _csv_to_list(raw.get("lotFeatures")),
        "constructionMaterials": _csv_to_list(raw.get("constructionMaterials")),
        "fireplaceFeatures": _csv_to_list(raw.get("fireplaceFeatures")),
        "fencing": raw.get("fencing"),
        "securityFeatures": _csv_to_list(raw.get("securityFeatures")),
    }


def normalize_listing(raw: dict) -> dict:
    """Map one upstream listing into the internal property dict shape."""
    if not isinstance(raw, dict):
        return {}
    if _looks_like_rapidapi(raw):
        return _normalize_rapidapi(raw)
    return _normalize_slipstream_legacy(raw)


def normalize_listings(raw_listings: list[dict]) -> list[dict]:
    return [normalize_listing(r) for r in raw_listings if isinstance(r, dict)]
