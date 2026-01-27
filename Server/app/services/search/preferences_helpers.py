"""
Helper functions for user preferences: retrieval, parsing, mapping to filters, and isochrone generation.
"""
from __future__ import annotations

import json
from typing import Dict, Any, List, Optional, Tuple
from flask import current_app, jsonify

from .locationPolygon import isochrone_union_for_addresses
from ...models import UserPreferences
from ...services.auth import get_current_user
from ...utils.security.security import security_error_response


def map_user_preferences_to_filters(user_preferences: Dict[str, Any], status_type: str = "ForSale") -> Dict[str, Any]:
    """Map user preferences to property API filters."""
    filters = {}
    
    # Map budget to price filters using range
    budget_min = user_preferences.get('home_budget_min')
    budget_max = user_preferences.get('home_budget_max')
    
    if budget_max:
        if status_type == "ForRent":
            filters['rentMaxPrice'] = int(budget_max / 12)  # Convert annual to monthly
            if budget_min:
                filters['rentMinPrice'] = int(budget_min / 12)
            else:
                filters['rentMinPrice'] = int(budget_max * 0.7 / 12)
        else:
            filters['maxPrice'] = int(budget_max)
            if budget_min:
                filters['minPrice'] = int(budget_min)
            else:
                filters['minPrice'] = int(budget_max * 0.65)
    
    # Map preferred bedrooms
    if user_preferences.get('preferred_bedrooms'):
        filters['bedsMin'] = user_preferences['preferred_bedrooms']
    
    # Map preferred bathrooms
    if user_preferences.get('preferred_bathrooms'):
        filters['bathsMin'] = user_preferences['preferred_bathrooms']
    
    # Map housing type based on status type
    raw_type = str(user_preferences.get('preferred_housing_type', user_preferences.get('housing_type', '')))
    if raw_type:
        user_type = raw_type.lower()
        
        if status_type == "ForRent":
            # For Rent: Townhomes, Houses, Apartments_Condos_Co-ops
            rent_type_map = {
                'single_family': 'Houses',
                'house': 'Houses',
                'houses': 'Houses',
                'townhouse': 'Townhomes',
                'townhomes': 'Townhomes',
                'condo': 'Apartments_Condos_Co-ops',
                'condos': 'Apartments_Condos_Co-ops',
                'apartment': 'Apartments_Condos_Co-ops',
                'apartments': 'Apartments_Condos_Co-ops',
                'co-op': 'Apartments_Condos_Co-ops',
                'coop': 'Apartments_Condos_Co-ops'
            }
            mapped_type = rent_type_map.get(user_type)
            if mapped_type:
                filters['home_type'] = mapped_type
        else:
            # For Sale/RecentlySold: Multi-family, Apartments, Houses, Manufactured, Condos, LotsLand, Townhomes
            sale_type_map = {
                'single_family': 'Houses',
                'house': 'Houses',
                'houses': 'Houses',
                'condo': 'Condos',
                'condos': 'Condos',
                'townhouse': 'Townhomes',
                'townhomes': 'Townhomes',
                'apartment': 'Apartments',
                'apartments': 'Apartments',
                'multi_family': 'Multi-family',
                'multifamily': 'Multi-family',
                'manufactured': 'Manufactured',
                'mobile': 'Manufactured',
                'land': 'LotsLand',
                'lot': 'LotsLand',
                'lots': 'LotsLand'
            }
            mapped_type = sale_type_map.get(user_type)
            if mapped_type:
                filters['home_type'] = mapped_type
    
    return filters


