from copy import deepcopy
from typing import Dict, Any
import logging
import traceback
import json

from app.services.research.report_models import (
    Affordability, Neighborhood, CommuteSection, FamilyFriendlySection,
    Entertainment, Investment, ClimateEnvironmentalSafety, ConvenienceWalkability, Home
)

logger = logging.getLogger(__name__)

# Common section model mapping for all modes
SECTION_MODEL_MAP = {
    'affordability': Affordability,
    'neighborhood': Neighborhood,
    'commute': CommuteSection,
    'family_friendly': FamilyFriendlySection,
    'entertainment': Entertainment,
    'investment': Investment,
    'climate_environmental_safety': ClimateEnvironmentalSafety,
    'convenience_walkability': ConvenienceWalkability,
    'home': Home,
}

def synthesize_property_analysis_sections(
    existing_sections: Dict[str, Dict[str, Any]],
    newly_generated_sections: Dict[str, Any]
) -> Dict[str, Any]:
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
    
    # Start with existing sections
    for section_name, section_info in existing_sections.items():
        if isinstance(section_info, dict) and 'data' in section_info:
            synthesized[section_name] = section_info['data']
    
    # Merge in newly generated sections
    for section_name, new_data in newly_generated_sections.items():
        if section_name in synthesized:
            # Merge existing and new data
            existing_data = synthesized[section_name]
            if isinstance(existing_data, dict) and isinstance(new_data, dict):
                # For dict sections, merge field by field
                merged = existing_data.copy()
                for key, value in new_data.items():
                    # Prefer new data if it's not empty/None
                    if value is not None and value != "" and value != []:
                        merged[key] = value
                    # Keep existing if new is empty but existing has value
                    elif key not in merged or not merged[key]:
                        merged[key] = value
                synthesized[section_name] = merged
            else:
                # For non-dict sections, prefer new data
                synthesized[section_name] = new_data
        else:
            # New section, add it
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

        for key, val in obj.items():
            if isinstance(val, dict):
                # Remove disallowed keys
                for bad in ["$ref", "anyOf", "oneOf", "examples", "example", "title", "default"]:
                    val.pop(bad, None)

                # Recurse into object properties
                if val.get("type") == "object":
                    val.setdefault("properties", {})
                    clean_props(val["properties"])

                # Recurse into nested dictionaries
                clean_props(val)

    # Clean starting at top-level properties
    clean_props(schema.get("properties", {}))
    
    # Also clean the root schema
    for key in ["$ref", "anyOf", "oneOf", "examples", "example", "title", "default"]:
        schema.pop(key, None)

    return schema


def _process_schema_common_steps(
    schema: dict,
    model_class: type,
    section_name: str,
    user_preferences: Dict[str, Any] = None,
    default_type_for_missing: str = "string"
) -> dict:
    """
    Common schema processing steps shared between report and comparison modes.
    
    Args:
        schema: The schema dict to process
        model_class: The model class for this section
        section_name: Name of the section
        user_preferences: Optional user preferences dict
        default_type_for_missing: Default type to use for properties without a type
        
    Returns:
        Processed schema dict
    """
    # Add field descriptions if available
    if hasattr(model_class, 'get_description'):
        try:
            descriptions = model_class.get_description(user_preferences or {})
            for key, desc in descriptions.items():
                if key in schema.get("properties", {}):
                    schema["properties"][key]["description"] = desc
        except Exception as e:
            logger.warning(f"⚠️ Failed to add descriptions to {section_name} schema: {e}\n{traceback.format_exc()}")
    
    # Ensure required schema structure
    schema.setdefault("type", "object")
    schema.setdefault("properties", {})
    schema.setdefault("required", [])
    
    # Sanitize recursively
    schema = sanitize_schema_for_llm(schema)
    
    # Ensure every property has a "type"
    for prop_name, prop_schema in schema.get("properties", {}).items():
        if isinstance(prop_schema, dict) and "type" not in prop_schema:
            prop_schema["type"] = default_type_for_missing
    
    # Trim required list to only valid props
    schema["required"] = [r for r in schema.get("required", []) if r in schema["properties"]]
    
    # Assemble clean schema
    clean_schema = {
        "title": model_class.__name__,
        "description": f"Schema for the {section_name.replace('_', ' ')} section",
        "type": "object",
        "properties": schema["properties"],
        "required": schema["required"],
    }
    
    # Final structured output format
    final_schema = {
        "type": "json_schema",
        "json_schema": {
            "schema": clean_schema
        }
    }
    
    # Final sanity check for forbidden keys
    disallowed_keys = ["$ref", "oneOf", "anyOf", "example", "default", "schema"]
    for key in disallowed_keys:
        if key in clean_schema:
            logger.warning(f"⚠️ Disallowed key '{key}' found at root of schema for {section_name}")
        for prop_name, prop in clean_schema.get("properties", {}).items():
            if isinstance(prop, dict) and key in prop:
                logger.warning(f"⚠️ Disallowed key '{key}' found in property '{prop_name}'")
    
    return final_schema


