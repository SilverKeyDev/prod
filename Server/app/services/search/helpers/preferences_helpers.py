"""
Helper functions for user preferences: retrieval, parsing, mapping to filters, and isochrone generation.
"""

from __future__ import annotations

import json
from typing import Any

from flask import jsonify

from logger import log

from ....utils.security.security import security_error_response
from ...aggregation import get_preferences_dict_for_user
from ...auth import get_current_user


def map_user_preferences_to_filters(
    user_preferences: dict[str, Any], status_type: str = "ForSale"
) -> dict[str, Any]:
    """Map user preferences to RapidAPI ``propertyByPolygon`` filter params.

    Output keys match what ``search_loop_helpers`` forwards:
      home_type, bedsMin, bathsMin, minPrice, maxPrice,
      minSqft, maxSqft, daysOnMarketMin, daysOnMarketMax
      (plus rentMinPrice/rentMaxPrice when status_type is ForRent).
    """
    filters: dict[str, Any] = {}

    budget_min = user_preferences.get("home_budget_min")
    budget_max = user_preferences.get("home_budget_max")

    if budget_max is not None:
        try:
            budget_max_i = int(budget_max)
            if status_type == "ForRent":
                filters["rentMaxPrice"] = int(budget_max_i / 12)
                if budget_min is not None:
                    filters["rentMinPrice"] = int(int(budget_min) / 12)
                else:
                    filters["rentMinPrice"] = int(budget_max_i * 0.7 / 12)
            else:
                filters["maxPrice"] = budget_max_i
                if budget_min is not None:
                    filters["minPrice"] = int(budget_min)
                else:
                    filters["minPrice"] = int(budget_max_i * 0.65)
        except (TypeError, ValueError):
            pass
    elif budget_min is not None:
        try:
            if status_type == "ForRent":
                filters["rentMinPrice"] = int(int(budget_min) / 12)
            else:
                filters["minPrice"] = int(budget_min)
        except (TypeError, ValueError):
            pass

    beds_min = user_preferences.get("preferred_bedrooms_min")
    if beds_min is not None:
        try:
            filters["bedsMin"] = int(beds_min)
        except (TypeError, ValueError):
            pass

    baths_min = user_preferences.get("preferred_bathrooms_min")
    if baths_min is not None:
        try:
            filters["bathsMin"] = int(baths_min)
        except (TypeError, ValueError):
            pass

    raw_type = str(
        user_preferences.get("preferred_housing_type", user_preferences.get("housing_type", ""))
    )
    if raw_type:
        # RapidAPI accepts a single home_type token for the first mapped value.
        # Comma-separated prefs: use the first recognized token.
        first_token = raw_type.split(",")[0].strip().lower()

        if status_type == "ForRent":
            rent_type_map = {
                "single_family": "Houses",
                "house": "Houses",
                "houses": "Houses",
                "townhouse": "Townhomes",
                "townhome": "Townhomes",
                "townhomes": "Townhomes",
                "condo": "Apartments_Condos_Co-ops",
                "condos": "Apartments_Condos_Co-ops",
                "condos-co-ops": "Apartments_Condos_Co-ops",
                "apartment": "Apartments_Condos_Co-ops",
                "apartments": "Apartments_Condos_Co-ops",
                "co-op": "Apartments_Condos_Co-ops",
                "coop": "Apartments_Condos_Co-ops",
            }
            mapped = rent_type_map.get(first_token)
            if mapped:
                filters["home_type"] = mapped
        else:
            sale_type_map = {
                "single_family": "Houses",
                "house": "Houses",
                "houses": "Houses",
                "condo": "Condos",
                "condos": "Condos",
                "townhouse": "Townhomes",
                "townhome": "Townhomes",
                "townhomes": "Townhomes",
                "apartment": "Apartments",
                "apartments": "Apartments",
                "multi_family": "Multi-family",
                "multi-family": "Multi-family",
                "multifamily": "Multi-family",
                "manufactured": "Manufactured",
                "mobile": "Manufactured",
                "land": "LotsLand",
                "lot": "LotsLand",
                "lots": "LotsLand",
                "lots-land": "LotsLand",
            }
            mapped = sale_type_map.get(first_token)
            if mapped:
                filters["home_type"] = mapped

    sqft_min = user_preferences.get("preferred_sqft_min")
    sqft_max = user_preferences.get("preferred_sqft_max")
    if sqft_min is not None:
        try:
            filters["minSqft"] = int(sqft_min)
        except (TypeError, ValueError):
            pass
    if sqft_max is not None:
        try:
            filters["maxSqft"] = int(sqft_max)
        except (TypeError, ValueError):
            pass

    dom_min = user_preferences.get("days_on_market_min")
    dom_max = user_preferences.get("days_on_market_max")
    if dom_min is not None:
        try:
            filters["daysOnMarketMin"] = int(dom_min)
        except (TypeError, ValueError):
            pass
    if dom_max is not None:
        try:
            filters["daysOnMarketMax"] = int(dom_max)
        except (TypeError, ValueError):
            pass

    return filters


