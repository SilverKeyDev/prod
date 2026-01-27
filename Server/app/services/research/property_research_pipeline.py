"""
Property research pipeline for /property and /compare endpoints.
Handles the complete flow: fetching, caching, analysis generation, and persistence.
Consolidates common logic shared between /property and /compare routes.
"""
from typing import Optional, Dict, Any, Tuple
from flask import current_app
from datetime import datetime, timedelta
import requests
import time

from app.services.auth import get_current_user, SecurityException
from app.services.research.property_cache import find_cached_property, get_cached_data, get_cached_details
from app.services.research.property_params import (
    build_property_params,
    extract_property_address,
    extract_zpid
)
from app.services.research.property_commute import get_commute_data_for_property
from app.services.research.property_analysis import get_property_analysis_for_property
from app.services.research.property_images import fetch_zillow_images, extract_primary_image
from app.services.research.property_persistence import persist_property_data
from app.services.search.image_features import extract_and_clean_features
from app.services.search.property_features import extract_property_features
from app.models import HomeUniversal

RAPI_HOST = "us-housing-market-data1.p.rapidapi.com"


def get_current_user_safe() -> Optional[Any]:
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
    params: Dict[str, Any],
    address: Optional[str],
    start_time: float,
    log_prefix: str = "[PROPERTY]",
    remove_pros_cons: bool = False
) -> Optional[Tuple[Dict[str, Any], int]]:
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
                user_id=str(existing_user.id),
                zpid=zpid_param,
                address=address
            )
            
            if cached_property:
                cached_response = get_cached_data(cached_property, params)
                if cached_response:
                    # Remove pros/cons and neighborhood_overview from cached response if requested
                    if remove_pros_cons:
                        if cached_response.get('property_analysis') and isinstance(cached_response['property_analysis'], dict):
                            cached_response['property_analysis'] = {
                                k: v for k, v in cached_response['property_analysis'].items()
                                if k not in ['pros', 'cons', 'neighborhood_overview']
                            }
                    
                    elapsed = time.time() - start_time
                    current_app.logger.info(
                        f"{log_prefix} ✅ Returning cached data in {elapsed:.2f}ms "
                        f"(zpid={cached_property.zpid})"
                    )
                    return (cached_response, 200)
    except Exception as cache_err:
        current_app.logger.warning(
            f"{log_prefix} Cache fast-path failed, proceeding to fetch: {cache_err}",
            exc_info=True
        )
    
    return None


def fetch_property_from_rapidapi(
    params: Dict[str, Any],
    rapidapi_key: str
) -> Tuple[Optional[Dict[str, Any]], Optional[Tuple[Dict[str, Any], int]]]:
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
                "details": r.text[:800]
            },
            r.status_code
        )
        return None, error_response
    
    data = r.json()
    return data, None


def get_cached_details_with_pros_cons_removal(
    params: Dict[str, Any],
    address: Optional[str],
    log_prefix: str = "[PROPERTY]",
    remove_pros_cons: bool = False
) -> Tuple[Optional[Dict], Optional[Dict], Optional[Dict]]:
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
                user_id=str(existing_user.id),
                zpid=zpid_param,
                address=address
            )
            
            if cached_record:
                cached_commute_data, cached_property_analysis, cached_features = get_cached_details(cached_record)
                
                # Remove pros/cons and neighborhood_overview from cached analysis if requested
                if remove_pros_cons and cached_property_analysis and isinstance(cached_property_analysis, dict):
                    cached_property_analysis = {
                        k: v for k, v in cached_property_analysis.items()
                        if k not in ['pros', 'cons', 'neighborhood_overview']
                    }
    except Exception as cache_check_err:
        current_app.logger.debug(f"{log_prefix} Error checking cache for commute/analysis: {cache_check_err}")
    
    return cached_commute_data, cached_property_analysis, cached_features


def get_recent_property_analysis_sections(
    user_id: str,
    address: Optional[str],
    zpid: Optional[str],
    days_back: int = 14
) -> Dict[str, Dict[str, Any]]:
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
        from app.utils.address_format import normalize_address
        
        cutoff_date = datetime.utcnow() - timedelta(days=days_back)
        
        # Try to find property by zpid first, then by address
        property_record = None
        
        if zpid:
            property_record = HomeUniversal.query.filter_by(
                user_id=str(user_id),
                zpid=str(zpid)
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
                        'data': section_data,
                        'generated_at': property_record.updated_at.isoformat() if property_record.updated_at else None,
                        'is_recent': True
                    }
                return sections
        
        return {}
        
    except Exception as e:
        current_app.logger.warning(f"[PROPERTY] Error checking recent analysis sections: {e}")
        return {}


def process_property_data(
    data: Dict[str, Any],
    params: Dict[str, Any],
    address: Optional[str],
    cached_commute_data: Optional[Dict[str, Any]],
    cached_property_analysis: Optional[Dict[str, Any]],
    cached_features: Optional[Dict[str, Any]],
    google_maps_api_key: str,
    rapidapi_key: str,
    log_prefix: str = "[PROPERTY]",
    skip_pros_cons: bool = False
) -> Dict[str, Any]:
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
        google_maps_api_key=google_maps_api_key
    )
    
    # Generate property analysis (with smart schema generation and synthesis)
    property_analysis = get_property_analysis_for_property(
        property_address=property_address,
        data=data,
        cached_property_analysis=cached_property_analysis,
        skip_pros_cons=skip_pros_cons
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
        image_features = {'error': 'Failed to extract features from images'}
    
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
                primary_image=primary_image
            )
    except SecurityException:
        # Silently handle SecurityException for optional user context
        pass
    except Exception as persist_err:
        current_app.logger.error(
            f"{log_prefix} ⚠️ Failed to persist property details: {persist_err}",
            exc_info=True
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
        "images": zillow_api_images
    }
    
    return response_data


def handle_property_request_non_streaming(
    params: Dict[str, Any],
    address: Optional[str],
    google_maps_api_key: str,
    rapidapi_key: str,
    start_time: float,
    log_prefix: str = "[PROPERTY]",
    skip_pros_cons: bool = False
) -> Tuple[Dict[str, Any], int]:
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
        remove_pros_cons=skip_pros_cons
    )
    if cache_result:
        return cache_result
    
    # Fetch property data from RapidAPI
    data, error_response = fetch_property_from_rapidapi(params, rapidapi_key)
    if error_response:
        return error_response
    
    # Check for cached details
    cached_commute_data, cached_property_analysis, cached_features = get_cached_details_with_pros_cons_removal(
        params=params,
        address=address,
        log_prefix=log_prefix,
        remove_pros_cons=skip_pros_cons
    )
    
    # Process property data
    response_data = process_property_data(
        data=data,
        params=params,
        address=address,
        cached_commute_data=cached_commute_data,
        cached_property_analysis=cached_property_analysis,
        cached_features=cached_features,
        google_maps_api_key=google_maps_api_key,
        rapidapi_key=rapidapi_key,
        log_prefix=log_prefix,
        skip_pros_cons=skip_pros_cons
    )
    
    return response_data, 200
