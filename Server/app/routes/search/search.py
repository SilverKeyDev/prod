from __future__ import annotations

import time

from flask import Blueprint, current_app, jsonify, request

from ...services.search.api_client import (
    API_BASE,
    build_session,
    get_rapidapi_headers,
)
from ...services.search.helpers.geometry_helpers import geocode_address_google
from ...services.search.helpers.preferences_helpers import (
    get_authenticated_user,
    get_user_preferences_parsed,
    parse_important_locations,
)
from ...services.search.locationPolygon import isochrone_union_for_addresses
from ...services.search.polygon_search_runner import run_polygon_search
from ...utils.security.secure_errors import SecureErrorHandler

_SESSION = build_session()

search_bp = Blueprint("search", __name__, url_prefix="/api/v1/search")


@search_bp.route("/propertyComps", methods=["GET"])
def get_property_comps():
    """
    Get property comparables using property API.
    Prioritizes address parameter, with zpid and property_url as fallbacks.
    """
    try:
        # Get query parameters
        address = request.args.get("address")
        zpid = request.args.get("zpid")
        property_url = request.args.get("property_url")

        # Validate that at least one parameter is provided
        if not address and not zpid and not property_url:
            return jsonify(
                {
                    "success": False,
                    "error": "BAD_REQUEST",
                    "message": "Provide one of: address, zpid, or property_url",
                }
            ), 400

        # Build API request parameters - prioritize address
        params = {}
        if address and str(address).strip():
            params["address"] = str(address).strip()
        elif zpid:
            try:
                params["zpid"] = str(int(str(zpid).strip()))
            except (ValueError, TypeError):
                return jsonify(
                    {"success": False, "error": "BAD_REQUEST", "message": "Invalid zpid format"}
                ), 400
        elif property_url:
            params["property_url"] = str(property_url).strip()

        # Make API request to Zillow
        url = f"{API_BASE}/propertyComps"
        headers = get_rapidapi_headers()

        response = _SESSION.get(url, headers=headers, params=params, timeout=300)

        # Handle API response
        if not response.ok:
            current_app.logger.error(f"🏠 [PROPERTY_COMPS] API Error: {response.status_code}")
            return SecureErrorHandler.handle_external_api_error(
                Exception(f"API returned status {response.status_code}"),
                "Property API",
                {"endpoint": "propertyComps", "status_code": response.status_code},
            )

        # Parse response data
        try:
            data = response.json()
        except ValueError as e:
            current_app.logger.error(f"🏠 [PROPERTY_COMPS] JSON Parse Error: {e}")
            return jsonify(
                {
                    "success": False,
                    "error": "PARSE_ERROR",
                    "message": "Failed to parse API response",
                }
            ), 500

        # Return successful response
        return jsonify(
            {"success": True, "query": params, "data": data, "source": "zillow_rapidapi"}
        ), 200

    except Exception as e:
        current_app.logger.error(f"🏠 [PROPERTY_COMPS] Unexpected error: {e}", exc_info=True)
        return jsonify(
            {
                "success": False,
                "error": "INTERNAL_ERROR",
                "message": "An unexpected error occurred while fetching property comparables",
            }
        ), 500


@search_bp.route("/properties-by-polygon", methods=["POST"])
def search_properties_by_polygon():
    """
    Polygon search endpoint. Without forceSearch: read-only response from persisted results (no new search).
    With forceSearch: run full pipeline (isochrone, search, filters, score, persist).
    Delegates to run_polygon_search; returns JSON and status code.
    """
    start_time = time.time()
    request_id = f"poly_{int(start_time * 1000)}"
    user, auth_error = get_authenticated_user()
    if auth_error:
        return auth_error
    if user is None:
        return jsonify(
            {"success": False, "error": "UNAUTHORIZED", "message": "Authentication required"}
        ), 401
    data = request.get_json(silent=True) or {}
    try:
        result = run_polygon_search(str(user.id), data)
        if result[0] is None:
            return result[1]
        return jsonify(result[0]), result[1]
    except Exception as e:
        total_time = time.time() - start_time
        current_app.logger.error(
            f"[POLYGON_SEARCH] ❌ {request_id} - Exception: {e}", exc_info=True
        )
        return jsonify(
            {
                "success": False,
                "error": "INTERNAL",
                "message": str(e),
                "requestId": request_id,
                "searchTime": round(total_time, 2),
            }
        ), 500