def normalize_important_location(location: dict[str, Any]) -> dict[str, Any]:
    """Normalize a single important location dict from DB or aggregation shapes."""
    loc = dict(location)
    if loc.get("commute_tolerance") is None and loc.get("max_commute_minutes") is not None:
        loc["commute_tolerance"] = loc["max_commute_minutes"]
    return loc


def generate_isochrone_polygon_from_preferences(
    user_preferences: dict[str, Any],
) -> list[dict[str, float]] | None:
    """
    Generate an isochrone polygon from user preferences using ALL important locations
    and their respective commute tolerances. Returns union polygon coordinates as list of {lat, lon} dicts.
    """
    # Lazy import to avoid circular dependency
    from ..polygon.locationPolygon import isochrone_union_for_addresses

    try:
        # Extract important locations
        important_locations = []
        locations_data = user_preferences.get("important_locations")

        if isinstance(locations_data, str):
            try:
                locations_data = json.loads(locations_data)
            except json.JSONDecodeError:
                log.error("SEARCH", "🗺️ ISOCHRONE: ❌ Failed to parse important_locations JSON")
                return None

        if isinstance(locations_data, list) and locations_data:
            important_locations = [
                normalize_important_location(loc) for loc in locations_data if isinstance(loc, dict)
            ]

        if not important_locations:
            return None

        # Prepare address and commute tolerance pairs for all locations
        addresses_and_minutes = []

        for i, location in enumerate(important_locations):
            address = location.get("address")
            if not address:
                log.warn("SEARCH", f"🗺️ ISOCHRONE: ⚠️ Location {i + 1} has no address, skipping")
                continue

            # Get commute tolerance from the location (in minutes)
            commute_tolerance = location.get("commute_tolerance", 30)

            addresses_and_minutes.append((address, commute_tolerance))

        if not addresses_and_minutes:
            log.error("SEARCH", "🗺️ ISOCHRONE: ❌ No valid locations with addresses found")
            return None

        # Generate union isochrone polygon for all locations
        isochrone_feature = isochrone_union_for_addresses(
            addresses_and_minutes,
            mode="drive",
            include_individual=False,  # We only want the union, not individual polygons
        )

        # Extract coordinates from GeoJSON
        geometry = isochrone_feature.get("geometry", {})
        coordinates = geometry.get("coordinates", [])

        if geometry.get("type") == "Polygon" and coordinates:
            # Polygon coordinates are [[[lon, lat], [lon, lat], ...]]
            polygon_coords = coordinates[0]  # Get outer ring
            # Convert to [{lat, lon}, {lat, lon}, ...] format expected by search API
            polygon_points = [{"lat": coord[1], "lon": coord[0]} for coord in polygon_coords]

            return polygon_points

        elif geometry.get("type") == "MultiPolygon" and coordinates:
            # Use the largest polygon from MultiPolygon
            largest_polygon = max(coordinates, key=lambda p: len(p[0]))
            polygon_coords = largest_polygon[0]  # Get outer ring of largest polygon
            polygon_points = [{"lat": coord[1], "lon": coord[0]} for coord in polygon_coords]

            return polygon_points

        else:
            log.error("SEARCH", f"🗺️ ISOCHRONE: ❌ Unexpected geometry type: {geometry.get('type')}")
            return None

    except Exception as e:
        log.error("SEARCH", f"🗺️ ISOCHRONE: ❌ Failed to generate isochrone polygon: {e}")
        return None


def get_user_preferences_parsed(user_id: str) -> tuple[dict[str, Any] | None, tuple | None]:
    """
    Get user preferences from database (aggregated from new models with legacy fallback).
    Returns dict with same shape as preferences aggregation; list fields already parsed.

    Returns:
        Tuple of (user_preferences_dict, error_response_tuple)
        If error_response_tuple is not None, return it as HTTP response.
    """
    return get_preferences_dict_for_user(user_id)


def get_authenticated_user() -> tuple[Any | None, tuple | None]:
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
            return None, (
                jsonify({"success": False, "error": "USER_NOT_FOUND", "message": "User not found"}),
                404,
            )
    except SecurityException as se:
        # Handle SecurityException (wraps SecurityError tuples)
        return None, security_error_response(se.error_tuple)
    except Exception as auth_error:
        log.error("SEARCH", f"❌ Authentication error: {str(auth_error)}")
        return None, (
            jsonify({"success": False, "error": "AUTH_ERROR", "message": "Authentication failed"}),
            401,
        )

    return user, None


def parse_important_locations(
    user_preferences: dict[str, Any],
) -> tuple[list, str | None]:
    """
    Parse important_locations from user preferences.

    Returns:
        Tuple of (locations_list, error_message).
        An empty list means the user has no commute locations configured (expected).
        error_message is set only for malformed important_locations data.
    """
    locations_data = user_preferences.get("important_locations")

    if isinstance(locations_data, str):
        try:
            locations_data = json.loads(locations_data)
        except json.JSONDecodeError as e:
            log.error("SEARCH", f"❌ Failed to parse important_locations JSON: {e}")
            return [], "Invalid important locations data"

    if isinstance(locations_data, list) and locations_data:
        normalized = [
            normalize_important_location(loc) for loc in locations_data if isinstance(loc, dict)
        ]
        if normalized:
            return normalized, None

    return [], None
