"""
Property analysis generation utilities for property research endpoints.
Handles generating property analysis (pros/cons, sections) from user preferences.
"""

import json
import logging
from typing import Any

from flask import current_app

from app.services.aggregation import get_preferences_dict_optional
from app.services.auth import SecurityException, get_current_user
from app.services.research.perplexity_analysis import analyze_property_with_sonar_pro
from app.services.research.perplexity_report_sections import generate_report_sections_for_property

logger = logging.getLogger(__name__)

# Fixed section order (matches client DEFAULT_REPORT_SECTIONS)
DEFAULT_SECTION_ORDER = [
    "affordability",
    "neighborhood",
    "commute",
    "family_friendly",
    "entertainment",
    "investment",
    "climate_environmental_safety",
    "convenience_walkability",
    "home",
]


def prepare_user_preferences_dict(user_preferences: dict[str, Any]) -> dict[str, Any]:
    """
    Return user preferences as dict (already in dict form from aggregation).
    Kept for backward compatibility; pass-through when input is already a dict.
    """
    if isinstance(user_preferences, dict):
        return user_preferences
    # Legacy: model instance
    user_prefs_dict = getattr(user_preferences, "to_dict", lambda: {})()
    if not user_prefs_dict and hasattr(user_preferences, "home_budget_min"):
        user_prefs_dict = {
            "home_budget_min": getattr(user_preferences, "home_budget_min", None),
            "home_budget_max": getattr(user_preferences, "home_budget_max", None),
            "occupation": getattr(user_preferences, "occupation", None),
            "age": getattr(user_preferences, "age", None),
            "important_locations": getattr(user_preferences, "important_locations", None),
            "preferred_home_features": getattr(user_preferences, "preferred_home_features", None),
            "deal_breakers": getattr(user_preferences, "deal_breakers", None),
            "gross_income": getattr(user_preferences, "gross_income", None),
            "housing_type": getattr(user_preferences, "housing_type", None),
        }
    for field in ["important_locations", "preferred_home_features", "deal_breakers"]:
        val = user_prefs_dict.get(field)
        if isinstance(val, str):
            try:
                user_prefs_dict[field] = json.loads(val)
            except json.JSONDecodeError:
                user_prefs_dict[field] = []
        elif val is None:
            user_prefs_dict[field] = []
    return user_prefs_dict


def prepare_home_object(property_address: str | None, data: dict[str, Any]) -> dict[str, Any]:
    """
    Prepare home object dict for analysis from property data.

    Args:
        property_address: Property address string
        data: Property data dict

    Returns:
        Dict with home object data for analysis
    """
    return {
        "address": property_address or data.get("streetAddress", "Unknown address"),
        "price": data.get("price", data.get("listPrice", 0)),
        "bedrooms": data.get("bedrooms", data.get("beds", 0)),
        "bathrooms": data.get("bathrooms", data.get("baths", 0)),
        "livingArea": data.get("livingArea", data.get("sqft", 0)),
        "propertyType": data.get("propertyType", data.get("homeType", "Unknown")),
        "lotAreaValue": data.get("lotAreaValue"),
        "lotAreaUnit": data.get("lotAreaUnit"),
        "listingStatus": data.get("listingStatus"),
        "city": data.get("city"),
        "state": data.get("state"),
        "zipcode": data.get("zipcode"),
    }


