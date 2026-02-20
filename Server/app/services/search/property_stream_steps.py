"""
Pure step functions for property stream: fetch data, build commute/features, persist.
Used by property_stream._generate_property_stream_internal to avoid duplication.
"""

import os

import requests

from app import db
from app.models import HomeUniversal
from app.services.aggregation import get_preferences_dict_optional
from app.services.research.graphs.graphic_generation import (
    GOOGLE_MAPS_ID,
    fetch_travel_time,
    generate_static_map_url,
)
from app.services.search.features.feature_overlap_llm import combine_and_check_features
from app.services.search.features.property_features import extract_property_features
from app.utils.address_format import normalize_address
from app.utils.currency import format_currency

RAPI_HOST = "us-housing-market-data1.p.rapidapi.com"
RAPI_KEY = os.getenv("RAPIDAPI_KEY")


def fetch_basic_property_data(params: dict):
    """
    Fetch basic property data from RapidAPI. Returns (data, None) on success,
    (None, error_dict) on failure. Caller yields SSE from error_dict if present.
    """
    url = f"https://{RAPI_HOST}/property"
    headers = {
        "x-rapidapi-host": RAPI_HOST,
        "x-rapidapi-key": RAPI_KEY,
        "Accept": "application/json",
    }
    r = requests.get(url, headers=headers, params=params, timeout=300)
    if not r.ok:
        return None, {
            "success": False,
            "error": "RAPIDAPI_ERROR",
            "status_code": r.status_code,
            "details": r.text[:800],
        }
    data = r.json()
    if isinstance(data, list):
        if len(data) > 0:
            data = data[0]
        else:
            return None, {
                "success": False,
                "error": "RAPIDAPI_ERROR",
                "status_code": 200,
                "details": "API returned empty list",
            }
    if not isinstance(data, dict):
        return None, {
            "success": False,
            "error": "RAPIDAPI_ERROR",
            "status_code": 200,
            "details": f"API returned unexpected data type: {type(data).__name__}",
        }
    return data, None


def get_property_address(data: dict, address: str | None) -> str | None:
    """Build property address string from data or use provided address."""
    if address and address.strip():
        return address.strip()
    if not data or not isinstance(data, dict):
        return None
    street = data.get("streetAddress", "")
    city = data.get("city", "")
    state = data.get("state", "")
    zipcode = data.get("zipcode", "")
    if street and city and state:
        return f"{street}, {city}, {state} {zipcode}".strip()
    return None


def build_commute_data(property_address, current_user, google_maps_key):
    """
    Build commute_data dict (travel_times, map_url, property_address).
    Returns dict; may include 'error' key on failure.
    """
    commute_data = {}
    if not current_user or not property_address or not google_maps_key:
        return commute_data
    user_prefs_dict = get_preferences_dict_optional(str(current_user.id))
    if not user_prefs_dict:
        return commute_data
    important_locations = user_prefs_dict.get("important_locations") or []
    if not isinstance(important_locations, list):
        important_locations = []
    travel_times = []
    secondary_locations = []
    for i, location in enumerate(important_locations):
        if isinstance(location, dict) and "address" in location:
            location_address = location["address"]
            location_name = location.get("name") or location_address[:40] or f"Location {i + 1}"
            travel_time = fetch_travel_time(property_address, location_address, google_maps_key)
            travel_times.append(
                {
                    "name": location_name,
                    "address": location_address,
                    "travel_time": travel_time,
                    "commute_tolerance": location.get("commute_tolerance", 30),
                }
            )
            secondary_locations.append(
                {
                    "name": location_name,
                    "address": location_address,
                }
            )
    commute_data["travel_times"] = travel_times
    if secondary_locations:
        try:
            map_url = generate_static_map_url(
                property_address, secondary_locations, google_maps_key, map_id=GOOGLE_MAPS_ID
            )
            commute_data["map_url"] = map_url
        except Exception:
            pass
    commute_data["property_address"] = property_address
    return commute_data


def fetch_zillow_images(params: dict, data: dict) -> list:
    """Fetch image URLs from RapidAPI images endpoint. Returns list of URL strings."""
    zpid_val = None
    if isinstance(params, dict) and params.get("zpid"):
        zpid_val = str(params["zpid"]).strip()
    if not zpid_val and isinstance(data, dict) and data.get("zpid"):
        zpid_val = str(data["zpid"]).strip()
    if not zpid_val:
        return []
    images = []
    try:
        images_url = f"https://{RAPI_HOST}/images"
        images_params = {"zpid": zpid_val}
        images_headers = {
            "X-RapidAPI-Key": RAPI_KEY,
            "X-RapidAPI-Host": RAPI_HOST,
        }
        resp = requests.get(images_url, headers=images_headers, params=images_params, timeout=300)
        if resp.status_code != 200:
            return []
        images_data = resp.json()
        if not isinstance(images_data, dict):
            return []
        for key in ["images", "photos", "imageList", "data"]:
            if key in images_data and isinstance(images_data[key], list):
                for img_item in images_data[key]:
                    if isinstance(img_item, str):
                        images.append(img_item)
                    elif isinstance(img_item, dict):
                        for url_key in ["url", "src", "href", "link"]:
                            if url_key in img_item and isinstance(img_item[url_key], str):
                                images.append(img_item[url_key])
                                break
                break
    except Exception:
        pass
    return images


