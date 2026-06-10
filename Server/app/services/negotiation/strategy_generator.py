"""
Strategy generator for negotiation strategies.
"""

from typing import Any

from logger import log

from .research import generate_report


def generate_negotiation_strategy(
    address: str,
    user_preferences: dict[str, Any] | None = None,
    property_data: dict[str, Any] | None = None,
    commute_data: dict[str, Any] | None = None,
    property_analysis: dict[str, Any] | None = None,
    params: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Generate a negotiation strategy for a property.

    Args:
        address: Property address
        user_preferences: User preferences dict
        property_data: Property data dict
        commute_data: Commute data dict
        property_analysis: Property analysis dict with pros/cons
        params: Additional parameters for generation

    Returns:
        Dict containing the generated negotiation strategy
    """
    params = params or {}

    # Enhance params with provided data
    enhanced_params = {
        "property_data": property_data,
        "commute_data": commute_data,
        "property_analysis": property_analysis,
        **params,
    }

    # Generate strategy using the research module
    # Use "strategy" as section_type to trigger negotiation strategy generation
    result = generate_report(
        section_type="strategy",
        address=address,
        filename=f"negotiation_strategy_{address.replace(' ', '_')}.json",
        user_id=user_preferences.get("user_id", "") if user_preferences else "",
        params=enhanced_params,
        user_preferences=user_preferences,
        max_retries=params.get("max_retries", 2),
    )

    # Return the data from the result
    if result.get("success") and "data" in result:
        return result["data"]
    else:
        log.error("NEGOTIATION", "Failed to generate negotiation strategy", {"result": result})
        raise RuntimeError(f"Strategy generation failed: {result.get('error', 'Unknown error')}")
