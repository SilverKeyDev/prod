"""Cache management utilities for property research endpoints.

Uses shared PropertyCache (no user_id filter) for cross-user data reuse.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from flask import current_app

from app.models import PropertyCache
from app.services.property_cache import get_property_by_zpid_or_address
from app.services.search.scoring import analysis_cache_signature_matches
from app.utils.address_format import normalize_address


def find_cached_property(
    user_id: str | None = None,
    zpid: str | None = None,
    address: str | None = None,
) -> PropertyCache | None:
    """Find a shared PropertyCache record by zpid or normalized address.

    The lookup is user-agnostic so any user benefits from previously cached data.
    ``user_id`` is accepted for API compatibility but is NOT used for filtering.
    """
    return get_property_by_zpid_or_address(zpid=zpid, address=address)


def is_fully_populated(record: PropertyCache | None) -> bool:
    """Check if a record has all essential fields populated."""
    if not record:
        return False

    essential_fields = [
        record.raw_data is not None,
        bool(record.address),
        bool(record.zpid or record.listing_status or record.property_type or record.home_type),
    ]

    if not all(essential_fields):
        current_app.logger.debug(
            "[PROPERTY] Cache miss - missing essential fields: raw_data=%s, address=%s",
            record.raw_data is not None,
            bool(record.address),
        )
        return False

    current_app.logger.info(
        "[PROPERTY] Cache hit! Found cached property: zpid=%s, address=%s",
        record.zpid,
        record.address,
    )
    return True


def should_regenerate_details(record: PropertyCache) -> bool:
    """Determine if property details should be regenerated."""
    try:
        has_features = bool(record.listing_features)
        has_analysis = bool(hasattr(record, "analysis_sections"))
        updated_at = record.updated_at
        recent_cutoff = datetime.now(timezone.utc) - timedelta(days=30)
        unlocked_recently = bool(updated_at and updated_at >= recent_cutoff)

        details_present = has_features and has_analysis
        return not details_present and not unlocked_recently
    except Exception:
        return False


def get_cached_data(
    record: PropertyCache,
    params: dict[str, Any],
    analysis_cache_signature: str | None = None,
) -> dict[str, Any] | None:
    """Extract cached data from a record if it is fully populated."""
    if not is_fully_populated(record):
        return None

    if should_regenerate_details(record):
        current_app.logger.info(
            "[PROPERTY] Cached record incomplete and not unlocked recently; regenerating"
        )
        return None

    from app.services.property_cache import get_cached_sections_dict

    pa = get_cached_sections_dict(record.id) or {}

    if (
        analysis_cache_signature
        and isinstance(pa, dict)
        and pa
        and not analysis_cache_signature_matches(pa, analysis_cache_signature)
    ):
        current_app.logger.info("[PROPERTY] Cache skip: property_analysis signature mismatch")
        return None

    images = record.images or []

    return {
        "success": True,
        "query": params,
        "data": record.raw_data,
        "features": record.listing_features or {},
        "commute_data": {},
        "property_analysis": pa if isinstance(pa, dict) else {},
        "image_features": record.image_features,
        "images": images,
    }


def get_cached_details(
    record: PropertyCache,
    analysis_cache_signature: str | None = None,
) -> tuple[dict | None, dict | None, dict | None]:
    """Extract cached commute_data, property_analysis, and features."""
    if not record:
        return None, None, None

    updated_at = record.updated_at
    recent_cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    unlocked_recently = bool(updated_at and updated_at >= recent_cutoff)

    cached_commute_data = None
    cached_property_analysis = None
    cached_features = None

    if record.listing_features and isinstance(record.listing_features, dict):
        cached_features = record.listing_features

    from app.services.property_cache import get_cached_sections_dict

    pa = get_cached_sections_dict(record.id) or {}

    if pa and isinstance(pa, dict):
        if analysis_cache_signature and not analysis_cache_signature_matches(
            pa, analysis_cache_signature
        ):
            current_app.logger.info(
                "[PROPERTY] Skipping cached property_analysis (signature mismatch)"
            )
        else:
            cached_property_analysis = pa

    all_present = all([cached_features, cached_property_analysis])
    if not all_present and not unlocked_recently:
        current_app.logger.info("[PROPERTY] Forcing regeneration (incomplete and not recent)")
        return None, None, None

    return cached_commute_data, cached_property_analysis, cached_features


def _safe_normalize(address: str) -> str:
    try:
        return normalize_address(address.strip())
    except Exception:
        return address.strip().lower()
