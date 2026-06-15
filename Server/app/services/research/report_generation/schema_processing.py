"""Shared schema filtering and processing for report and comparison modes."""

import traceback
from typing import Any

from logger import log

from .schema_synthesis import sanitize_schema_for_llm


def process_schema_common_steps(
    schema: dict,
    model_class: type,
    section_name: str,
    user_preferences: dict[str, Any] | None = None,
    default_type_for_missing: str = "string",
    mode: str = "report",
) -> dict:
    """
    Common schema processing steps shared between report and comparison modes.
    """
    use_comparison = mode == "comparison" and hasattr(model_class, "get_comparison_description")
    description_method = "get_comparison_description" if use_comparison else "get_description"

    if hasattr(model_class, description_method):
        try:
            if use_comparison:
                descriptions = model_class.get_comparison_description(user_preferences or {})
            else:
                descriptions = model_class.get_description(user_preferences or {})

            original_properties = schema.get("properties", {}).copy()
            filtered_properties = {}

            for key, desc in descriptions.items():
                if key in original_properties:
                    filtered_properties[key] = original_properties[key].copy()
                    filtered_properties[key]["description"] = desc
                else:
                    log.warn(
                        "PROPERTY_DETAILS",
                        "Schema description references unknown field",
                        {
                            "section_name": section_name,
                            "field": key,
                            "description_method": description_method,
                        },
                    )

            if use_comparison:
                schema["properties"] = filtered_properties
                schema["required"] = [
                    r for r in schema.get("required", []) if r in filtered_properties
                ]
                log.info(
                    "PROPERTY_DETAILS",
                    "Comparison mode schema filtered",
                    {
                        "section_name": section_name,
                        "field_count": len(filtered_properties),
                    },
                )
            else:
                schema["properties"] = original_properties
                for key, desc in descriptions.items():
                    if key in schema["properties"]:
                        schema["properties"][key]["description"] = desc

        except Exception as e:
            log.warn(
                "PROPERTY_DETAILS",
                "Failed to add descriptions to schema",
                {
                    "section_name": section_name,
                    "error": str(e),
                    "traceback": traceback.format_exc(),
                },
            )
    else:
        log.warn(
            "PROPERTY_DETAILS",
            "Model missing description method",
            {
                "section_name": section_name,
                "description_method": description_method,
            },
        )

    schema.setdefault("type", "object")
    schema.setdefault("properties", {})
    schema.setdefault("required", [])

    schema = sanitize_schema_for_llm(schema)

    for _, prop_schema in schema.get("properties", {}).items():
        if isinstance(prop_schema, dict) and "type" not in prop_schema:
            prop_schema["type"] = default_type_for_missing

    schema["required"] = [r for r in schema.get("required", []) if r in schema["properties"]]

    clean_schema = {
        "title": model_class.__name__,
        "description": f"Schema for the {section_name.replace('_', ' ')} section",
        "type": "object",
        "properties": schema["properties"],
        "required": schema["required"],
    }

    final_schema = {"type": "json_schema", "json_schema": {"schema": clean_schema}}

    disallowed_keys = ["$ref", "oneOf", "anyOf", "example", "default", "schema"]
    for key in disallowed_keys:
        if key in clean_schema:
            log.warn(
                "PROPERTY_DETAILS",
                "Disallowed key '{key}' found at root of schema for {section_name}",
            )
        for _prop_name, prop in clean_schema.get("properties", {}).items():
            if isinstance(prop, dict) and key in prop:
                log.warn(
                    "PROPERTY_DETAILS", "Disallowed key '{key}' found in property '{prop_name}'"
                )

    return final_schema


def filter_schema_by_recent_data(
    schema: dict,
    section_name: str,
    recent_sections: dict[str, dict[str, Any]],
    section_priorities: list | None = None,
) -> dict:
    """Filter schema properties based on recent data and priorities."""
    if not recent_sections or section_name not in recent_sections:
        return schema

    recent_data = recent_sections[section_name].get("data", {})
    if not isinstance(recent_data, dict) or not recent_data:
        return schema

    original_properties = schema.get("properties", {}).copy()
    filtered_properties = {}

    for prop_name, prop_schema in original_properties.items():
        if (
            prop_name not in recent_data
            or not recent_data[prop_name]
            or recent_data[prop_name] is None
        ):
            filtered_properties[prop_name] = prop_schema
        elif section_priorities and section_name in section_priorities:
            priority_index = section_priorities.index(section_name)
            if priority_index < 3:
                filtered_properties[prop_name] = prop_schema

    if filtered_properties:
        schema["properties"] = filtered_properties
        log.info(
            "PROPERTY_DETAILS",
            "Filtered schema (recent data exists)",
            {
                "section_name": section_name,
                "filtered_fields": len(filtered_properties),
                "original_fields": len(original_properties),
            },
        )
    else:
        log.info(
            "PROPERTY_DETAILS",
            "Keeping full schema",
            {"section_name": section_name},
        )

    return schema


def reduce_schema_for_low_priority(
    schema: dict,
    section_name: str,
    section_priorities: list,
    recent_sections: dict[str, dict[str, Any]] | None = None,
) -> dict:
    """Reduce schema for low-priority sections when recent data exists."""
    if not section_priorities or section_name not in section_priorities:
        return schema

    priority_index = section_priorities.index(section_name)
    if priority_index >= 5 and recent_sections and section_name in recent_sections:
        key_fields = list(schema.get("properties", {}).keys())[:5]
        schema["properties"] = {
            k: v for k, v in schema.get("properties", {}).items() if k in key_fields
        }
        log.info(
            "PROPERTY_DETAILS",
            "📊 [SCHEMA] Reduced schema for low-priority section {section_name} to key fields",
        )

    return schema