def build_features(data: dict) -> dict:
    """Extract property features from basic data."""
    return extract_property_features(data) if data else {}


def build_combined_features(
    features: dict,
    image_features: dict | None,
    current_user,
):
    """
    Combine features and check overlap with user preferences.
    Returns dict with combined_features, preferred_overlap, dealbreaker_overlap.
    """
    preferred_features = []
    deal_breakers = []
    if current_user:
        user_prefs_dict = get_preferences_dict_optional(str(current_user.id))
        if user_prefs_dict:
            preferred_features = user_prefs_dict.get("preferred_home_features") or []
            if not isinstance(preferred_features, list):
                preferred_features = []
            deal_breakers = user_prefs_dict.get("deal_breakers") or []
            if not isinstance(deal_breakers, list):
                deal_breakers = []
    try:
        return combine_and_check_features(
            features=features or {},
            image_features=image_features or {},
            preferred_features=preferred_features,
            deal_breakers=deal_breakers,
        )
    except Exception:
        combined_list = []
        if features and isinstance(features, dict):
            for category_features in features.values():
                if isinstance(category_features, list):
                    combined_list.extend(category_features)
        if image_features and isinstance(image_features, dict) and "error" not in image_features:
            clean = image_features.get("clean", [])
            if isinstance(clean, list):
                combined_list.extend(clean)
        return {
            "combined_features": combined_list,
            "preferred_overlap": [],
            "dealbreaker_overlap": [],
        }


def build_update_fields(
    data: dict,
    address: str | None,
    params: dict,
    features: dict,
    combined_features_data: dict,
    property_analysis: dict,
    commute_data: dict,
    zillow_images: list,
) -> tuple[str | None, dict]:
    """
    Build full_address and update_fields for HomeUniversal persist.
    Returns (full_address, update_fields). full_address may be used for existing lookup.
    """
    street = city = state = ""
    zipcode = None
    addr = data.get("address") or {}
    if isinstance(addr, dict):
        street = (addr.get("streetAddress") or "").strip()
        city = (addr.get("city") or "").strip()
        state = (addr.get("state") or "").strip()
        zipcode = addr.get("zipcode") or addr.get("zipCode")
        zipcode = str(zipcode).strip() if zipcode else None
    street = street or (data.get("streetAddress") or "").strip()
    city = city or (data.get("city") or "").strip()
    state = state or (data.get("state") or "").strip()
    zipcode = zipcode or (str(data.get("zipcode") or data.get("zipCode") or "").strip() or None)

    if street and city and state:
        full_address = f"{street}, {city}, {state} {zipcode or ''}".strip()
    else:
        full_address = data.get("streetAddress") or address or ""

    primary_image = None
    if isinstance(zillow_images, list) and zillow_images:
        primary_image = zillow_images[0]
    primary_image = (
        primary_image
        or data.get("imgSrc")
        or data.get("image")
        or data.get("image_url")
        or data.get("imageUrl")
    )

    features_to_save = features.copy() if isinstance(features, dict) else {}
    if combined_features_data:
        features_to_save["_combined_features"] = combined_features_data

    update_fields = {
        "address": full_address,
        "city": city or data.get("city"),
        "state": state or data.get("state"),
        "zipcode": zipcode or data.get("zipcode") or data.get("zipCode"),
        "beds": str(data.get("bedrooms", data.get("beds", "")) or ""),
        "baths": str(data.get("bathrooms", data.get("baths", "")) or ""),
        "sqft": str(data.get("livingArea", data.get("sqft", "")) or ""),
        "lot_size": str(data.get("lotAreaValue", "") or ""),
        "price": format_currency(data.get("price", data.get("listPrice", ""))),
        "image_url": primary_image or "",
        "image_urls": zillow_images or [],
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
        "features": features_to_save,
        "property_analysis": property_analysis,
        "commute_data": commute_data,
        "raw_data": data,
    }
    return full_address, update_fields


def persist_home_universal(user_id: str, full_address: str, update_fields: dict) -> None:
    """Find or create HomeUniversal and commit. No-op if full_address is falsy."""
    if not full_address:
        return
    try:
        target_norm = None
        try:
            target_norm = normalize_address(full_address)
        except Exception:
            target_norm = full_address.strip().lower()

        existing = None
        for h in HomeUniversal.query.filter_by(user_id=user_id).all():
            if not h.address:
                continue
            try:
                norm_existing = normalize_address(h.address)
            except Exception:
                norm_existing = h.address.strip().lower()
            if norm_existing == target_norm:
                existing = h
                break

        if existing:
            for k, v in update_fields.items():
                setattr(existing, k, v)
            existing.current = True
        else:
            record = HomeUniversal(user_id=user_id, current=True, **update_fields)
            db.session.add(record)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
