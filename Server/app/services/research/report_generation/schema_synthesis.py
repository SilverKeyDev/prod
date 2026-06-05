"""Section synthesis and LLM schema sanitization for report generation."""

from typing import Any


def synthesize_property_analysis_sections(
    existing_sections: dict[str, dict[str, Any]], newly_generated_sections: dict[str, Any]
) -> dict[str, Any]:
    """
    Synthesize existing property analysis sections with newly generated sections.
    Merges data intelligently, preferring newer data but preserving valuable existing data.

    Args:
        existing_sections: Dict of existing sections with metadata (from database)
        newly_generated_sections: Dict of newly generated sections

    Returns:
        Synthesized dict containing merged sections
    """
    synthesized = {}

    for section_name, section_info in existing_sections.items():
        if isinstance(section_info, dict) and "data" in section_info:
            synthesized[section_name] = section_info["data"]

    for section_name, new_data in newly_generated_sections.items():
        if section_name in synthesized:
            existing_data = synthesized[section_name]
            if isinstance(existing_data, dict) and isinstance(new_data, dict):
                merged = existing_data.copy()
                for key, value in new_data.items():
                    if value is not None and value != "" and value != []:
                        merged[key] = value
                    elif key not in merged or not merged[key]:
                        merged[key] = value
                synthesized[section_name] = merged
            else:
                synthesized[section_name] = new_data
        else:
            synthesized[section_name] = new_data

    return synthesized


def sanitize_schema_for_llm(schema: dict) -> dict:
    """
    Clean up schema for LLM compatibility.
    - Remove problematic keywords: $ref, anyOf, oneOf, examples, title, default
    - Recursively sanitize nested properties
    """

    def clean_props(obj):
        if not isinstance(obj, dict):
            return

        for _key, val in obj.items():
            if isinstance(val, dict):
                for bad in ["$ref", "anyOf", "oneOf", "examples", "example", "title", "default"]:
                    val.pop(bad, None)

                if val.get("type") == "object":
                    val.setdefault("properties", {})
                    clean_props(val["properties"])

                clean_props(val)

    clean_props(schema.get("properties", {}))

    for key in ["$ref", "anyOf", "oneOf", "examples", "example", "title", "default"]:
        schema.pop(key, None)

    return schema
