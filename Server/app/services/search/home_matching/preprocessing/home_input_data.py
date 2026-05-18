"""
Home data retrieval and formatting for home matching system.

This module provides functions to retrieve and format home/property data from the database
or API responses for use in the home matching system.

This module now uses the preprocessing models internally but maintains backward
compatibility by returning dictionaries.
"""

import logging
from typing import Any

from app.models import PropertyCache, UserPropertyLink
from app.utils.db.orm_lookup import get_model

logger = logging.getLogger(__name__)

# Reference existing scraping helpers from services
try:
    import app.services.research.property.property_analysis
    import app.services.research.property.property_commute
    import app.services.research.property.property_images  # noqa: F401 -- imported for availability check
    from app.services.search.features.image_features import extract_and_clean_features
    from app.services.search.features.property_features import extract_property_features

    SCRAPING_HELPERS_AVAILABLE = True
except ImportError:
    SCRAPING_HELPERS_AVAILABLE = False
    extract_property_features = None  # type: ignore[assignment]
    extract_and_clean_features = None  # type: ignore[assignment]
    logger.warning("Some scraping helpers not available - some features may be limited")


def get_home_data_from_db(home_id: str, user_id: str | None = None) -> dict[str, Any] | None:
    """Retrieve home data from database by property ID."""
    try:
        prop = get_model(PropertyCache, home_id)
        if not prop:
            logger.warning("Property not found: %s", home_id)
            return None

        link = None
        if user_id:
            link = UserPropertyLink.query.filter_by(user_id=user_id, property_id=prop.id).first()

        return format_home_data_for_matching(prop, link)

    except Exception as e:
        logger.error("Error retrieving home data for %s: %s", home_id, e)
        return None


def get_homes_data_from_db(
    user_id: str | None = None, limit: int | None = None, liked_only: bool = False
) -> list[dict[str, Any]]:
    """Retrieve multiple properties from database via UserPropertyLink."""
    try:
        query = UserPropertyLink.query
        if user_id:
            query = query.filter_by(user_id=user_id)
        query = query.filter_by(current=True)
        if liked_only:
            query = query.filter_by(is_liked=True)
        if limit:
            query = query.limit(limit)

        links = query.all()
        results = []
        for link in links:
            prop = get_model(PropertyCache, link.property_id)
            if prop:
                results.append(format_home_data_for_matching(prop, link))
        return results

    except Exception as e:
        logger.error("Error retrieving homes data: %s", e)
        return []


def format_home_data_for_matching(
    prop: PropertyCache, link: UserPropertyLink | None = None
) -> dict[str, Any]:
    """Format PropertyCache + optional UserPropertyLink for home matching."""
    formatted = {
        "home_id": prop.id,
        "zpid": prop.zpid,
        "address": prop.address or "",
        "price": _parse_numeric(prop.price),
        "bedrooms": _parse_numeric(prop.beds),
        "bathrooms": _parse_numeric(prop.baths),
        "sqft": _parse_numeric(prop.sqft or prop.living_area),
        "lot_size": _parse_numeric(prop.lot_size or prop.lot_area_value),
        "home_type": prop.home_type or prop.property_type,
        "property_type": prop.property_type,
        "year_built": _parse_numeric(prop.year_built),
        "listing_status": prop.listing_status,
        "latitude": prop.latitude,
        "longitude": prop.longitude,
        "city": prop.city,
        "state": prop.state,
        "zipcode": prop.zipcode,
        "image_url": prop.primary_image_url,
        "image_urls": prop.images,
        "score": link.score if link else None,
        "is_liked": link.is_liked if link else False,
    }

    if prop.listing_features:
        formatted["features"] = prop.listing_features
        formatted["amenities"] = _extract_amenities_from_features(prop.listing_features)

    if prop.raw_data:
        formatted["raw_data"] = prop.raw_data

    return formatted


