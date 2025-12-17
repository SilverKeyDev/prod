from __future__ import annotations

from flask import Blueprint, request, jsonify, current_app
from ..services.search.locationPolygon import isochrone_union_for_addresses
from ..utils.security.secure_errors import SecureErrorHandler

# Import helper modules
from ..services.search.geometry_helpers import (
    simplify_polygon,
    to_polygon_param,
    geocode_address_google
)
from ..services.search.preferences_helpers import (
    map_user_preferences_to_filters,
    generate_isochrone_polygon_from_preferences,
    get_user_preferences_parsed,
    get_authenticated_user,
    parse_important_locations
)
from ..services.search.api_client import (
    build_session,
    get_rapidapi_headers,
    API_BASE
)
from ..services.search.scoring_helpers import score_and_sort_properties
from ..services.search.persistence_helpers import persist_and_prune_search_results
from ..services.search.search_loop_helpers import search_properties_paginated

import time
import json
from typing import Dict, Any, List

# Build session for API requests
_SESSION = build_session()

search_bp = Blueprint('search', __name__, url_prefix='/api/v1/search')

        
@search_bp.route('/propertyComps', methods=['GET'])
def get_property_comps():
    """
    Get property comparables using Zillow API.
    Prioritizes address parameter, with zpid and property_url as fallbacks.
    """
    try:
        # Get query parameters
        address = request.args.get('address')
        zpid = request.args.get('zpid')
        property_url = request.args.get('property_url')
        
        # Validate that at least one parameter is provided
        if not address and not zpid and not property_url:
            return jsonify({
                "success": False, 
                "error": "BAD_REQUEST",
                "message": "Provide one of: address, zpid, or property_url"
            }), 400
        
        # Build API request parameters - prioritize address
        params = {}
        if address and str(address).strip():
            params['address'] = str(address).strip()
        elif zpid:
            try:
                params['zpid'] = str(int(str(zpid).strip()))
            except (ValueError, TypeError):
                return jsonify({
                    "success": False,
                    "error": "BAD_REQUEST", 
                    "message": "Invalid zpid format"
                }), 400
        elif property_url:
            params['property_url'] = str(property_url).strip()
        
        # Make API request to Zillow
        url = f"{API_BASE}/propertyComps"
        headers = get_rapidapi_headers()
                
        response = _SESSION.get(url, headers=headers, params=params, timeout=300)
        
        # Handle API response
        if not response.ok:
            current_app.logger.error(f"🏠 [PROPERTY_COMPS] API Error: {response.status_code}")
            return SecureErrorHandler.handle_external_api_error(
                Exception(f"API returned status {response.status_code}"),
                'Zillow API',
                {'endpoint': 'propertyComps', 'status_code': response.status_code}
            )
        
        # Parse response data
        try:
            data = response.json()
        except ValueError as e:
            current_app.logger.error(f"🏠 [PROPERTY_COMPS] JSON Parse Error: {e}")
            return jsonify({
                "success": False,
                "error": "PARSE_ERROR",
                "message": "Failed to parse API response"
            }), 500
        
        # Return successful response
        return jsonify({
            "success": True,
            "query": params,
            "data": data,
            "source": "zillow_rapidapi"
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"🏠 [PROPERTY_COMPS] Unexpected error: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred while fetching property comparables"
        }), 500


