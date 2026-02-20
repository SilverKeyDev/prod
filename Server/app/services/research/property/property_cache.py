"""
Cache management utilities for property research endpoints.
Handles checking and retrieving cached property data from HomeUniversal.
"""

from datetime import datetime, timedelta
from typing import Any

from flask import current_app

from app.models import HomeUniversal
from app.utils.address_format import normalize_address


def find_cached_property(
    user_id: str, zpid: str | None = None, address: str | None = None
) -> HomeUniversal | None:
    """
    Find a cached property record by zpid or normalized address.

    Args:
        user_id: User ID to filter by
        zpid: Optional ZPID to search for
        address: Optional address string to search for

    Returns:
        HomeUniversal record if found, None otherwise
    """
    candidate = None

    # Try zpid first if provided
    if zpid:
        candidate = HomeUniversal.query.filter_by(user_id=str(user_id), zpid=str(zpid)).first()

    # Fallback to address match if not found via zpid
    if not candidate and address:
        target_norm = None
        try:
            target_norm = normalize_address(address.strip())
        except Exception:
            target_norm = address.strip().lower()

        for h in HomeUniversal.query.filter_by(user_id=str(user_id)).all():
            if not h.address:
                continue
            try:
                norm_existing = normalize_address(h.address)
            except Exception:
                norm_existing = h.address.strip().lower()
            if norm_existing == target_norm:
                candidate = h
                break

    return candidate


def is_fully_populated(record: HomeUniversal) -> bool:
    """
    Check if a HomeUniversal record has all essential fields populated.

    Args:
        record: HomeUniversal record to check

    Returns:
        True if record has all essential fields, False otherwise
    """
    if not record:
        return False

    # Essential fields that must exist
    essential_fields = [
        record.raw_data is not None,  # Must have raw data
        record.address,  # Must have address
        record.zpid
        or record.listing_status
        or record.property_type
        or record.home_type,  # Some identifier
    ]

    if not all(essential_fields):
        current_app.logger.debug(
            f"[PROPERTY] Cache miss - missing essential fields: "
            f"raw_data={record.raw_data is not None}, "
            f"address={bool(record.address)}, "
            f"identifier={bool(record.zpid or record.listing_status or record.property_type or record.home_type)}"
        )
        return False

    current_app.logger.info(
        f"[PROPERTY] Cache hit! Found cached property: zpid={record.zpid}, address={record.address}"
    )
    return True


def should_regenerate_details(record: HomeUniversal) -> bool:
    """
    Determine if property details should be regenerated based on completeness and recency.

    Args:
        record: HomeUniversal record to check

    Returns:
        True if details should be regenerated, False if cached data is sufficient
    """
    try:
        details_present = bool(record.features and record.property_analysis and record.commute_data)
        updated_at = getattr(record, "updated_at", None)
        recent_cutoff = datetime.utcnow() - timedelta(days=30)
        unlocked_recently = bool(updated_at and updated_at >= recent_cutoff)

        return not details_present and not unlocked_recently
    except Exception:
        return False


def get_cached_data(record: HomeUniversal, params: dict[str, Any]) -> dict[str, Any] | None:
    """
    Extract cached data from a HomeUniversal record if it's fully populated.

    Args:
        record: HomeUniversal record
        params: Original query parameters

    Returns:
        Response data dict if cache is valid, None otherwise
    """
    if not is_fully_populated(record):
        return None

    if should_regenerate_details(record):
        current_app.logger.info(
            "[PROPERTY] 🔄 Cached record incomplete and not unlocked in last month; regenerating details"
        )
        return None

    # Build response in the same shape as the normal path
    response_data = {
        "success": True,
        "query": params,
        "data": record.raw_data,
        "features": record.features if record.features is not None else {},
        "commute_data": record.commute_data if record.commute_data is not None else {},
        "property_analysis": record.property_analysis
        if record.property_analysis is not None
        else {},
        "image_features": None,  # not cached; can be added later if desired
        "images": record.image_urls or [],
    }

    return response_data


def get_cached_details(
    record: HomeUniversal,
) -> tuple[dict | None, dict | None, dict | None]:
    """
    Extract cached commute_data, property_analysis, and features from a record.

    Args:
        record: HomeUniversal record

    Returns:
        Tuple of (commute_data, property_analysis, features) - each may be None
    """
    if not record:
        return None, None, None

    # Check if details are present and recent
    from datetime import datetime, timedelta

    details_commute_present = bool(
        record.commute_data and isinstance(record.commute_data, dict) and record.commute_data
    )
    details_analysis_present = bool(
        record.property_analysis
        and isinstance(record.property_analysis, dict)
        and record.property_analysis
    )
    details_features_present = bool(record.features and isinstance(record.features, dict))

    updated_at = getattr(record, "updated_at", None)
    recent_cutoff = datetime.utcnow() - timedelta(days=30)
    unlocked_recently = bool(updated_at and updated_at >= recent_cutoff)

    force_regen = (
        not (details_commute_present and details_analysis_present and details_features_present)
    ) and (not unlocked_recently)

    if force_regen:
        current_app.logger.info(
            "[PROPERTY] 🔄 Forcing regeneration of details (incomplete and not unlocked in last month)"
        )
        return None, None, None

    cached_commute_data = None
    cached_property_analysis = None
    cached_features = None

    if details_commute_present:
        cached_commute_data = record.commute_data
        current_app.logger.info("[PROPERTY] ✅ Found cached commute_data for property")

    if details_analysis_present:
        cached_property_analysis = record.property_analysis
        current_app.logger.info("[PROPERTY] ✅ Found cached property_analysis for property")

    if details_features_present:
        cached_features = record.features
        current_app.logger.info("[PROPERTY] ✅ Found cached features for property")

    return cached_commute_data, cached_property_analysis, cached_features