def generate_isochrone_polygon_from_preferences(user_preferences: Dict[str, Any]) -> Optional[List[Dict[str, float]]]:
    """
    Generate an isochrone polygon from user preferences using ALL important locations
    and their respective commute tolerances. Returns union polygon coordinates as list of {lat, lon} dicts.
    """
    try:
        # Extract important locations
        important_locations = []
        locations_data = user_preferences.get('important_locations')
        
        if isinstance(locations_data, str):
            try:
                locations_data = json.loads(locations_data)
            except json.JSONDecodeError:
                current_app.logger.error("🗺️ ISOCHRONE: ❌ Failed to parse important_locations JSON")
                return None
        
        if isinstance(locations_data, list) and locations_data:
            important_locations = locations_data
        
        if not important_locations:
            current_app.logger.warning("🗺️ ISOCHRONE: ⚠️ No important locations found in user preferences")
            current_app.logger.warning(f"🗺️ ISOCHRONE: ⚠️ Available user preference keys: {list(user_preferences.keys())}")
            current_app.logger.warning(f"🗺️ ISOCHRONE: ⚠️ Important locations data: {locations_data}")
            return None
        
        # Prepare address and commute tolerance pairs for all locations
        addresses_and_minutes = []
        
        for i, location in enumerate(important_locations):
            address = location.get('address')
            if not address:
                current_app.logger.warning(f"🗺️ ISOCHRONE: ⚠️ Location {i+1} has no address, skipping")
                continue
            
            # Get commute tolerance from the location (in minutes)
            commute_tolerance = location.get('commute_tolerance', 30)
            
            addresses_and_minutes.append((address, commute_tolerance))
        
        if not addresses_and_minutes:
            current_app.logger.error("🗺️ ISOCHRONE: ❌ No valid locations with addresses found")
            return None
        
        # Generate union isochrone polygon for all locations
        isochrone_feature = isochrone_union_for_addresses(
            addresses_and_minutes, 
            mode="drive",
            include_individual=False  # We only want the union, not individual polygons
        )
        
        # Extract coordinates from GeoJSON
        geometry = isochrone_feature.get('geometry', {})
        coordinates = geometry.get('coordinates', [])
        
        if geometry.get('type') == 'Polygon' and coordinates:
            # Polygon coordinates are [[[lon, lat], [lon, lat], ...]]
            polygon_coords = coordinates[0]  # Get outer ring
            # Convert to [{lat, lon}, {lat, lon}, ...] format expected by search API
            polygon_points = [{'lat': coord[1], 'lon': coord[0]} for coord in polygon_coords]

            return polygon_points
            
        elif geometry.get('type') == 'MultiPolygon' and coordinates:
            # Use the largest polygon from MultiPolygon
            largest_polygon = max(coordinates, key=lambda p: len(p[0]))
            polygon_coords = largest_polygon[0]  # Get outer ring of largest polygon
            polygon_points = [{'lat': coord[1], 'lon': coord[0]} for coord in polygon_coords]

            return polygon_points
        
        else:
            current_app.logger.error(f"🗺️ ISOCHRONE: ❌ Unexpected geometry type: {geometry.get('type')}")
            return None
            
    except Exception as e:
        current_app.logger.error(f"🗺️ ISOCHRONE: ❌ Failed to generate isochrone polygon: {e}")
        return None


def get_user_preferences_parsed(user_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[Tuple]]:
    """
    Get user preferences from database and parse JSON fields.
    
    Returns:
        Tuple of (user_preferences_dict, error_response_tuple)
        If error_response_tuple is not None, return it as HTTP response.
    """
    user_prefs_obj = UserPreferences.query.filter_by(user_id=user_id).first()
    
    if not user_prefs_obj:
        return None, (jsonify({
            "success": False,
            "error": "NO_PREFERENCES",
            "message": "User preferences not found. Please complete your profile setup."
        }), 400)
    
    user_preferences = user_prefs_obj.to_dict()
    
    # Parse JSON fields if they're strings
    for field in ['important_locations', 'preferred_home_features', 'deal_breakers']:
        if hasattr(user_prefs_obj, field):
            field_value = getattr(user_prefs_obj, field)
            if isinstance(field_value, str):
                try:
                    user_preferences[field] = json.loads(field_value)
                except json.JSONDecodeError:
                    user_preferences[field] = []
            else:
                user_preferences[field] = field_value or []
    
    return user_preferences, None


def get_authenticated_user() -> Tuple[Optional[Any], Optional[Tuple]]:
    """
    Get authenticated user with error handling.
    
    Returns:
        Tuple of (user_object, error_response_tuple)
        If error_response_tuple is not None, return it as HTTP response.
    """
    from app.services.auth import SecurityException
    try:
        user = get_current_user()
        if not user:
            return None, (jsonify({
                "success": False,
                "error": "USER_NOT_FOUND",
                "message": "User not found"
            }), 404)
    except SecurityException as se:
        # Handle SecurityException (wraps SecurityError tuples)
        return None, security_error_response(se.error_tuple)
    except Exception as auth_error:
        current_app.logger.error(f"❌ Authentication error: {str(auth_error)}")
        return None, (jsonify({
            "success": False,
            "error": "AUTH_ERROR",
            "message": "Authentication failed"
        }), 401)
    
    return user, None


def parse_important_locations(user_preferences: Dict[str, Any]) -> Tuple[Optional[list], Optional[str]]:
    """
    Parse important_locations from user preferences.
    
    Returns:
        Tuple of (locations_list, error_message)
        If error_message is not None, there was an error parsing.
    """
    locations_data = user_preferences.get('important_locations')
    
    if isinstance(locations_data, str):
        try:
            locations_data = json.loads(locations_data)
        except json.JSONDecodeError as e:
            current_app.logger.error(f"❌ Failed to parse important_locations JSON: {e}")
            return None, "Invalid important locations data"
    
    if isinstance(locations_data, list) and locations_data:
        return locations_data, None
    
    return None, "No important locations found in user preferences"
