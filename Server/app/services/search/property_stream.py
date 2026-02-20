"""
Streaming property data generator for Server-Sent Events (SSE).

This module provides a generator function that yields property data chunks
as they become available, allowing the frontend to display data progressively.
"""

import json
import os
import traceback

from flask import current_app

from app.services.aggregation import get_preferences_dict_optional
from app.services.auth import SecurityException, get_current_user
from app.services.research.perplexity_analysis import analyze_property_with_sonar_pro
from app.services.research.perplexity_report_sections import (
    generate_report_sections_for_property,
    generate_report_sections_for_property_streaming,
)
from app.services.research.property.property_analysis import DEFAULT_SECTION_ORDER
from app.services.search.features.image_features import extract_and_clean_features
from app.services.search.property_stream_steps import (
    build_combined_features,
    build_commute_data,
    build_features,
    build_update_fields,
    fetch_basic_property_data,
    fetch_zillow_images,
    get_property_address,
    persist_home_universal,
)

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")


def _sse(type_name: str, data: dict) -> str:
    return f"data: {json.dumps({'type': type_name, 'data': data})}\n\n"


def _generate_property_stream_internal(
    params: dict, address: str | None, skip_pros_cons: bool = False
):
    """
    Internal generator: runs steps in order and yields SSE strings.
    skip_pros_cons=True: compare mode (no pros/cons, streaming sections).
    """
    try:
        data, err = fetch_basic_property_data(params)
        if err is not None:
            yield _sse("error", err)
            return

        yield _sse("basic", {"success": True, "query": params, "data": data})

        property_address = get_property_address(data or {}, address)
        current_user = None
        try:
            current_user = get_current_user()
        except (SecurityException, Exception):
            current_user = None

        commute_data = {}
        try:
            commute_data = build_commute_data(property_address, current_user, GOOGLE_MAPS_API_KEY)
            if not commute_data and property_address:
                commute_data["property_address"] = property_address
        except Exception as e:
            current_app.logger.error(f"🗺️ [PROPERTY] Error calculating commute data: {e}")
            commute_data = {"error": "Failed to calculate commute data"}
        yield _sse("commute_data", commute_data)

        property_analysis = {}
        if skip_pros_cons:
            section_names = DEFAULT_SECTION_ORDER
            if section_names and isinstance(section_names, list):
                section_names = [s for s in section_names if s != "neighborhood_overview"]
            if section_names and current_user and data:
                user_prefs_dict = get_preferences_dict_optional(str(current_user.id))
                if user_prefs_dict:
                    existing_sections = {}
                    sections_to_generate = []
                    for section_name in section_names:
                        if (
                            section_name in property_analysis
                            and property_analysis[section_name] is not None
                            and property_analysis[section_name] != {}
                        ):
                            existing_sections[section_name] = property_analysis[section_name]
                        else:
                            sections_to_generate.append(section_name)
                    for section_name, section_data in existing_sections.items():
                        yield _sse("property_analysis_section", {section_name: section_data})
                    if sections_to_generate:
                        for section_result in generate_report_sections_for_property_streaming(
                            section_names=sections_to_generate,
                            address=property_address
                            or data.get("streetAddress", "Unknown address"),
                            user_preferences=user_prefs_dict,
                            property_data=data,
                            existing_sections=property_analysis,
                        ):
                            sn = section_result["section_name"]
                            sd = section_result["section_data"]
                            property_analysis[sn] = sd
                            yield _sse("property_analysis_section", {sn: sd})
            if isinstance(property_analysis, dict):
                property_analysis.pop("neighborhood_overview", None)
        else:
            try:
                if current_user and data:
                    user_prefs_dict = get_preferences_dict_optional(str(current_user.id))
                    if user_prefs_dict:
                        home_object = {
                            "address": property_address
                            or data.get("streetAddress", "Unknown address"),
                            "price": data.get("price", data.get("listPrice", 0)),
                            "bedrooms": data.get("bedrooms", data.get("beds", 0)),
                            "bathrooms": data.get("bathrooms", data.get("baths", 0)),
                            "livingArea": data.get("livingArea", data.get("sqft", 0)),
                            "propertyType": data.get(
                                "propertyType", data.get("homeType", "Unknown")
                            ),
                            "lotAreaValue": data.get("lotAreaValue"),
                            "lotAreaUnit": data.get("lotAreaUnit"),
                            "listingStatus": data.get("listingStatus"),
                            "city": data.get("city"),
                            "state": data.get("state"),
                            "zipcode": data.get("zipcode"),
                        }
                        analysis_result = analyze_property_with_sonar_pro(
                            user_prefs_dict, home_object
                        )
                        if analysis_result:
                            property_analysis = {
                                "pros": analysis_result.pros,
                                "cons": analysis_result.cons,
                            }
                        else:
                            property_analysis = {}
                        yield _sse("property_analysis_partial", property_analysis.copy())
                        section_names = DEFAULT_SECTION_ORDER
                        if section_names and isinstance(section_names, list):
                            additional_sections = generate_report_sections_for_property(
                                section_names=section_names,
                                address=property_address
                                or data.get("streetAddress", "Unknown address"),
                                user_preferences=user_prefs_dict,
                                property_data=data,
                            )
                            if additional_sections:
                                property_analysis.update(additional_sections)
            except Exception as e:
                current_app.logger.error(f"🔍 [PROPERTY] Error during property analysis: {e}")
                current_app.logger.error(traceback.format_exc())
                property_analysis = {"error": "Failed to analyze property"}

        yield _sse("property_analysis", property_analysis)

        zillow_images = fetch_zillow_images(params, data or {})
        yield _sse(
            "images",
            zillow_images if isinstance(zillow_images, dict) else {"images": zillow_images or []},
        )

        image_features = None
        try:
            if zillow_images:
                image_features = extract_and_clean_features(zillow_images[:5])
        except Exception as e:
            current_app.logger.error(f"🔍 [PROPERTY] Error during image feature extraction: {e}")
            image_features = {"error": "Failed to extract features from images"}

        features = build_features(data or {})

        if skip_pros_cons:
            combined_features_data = build_combined_features(features, image_features, current_user)
            yield _sse("combined_features", combined_features_data or {})
            yield _sse("image_features", image_features or {})
            yield _sse("features", features or {})
        else:
            yield _sse("image_features", image_features or {})
            yield _sse("features", features or {})
            combined_features_data = build_combined_features(features, image_features, current_user)
            yield _sse("combined_features", combined_features_data or {})

        try:
            if current_user:
                full_address, update_fields = build_update_fields(
                    data or {},
                    address,
                    params,
                    features,
                    combined_features_data,
                    property_analysis,
                    commute_data,
                    zillow_images,
                )
                if full_address:
                    persist_home_universal(str(current_user.id), full_address, update_fields)
        except Exception as persist_err:
            current_app.logger.error(
                f"[PROPERTY] ⚠️ Failed to persist property details: {persist_err}",
                exc_info=True,
            )

        yield _sse("complete", {})

    except Exception as e:
        current_app.logger.error(f"[PROPERTY] Streaming error: {e}", exc_info=True)
        current_app.logger.error(traceback.format_exc())
        yield _sse("error", {"error": str(e)})


def generate_property_stream(params: dict, address: str | None = None):
    """
    Generator function that yields SSE-formatted property data chunks.
    Includes pros/cons and full report sections.
    """
    yield from _generate_property_stream_internal(params, address, skip_pros_cons=False)


def generate_property_stream_compare(params: dict, address: str | None = None):
    """
    Generator that yields SSE-formatted property data for comparison.
    Skips pros/cons; yields report sections and combined/image_features/features.
    """
    yield from _generate_property_stream_internal(params, address, skip_pros_cons=True)