def _filter_schema_by_recent_data(
    schema: dict,
    section_name: str,
    recent_sections: Dict[str, Dict[str, Any]],
    section_priorities: list = None
) -> dict:
    """
    Filter schema properties based on recent data and priorities.
    
    Args:
        schema: The schema dict to filter
        section_name: Name of the section
        recent_sections: Dict of recently generated sections with metadata
        section_priorities: Ordered list of section names by priority
        
    Returns:
        Filtered schema dict
    """
    if not recent_sections or section_name not in recent_sections:
        return schema
    
    recent_data = recent_sections[section_name].get('data', {})
    if not isinstance(recent_data, dict) or not recent_data:
        return schema
    
    # Filter schema properties to only include fields that are missing or empty in recent data
    original_properties = schema.get("properties", {}).copy()
    filtered_properties = {}
    
    for prop_name, prop_schema in original_properties.items():
        # Include field if it's missing, empty, or None in recent data
        if prop_name not in recent_data or not recent_data[prop_name] or recent_data[prop_name] is None:
            filtered_properties[prop_name] = prop_schema
        # Also include if section_priorities indicates this is high priority
        elif section_priorities and section_name in section_priorities:
            priority_index = section_priorities.index(section_name)
            # If this is in top 3 priorities, regenerate even if exists
            if priority_index < 3:
                filtered_properties[prop_name] = prop_schema
    
    # If we filtered out all properties, keep original (regenerate everything)
    if filtered_properties:
        schema["properties"] = filtered_properties
        logger.info(f"📊 [SCHEMA] Filtered schema for {section_name}: {len(filtered_properties)}/{len(original_properties)} fields (recent data exists)")
    else:
        logger.info(f"📊 [SCHEMA] Keeping full schema for {section_name} (high priority or all fields need update)")
    
    return schema


def _reduce_schema_for_low_priority(
    schema: dict,
    section_name: str,
    section_priorities: list,
    recent_sections: Dict[str, Dict[str, Any]] = None
) -> dict:
    """
    Reduce schema for low-priority sections when recent data exists.
    
    Args:
        schema: The schema dict to potentially reduce
        section_name: Name of the section
        section_priorities: Ordered list of section names by priority
        recent_sections: Optional dict of recently generated sections
        
    Returns:
        Potentially reduced schema dict
    """
    if not section_priorities or section_name not in section_priorities:
        return schema
    
    priority_index = section_priorities.index(section_name)
    # Lower priority sections might get reduced schemas if recent data exists
    if priority_index >= 5 and recent_sections and section_name in recent_sections:
        # For lower priority sections with recent data, focus on key fields only
        key_fields = list(schema.get("properties", {}).keys())[:5]  # Top 5 fields
        schema["properties"] = {k: v for k, v in schema.get("properties", {}).items() if k in key_fields}
        logger.info(f"📊 [SCHEMA] Reduced schema for low-priority section {section_name} to key fields")
    
    return schema


def get_individual_section_schema(
    section_name: str, 
    user_preferences: Dict[str, Any] = None, 
    mode: str = "report",
    recent_sections: Dict[str, Dict[str, Any]] = None,
    section_priorities: list = None
) -> Dict[str, Any]:
    """
    Generate a flattened, Perplexity-compatible JSON schema for a given report section.
    
    This function intelligently determines what fields to include in the schema based on:
    - Schema type (report/comparison/marketing)
    - User priorities (which sections are most important)
    - Recent database entries (what was generated in the last 2 weeks)
    
    Args:
        section_name: Name of the section to generate schema for
        user_preferences: User preferences dict
        mode: Schema mode ("report", "comparison", or "marketing")
        recent_sections: Dict of recently generated sections with metadata (from last 2 weeks)
        section_priorities: Ordered list of section names by priority
        
    Returns:
        Dict containing the schema, potentially filtered based on recent data and priorities
    """

    # Get model class for the section
    model_class = SECTION_MODEL_MAP.get(section_name)
    
    if not model_class:
        logger.error(f"❌ No model class found for section: {section_name} in mode: {mode}")
        return {"error": f"No model class found for section: {section_name}"}
    
    # Deepcopy to avoid modifying the original schema
    schema = deepcopy(model_class.schema())
    
    # Mode-specific processing
    if mode == "report":
        # Smart schema filtering based on recent data and priorities
        schema = _filter_schema_by_recent_data(schema, section_name, recent_sections or {}, section_priorities)
        
        # Reduce schema for low-priority sections
        schema = _reduce_schema_for_low_priority(schema, section_name, section_priorities or [], recent_sections)
        
        # Process common steps with "string" as default type
        return _process_schema_common_steps(
            schema, model_class, section_name, user_preferences, default_type_for_missing="string"
        )
    
    elif mode == "comparison":
        # Comparison mode: For comparing two properties in research reports.
        # Excludes sections with long narrative text content for more concise comparisons.
        # Process common steps with "object" as default type
        return _process_schema_common_steps(
            schema, model_class, section_name, user_preferences, default_type_for_missing="object"
        )
    
    else:
        logger.error(f"❌ Unknown mode: {mode}")
        return {"error": f"Unknown mode: {mode}"}