def format_home_data_from_api(property_data: dict[str, Any]) -> dict[str, Any]:
    """
    Format property data from API response (e.g., Zillow API) for home matching.

    This is used when property data comes from external APIs rather than the database.

    Args:
        property_data: Dictionary containing property data from API

    Returns:
        Formatted home data dictionary for home matching
    """
    # Map common API field names to home matching format
    formatted = {
        "home_id": property_data.get("home_id") or property_data.get("id"),
        "zpid": property_data.get("zpid"),
        "address": property_data.get("address", ""),
        "price": property_data.get("price") or property_data.get("listPrice"),
        "bedrooms": property_data.get("bedrooms") or property_data.get("beds"),
        "bathrooms": property_data.get("bathrooms") or property_data.get("baths"),
        "sqft": property_data.get("sqft")
        or property_data.get("livingArea")
        or property_data.get("squareFootage"),
        "lot_size": property_data.get("lot_size")
        or property_data.get("lotAreaValue")
        or property_data.get("lotSize"),
        "home_type": property_data.get("homeType")
        or property_data.get("home_type")
        or property_data.get("propertyType"),
        "property_type": property_data.get("propertyType") or property_data.get("property_type"),
        "year_built": property_data.get("yearBuilt") or property_data.get("year_built"),
        "listing_status": property_data.get("listingStatus") or property_data.get("listing_status"),
        "latitude": property_data.get("latitude") or property_data.get("lat"),
        "longitude": property_data.get("longitude")
        or property_data.get("lon")
        or property_data.get("lng"),
        "city": property_data.get("city"),
        "state": property_data.get("state"),
        "zipcode": property_data.get("zipcode")
        or property_data.get("zipCode")
        or property_data.get("postalCode"),
    }

    # Add image data
    if "image_url" in property_data:
        formatted["image_url"] = property_data["image_url"]
    elif "imgSrc" in property_data:
        formatted["image_url"] = property_data["imgSrc"]
    elif "imageUrl" in property_data:
        formatted["image_url"] = property_data["imageUrl"]

    if "image_urls" in property_data:
        formatted["image_urls"] = property_data["image_urls"]
    elif "images" in property_data:
        formatted["image_urls"] = property_data["images"]

    # Add description and neighborhood info if available
    if "description" in property_data:
        formatted["description"] = property_data["description"]

    if "neighborhood" in property_data:
        formatted["neighborhood"] = property_data["neighborhood"]

    if "neighborhood_info" in property_data:
        formatted["neighborhood_info"] = property_data["neighborhood_info"]

    if "school_district" in property_data:
        formatted["school_district"] = property_data["school_district"]

    # Add amenities and features
    if "amenities" in property_data:
        formatted["amenities"] = property_data["amenities"]

    if "features" in property_data:
        formatted["features"] = property_data["features"]

    # Add walkability/transit scores if available
    if "walkability_score" in property_data:
        formatted["walkability_score"] = property_data["walkability_score"]

    if "transit_score" in property_data:
        formatted["transit_score"] = property_data["transit_score"]

    if "bike_score" in property_data:
        formatted["bike_score"] = property_data["bike_score"]

    # Add nearby amenities if available
    if "nearby_amenities" in property_data:
        formatted["nearby_amenities"] = property_data["nearby_amenities"]

    # Preserve raw data
    formatted["raw_data"] = property_data

    # Optionally enrich with scraping helpers if available
    if (
        SCRAPING_HELPERS_AVAILABLE
        and extract_property_features is not None
        and extract_and_clean_features is not None
    ):
        # Extract features if not already present
        if not formatted.get("features"):
            try:
                features = extract_property_features(property_data)
                if features:
                    formatted["features"] = features
            except Exception as e:
                logger.warning(f"Could not extract property features: {e}")

        # Extract image features if images are available
        if formatted.get("image_urls") and not formatted.get("image_features"):
            try:
                image_features = extract_and_clean_features(formatted.get("image_urls", []))
                if image_features:
                    formatted["image_features"] = image_features
            except Exception as e:
                logger.warning(f"Could not extract image features: {e}")

    return formatted


def format_homes_data_from_api(properties: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Format multiple properties from API response for home matching.

    Args:
        properties: List of property dictionaries from API

    Returns:
        List of formatted home data dictionaries
    """
    return [format_home_data_from_api(prop) for prop in properties]


def get_home_data(
    home_id: str | None = None,
    user_id: str | None = None,
    home_data_dict: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    """
    Main entry point to get home data for home matching.

    Can retrieve from database (if home_id provided) or format from dictionary.

    Args:
        home_id: Home ID to retrieve from database (optional)
        user_id: User ID for filtering (optional)
        home_data_dict: Pre-provided home data dictionary (optional)

    Returns:
        Formatted home data for home matching, or None if unavailable
    """
    if home_data_dict:
        return format_home_data_from_api(home_data_dict)
    elif home_id:
        return get_home_data_from_db(home_id, user_id)
    else:
        logger.warning("Either home_id or home_data_dict must be provided")
        return None


def get_homes_data(
    user_id: str | None = None,
    homes_data_list: list[dict[str, Any]] | None = None,
    limit: int | None = None,
    liked_only: bool = False,
) -> list[dict[str, Any]]:
    """
    Main entry point to get multiple homes data for home matching.

    Can retrieve from database or format from list of dictionaries.

    Args:
        user_id: User ID to retrieve homes for (optional)
        homes_data_list: Pre-provided list of home data dictionaries (optional)
        limit: Optional limit on number of homes
        liked_only: If True, only retrieve liked homes (database only)

    Returns:
        List of formatted home data dictionaries
    """
    if homes_data_list:
        return format_homes_data_from_api(homes_data_list)
    elif user_id or not homes_data_list:
        return get_homes_data_from_db(user_id, limit, liked_only)
    else:
        return []


def _parse_numeric(value: Any) -> float | None:
    """Parse numeric value from string or return as-is if already numeric."""
    if value is None:
        return None

    if isinstance(value, int | float):
        return float(value)

    if isinstance(value, str):
        # Remove common formatting characters
        cleaned = value.replace("$", "").replace(",", "").strip()
        try:
            return float(cleaned)
        except (ValueError, TypeError):
            return None

    return None


def _extract_amenities_from_features(features: Any) -> list[str]:
    """Extract amenities list from features data."""
    if isinstance(features, list):
        return [str(f) for f in features if f]
    elif isinstance(features, dict):
        # Extract keys or values that look like amenities
        amenities = []
        for key, value in features.items():
            if isinstance(value, bool) and value:
                amenities.append(key)
            elif isinstance(value, str):
                amenities.append(value)
        return amenities
    elif isinstance(features, str):
        return [features]

    return []
