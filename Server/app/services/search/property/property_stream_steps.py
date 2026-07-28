"""
Pure step functions for property stream: fetch data, build commute/features, persist.
Used by property_stream_internal._generate_property_stream_internal to avoid duplication.
"""

from sqlalchemy import select

from app import db
from app.models import UserPropertyLink
from app.services.aggregation import get_preferences_dict_optional
from app.services.research.graphs.graphic_generation import (
    GOOGLE_MAPS_ID,
    fetch_directions_leg,
    generate_static_map_url,
)
from app.services.search.data import get_property_detail, get_property_images
from app.services.search.features.feature_overlap_llm import combine_and_check_features
from app.services.search.features.property_features import extract_property_features


def fetch_basic_property_data(params: dict):
    """
    Fetch basic property data from Slipstream. Returns (data, None) on success,
    (None, error_dict) on failure. Caller yields SSE from error_dict if present.
    """
    listing_id = params.get("zpid") or params.get("id")
    address = params.get("address")

    data, err = get_property_detail(
        listing_id=str(listing_id) if listing_id else None, address=address
    )
    if err:
        return None, err
    if not data or not isinstance(data, dict):
        return None, {
            "success": False,
            "error": "RAPIDAPI_ERROR",
            "status_code": 200,
            "details": "API returned no data",
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


def build_commute_data(
    property_address,
    current_user,
    google_maps_key,
    user_prefs_dict=None,
):
    """
    Build commute_data dict (travel_times, map_url, property_address).
    Returns dict; may include 'error' key on failure.

    When user_prefs_dict is provided, use it for important_locations (e.g. client's prefs).
    """
    commute_data = {}
    if not current_user or not property_address or not google_maps_key:
        return commute_data
    prefs = user_prefs_dict
    if prefs is None:
        prefs = get_preferences_dict_optional(str(current_user.id))
    if not prefs:
        return commute_data
    user_prefs_dict = prefs
    important_locations = user_prefs_dict.get("important_locations") or []
    if not isinstance(important_locations, list):
        important_locations = []
    travel_times = []
    secondary_locations = []
    for i, location in enumerate(important_locations):
        if isinstance(location, dict) and "address" in location:
            location_address = location["address"]
            location_name = (
                location.get("name")
                or location.get("label")
                or location_address[:40]
                or f"Location {i + 1}"
            )
            leg = fetch_directions_leg(property_address, location_address, google_maps_key)
            travel_time = leg.get("duration_text") if leg else None
            encoded_polyline = leg.get("encoded_polyline") if leg else None
            tol = location.get("commute_tolerance")
            if tol is None:
                tol = location.get("max_commute_minutes")
            if tol is None:
                tol = 30
            travel_times.append(
                {
                    "name": location_name,
                    "address": location_address,
                    "travel_time": travel_time,
                    "commute_tolerance": tol,
                    "encoded_polyline": encoded_polyline,
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
    """Fetch image URLs from Slipstream. Returns list of URL strings.

    First tries the ``images`` array already present in normalized data (from detail
    call with details=true).  Falls back to a dedicated get_property_images call.
    """
    if isinstance(data, dict) and data.get("images"):
        imgs = data["images"]
        if isinstance(imgs, list) and imgs:
            return [i for i in imgs if isinstance(i, str)]

    listing_id = None
    if isinstance(params, dict):
        listing_id = params.get("zpid") or params.get("id")
    if not listing_id and isinstance(data, dict):
        listing_id = data.get("zpid") or data.get("mls_home_id")
    if not listing_id:
        return []

    return get_property_images(str(listing_id))


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


def persist_to_property_cache(
    user_id: str,
    prop_record,
    data: dict,
    address: str | None,
    params: dict,
    features: dict,
    combined_features_data: dict,
    property_analysis: dict,
    commute_data: dict,
    zillow_images: list,
) -> None:
    """Write to shared PropertyCache + UserPropertyLink."""
    if not prop_record or not user_id:
        return
    try:
        link = db.session.scalar(
            select(UserPropertyLink).where(
                UserPropertyLink.user_id == user_id, UserPropertyLink.property_id == prop_record.id
            )
        )
        if not link:
            link = UserPropertyLink(
                user_id=user_id,
                property_id=prop_record.id,
                current=True,
            )
            db.session.add(link)
        else:
            link.current = True
        db.session.commit()
    except Exception:
        db.session.rollback()
