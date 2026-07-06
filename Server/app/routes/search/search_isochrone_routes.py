"""Isochrone route (large handler split from main search routes)."""

from flask import jsonify, request

from app.schemas import IsochroneQueryParams
from app.utils.route.http_errors import forbidden, server_error, unauthorized
from app.utils.route.response_helpers import standardize_error_response
from app.utils.validation import validate_query
from logger import log

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


def _no_locations_response(message: str = "No important locations found"):
    return standardize_error_response(message, status_code=400, error_code="NO_LOCATIONS")


def _no_valid_locations_response():
    return standardize_error_response(
        "No valid locations with addresses found",
        status_code=400,
        error_code="NO_VALID_LOCATIONS",
    )


@search_bp.route("/isochrone", methods=["GET"])
@validate_query(IsochroneQueryParams)
def get_isochrone(query: IsochroneQueryParams | None = None):
    """
    Generate and return isochrone polygon data based on user preferences.
    Returns GeoJSON polygon representing areas reachable within commute tolerance
    from the first important location.
    """
    try:
        user, auth_error = get_authenticated_user()
        if auth_error:
            log.error("AUTH", "isochrone_user_authentication_failed", None)
            return auth_error
        if user is None:
            return unauthorized()

        requested = (
            query.preferences_user_id
            if query is not None
            else request.args.get("preferences_user_id")
        )
        resolved_prefs_uid, resolve_err = resolve_preferences_user_id_for_research(user, requested)
        if resolve_err is not None:
            return forbidden()

        user_preferences, pref_error = get_user_preferences_parsed(str(resolved_prefs_uid))
        if pref_error:
            return pref_error

        important_locations, loc_error = parse_important_locations(user_preferences or {})
        if loc_error:
            log.warn(
                "POLYGON_SEARCH",
                "isochrone_locations_parse_invalid",
                {
                    "prefs_user_id": str(resolved_prefs_uid),
                    "requested_preferences_user_id": requested,
                },
            )
            return standardize_error_response(
                loc_error,
                status_code=400,
                error_code="INVALID_LOCATIONS",
            )
        if not important_locations:
            return _no_locations_response()

        addresses_and_minutes = []
        geocoded_locations = []

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
                    log.error(
                        "SEARCH",
                        "isochrone_geocode_failed",
                        {
                            "location_name": name,
                            "address_prefix": address.strip()[:20] if address else None,
                        },
                    )
                    geocoded_locations.append(
                        {
                            "name": name,
                            "address": address.strip(),
                            "commute_tolerance": commute_tolerance,
                            "lat": None,
                            "lng": None,
                        }
                    )
                    log.warn(
                        "SEARCH",
                        "isochrone_geocode_null_coordinates",
                        {"location_name": name},
                    )

        if not addresses_and_minutes:
            log.warn(
                "SEARCH",
                "isochrone_no_valid_locations",
                {
                    "prefs_user_id": str(resolved_prefs_uid),
                    "requested_preferences_user_id": requested,
                    "important_location_count": len(important_locations),
                },
            )
            return _no_valid_locations_response()

        try:
            isochrone_feature = isochrone_union_for_addresses(
                addresses_and_minutes,
                mode="drive",
                include_individual=True,
            )
            if isinstance(isochrone_feature, dict) and "geometry" in isochrone_feature:
                isochrone_feature["geometry"]
        except Exception as e:
            log.error("SEARCH", "isochrone_generation_failed", e)
            return server_error(e, context={"endpoint": "isochrone"})

        if not important_locations:
            return _no_locations_response("No locations")

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
                center_lat, center_lon = 0, 0
                log.warn(
                    "SEARCH",
                    "isochrone_center_geocode_fallback",
                    {
                        "address_prefix": (primary_address or "")[:20],
                        "center_lat": center_lat,
                        "center_lon": center_lon,
                    },
                )
        except Exception as e:
            center_lat, center_lon = 0, 0
            log.error(
                "SEARCH",
                "isochrone_center_geocode_exception",
                {
                    "error": str(e),
                    "center_lat": center_lat,
                    "center_lon": center_lon,
                },
            )

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
                "commute_tolerance": primary_location.get("commute_tolerance", 30),
                "mode": "drive",
            },
        }

        return jsonify(response_data), 200

    except Exception as e:
        log.error("SEARCH", "isochrone_unexpected_error", e)
        return server_error(e, context={"endpoint": "isochrone"})
