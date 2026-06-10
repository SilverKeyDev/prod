"""
Property analysis generation utilities for property research endpoints.
Handles generating property analysis (pros/cons, sections) from user preferences.
"""

import json
import traceback
from typing import Any

from app.services.auth import SecurityException, get_current_user
from app.services.research.perplexity import (
    analyze_property_with_sonar_pro,
    generate_report_sections_for_property,
)
from app.services.search.scoring import (
    ResearchAnalysisOptions,
    analysis_cache_signature_matches,
    attach_analysis_cache_meta,
    build_research_analysis_options,
    highlights_context_payload,
    resolve_highlights_counts_and_signature,
)
from logger import log

from .property_analysis_payload import finalize_property_analysis_payload

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
    analysis_options: ResearchAnalysisOptions | None = None,
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
        adj_cache_signature = analysis_options.cache_signature if analysis_options else None
        match_score_for_highlights: float | None = None
        if not skip_pros_cons:
            sonar_ctx = None
            if analysis_options:
                (
                    adj_p,
                    adj_c,
                    adj_cache_signature,
                    match_score_for_highlights,
                ) = resolve_highlights_counts_and_signature(analysis_options, data)
                sonar_ctx = {
                    "viewer_is_agent": analysis_options.viewer_is_agent,
                    "profile_subject": analysis_options.profile_subject,
                    "pros_count": adj_p,
                    "cons_count": adj_c,
                    "bullet_style": analysis_options.bullet_style,
                }
            analysis_result = analyze_property_with_sonar_pro(
                user_prefs_dict, home_object, analysis_context=sonar_ctx
            )

            # Initialize property_analysis with pros/cons
            if analysis_result:
                property_analysis = {
                    "pros": analysis_result.pros,
                    "cons": analysis_result.cons,
                }
                hc = highlights_context_payload(match_score_for_highlights)
                if hc:
                    property_analysis["highlights_context"] = hc
                # Note: neighborhood_overview may be included in analysis_result, but we'll filter it out later if needed
            else:
                log.warn("PROPERTY_DETAILS", "Pros/cons analysis returned no results")
        else:
            log.info("PROPERTY_DETAILS", "Skipping pros/cons generation")

        # Step 2: Generate additional report sections (fixed default order)
        section_names = DEFAULT_SECTION_ORDER
        if section_names and isinstance(section_names, list):
            # Filter out neighborhood_overview from section_names if skipping pros/cons
            if skip_pros_cons:
                section_names = [s for s in section_names if s != "neighborhood"]
                log.info(
                    "PROPERTY_DETAILS",
                    "Generating priority sections (excluding neighborhood)",
                    {"count": len(section_names), "sections": section_names},
                )
            else:
                log.info(
                    "PROPERTY_DETAILS",
                    "Generating additional report sections",
                    {"count": len(section_names), "sections": section_names},
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
                            log.info(
                                "PROPERTY_DETAILS",
                                "Found recent sections in database",
                                {"count": len(recent_sections), "days_back": 14},
                            )
                except Exception as recent_check_err:
                    log.debug(
                        "PROPERTY_DETAILS",
                        "Error checking recent sections",
                        {"error": str(recent_check_err)},
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
                    log.info(
                        "PROPERTY_DETAILS",
                        "Successfully generated additional sections",
                        {"count": len(additional_sections)},
                    )
                else:
                    log.warn("PROPERTY_DETAILS", "No additional sections generated")
        else:
            log.info("PROPERTY_DETAILS", "No section names, skipping additional section generation")

        property_analysis = finalize_property_analysis_payload(
            property_analysis,
            property_address,
            for_compare_stream=skip_pros_cons,
        )

        if not skip_pros_cons and "neighborhood_overview" not in property_analysis:
            log.warn(
                "PROPERTY_DETAILS",
                "neighborhood_overview missing from response to frontend",
            )

        if (
            not skip_pros_cons
            and analysis_options
            and adj_cache_signature is not None
            and property_analysis
            and "error" not in property_analysis
            and ("pros" in property_analysis or "cons" in property_analysis)
        ):
            property_analysis = attach_analysis_cache_meta(property_analysis, adj_cache_signature)

        return property_analysis

    except Exception as e:
        log.error(
            "ERRORS",
            "Error during property analysis",
            {"error": str(e), "traceback": traceback.format_exc()},
        )
        return {"error": "Failed to analyze property"}


def get_property_analysis_for_property(
    property_address: str | None,
    data: dict[str, Any],
    cached_property_analysis: dict[str, Any] | None,
    skip_pros_cons: bool = False,
    analysis_options: ResearchAnalysisOptions | None = None,
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
    # Use cached data if available (and signature matches when options provided)
    if cached_property_analysis:
        if skip_pros_cons:
            log.info("PROPERTY_DETAILS", "Using cached property_analysis (compare mode strip)")
            filtered_analysis = {
                k: v
                for k, v in cached_property_analysis.items()
                if k not in ["pros", "cons", "neighborhood_overview", "neighborhood"]
            }
            log.info(
                "PROPERTY_DETAILS",
                "Removed pros/cons and neighborhood section from cached data",
            )
            return filtered_analysis
        if analysis_options is None:
            use_cache = True
        else:
            _, _, expected_sig, _ = resolve_highlights_counts_and_signature(analysis_options, data)
            use_cache = analysis_cache_signature_matches(cached_property_analysis, expected_sig)
        if use_cache:
            log.info(
                "PROPERTY_DETAILS",
                "Skipping property_analysis generation, using cached data",
            )
            return finalize_property_analysis_payload(
                cached_property_analysis, property_address, for_compare_stream=False
            )
        log.info(
            "PROPERTY_DETAILS",
            "Cached analysis present but signature mismatch; regenerating",
        )

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

        resolved_options = analysis_options
        if resolved_options is None:
            built, err = build_research_analysis_options(current_user, {})
            if err is not None or built is None:
                return {}
            resolved_options = built

        user_preferences = resolved_options.preferences
        return generate_property_analysis(
            property_address,
            data,
            user_preferences,
            skip_pros_cons=skip_pros_cons,
            analysis_options=resolved_options,
        )

    except Exception as e:
        log.error(
            "ERRORS",
            "Error during property analysis",
            {"error": str(e), "traceback": traceback.format_exc()},
        )
        return {"error": "Failed to analyze property"}
