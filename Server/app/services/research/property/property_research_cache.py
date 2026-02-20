"""
Property research cache and fetch helpers.

Fast-path cache checks, RapidAPI fetch, and cached details with optional pros/cons removal.
"""

import time
from datetime import datetime, timedelta
from typing import Any

import requests
from flask import current_app

from app.models import HomeUniversal
from app.services.auth import get_current_user
from app.utils.address_format import normalize_address

from .property_cache import (
    find_cached_property,
    get_cached_data,
    get_cached_details,
)

RAPI_HOST = "us-housing-market-data1.p.rapidapi.com"


def get_current_user_safe() -> Any | None:
    """
    Safely get current user, returning None if not authenticated or on error.

    Returns:
        Current user object or None
    """
    try:
        return get_current_user()
    except Exception:
        return None


def check_cache_fast_path(
    params: dict[str, Any],
    address: str | None,
    start_time: float,
    log_prefix: str = "[PROPERTY]",
    remove_pros_cons: bool = False,
) -> tuple[dict[str, Any], int] | None:
    """
    Check cache for fully populated record and return cached response if found.

    Args:
        params: API parameters dict
        address: Address string from request
        start_time: Start time for elapsed calculation
        log_prefix: Logging prefix (e.g., "[PROPERTY]" or "[COMPARE]")
        remove_pros_cons: If True, remove pros/cons from cached property_analysis

    Returns:
        Tuple of (cached_response, status_code) if cache hit, None otherwise
    """
    try:
        existing_user = get_current_user_safe()

        if existing_user:
            zpid_param = params.get("zpid") if isinstance(params, dict) else None
            cached_property = find_cached_property(
                user_id=str(existing_user.id), zpid=zpid_param, address=address
            )

            if cached_property:
                cached_response = get_cached_data(cached_property, params)
                if cached_response:
                    # Remove pros/cons and neighborhood_overview from cached response if requested
                    if remove_pros_cons:
                        if cached_response.get("property_analysis") and isinstance(
                            cached_response["property_analysis"], dict
                        ):
                            cached_response["property_analysis"] = {
                                k: v
                                for k, v in cached_response["property_analysis"].items()
                                if k not in ["pros", "cons", "neighborhood_overview"]
                            }

                    elapsed = time.time() - start_time
                    current_app.logger.info(
                        f"{log_prefix} ✅ Returning cached data in {elapsed:.2f}ms "
                        f"(zpid={cached_property.zpid})"
                    )
                    return (cached_response, 200)
    except Exception as cache_err:
        current_app.logger.warning(
            f"{log_prefix} Cache fast-path failed, proceeding to fetch: {cache_err}", exc_info=True
        )

    return None


def fetch_property_from_rapidapi(
    params: dict[str, Any], rapidapi_key: str
) -> tuple[dict[str, Any] | None, tuple[dict[str, Any], int] | None]:
    """
    Fetch property data from RapidAPI.

    Args:
        params: API parameters dict
        rapidapi_key: RapidAPI key

    Returns:
        Tuple of (data_dict, error_response_tuple) where error_response_tuple is None on success
    """
    url = f"https://{RAPI_HOST}/property"
    headers = {
        "x-rapidapi-host": RAPI_HOST,
        "x-rapidapi-key": rapidapi_key,
        "Accept": "application/json",
    }

    r = requests.get(url, headers=headers, params=params, timeout=300)

    if not r.ok:
        error_response = (
            {
                "success": False,
                "error": "RAPIDAPI_ERROR",
                "status_code": r.status_code,
                "details": r.text[:800],
            },
            r.status_code,
        )
        return None, error_response

    data = r.json()
    return data, None


def get_cached_details_with_pros_cons_removal(
    params: dict[str, Any],
    address: str | None,
    log_prefix: str = "[PROPERTY]",
    remove_pros_cons: bool = False,
) -> tuple[dict | None, dict | None, dict | None]:
    """
    Get cached details (commute_data, property_analysis, features) with optional pros/cons removal.

    Args:
        params: API parameters dict
        address: Address string from request
        log_prefix: Logging prefix
        remove_pros_cons: If True, remove pros/cons from cached property_analysis

    Returns:
        Tuple of (cached_commute_data, cached_property_analysis, cached_features)
    """
    cached_commute_data = None
    cached_property_analysis = None
    cached_features = None

    try:
        existing_user = get_current_user_safe()

        if existing_user:
            zpid_param = params.get("zpid") if isinstance(params, dict) else None
            cached_record = find_cached_property(
                user_id=str(existing_user.id), zpid=zpid_param, address=address
            )

            if cached_record:
                cached_commute_data, cached_property_analysis, cached_features = get_cached_details(
                    cached_record
                )

                # Remove pros/cons and neighborhood_overview from cached analysis if requested
                if (
                    remove_pros_cons
                    and cached_property_analysis
                    and isinstance(cached_property_analysis, dict)
                ):
                    cached_property_analysis = {
                        k: v
                        for k, v in cached_property_analysis.items()
                        if k not in ["pros", "cons", "neighborhood_overview"]
                    }
    except Exception as cache_check_err:
        current_app.logger.debug(
            f"{log_prefix} Error checking cache for commute/analysis: {cache_check_err}"
        )

    return cached_commute_data, cached_property_analysis, cached_features


def get_recent_property_analysis_sections(
    user_id: str, address: str | None, zpid: str | None, days_back: int = 14
) -> dict[str, dict[str, Any]]:
    """
    Get property analysis sections that were generated in the last N days.
    Checks for recent data to avoid regenerating sections unnecessarily.

    Args:
        user_id: User ID
        address: Property address (optional)
        zpid: Property ZPID (optional)
        days_back: Number of days to look back (default 14)

    Returns:
        Dict mapping section names to their data, with metadata about when they were generated
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days_back)

        # Try to find property by zpid first, then by address
        property_record = None

        if zpid:
            property_record = HomeUniversal.query.filter_by(
                user_id=str(user_id), zpid=str(zpid)
            ).first()

        if not property_record and address:
            try:
                target_norm = normalize_address(address.strip())
            except Exception:
                target_norm = address.strip().lower()

            for record in HomeUniversal.query.filter_by(user_id=str(user_id)).all():
                if record.address:
                    try:
                        norm_existing = normalize_address(record.address)
                    except Exception:
                        norm_existing = record.address.strip().lower()
                    if norm_existing == target_norm:
                        property_record = record
                        break

        if not property_record or not property_record.property_analysis:
            return {}

        # Check if property_analysis was updated recently
        if property_record.updated_at and property_record.updated_at >= cutoff_date:
            analysis = property_record.property_analysis
            if isinstance(analysis, dict):
                # Return sections with metadata
                sections = {}
                for section_name, section_data in analysis.items():
                    sections[section_name] = {
                        "data": section_data,
                        "generated_at": property_record.updated_at.isoformat()
                        if property_record.updated_at
                        else None,
                        "is_recent": True,
                    }
                return sections

        return {}

    except Exception as e:
        current_app.logger.warning(f"[PROPERTY] Error checking recent analysis sections: {e}")
        return {}