@search_bp.route('/properties-by-polygon', methods=['POST'])
def search_properties_by_polygon():
    """
    Polygon search WITHOUT price buckets.
    Grabs pages until we collect the first TARGET_LIMIT unique homes (or results end).
    minPrice / maxPrice are set from user_preferences.home_budget.
    """
    start_time = time.time()
    request_id = f"poly_{int(start_time * 1000)}"
    TARGET_LIMIT = 10  # hard cap on deduped results

    # Authenticate user
    user, auth_error = get_authenticated_user()
    if auth_error:
        return auth_error

    try:
        # Get and parse user preferences
        user_preferences, pref_error = get_user_preferences_parsed(str(user.id))
        if pref_error:
            current_app.logger.error(f"[POLYGON_SEARCH] ❌ {request_id} - User preferences not found")
            return pref_error

        data = request.get_json(silent=True) or {}
        status_type = "ForSale"
        per_pages = max(0, min(int(data.get("perBucketPages", 20)), 20))

        # ---- Generate polygon ----
        polygon = generate_isochrone_polygon_from_preferences(user_preferences)
        if not polygon:
            current_app.logger.error(f"[POLYGON_SEARCH] ❌ {request_id} - Failed to generate isochrone polygon")
            return jsonify({"success": False, "error": "ISOCHRONE_FAILED", "message": "Failed to generate search area"}), 400
        
        
        if polygon[0] != polygon[-1]:
            polygon.append(polygon[0])
        polygon = simplify_polygon(polygon, max_points=50)

        polygon_param = to_polygon_param(polygon)

        # Build filters and search properties
        filters = map_user_preferences_to_filters(user_preferences, status_type)
        all_properties, requests_made, errors = search_properties_paginated(
            polygon_param=polygon_param,
            filters=filters,
            status_type=status_type,
            per_pages=per_pages,
            target_limit=TARGET_LIMIT,
            request_id=request_id
        )

        # Score and sort properties
        user_data = {"user_id": user.id, "preferences": user_preferences}
        scored_properties = score_and_sort_properties(
            properties=all_properties,
            user_data=user_data,
            request_id=request_id
        )

        # Persist results and prune unliked homes
        persist_and_prune_search_results(str(user.id), scored_properties)

        # Log sample scores for debugging
        if scored_properties:
            sample_scores = [(p.get("zpid"), p.get("_score", 0.0)) for p in scored_properties[:3]]
            current_app.logger.info(f"[POLYGON_SEARCH] 📊 {request_id} - Sample scores (first 3): {sample_scores}")
        
        total_time = time.time() - start_time
        response_data = {
            "success": True,
            "properties": scored_properties,  # Frontend expects properties at root level
            "total_count": len(scored_properties),
            "has_more": False,
            "meta": {
                "requestsMade": requests_made,
                "deduped": len(scored_properties),
                "errors": errors[:20],
                "status_type": status_type,
                "pagesTried": per_pages + 1,
                "searchTime": round(total_time, 2),
                "scored": len(scored_properties) > 0 and scored_properties[0].get("_score", 0.0) > 0,
                "requestId": request_id,
                "limit": TARGET_LIMIT
            }
        }
        
        return jsonify(response_data), 200

    except Exception as e:
        total_time = time.time() - start_time
        return jsonify({
            "success": False,
            "error": "INTERNAL",
            "message": str(e),
            "requestId": request_id,
            "searchTime": round(total_time, 2)
        }), 500



