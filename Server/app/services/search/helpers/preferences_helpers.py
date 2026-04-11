"""
Helper functions for user preferences: retrieval, parsing, mapping to filters, and isochrone generation.
"""

from __future__ import annotations

import json
from typing import Any

from flask import current_app, jsonify

from ....utils.security.security import security_error_response
from ...aggregation import get_preferences_dict_for_user
from ...auth import get_current_user


def map_user_preferences_to_filters(
    user_preferences: dict[str, Any], status_type: str = "ForSale"
) -> dict[str, Any]:
    """Map user preferences to Slipstream API filter params.

    Slipstream uses operator-based syntax:
      beds=>=3, baths=>=2, listPrice=min:max, size=min:max,
      propertyType=Single Family Residence, sortField/sortOrder.
    """
    filters: dict[str, Any] = {}

    budget_min = user_preferences.get("home_budget_min")
    budget_max = user_preferences.get("home_budget_max")

    if budget_max:
        price_min = int(budget_min) if budget_min else int(budget_max * 0.65)
        price_max = int(budget_max)
        filters["listPrice"] = f"{price_min}:{price_max}"

    beds_min = user_preferences.get("preferred_bedrooms_min")
    if beds_min is not None:
        try:
            filters["beds"] = f">={int(beds_min)}"
        except (TypeError, ValueError):
            pass

    baths_min = user_preferences.get("preferred_bathrooms_min")
    if baths_min is not None:
        try:
            filters["baths"] = f">={int(baths_min)}"
        except (TypeError, ValueError):
            pass

    # Slipstream property types from GAMLS market
    _SLIPSTREAM_TYPE_MAP = {
        "single_family": "Single Family Residence",
        "house": "Single Family Residence",
        "houses": "Single Family Residence",
        "condo": "Condominium",
        "condos": "Condominium",
        "townhouse": "Townhouse",
        "townhomes": "Townhouse",
        "apartment": "Condominium",
        "apartments": "Condominium",
        "multi_family": "Multi-Family",
        "multifamily": "Multi-Family",
        "manufactured": "Manufactured Home",
        "mobile": "Manufactured Home",
        "land": "Land",
        "lot": "Land",
        "lots": "Land",
    }

    raw_type = str(
        user_preferences.get("preferred_housing_type", user_preferences.get("housing_type", ""))
    )
    if raw_type:
        mapped = _SLIPSTREAM_TYPE_MAP.get(raw_type.lower())
        if mapped:
            filters["propertyType"] = mapped

    sqft_min = user_preferences.get("preferred_sqft_min")
    sqft_max = user_preferences.get("preferred_sqft_max")
    if sqft_min is not None and sqft_max is not None:
        filters["size"] = f"{int(sqft_min)}:{int(sqft_max)}"
    elif sqft_min is not None:
        filters["size"] = f">={int(sqft_min)}"
    elif sqft_max is not None:
        filters["size"] = f"<={int(sqft_max)}"

    dom_min = user_preferences.get("days_on_market_min")
    dom_max = user_preferences.get("days_on_market_max")
    if dom_min is not None and dom_max is not None:
        filters["daysOnMarket"] = f"{int(dom_min)}:{int(dom_max)}"
    elif dom_max is not None:
        filters["daysOnMarket"] = f"<={int(dom_max)}"

    lot_min = user_preferences.get("preferred_lot_size_min")
    lot_max = user_preferences.get("preferred_lot_size_max")
    if lot_min is not None and lot_max is not None:
        filters["lotSize"] = f"{float(lot_min)}:{float(lot_max)}"
    elif lot_min is not None:
        filters["lotSize"] = f">={float(lot_min)}"
    elif lot_max is not None:
        filters["lotSize"] = f"<={float(lot_max)}"

    age_min = user_preferences.get("preferred_home_age_min")
    age_max = user_preferences.get("preferred_home_age_max")
    if age_min is not None or age_max is not None:
        import datetime as _dt

        current_year = _dt.datetime.now(tz=_dt.timezone.utc).year
        if age_min is not None and age_max is not None:
            year_newest = current_year - int(age_min)
            year_oldest = current_year - int(age_max)
            filters["yearBuilt"] = f"{year_oldest}:{year_newest}"
        elif age_min is not None:
            year_newest = current_year - int(age_min)
            filters["yearBuilt"] = f"<={year_newest}"
        elif age_max is not None:
            year_oldest = current_year - int(age_max)
            filters["yearBuilt"] = f">={year_oldest}"

    listing_type_prefs = user_preferences.get("listing_type")
    if isinstance(listing_type_prefs, list):
        for lt in listing_type_prefs:
            lt_norm = str(lt).strip().lower().replace("-", "_")
            if lt_norm == "new_construction":
                filters["newConstruction"] = "true"
                break

    listing_status = user_preferences.get("listing_status")
    if isinstance(listing_status, str) and listing_status.strip():
        _STATUS_MAP = {
            "active": "Active",
            "pending": "Pending",
            "contingent": "Contingent",
            "coming_soon": "Coming Soon",
        }
        mapped_status = _STATUS_MAP.get(listing_status.strip().lower())
        if mapped_status:
            filters["status"] = mapped_status

    filters["sortField"] = "listPrice"
    filters["sortOrder"] = "asc"

    return filters


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
                current_app.logger.error("🗺️ ISOCHRONE: ❌ Failed to parse important_locations JSON")
                return None

        if isinstance(locations_data, list) and locations_data:
            important_locations = locations_data

        if not important_locations:
            current_app.logger.warning(
                "🗺️ ISOCHRONE: ⚠️ No important locations found in user preferences"
            )
            current_app.logger.warning(
                f"🗺️ ISOCHRONE: ⚠️ Available user preference keys: {list(user_preferences.keys())}"
            )
            current_app.logger.warning(f"🗺️ ISOCHRONE: ⚠️ Important locations data: {locations_data}")
            return None

        # Prepare address and commute tolerance pairs for all locations
        addresses_and_minutes = []

        for i, location in enumerate(important_locations):
            address = location.get("address")
            if not address:
                current_app.logger.warning(
                    f"🗺️ ISOCHRONE: ⚠️ Location {i + 1} has no address, skipping"
                )
                continue

            # Get commute tolerance from the location (in minutes)
            commute_tolerance = location.get("commute_tolerance", 30)

            addresses_and_minutes.append((address, commute_tolerance))

        if not addresses_and_minutes:
            current_app.logger.error("🗺️ ISOCHRONE: ❌ No valid locations with addresses found")
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
            current_app.logger.error(
                f"🗺️ ISOCHRONE: ❌ Unexpected geometry type: {geometry.get('type')}"
            )
            return None

    except Exception as e:
        current_app.logger.error(f"🗺️ ISOCHRONE: ❌ Failed to generate isochrone polygon: {e}")
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
        current_app.logger.error(f"❌ Authentication error: {str(auth_error)}")
        return None, (
            jsonify({"success": False, "error": "AUTH_ERROR", "message": "Authentication failed"}),
            401,
        )

    return user, None


def parse_important_locations(
    user_preferences: dict[str, Any],
) -> tuple[list | None, str | None]:
    """
    Parse important_locations from user preferences.

    Returns:
        Tuple of (locations_list, error_message)
        If error_message is not None, there was an error parsing.
    """
    locations_data = user_preferences.get("important_locations")

    if isinstance(locations_data, str):
        try:
            locations_data = json.loads(locations_data)
        except json.JSONDecodeError as e:
            current_app.logger.error(f"❌ Failed to parse important_locations JSON: {e}")
            return None, "Invalid important locations data"

    if isinstance(locations_data, list) and locations_data:
        return locations_data, None

    return None, "No important locations found in user preferences"
