from copy import deepcopy
from typing import Dict, Any
import logging
import traceback
import json

logger = logging.getLogger(__name__)

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


def get_individual_section_schema(section_name: str, user_preferences: Dict[str, Any] = None, mode: str = "report") -> Dict[str, Any]:
    """
    Generate a flattened, Perplexity-compatible JSON schema for a given report section.
    """
    logger.info(f"🔍 Generating individual schema for section: {section_name} in mode: {mode}")

    if mode == "report":
        from app.models.report_models import (
            NeighborhoodOverview, Safety, CultureAndEvents, SocialCharacter,
            LocalAmenities, Commute, FamilyFriendly, NightlifeAndDating,
            Development, EnvironmentUtilities, FinancialInformation,
            Schools, ExtraTips, LifestyleDNA
        )

        section_model_map = {
            'neighborhood_overview': NeighborhoodOverview,
            'safety': Safety,
            'culture_and_events': CultureAndEvents,
            'social_character': SocialCharacter,
            'local_amenities': LocalAmenities,
            'commute': Commute,
            'family_friendly': FamilyFriendly,
            'nightlife_and_dating': NightlifeAndDating,
            'development': Development,
            'environment_utilities': EnvironmentUtilities,
            'financial_information': FinancialInformation,
            'schools': Schools,
            'extra_tips': ExtraTips,
            'lifestyle_dna': LifestyleDNA,
        }

        model_class = section_model_map.get(section_name)

        if not model_class:
            logger.error(f"❌ No model class found for section: {section_name} in mode: {mode}")
            return {"error": f"No model class found for section: {section_name}"}

        # Deepcopy to avoid modifying the original schema
        schema = deepcopy(model_class.schema())

        # Add field descriptions if available
        if hasattr(model_class, 'get_description'):
            try:
                descriptions = model_class.get_description(user_preferences or {})
                for key, desc in descriptions.items():
                    if key in schema.get("properties", {}):
                        schema["properties"][key]["description"] = desc
                logger.info(f"✅ Added field descriptions to {section_name} schema")
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
                prop_schema["type"] = "string"
                logger.info(f"✅ Added missing type 'string' to property {prop_name}")

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

    elif mode == "marketing":
        from app.models.marketing_model import Marketing
        
        section_model_map = {
            'marketing': Marketing,
        }
        
        model_class = section_model_map.get(section_name)
        
        if not model_class:
            logger.error(f"❌ No model class found for section: {section_name} in mode: {mode}")
            return {"error": f"No model class found for section: {section_name}"}
        
        # Deepcopy to avoid modifying the original schema
        schema = deepcopy(model_class.schema())
        
        # Add field descriptions if available
        if hasattr(model_class, 'get_description'):
            try:
                descriptions = model_class.get_description(user_preferences or {})
                for key, desc in descriptions.items():
                    if key in schema.get("properties", {}):
                        schema["properties"][key]["description"] = desc
                logger.info(f"✅ Added field descriptions to {section_name} schema")
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
                prop_schema["type"] = "string"
                logger.info(f"✅ Added missing type 'string' to property {prop_name}")
        
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
        
        # Logging for review
        logger.info(f"🔍 Final schema for section '{section_name}':\n{json.dumps(final_schema, indent=2)}")
        
        # Final sanity check for forbidden keys
        disallowed_keys = ["$ref", "oneOf", "anyOf", "example", "default", "schema"]
        for key in disallowed_keys:
            if key in clean_schema:
                logger.warning(f"⚠️ Disallowed key '{key}' found at root of schema for {section_name}")
            for prop_name, prop in clean_schema.get("properties", {}).items():
                if isinstance(prop, dict) and key in prop:
                    logger.warning(f"⚠️ Disallowed key '{key}' found in property '{prop_name}'")
        
        return final_schema

    elif mode == "comparison":
        from app.models.duel_report_models import (
            ComparisonSummary, NeighborhoodOverview, Safety, CultureAndEvents, SocialCharacter,
            Commute, FamilyFriendly, NightlifeAndDating, Development, EnvironmentUtilities,
            FinancialInformation, Schools, ExtraTips, ComparisonField
        )
        
        section_model_map = {
            'comparison_summary': ComparisonSummary,
            'neighborhood_overview': NeighborhoodOverview,
            'safety': Safety,
            'culture_and_events': CultureAndEvents,
            'social_character': SocialCharacter,
            'commute': Commute,
            'family_friendly': FamilyFriendly,
            'nightlife_and_dating': NightlifeAndDating,
            'development': Development,
            'environment_utilities': EnvironmentUtilities,
            'financial_information': FinancialInformation,
            'schools': Schools,
            'extra_tips': ExtraTips,
        }
        
        model_class = section_model_map.get(section_name)
        
        if not model_class:
            logger.error(f"❌ No model class found for section: {section_name} in mode: {mode}")
            return {"error": f"No model class found for section: {section_name}"}
        
        # Deepcopy to avoid modifying the original schema
        schema = deepcopy(model_class.schema())
        
        # Add field descriptions if available
        if hasattr(model_class, 'get_description'):
            try:
                descriptions = model_class.get_description(user_preferences or {})
                for key, desc in descriptions.items():
                    if key in schema.get("properties", {}):
                        schema["properties"][key]["description"] = desc
                logger.info(f"✅ Added field descriptions to {section_name} schema")
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
                prop_schema["type"] = "object"  # Use string instead of class reference
                logger.info(f"✅ Added missing type 'ComparisonField' to property {prop_name}")
        
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
        
        # Logging for review
        logger.info(f"🔍 Final schema for section '{section_name}':\n{json.dumps(final_schema, indent=2)}")
        
        # Final sanity check for forbidden keys
        disallowed_keys = ["$ref", "oneOf", "anyOf", "example", "default", "schema"]
        for key in disallowed_keys:
            if key in clean_schema:
                logger.warning(f"⚠️ Disallowed key '{key}' found at root of schema for {section_name}")
            for prop_name, prop in clean_schema.get("properties", {}).items():
                if isinstance(prop, dict) and key in prop:
                    logger.warning(f"⚠️ Disallowed key '{key}' found in property '{prop_name}'")
        
        return final_schema