@search_bp.route("/isochrone", methods=["GET"])
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
        if user is None:
            return jsonify(
                {"success": False, "error": "UNAUTHORIZED", "message": "Authentication required"}
            ), 401

        # Get and parse user preferences
        user_preferences, pref_error = get_user_preferences_parsed(str(user.id))
        if pref_error:
            return pref_error

        # Parse important locations
        important_locations, loc_error = parse_important_locations(user_preferences or {})
        if loc_error:
            current_app.logger.warning(f"[ISOCHRONE] ⚠️ {loc_error}")
            return jsonify({"success": False, "error": "NO_LOCATIONS", "message": loc_error}), 400
        if not important_locations:
            return jsonify(
                {
                    "success": False,
                    "error": "NO_LOCATIONS",
                    "message": "No important locations found",
                }
            ), 400

        # Prepare address and commute tolerance pairs for all locations and geocode them
        addresses_and_minutes = []
        geocoded_locations = []
        primary_location = important_locations[0]
        primary_address = primary_location.get("address", "")
        primary_name = (
            primary_location.get("name")
            or primary_location.get("address", "")[:40]
            or "Primary Location"
        )

        # Use the Google Maps geocoding function
        for location in important_locations:
            address = location.get("address")
            commute_tolerance = location.get("commute_tolerance", 30)
            name = location.get("name") or location.get("address", "")[:40] or "Unknown Location"

            if address and address.strip():
                addresses_and_minutes.append((address.strip(), commute_tolerance))

                # Geocode the address to get coordinates using Google Maps API
                coords = geocode_address_google(address.strip())
                if coords:
                    lat, lng = coords
                    geocoded_locations.append(
                        {
                            "name": name,
                            "address": address.strip(),
                            "commute_tolerance": commute_tolerance,
                            "lat": lat,
                            "lng": lng,
                        }
                    )
                else:
                    current_app.logger.error(
                        f"[ISOCHRONE] ❌ Failed to geocode {name} at {address}"
                    )
                    # Add location with null coordinates to maintain consistency
                    geocoded_locations.append(
                        {
                            "name": name,
                            "address": address.strip(),
                            "commute_tolerance": commute_tolerance,
                            "lat": None,
                            "lng": None,
                        }
                    )
                    current_app.logger.warning(
                        f"[ISOCHRONE] ⚠️ Added {name} with null coordinates due to geocoding failure"
                    )

        if not addresses_and_minutes:
            return jsonify(
                {
                    "success": False,
                    "error": "NO_VALID_LOCATIONS",
                    "message": "No valid locations with addresses found",
                }
            ), 400

        # Generate union isochrone polygon for all locations
        try:
            isochrone_feature = isochrone_union_for_addresses(
                addresses_and_minutes,
                mode="drive",
                include_individual=True,  # Include individual polygons for rendering
            )
            if isinstance(isochrone_feature, dict) and "geometry" in isochrone_feature:
                isochrone_feature["geometry"]
        except Exception as e:
            return jsonify(
                {
                    "success": False,
                    "error": "ISOCHRONE_GENERATION_FAILED",
                    "message": f"Failed to generate isochrone polygon: {str(e)}",
                }
            ), 500

        # Calculate center point from all locations (use first location as primary center for backward compatibility)
        if not important_locations:
            return jsonify(
                {"success": False, "error": "NO_LOCATIONS", "message": "No locations"}
            ), 400
        primary_location = important_locations[0]
        primary_address = primary_location.get("address")
        primary_name = (
            primary_location.get("name")
            or primary_location.get("address", "")[:40]
            or "Multiple Locations"
        )

        try:
            coords = geocode_address_google(primary_address) if primary_address else None
            if coords:
                center_lat, center_lon = coords
            else:
                # Fallback: use center of isochrone bounds if available
                center_lat, center_lon = 0, 0
                current_app.logger.warning(
                    f"🗺️ [ISOCHRONE_CENTER] Geocoding failed for address '{primary_address}', using fallback coordinates: lat={center_lat}, lon={center_lon}"
                )
        except Exception as e:
            center_lat, center_lon = 0, 0
            current_app.logger.error(
                f"🗺️ [ISOCHRONE_CENTER] Exception during geocoding: {str(e)}, using fallback coordinates: lat={center_lat}, lon={center_lon}"
            )

        # Extract individual isochrones if available
        individual_isochrones = []
        if isinstance(isochrone_feature, dict) and "extras" in isochrone_feature:
            individual_features = isochrone_feature["extras"].get("individual_features", []) or []
            for i, feature in enumerate(individual_features):
                if i < len(important_locations):
                    location = important_locations[i]
                    individual_isochrones.append(
                        {
                            "name": location.get("name")
                            or location.get("address", "")[:40]
                            or f"Location {i + 1}",
                            "address": location.get("address"),
                            "commute_tolerance": location.get("commute_tolerance", 30),
                            "isochrone": feature,
                        }
                    )

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
                    "name": primary_name,
                },
                "locations": geocoded_locations,
                "commute_tolerance": primary_location.get(
                    "commute_tolerance", 30
                ),  # Primary location's tolerance for backward compatibility
                "mode": "drive",
            },
        }

        return jsonify(response_data), 200

    except Exception as e:
        current_app.logger.error(f"[ISOCHRONE] ❌ Unexpected error in get_isochrone: {e}")
        current_app.logger.error(f"[ISOCHRONE] ❌ Error type: {type(e)}")
        current_app.logger.error("[ISOCHRONE] ❌ Error traceback:", exc_info=True)
        return jsonify(
            {
                "success": False,
                "error": "INTERNAL_ERROR",
                "message": f"Internal server error: {str(e)}",
            }
        ), 500