def generate_property_analysis(
    property_address: str | None,
    data: dict[str, Any],
    user_preferences: dict[str, Any],
    skip_pros_cons: bool = False,
) -> dict[str, Any]:
    """
    Generate property analysis (pros/cons and additional sections) for a property.

    Args:
        property_address: Property address string
        data: Property data dict
        user_preferences: User preferences dict (from aggregation or prepare_user_preferences_dict)
        skip_pros_cons: If True, skip pros/cons generation but still generate priority sections

    Returns:
        Dict containing property analysis
    """
    try:
        user_prefs_dict = prepare_user_preferences_dict(user_preferences)
        home_object = prepare_home_object(property_address, data)

        # Initialize property_analysis
        property_analysis = {}

        # Step 1: Generate pros/cons (core property analysis) unless skipped
        if not skip_pros_cons:
            analysis_result = analyze_property_with_sonar_pro(user_prefs_dict, home_object)

            # Initialize property_analysis with pros/cons
            if analysis_result:
                property_analysis = {
                    "pros": analysis_result.pros,
                    "cons": analysis_result.cons,
                }
                # Note: neighborhood_overview may be included in analysis_result, but we'll filter it out later if needed
            else:
                current_app.logger.warning("⚠️ [PROPERTY] Pros/cons analysis returned no results")
        else:
            current_app.logger.info("[PROPERTY] ⏭️ Skipping pros/cons generation")

        # Step 2: Generate additional report sections (fixed default order)
        section_names = DEFAULT_SECTION_ORDER
        if section_names and isinstance(section_names, list):
            # Filter out neighborhood_overview from section_names if skipping pros/cons
            if skip_pros_cons:
                section_names = [s for s in section_names if s != "neighborhood_overview"]
                current_app.logger.info(
                    f"[PROPERTY] Generating {len(section_names)} priority sections (excluding neighborhood_overview): {section_names}"
                )
            else:
                current_app.logger.info(
                    f"[PROPERTY] Generating {len(section_names)} additional report sections: {section_names}"
                )

            if section_names:  # Only generate if there are sections to generate
                # Check for recent sections in database (last 2 weeks)
                recent_sections = {}
                try:
                    current_user = get_current_user()
                    if current_user:
                        from .property_research_cache import (
                            get_recent_property_analysis_sections,
                        )

                        zpid_val = data.get("zpid") if isinstance(data, dict) else None
                        recent_sections = get_recent_property_analysis_sections(
                            user_id=str(current_user.id),
                            address=property_address,
                            zpid=str(zpid_val) if zpid_val else None,
                            days_back=14,
                        )
                        if recent_sections:
                            current_app.logger.info(
                                f"[PROPERTY] Found {len(recent_sections)} recent sections in database (last 2 weeks)"
                            )
                except Exception as recent_check_err:
                    current_app.logger.debug(
                        f"[PROPERTY] Error checking recent sections: {recent_check_err}"
                    )

                additional_sections = generate_report_sections_for_property(
                    section_names=section_names,
                    address=property_address or data.get("streetAddress", "Unknown address"),
                    user_preferences=user_prefs_dict,
                    property_data=data,
                    recent_sections=recent_sections,
                    mode="report",
                )

                # Merge additional sections into property_analysis
                if additional_sections:
                    property_analysis.update(additional_sections)
                    current_app.logger.info(
                        f"[PROPERTY] ✅ Successfully generated {len(additional_sections)} additional sections"
                    )
                else:
                    current_app.logger.warning("⚠️ [PROPERTY] No additional sections generated")
        else:
            current_app.logger.info(
                "[PROPERTY] No section names, skipping additional section generation"
            )

        # Remove neighborhood_overview if skipping pros/cons
        if skip_pros_cons and "neighborhood_overview" in property_analysis:
            del property_analysis["neighborhood_overview"]
            current_app.logger.info("[PROPERTY] Removed neighborhood_overview from response")

        if not skip_pros_cons and "neighborhood_overview" not in property_analysis:
            current_app.logger.warning(
                "⚠️ [PROPERTY] neighborhood_overview missing from response to frontend"
            )

        return property_analysis

    except Exception as e:
        current_app.logger.error(f"🔍 [PROPERTY] Error during property analysis: {e}")
        import traceback

        current_app.logger.error(traceback.format_exc())
        return {"error": "Failed to analyze property"}


def get_property_analysis_for_property(
    property_address: str | None,
    data: dict[str, Any],
    cached_property_analysis: dict[str, Any] | None,
    skip_pros_cons: bool = False,
) -> dict[str, Any]:
    """
    Get property analysis for a property, using cache if available or generating if needed.

    Args:
        property_address: Property address string
        data: Property data dict
        cached_property_analysis: Cached property analysis if available
        skip_pros_cons: If True, skip pros/cons generation but still generate priority sections

    Returns:
        Dict containing property analysis
    """
    # Use cached data if available
    if cached_property_analysis:
        current_app.logger.info(
            "[PROPERTY] ⏭️ Skipping property_analysis generation, using cached data"
        )
        # Remove pros/cons and neighborhood_overview if skipping pros/cons
        if skip_pros_cons:
            filtered_analysis = {
                k: v
                for k, v in cached_property_analysis.items()
                if k not in ["pros", "cons", "neighborhood_overview"]
            }
            current_app.logger.info(
                "[PROPERTY] Removed pros/cons and neighborhood_overview from cached data"
            )
            return filtered_analysis
        return cached_property_analysis

    # Generate new analysis
    if not data or not isinstance(data, dict):
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
        user_preferences = get_preferences_dict_optional(str(current_user.id))
        if not user_preferences:
            return {}
        return generate_property_analysis(
            property_address, data, user_preferences, skip_pros_cons=skip_pros_cons
        )

    except Exception as e:
        current_app.logger.error(f"🔍 [PROPERTY] Error during property analysis: {e}")
        import traceback

        current_app.logger.error(traceback.format_exc())
        return {"error": "Failed to analyze property"}