@search_bp.route('/isochrone', methods=['GET'])
def get_isochrone():
    """
    Generate and return isochrone polygon data based on user preferences.
    Returns GeoJSON polygon representing areas reachable within commute tolerance
    from the first important location.
    """
    try:
        # Authenticate user
        user, auth_error = get_authenticated_user()
        if auth_error:
            current_app.logger.error("[ISOCHRONE] ❌ User authentication failed")
            return auth_error

        # Get and parse user preferences
        user_preferences, pref_error = get_user_preferences_parsed(str(user.id))
        if pref_error:
            return pref_error

        # Parse important locations
        important_locations, loc_error = parse_important_locations(user_preferences)
        if loc_error:
            current_app.logger.warning(f"[ISOCHRONE] ⚠️ {loc_error}")
            return jsonify({
                "success": False,
                "error": "NO_LOCATIONS",
                "message": loc_error
            }), 400

        # Prepare address and commute tolerance pairs for all locations and geocode them
        addresses_and_minutes = []
        geocoded_locations = []
        primary_location = important_locations[0]  # Use first location as primary for backward compatibility
        primary_address = primary_location.get('address', '')
        primary_name = primary_location.get('name', 'Primary Location')
        
        # Use the Google Maps geocoding function
        for location in important_locations:
            address = location.get('address')
            commute_tolerance = location.get('commute_tolerance', 30)
            name = location.get('name', 'Unknown Location')
            
            if address and address.strip():
                addresses_and_minutes.append((address.strip(), commute_tolerance))
                
                # Geocode the address to get coordinates using Google Maps API
                coords = geocode_address_google(address.strip())
                if coords:
                    lat, lng = coords
                    geocoded_locations.append({
                        "name": name,
                        "address": address.strip(),
                        "commute_tolerance": commute_tolerance,
                        "lat": lat,
                        "lng": lng
                    })
                else:
                    current_app.logger.error(f"[ISOCHRONE] ❌ Failed to geocode {name} at {address}")
                    # Add location with null coordinates to maintain consistency
                    geocoded_locations.append({
                        "name": name,
                        "address": address.strip(),
                        "commute_tolerance": commute_tolerance,
                        "lat": None,
                        "lng": None
                    })
                    current_app.logger.warning(f"[ISOCHRONE] ⚠️ Added {name} with null coordinates due to geocoding failure")
        
        if not addresses_and_minutes:
            return jsonify({
                "success": False,
                "error": "NO_VALID_LOCATIONS",
                "message": "No valid locations with addresses found"
            }), 400

        # Generate union isochrone polygon for all locations
        try:
            isochrone_feature = isochrone_union_for_addresses(
                addresses_and_minutes, 
                mode="drive",
                include_individual=True  # Include individual polygons for rendering
            )
            if isinstance(isochrone_feature, dict) and 'geometry' in isochrone_feature:
                geom = isochrone_feature['geometry']
        except Exception as e:
            return jsonify({
                "success": False,
                "error": "ISOCHRONE_GENERATION_FAILED",
                "message": f"Failed to generate isochrone polygon: {str(e)}"
            }), 500
        
        # Calculate center point from all locations (use first location as primary center for backward compatibility)
        primary_location = important_locations[0]
        primary_address = primary_location.get('address')
        primary_name = primary_location.get('name', 'Multiple Locations')
        
        try:
            coords = geocode_address_google(primary_address) if primary_address else None
            if coords:
                center_lat, center_lon = coords
            else:
                # Fallback: use center of isochrone bounds if available
                center_lat, center_lon = 0, 0
                current_app.logger.warning(f"🗺️ [ISOCHRONE_CENTER] Geocoding failed for address '{primary_address}', using fallback coordinates: lat={center_lat}, lon={center_lon}")
        except Exception as e:
            center_lat, center_lon = 0, 0
            current_app.logger.error(f"🗺️ [ISOCHRONE_CENTER] Exception during geocoding: {str(e)}, using fallback coordinates: lat={center_lat}, lon={center_lon}")
        
        # Extract individual isochrones if available
        individual_isochrones = []
        if isinstance(isochrone_feature, dict) and 'extras' in isochrone_feature:
            individual_features = isochrone_feature['extras'].get('individual_features', [])
            for i, feature in enumerate(individual_features):
                if i < len(important_locations):
                    location = important_locations[i]
                    individual_isochrones.append({
                        "name": location.get('name', f'Location {i+1}'),
                        "address": location.get('address'),
                        "commute_tolerance": location.get('commute_tolerance', 30),
                        "isochrone": feature
                    })

        # Return the isochrone data
        response_data = {
            "success": True,
            "data": {
                "isochrone": isochrone_feature,
                "individual_isochrones": individual_isochrones,
                "center": {
                    "lat": center_lat,
                    "lon": center_lon,
                    "address": primary_address,
                    "name": primary_name
                },
                "locations": geocoded_locations,
                "commute_tolerance": primary_location.get('commute_tolerance', 30),  # Primary location's tolerance for backward compatibility
                "mode": "drive"
            }
        }
                
        return jsonify(response_data), 200

    except Exception as e:
        current_app.logger.error(f"[ISOCHRONE] ❌ Unexpected error in get_isochrone: {e}")
        current_app.logger.error(f"[ISOCHRONE] ❌ Error type: {type(e)}")
        current_app.logger.error(f"[ISOCHRONE] ❌ Error traceback:", exc_info=True)
        return jsonify({
            "success": False,
            "error": "INTERNAL_ERROR",
            "message": f"Internal server error: {str(e)}"
        }), 500


