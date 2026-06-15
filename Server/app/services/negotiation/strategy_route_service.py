"""Orchestration for POST /api/v1/offer/generate-strategy."""

from __future__ import annotations

import json
import os
import traceback
import uuid
from datetime import datetime, timezone
from typing import Any

from app.services.agent.client_service import agent_may_access_client
from app.services.aggregation import get_preferences_dict_optional
from app.services.analytics.posthog_events import capture_product_event
from app.services.auth.user_role_helpers import user_is_agent
from app.services.negotiation import generate_negotiation_strategy
from app.services.research.graphs.graphic_generation import (
    GOOGLE_MAPS_ID,
    fetch_directions_leg,
    generate_static_map_url,
)
from app.services.research.perplexity import analyze_property_with_sonar_pro
from app.services.search.data import get_property_detail
from app.services.search.home_matching.mcda.score import get_mcda_config
from app.services.search.scoring import (
    adjust_pros_cons_counts,
    compute_listing_match_score,
    highlights_context_payload,
)
from logger import log


def resolve_preferences_user_id(
    user, target_user_id: str | None
) -> tuple[str | None, dict[str, Any] | None, int | None]:
    """Returns (preferences_user_id, error_body, http_status) when access is denied."""
    preferences_user_id = user.id
    if not target_user_id:
        return preferences_user_id, None, None

    if not user_is_agent(user):
        log.warn(
            "NEGOTIATION",
            "Non-agent user attempted strategy for another user",
            {"user_id": str(user.id), "target_user_id": target_user_id},
        )
        return (
            None,
            {
                "error": "Only agents can generate strategies for other users",
                "success": False,
            },
            403,
        )

    target_s = str(target_user_id).strip()
    if not agent_may_access_client(str(user.id), target_s):
        log.warn(
            "NEGOTIATION",
            "Agent attempted strategy for non-client",
            {"agent_id": str(user.id), "client_id": target_s},
        )
        return (
            None,
            {"error": "Access denied: User is not your client", "success": False},
            403,
        )

    return target_s, None, None


