from copy import deepcopy
from app.models.report_models import FullReport
from app.models.duel_report_models import CompareReport
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

def generate_report_schema(report_customization: Dict[str, Any], user_preferences: Dict[str, Any] = None, compare: bool = False) -> Dict[str, Any]:
    try:
        section_keys = report_customization.get("report_section_priorities", [])
        logger.info(f"🔧 Schema generation started with sections: {section_keys}")
        logger.info(f"🔧 User preferences provided: {user_preferences is not None}")

        # Step 1: Instantiate and get full schema
        report = CompareReport(report_customization=report_customization) if compare else FullReport(report_customization=report_customization)
        full_schema = report.schema(report_customization=report_customization)

        # Step 2: Build filtered properties (just copy the base schema structure)
        properties = {}
        for section_key in section_keys:
            if section_key not in full_schema.get("properties", {}):
                logger.warning(f"⚠️ Section key '{section_key}' missing in full schema, skipping.")
                continue
            
            # Just copy the base section schema structure (with $ref)
            properties[section_key] = deepcopy(full_schema["properties"][section_key])

        # Step 3: Enhance $defs with personalized examples and descriptions
        original_defs = full_schema.get("$defs", {})
        description_map = {
            "NeighborhoodOverview": "Comprehensive overview of the neighborhood including demographics, culture, and community characteristics",
            "Demographics": "Population demographics including age, gender, race, and lifestyle distribution",
            "Safety": "Safety and crime information including ratings, police presence, and risks",
            "Weather": "Seasonal weather and climate characteristics across all four seasons",
            "CultureAndEvents": "Community events, cultural dynamics, and local traditions",
            "SocialCharacter": "Community tone including income, religiosity, and social cohesion",
            "LocalAmenities": "Nearby restaurants, parks, activities, and local gems",
            "Commute": "Walkability, traffic, and public transit access",
            "FamilyFriendly": "Child- and family-centric aspects including schools and parks",
            "NightlifeAndDating": "Local dating dynamics, nightlife ratings, and popular venues",
            "Accessibility": "Disability-friendly and age-inclusive features",
            "Development": "Zoning changes, gentrification trends, and neighborhood evolution",
            "EnvironmentUtilities": "Air/water quality, utility costs, internet, pollution",
            "FinancialInformation": "Property cost, taxes, and investment potential",
            "Schools": "School quality, ratings, college-bound indicators",
            "ExtraTips": "Parking, pet rules, mobile service, and miscellaneous local hacks"
        }

        enhanced_defs = {}
        for def_name, def_schema in original_defs.items():
            enhanced_def = deepcopy(def_schema)
            enhanced_def["description"] = description_map.get(def_name, "")
            
            # Inject personalized examples and descriptions for selected sections
            section_key = _get_section_key_from_def_name(def_name)
            logger.info(f"🔍 Processing def '{def_name}' -> section '{section_key}' (in selected: {section_key in section_keys})")
            if section_key in section_keys:
                # Inject personalized example at the definition level
                try:
                    # Get the field type from the report model using proper field access
                    field_descriptor = getattr(type(report), section_key, None)
                    section_type = None
                    
                    if field_descriptor and hasattr(field_descriptor, 'type_'):
                        section_type = field_descriptor.type_
                        # Handle Union types (Optional fields) - extract the actual model class
                        if hasattr(section_type, '__args__') and section_type.__args__:
                            for arg in section_type.__args__:
                                if arg is not type(None) and hasattr(arg, 'get_example'):
                                    section_type = arg
                                    break
                    
                    has_method = hasattr(section_type, 'get_example') if section_type else False
                    logger.info(f"🔧 {section_key}: field_descriptor={field_descriptor is not None}, section_type={type(section_type).__name__ if section_type else None}, method={has_method}")
                    
                    if section_type and hasattr(section_type, 'get_example'):
                        logger.info(f"🎯 Using dynamic example for {section_key}")
                        example = section_type.get_example(user_preferences)
                        enhanced_def["example"] = example
                        logger.info(f"✅ Injected example for {def_name} (section: {section_key})")
                    else:
                        logger.debug(f"📝 No get_example() method found for {section_key}")
                except Exception as e:
                    logger.warning(f"❌ Failed to get example for '{def_name}': {e}")
                
                # Inject personalized field descriptions
                try:
                    if section_type and hasattr(section_type, 'get_description'):
                        field_descriptions = section_type.get_description(user_preferences)
                        if "properties" in enhanced_def:
                            for field_name, desc in field_descriptions.items():
                                if field_name in enhanced_def["properties"]:
                                    enhanced_def["properties"][field_name]["description"] = desc
                        logger.info(f"✅ Injected descriptions for {def_name} (section: {section_key})")
                except Exception as e:
                    logger.warning(f"❌ Failed to get descriptions for '{def_name}': {e}")
            
            enhanced_defs[def_name] = enhanced_def

        # Step 4: Final schema assembly
        schema = {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "title": "Property Report Schema",
            "type": "object",
            "properties": properties,
            "required": section_keys,
            "$defs": enhanced_defs,
        }

        # Log final schema structure for debugging
        for section_key in section_keys:
            def_name = None
            for name, mapping in {"NeighborhoodOverview": "neighborhood_overview", "CultureAndEvents": "culture_and_events", "Safety": "safety", "Weather": "weather", "SocialCharacter": "social_character"}.items():
                if mapping == section_key:
                    def_name = name
                    break
            if def_name and def_name in schema.get("$defs", {}):
                has_example = "example" in schema["$defs"][def_name]
                logger.info(f"📊 {section_key} ({def_name}): has_example={has_example}")
        
        logger.info(f"🧩 Final report schema generated with sections: {section_keys}")
        return schema

    except Exception as e:
        import traceback
        logger.error(f"❌ Failed to generate report schema: {str(e)}")
        logger.debug(traceback.format_exc())
        raise Exception(f"Schema creation failed: {str(e)}")


def _get_section_key_from_def_name(def_name: str) -> str:
    """Map definition names to section keys"""
    mapping = {
        "NeighborhoodOverview": "neighborhood_overview",
        "Demographics": "demographics", 
        "Safety": "safety",
        "Weather": "weather",
        "CultureAndEvents": "culture_and_events",
        "SocialCharacter": "social_character",
        "LocalAmenities": "local_amenities",
        "Commute": "commute",
        "FamilyFriendly": "family_friendly",
        "NightlifeAndDating": "nightlife_and_dating",
        "Accessibility": "accessibility",
        "Development": "development",
        "EnvironmentUtilities": "environment_utilities",
        "FinancialInformation": "financial_information",
        "Schools": "schools",
        "ExtraTips": "extra_tips"
    }
    return mapping.get(def_name, def_name.lower())
