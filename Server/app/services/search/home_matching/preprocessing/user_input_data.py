"""
User data retrieval and formatting for home matching system.

This module provides functions to retrieve and format user data from the database
for use in the home matching system.

This module now uses the preprocessing models internally but maintains backward
compatibility by returning dictionaries.
"""

import logging
from typing import Any

from app.models import User
from app.services.aggregation import get_preferences_dict_optional
from app.utils.db.orm_lookup import get_model

logger = logging.getLogger(__name__)


def get_user_data_from_db(user_id: str) -> dict[str, Any] | None:
    """
    Retrieve complete user data from database for home matching.

    Uses aggregated preferences (new models with legacy fallback) and User.
    """
    try:
        user = get_model(User, user_id)
        if not user:
            logger.warning(f"User not found for user_id {user_id}")
            return None
        user_preferences_dict = get_preferences_dict_optional(user_id)
        if not user_preferences_dict:
            logger.warning(f"User preferences not found for user {user_id}")
            return None
        formatted_data = format_user_data_for_matching(user, user_preferences_dict)

        # Convert to dict for backward compatibility
        return formatted_data

    except Exception as e:
        logger.error(f"Error retrieving user data for {user_id}: {e}")
        return None


def format_user_data_for_matching(user: User, user_preferences: dict[str, Any]) -> dict[str, Any]:
    """
    Format user and preferences data into the structure expected by home matching.

    Args:
        user: User model instance
        user_preferences: Dictionary of user preferences from preferences aggregation

    Returns:
        Formatted user data dictionary for home matching
    """
    # Extract preferences with defaults
    prefs = user_preferences or {}

    # Build preferences dictionary matching expected format
    preferences = {
        # Budget
        "budget_min": prefs.get("home_budget_min"),
        "budget_max": prefs.get("home_budget_max"),
        # Bedrooms and bathrooms (range)
        "preferred_bedrooms_min": prefs.get("preferred_bedrooms_min"),
        "preferred_bedrooms_max": prefs.get("preferred_bedrooms_max"),
        "preferred_bathrooms_min": prefs.get("preferred_bathrooms_min"),
        "preferred_bathrooms_max": prefs.get("preferred_bathrooms_max"),
        # Home type
        "preferred_home_types": _parse_home_types(
            prefs.get("preferred_housing_type", prefs.get("housing_type"))
        ),
        # Lot size (range in acres) and age
        "preferred_lot_size": prefs.get("preferred_lot_size"),
        "preferred_lot_size_min": prefs.get("preferred_lot_size_min"),
        "preferred_lot_size_max": prefs.get("preferred_lot_size_max"),
        "preferred_home_age": prefs.get("preferred_home_age"),
        "preferred_home_age_min": prefs.get("preferred_home_age_min"),
        "preferred_home_age_max": prefs.get("preferred_home_age_max"),
        # Style and renovation
        "preferred_architectural_style": prefs.get("preferred_architectural_style")
        or prefs.get("architectural_style_preference"),
        "renovation_preference": prefs.get("renovation_preference"),
        # Features and amenities
        "preferred_home_features": prefs.get("preferred_home_features", []),
        "must_have_amenities": _extract_must_have_amenities(prefs),
        "nice_to_have_amenities": _extract_nice_to_have_amenities(prefs),
        "deal_breakers": prefs.get("deal_breakers", []),
        # Location preferences
        "important_locations": prefs.get("important_locations", []),
        "walkability_importance": prefs.get("walkability_importance"),
        "ideal_zip_code": prefs.get("ideal_zip_code"),
        # Lifestyle and personal
        "pets": prefs.get("pets"),
        "occupation": prefs.get("occupation"),
        "intended_property_use": prefs.get("intended_property_use"),
        # Additional preferences that might be useful
        "communication_frequency": prefs.get("communication_frequency"),
        "information_detail_level": prefs.get("information_detail_level"),
    }

    # Build complete user data structure
    user_data = {
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "preferences": preferences,
        # Additional metadata
        "has_preferences": user.has_preferences,
        "is_agent": user.is_agent,
    }

    # Add lifestyle description if available
    lifestyle_parts = []
    if prefs.get("pets"):
        lifestyle_parts.append(f"Has pets: {prefs['pets']}")
    if prefs.get("occupation"):
        lifestyle_parts.append(f"Occupation: {prefs['occupation']}")
    if prefs.get("intended_property_use"):
        lifestyle_parts.append(f"Property use: {prefs['intended_property_use']}")

    if lifestyle_parts:
        preferences["lifestyle"] = ". ".join(lifestyle_parts)

    return user_data