def build_negotiation_strategy_payload(
    user,
    *,
    address: str,
    target_user_id: str | None = None,
) -> tuple[dict[str, Any], int]:
    preferences_user_id, err_body, err_status = resolve_preferences_user_id(user, target_user_id)
    if err_body is not None:
        return err_body, err_status or 403

    strategy_id = str(uuid.uuid4())
    filename = f"negotiation_strategy_{strategy_id}.json"

    user_preferences = get_preferences_dict_optional(str(preferences_user_id))
    if not user_preferences:
        log.warn(
            "NEGOTIATION",
            "No user preferences for negotiation strategy",
            {"preferences_user_id": preferences_user_id},
        )

    property_data = None
    commute_data = None
    property_analysis = None

    try:
        GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
        property_data, _prop_err = get_property_detail(address=address.strip())

        if property_data:
            property_address = address.strip()
            if isinstance(property_data, dict):
                street = property_data.get("streetAddress", "")
                city = property_data.get("city", "")
                state = property_data.get("state", "")
                zipcode = property_data.get("zipcode", "")
                if street and city and state:
                    property_address = f"{street}, {city}, {state} {zipcode}".strip()

            if user_preferences and GOOGLE_MAPS_API_KEY:
                commute_data = {"travel_times": [], "property_address": property_address}
                important_locations = []
                locations_data = user_preferences.get("important_locations", [])

                if isinstance(locations_data, str):
                    try:
                        locations_data = json.loads(locations_data)
                    except json.JSONDecodeError:
                        locations_data = []

                if isinstance(locations_data, list):
                    important_locations = locations_data

                secondary_locations = []
                for i, location in enumerate(important_locations):
                    if isinstance(location, dict) and "address" in location:
                        location_address = location["address"]
                        location_name = (
                            location.get("name")
                            or location.get("label")
                            or location_address[:40]
                            or f"Location {i + 1}"
                        )
                        leg = fetch_directions_leg(
                            property_address, location_address, GOOGLE_MAPS_API_KEY
                        )
                        travel_time = leg.get("duration_text") if leg else None
                        encoded_polyline = leg.get("encoded_polyline") if leg else None
                        commute_data["travel_times"].append(
                            {
                                "name": location_name,
                                "address": location_address,
                                "travel_time": travel_time,
                                "commute_tolerance": location.get("commute_tolerance", 30),
                                "encoded_polyline": encoded_polyline,
                            }
                        )
                        secondary_locations.append(
                            {"name": location_name, "address": location_address}
                        )

                map_url = None
                if secondary_locations:
                    try:
                        map_url = generate_static_map_url(
                            property_address,
                            secondary_locations,
                            GOOGLE_MAPS_API_KEY,
                            map_id=GOOGLE_MAPS_ID,
                        )
                    except Exception as e:
                        log.error("ERRORS", "Error generating map URL", {"error": str(e)})
                commute_data["map_url"] = map_url

            if user_preferences and isinstance(property_data, dict):
                home_object = {
                    "address": property_address,
                    "price": property_data.get("price", property_data.get("listPrice", 0)),
                    "bedrooms": property_data.get("bedrooms", property_data.get("beds", 0)),
                    "bathrooms": property_data.get("bathrooms", property_data.get("baths", 0)),
                    "livingArea": property_data.get("livingArea", property_data.get("sqft", 0)),
                    "propertyType": property_data.get(
                        "propertyType", property_data.get("homeType", "Unknown")
                    ),
                    "lotAreaValue": property_data.get("lotAreaValue"),
                    "lotAreaUnit": property_data.get("lotAreaUnit"),
                    "listingStatus": property_data.get("listingStatus"),
                    "city": property_data.get("city"),
                    "state": property_data.get("state"),
                    "zipcode": property_data.get("zipcode"),
                }
                _cfg = get_mcda_config()
                _lo = float(_cfg["output_display_min"])
                _hi = float(_cfg["output_display_max"])
                _mscore = compute_listing_match_score(user_preferences, property_data, config=_cfg)
                if _mscore is None:
                    _p, _c = 3, 3
                else:
                    _p, _c = adjust_pros_cons_counts(3, 3, _mscore, _lo, _hi)
                sonar_ctx = {
                    "viewer_is_agent": bool(user_is_agent(user)),
                    "profile_subject": (
                        "client" if str(preferences_user_id) != str(user.id) else "self"
                    ),
                    "pros_count": _p,
                    "cons_count": _c,
                    "bullet_style": "medium",
                }
                analysis_result = analyze_property_with_sonar_pro(
                    user_preferences, home_object, analysis_context=sonar_ctx
                )
                if analysis_result:
                    property_analysis = {
                        "pros": analysis_result.pros,
                        "cons": analysis_result.cons,
                    }
                    _hc = highlights_context_payload(_mscore)
                    if _hc:
                        property_analysis["highlights_context"] = _hc
    except Exception as e:
        log.error(
            "NEGOTIATION",
            "Error fetching property data for negotiation strategy",
            {"error": str(e)},
        )

    try:
        enhanced_params = {
            "strategy_type": "comprehensive",
            "include_market_analysis": True,
            "include_tactics": True,
            "temperature": 0.2,
            "max_tokens": 3000,
            "property_data": property_data,
            "commute_data": commute_data,
            "property_analysis": property_analysis,
        }
        strategy_data = generate_negotiation_strategy(
            address=address,
            user_preferences=user_preferences,
            property_data=property_data,
            commute_data=commute_data,
            property_analysis=property_analysis,
            params=enhanced_params,
        )
        response_data: dict[str, Any] = {
            "success": True,
            "strategy": strategy_data,
            "property_address": address,
            "strategy_id": strategy_id,
            "filename": filename,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "generated_for_user": preferences_user_id,
        }
        if property_data:
            response_data["property_data"] = property_data
        if commute_data:
            response_data["commute_data"] = commute_data
        if property_analysis:
            response_data["property_analysis"] = property_analysis

        capture_product_event(
            str(user.id),
            "negotiation_strategy_generated",
            properties={
                "generated_for_self": str(preferences_user_id) == str(user.id),
                "has_property_data": bool(property_data),
                "has_commute_data": bool(commute_data),
                "has_property_analysis": bool(property_analysis),
            },
        )
        return response_data, 200
    except Exception as e:
        error_msg = f"Strategy generation failed: {str(e)}"
        log.error(
            "ERRORS",
            error_msg,
            {"traceback": traceback.format_exc()},
        )
        return (
            {"success": False, "error": error_msg, "traceback": traceback.format_exc()},
            500,
        )
