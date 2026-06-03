"""
Commute data generation utilities for property research endpoints.
Handles generating commute data from user preferences.
"""

import json
from typing import Any

from app.services.auth import SecurityException, get_current_user
from logger import log

from ..graphs.graphic_generation import (
    GOOGLE_MAPS_ID,
    fetch_directions_leg,
    generate_static_map_url,
)


def generate_commute_data(
    property_address: str, user_preferences: dict[str, Any], google_maps_api_key: str
) -> dict[str, Any]:
    """
    Generate commute data for a property based on user's important locations.

    Args:
        property_address: Full address of the property
        user_preferences: Preferences dict (e.g. from preferences aggregation)
        google_maps_api_key: Google Maps API key

    Returns:
        Dict containing commute data (travel_times, map_url, property_address)
    """
    commute_data = {}
    try:
        locations_data = (
            user_preferences.get("important_locations")
            if isinstance(user_preferences, dict)
            else getattr(user_preferences, "important_locations", None)
        )
        important_locations = []
        if isinstance(locations_data, str):
            try:
                locations_data = json.loads(locations_data)
            except json.JSONDecodeError:
                log.error("ERRORS", "Failed to parse important_locations JSON")
                locations_data = []
        if isinstance(locations_data, list):
            important_locations = locations_data

        # Calculate travel times for each important location
        travel_times = []
        secondary_locations = []

        for i, location in enumerate(important_locations):
            if isinstance(location, dict) and "address" in location:
                location_address = location["address"]
                location_name = (
                    location.get("name")
                    or location.get("label")
                    or location.get("address", "")[:40]
                    or f"Location {i + 1}"
                )

                leg = fetch_directions_leg(property_address, location_address, google_maps_api_key)
                travel_time = leg.get("duration_text") if leg else None
                encoded_polyline = leg.get("encoded_polyline") if leg else None

                tol = location.get("commute_tolerance")
                if tol is None:
                    tol = location.get("max_commute_minutes")
                if tol is None:
                    tol = 30
                travel_times.append(
                    {
                        "name": location_name,
                        "address": location_address,
                        "travel_time": travel_time,
                        "commute_tolerance": tol,
                        "encoded_polyline": encoded_polyline,
                    }
                )

                # Prepare for map generation
                secondary_locations.append({"name": location_name, "address": location_address})

        commute_data["travel_times"] = travel_times

        # Generate static map URL with commute routes
        if secondary_locations:
            try:
                map_url = generate_static_map_url(
                    property_address,
                    secondary_locations,
                    google_maps_api_key,
                    map_id=GOOGLE_MAPS_ID,
                )
                commute_data["map_url"] = map_url
            except Exception as e:
                log.error("API", "Error generating map URL", {"error": str(e)})

        commute_data["property_address"] = property_address

    except Exception as e:
        log.error("ERRORS", "Error calculating commute data", {"error": str(e)})
        commute_data = {"error": "Failed to calculate commute data"}

    return commute_data


def get_commute_data_for_property(
    property_address: str | None,
    data: dict[str, Any] | None,
    cached_commute_data: dict[str, Any] | None,
    google_maps_api_key: str | None,
) -> dict[str, Any]:
    """
    Get commute data for a property, using cache if available or generating if needed.

    Args:
        property_address: Property address string
        data: Property data dict (for address extraction if needed)
        cached_commute_data: Cached commute data if available
        google_maps_api_key: Google Maps API key

    Returns:
        Dict containing commute data
    """
    # Use cached data if available
    if cached_commute_data:
        log.info("PROPERTY_DETAILS", "Skipping commute_data generation, using cached data")
        return cached_commute_data

    # Generate new commute data
    if not property_address:
        # Try to extract from data
        if data and isinstance(data, dict):
            street = data.get("streetAddress", "")
            city = data.get("city", "")
            state = data.get("state", "")
            zipcode = data.get("zipcode", "")
            if street and city and state:
                property_address = f"{street}, {city}, {state} {zipcode}".strip()

    if not property_address or not google_maps_api_key:
        return {}

    try:
        current_user = None
        try:
            current_user = get_current_user()
        except SecurityException:
            current_user = None
        except Exception:
            current_user = None

        if not current_user:
            return {}
        from app.services.aggregation import get_preferences_dict_optional

        user_preferences = get_preferences_dict_optional(str(current_user.id))
        if not user_preferences:
            return {}
        return generate_commute_data(property_address, user_preferences, google_maps_api_key)

    except Exception as e:
        log.error("ERRORS", "Error calculating commute data", {"error": str(e)})
        return {"error": "Failed to calculate commute data"}
