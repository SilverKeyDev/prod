"""Isochrone route (large handler split from main search routes)."""

from flask import current_app, jsonify, request

from logger import LOG_CATEGORIES, log

from ...services.search.helpers.geometry_helpers import geocode_address_google
from ...services.search.helpers.preferences_helpers import (
    get_authenticated_user,
    get_user_preferences_parsed,
    parse_important_locations,
)
from ...services.search.polygon.locationPolygon import isochrone_union_for_addresses
from ...services.search.scoring.research_preferences_context import (
    resolve_preferences_user_id_for_research,
)
from .search_blueprint import search_bp


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
            current_app.logger.error("[ISOCHRONE] User authentication failed")
            return auth_error
        if user is None:
            return jsonify(
                {"success": False, "error": "UNAUTHORIZED", "message": "Authentication required"}
            ), 401

        requested = request.args.get("preferences_user_id")
        resolved_prefs_uid, resolve_err = resolve_preferences_user_id_for_research(user, requested)
        if resolve_err is not None:
            return jsonify(resolve_err), 403
        assert resolved_prefs_uid is not None

        # Get and parse user preferences
        user_preferences, pref_error = get_user_preferences_parsed(str(resolved_prefs_uid))
        if pref_error:
            return pref_error

        # Parse important locations
        important_locations, loc_error = parse_important_locations(user_preferences or {})
        if loc_error:
            current_app.logger.warning("[ISOCHRONE] %s", loc_error)
            log.warn(
                LOG_CATEGORIES["ERRORS"],
                "[ISOCHRONE] 400 NO_LOCATIONS (parse important_locations failed)",
                {
                    "prefs_user_id": str(resolved_prefs_uid),
                    "requested_preferences_user_id": requested,
                    "parse_error": loc_error,
                },
            )
            return jsonify({"success": False, "error": "NO_LOCATIONS", "message": loc_error}), 400
        if not important_locations:
            log.warn(
                LOG_CATEGORIES["ERRORS"],
                "[ISOCHRONE] 400 NO_LOCATIONS (empty important_locations list)",
                {
                    "prefs_user_id": str(resolved_prefs_uid),
                    "requested_preferences_user_id": requested,
                },
            )
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

        # Use the Google Maps geocoding function
        for location in important_locations:
            address = location.get("address")
            commute_tolerance = location.get("commute_tolerance", 30)
            name = location.get("name") or location.get("address", "")[:40] or "Unknown Location"

            if address and address.strip():
                try:
                    minutes = float(commute_tolerance)
                except (TypeError, ValueError):
                    minutes = 30.0
                addresses_and_minutes.append((address.strip(), minutes))

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
                        "[ISOCHRONE] Failed to geocode %s at %s", name, address
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
                        "[ISOCHRONE] Added %s with null coordinates due to geocoding failure",
                        name,
                    )

        if not addresses_and_minutes:
            log.warn(
                LOG_CATEGORIES["ERRORS"],
                "[ISOCHRONE] 400 NO_VALID_LOCATIONS (no non-blank addresses after parsing)",
                {
                    "prefs_user_id": str(resolved_prefs_uid),
                    "requested_preferences_user_id": requested,
                    "important_location_count": len(important_locations),
                },
            )
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
                    "[ISOCHRONE_CENTER] Geocoding failed for address '%s', using fallback coordinates: lat=%s, lon=%s",
                    primary_address,
                    center_lat,
                    center_lon,
                )
        except Exception as e:
            center_lat, center_lon = 0, 0
            current_app.logger.error(
                "[ISOCHRONE_CENTER] Exception during geocoding: %s, using fallback coordinates: lat=%s, lon=%s",
                str(e),
                center_lat,
                center_lon,
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
        current_app.logger.error("[ISOCHRONE] Unexpected error in get_isochrone: %s", e)
        current_app.logger.error("[ISOCHRONE] Error type: %s", type(e))
        current_app.logger.error("[ISOCHRONE] Error traceback:", exc_info=True)
        return jsonify(
            {
                "success": False,
                "error": "INTERNAL_ERROR",
                "message": f"Internal server error: {str(e)}",
            }
        ), 500