def get_user_data_from_dict(user_data_dict: dict[str, Any]) -> dict[str, Any]:
    """
    Format user data from a dictionary (e.g., from API request) for home matching.

    This is useful when user data is already provided in a request and doesn't
    need to be retrieved from the database.

    Args:
        user_data_dict: Dictionary containing user data

    Returns:
        Formatted user data dictionary for home matching
    """
    # If already in correct format, return as-is
    if "preferences" in user_data_dict and "user_id" in user_data_dict:
        return user_data_dict

    # Otherwise, try to format it
    formatted = {
        "user_id": user_data_dict.get("user_id", "unknown"),
        "preferences": user_data_dict.get("preferences", {}),
    }

    # Copy over any additional fields
    for key in ["email", "name", "has_preferences", "is_agent"]:
        if key in user_data_dict:
            formatted[key] = user_data_dict[key]

    return formatted


def _parse_home_types(housing_type: str | None) -> list[str]:
    """Parse housing type string into list of preferred home types."""
    if not housing_type:
        return []

    # Normalize and split
    housing_type_lower = housing_type.lower().strip()

    # Map common types
    type_mapping = {
        "single_family": ["house"],
        "house": ["house"],
        "houses": ["house"],
        "townhouse": ["townhouse"],
        "townhomes": ["townhouse"],
        "condo": ["condo"],
        "condos": ["condo"],
        "apartment": ["apartment"],
        "apartments": ["apartment"],
        "multi_family": ["house", "townhouse"],
        "multifamily": ["house", "townhouse"],
    }

    # Check for exact match
    if housing_type_lower in type_mapping:
        return type_mapping[housing_type_lower]

    # Check for partial match
    for key, value in type_mapping.items():
        if key in housing_type_lower:
            return value

    # Default: return as single-item list
    return [housing_type_lower]


def _extract_must_have_amenities(prefs: dict[str, Any]) -> list[str]:
    """Extract must-have amenities from preferences."""
    features = prefs.get("preferred_home_features", [])
    if isinstance(features, str):
        try:
            import json

            features = json.loads(features)
        except Exception:
            features = []

    # Filter for must-haves (could be enhanced with logic to identify must-haves)
    # For now, return all features as must-haves
    if isinstance(features, list):
        return [str(f) for f in features if f]

    return []


def _extract_nice_to_have_amenities(prefs: dict[str, Any]) -> list[str]:
    """Extract nice-to-have amenities from preferences."""
    # This could be enhanced with logic to identify nice-to-haves
    # For now, return empty list
    return []


def get_user_data(
    user_id: str | None = None, user_data_dict: dict[str, Any] | None = None
) -> dict[str, Any] | None:
    """
    Main entry point to get user data for home matching.

    Can retrieve from database (if user_id provided) or format from dictionary.

    Args:
        user_id: User ID to retrieve from database (optional)
        user_data_dict: Pre-provided user data dictionary (optional)

    Returns:
        Formatted user data for home matching, or None if unavailable
    """
    if user_data_dict:
        return get_user_data_from_dict(user_data_dict)
    elif user_id:
        return get_user_data_from_db(user_id)
    else:
        logger.warning("Either user_id or user_data_dict must be provided")
        return None
