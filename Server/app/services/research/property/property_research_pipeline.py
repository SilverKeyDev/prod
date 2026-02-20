"""
Property research pipeline for /property and /compare endpoints.
Handles the complete flow: fetching, caching, analysis generation, and persistence.
Consolidates common logic shared between /property and /compare routes.
"""

from typing import Any

from flask import current_app

from app.services.auth import SecurityException, get_current_user
from app.services.search.features.image_features import extract_and_clean_features
from app.services.search.features.property_features import extract_property_features

from .property_analysis import get_property_analysis_for_property
from .property_commute import get_commute_data_for_property
from .property_images import extract_primary_image, fetch_zillow_images
from .property_params import (
    extract_property_address,
    extract_zpid,
)
from .property_persistence import persist_property_data
from .property_research_cache import (
    check_cache_fast_path,
    fetch_property_from_rapidapi,
    get_cached_details_with_pros_cons_removal,
)


def process_property_data(
    data: dict[str, Any],
    params: dict[str, Any],
    address: str | None,
    cached_commute_data: dict[str, Any] | None,
    cached_property_analysis: dict[str, Any] | None,
    cached_features: dict[str, Any] | None,
    google_maps_api_key: str,
    rapidapi_key: str,
    log_prefix: str = "[PROPERTY]",
    skip_pros_cons: bool = False,
) -> dict[str, Any]:
    """
    Process property data: generate commute, analysis, images, features, etc.
    This function orchestrates the complete property research pipeline.

    Args:
        data: Property data dict from RapidAPI
        params: API parameters dict
        address: Address string from request
        cached_commute_data: Cached commute data if available
        cached_property_analysis: Cached property analysis if available
        cached_features: Cached features if available
        google_maps_api_key: Google Maps API key
        rapidapi_key: RapidAPI key
        log_prefix: Logging prefix
        skip_pros_cons: If True, skip pros/cons generation in property analysis

    Returns:
        Dict containing all processed property data
    """
    # Extract property address
    property_address = extract_property_address(address, data)

    # Generate commute data
    commute_data = get_commute_data_for_property(
        property_address=property_address,
        data=data,
        cached_commute_data=cached_commute_data,
        google_maps_api_key=google_maps_api_key,
    )

    # Generate property analysis (with smart schema generation and synthesis)
    property_analysis = get_property_analysis_for_property(
        property_address=property_address,
        data=data,
        cached_property_analysis=cached_property_analysis,
        skip_pros_cons=skip_pros_cons,
    )

    # Fetch images
    zpid_val = extract_zpid(params, data)
    zillow_api_images = fetch_zillow_images(zpid_val, rapidapi_key) if zpid_val else []

    # Extract image features
    image_features = None
    try:
        if zillow_api_images:
            images_to_analyze = zillow_api_images[:5]
            image_features = extract_and_clean_features(images_to_analyze)
    except Exception as e:
        current_app.logger.error(f"🔍 {log_prefix} Error during image feature extraction: {e}")
        image_features = {"error": "Failed to extract features from images"}

    # Extract features
    features = cached_features if cached_features else extract_property_features(data)
    if cached_features:
        current_app.logger.info(f"{log_prefix} ⏭️ Skipping features extraction, using cached data")

    # Persist property data
    try:
        current_user = get_current_user()
        if current_user:
            primary_image = extract_primary_image(zillow_api_images, data)
            persist_property_data(
                user_id=str(current_user.id),
                data=data,
                params=params,
                address=address,
                zillow_api_images=zillow_api_images,
                features=features,
                property_analysis=property_analysis,
                commute_data=commute_data,
                primary_image=primary_image,
            )
    except SecurityException:
        # Silently handle SecurityException for optional user context
        pass
    except Exception as persist_err:
        current_app.logger.error(
            f"{log_prefix} ⚠️ Failed to persist property details: {persist_err}", exc_info=True
        )

    # Build response
    response_data = {
        "success": True,
        "query": params,
        "data": data,
        "features": features,
        "commute_data": commute_data,
        "property_analysis": property_analysis,
        "image_features": image_features,
        "images": zillow_api_images,
    }

    return response_data


def handle_property_request_non_streaming(
    params: dict[str, Any],
    address: str | None,
    google_maps_api_key: str,
    rapidapi_key: str,
    start_time: float,
    log_prefix: str = "[PROPERTY]",
    skip_pros_cons: bool = False,
) -> tuple[dict[str, Any], int]:
    """
    Handle non-streaming property request - main processing pipeline.
    Orchestrates the complete flow: caching, fetching, analysis, and persistence.

    Args:
        params: API parameters dict
        address: Address string from request
        google_maps_api_key: Google Maps API key
        rapidapi_key: RapidAPI key
        start_time: Start time for elapsed calculation
        log_prefix: Logging prefix
        skip_pros_cons: If True, skip pros/cons generation

    Returns:
        Tuple of (response_data, status_code)
    """
    # Fast-path: check cache for fully populated record
    cache_result = check_cache_fast_path(
        params=params,
        address=address,
        start_time=start_time,
        log_prefix=log_prefix,
        remove_pros_cons=skip_pros_cons,
    )
    if cache_result:
        return cache_result

    # Fetch property data from RapidAPI
    data, error_response = fetch_property_from_rapidapi(params, rapidapi_key)
    if error_response:
        return error_response

    # Check for cached details
    cached_commute_data, cached_property_analysis, cached_features = (
        get_cached_details_with_pros_cons_removal(
            params=params, address=address, log_prefix=log_prefix, remove_pros_cons=skip_pros_cons
        )
    )

    # Process property data
    response_data = process_property_data(
        data=data or {},
        params=params,
        address=address,
        cached_commute_data=cached_commute_data,
        cached_property_analysis=cached_property_analysis,
        cached_features=cached_features,
        google_maps_api_key=google_maps_api_key,
        rapidapi_key=rapidapi_key,
        log_prefix=log_prefix,
        skip_pros_cons=skip_pros_cons,
    )

    return response_data, 200
