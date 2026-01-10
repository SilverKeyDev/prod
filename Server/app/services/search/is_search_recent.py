"""
Helper functions for checking if search results are recent and retrieving cached results.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from flask import current_app

from app import db
from app.models import HomeUniversal, UserPreferences


def is_search_cache_valid(user_id: str) -> Tuple[bool, Optional[List[Dict[str, Any]]]]:
    """
    Check if search results cache is valid for a user.
    
    Cache is valid if:
    1. User has searched within the last 7 days (HomeUniversal records with current=True and updated_at within 7 days)
    2. User preferences haven't changed in the last 7 days (UserPreferences.updated_at within 7 days)
    
    Args:
        user_id: User ID to check cache for
        
    Returns:
        Tuple of (is_valid: bool, cached_results: Optional[List[Dict]]):
        - If cache is valid, returns (True, cached_results)
        - If cache is invalid, returns (False, None)
    """
    try:
        # Calculate 7 days ago threshold
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        # Check if user has current search results updated within last 7 days
        current_homes = HomeUniversal.query.filter(
            HomeUniversal.user_id == str(user_id),
            HomeUniversal.current == True
        ).order_by(HomeUniversal.ranking.asc()).all()
        
        if not current_homes:
            current_app.logger.debug(f"[CACHE] No current search results found for user {user_id}")
            return False, None
        
        # Check if most recent search result is within 7 days
        most_recent_search = max(
            (home.updated_at for home in current_homes if home.updated_at),
            default=None
        )
        
        if not most_recent_search or most_recent_search < seven_days_ago:
            current_app.logger.debug(
                f"[CACHE] Search results too old for user {user_id}. "
                f"Most recent: {most_recent_search}, threshold: {seven_days_ago}"
            )
            return False, None
        
        # Check if user preferences have been updated within last 7 days
        user_prefs = UserPreferences.query.filter_by(user_id=str(user_id)).first()
        
        if not user_prefs:
            current_app.logger.debug(f"[CACHE] No user preferences found for user {user_id}")
            return False, None
        
        if not user_prefs.updated_at or user_prefs.updated_at < seven_days_ago:
            current_app.logger.debug(
                f"[CACHE] User preferences too old for user {user_id}. "
                f"Updated: {user_prefs.updated_at}, threshold: {seven_days_ago}"
            )
            return False, None
        
        # Both conditions met - cache is valid
        cached_results = get_cached_search_results(user_id)
        current_app.logger.info(
            f"[CACHE] ✅ Cache valid for user {user_id}. "
            f"Returning {len(cached_results)} cached results"
        )
        return True, cached_results
        
    except Exception as e:
        current_app.logger.error(
            f"[CACHE] ❌ Error checking cache validity for user {user_id}: {e}",
            exc_info=True
        )
        return False, None


def get_cached_search_results(user_id: str) -> List[Dict[str, Any]]:
    """
    Retrieve cached search results from HomeUniversal table.
    
    Args:
        user_id: User ID to get cached results for
        
    Returns:
        List of property dictionaries in API response format
    """
    try:
        # Query current homes ordered by ranking (1 = best)
        homes = HomeUniversal.query.filter(
            HomeUniversal.user_id == str(user_id),
            HomeUniversal.current == True
        ).order_by(HomeUniversal.ranking.asc()).all()
        
        results = []
        for home in homes:
            # Transform HomeUniversal to PropertySearchResult format
            property_dict: Dict[str, Any] = {}
            
            # Basic identifiers
            if home.zpid:
                property_dict['zpid'] = str(home.zpid)
            if home.mls_home_id:
                property_dict['mls_home_id'] = home.mls_home_id
            
            # Address
            if home.address:
                property_dict['address'] = home.address
            
            # Price - convert string to number if possible
            if home.price:
                try:
                    # Remove commas and dollar signs, then convert
                    price_str = str(home.price).replace(',', '').replace('$', '').strip()
                    property_dict['price'] = int(float(price_str))
                except (ValueError, TypeError):
                    # If conversion fails, keep as string in raw_data
                    property_dict['price'] = None
            
            # Bedrooms and bathrooms - convert string to int if possible
            if home.beds:
                try:
                    property_dict['bedrooms'] = int(float(str(home.beds)))
                except (ValueError, TypeError):
                    property_dict['bedrooms'] = None
            
            if home.baths:
                try:
                    property_dict['bathrooms'] = int(float(str(home.baths)))
                except (ValueError, TypeError):
                    property_dict['bathrooms'] = None
            
            # Living area (sqft) - convert string to number
            if home.sqft or home.living_area:
                sqft_value = home.sqft or home.living_area
                try:
                    sqft_str = str(sqft_value).replace(',', '').strip()
                    property_dict['livingArea'] = int(float(sqft_str))
                except (ValueError, TypeError):
                    property_dict['livingArea'] = None
            
            # Coordinates
            if home.latitude is not None:
                property_dict['latitude'] = float(home.latitude)
            if home.longitude is not None:
                property_dict['longitude'] = float(home.longitude)
            
            # Lot area
            if home.lot_area_value:
                try:
                    lot_value_str = str(home.lot_area_value).replace(',', '').strip()
                    property_dict['lotAreaValue'] = float(lot_value_str)
                except (ValueError, TypeError):
                    property_dict['lotAreaValue'] = None
            
            if home.lot_area_unit:
                property_dict['lotAreaUnit'] = str(home.lot_area_unit)
            
            # Property type and status
            if home.property_type:
                property_dict['propertyType'] = home.property_type
            if home.listing_status:
                property_dict['listingStatus'] = home.listing_status
            
            # Image
            if home.image_url:
                property_dict['imgSrc'] = home.image_url
            
            # Score - map score to _score (backend uses _score)
            if home.score is not None:
                property_dict['_score'] = float(home.score)
            else:
                property_dict['_score'] = 0.0
            
            # Include raw_data if available for additional fields
            if home.raw_data and isinstance(home.raw_data, dict):
                # Merge any additional fields from raw_data
                for key, value in home.raw_data.items():
                    if key not in property_dict:
                        property_dict[key] = value
            
            results.append(property_dict)
        
        current_app.logger.debug(
            f"[CACHE] Retrieved {len(results)} cached results for user {user_id}"
        )
        return results
        
    except Exception as e:
        current_app.logger.error(
            f"[CACHE] ❌ Error retrieving cached results for user {user_id}: {e}",
            exc_info=True
        )
        return []
