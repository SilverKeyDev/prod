from copy import deepcopy
from app.models.report_models import FullReport
from app.models.duel_report_models import ComparisonReport
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

def generate_report_schema(report_customization: Dict[str, Any], user_preferences: Dict[str, Any] = None, compare: bool = False) -> Dict[str, Any]:
    try:
        section_keys = report_customization.get("report_section_priorities", [])
        if compare and 'comparison_summary' not in section_keys: section_keys.insert(0, 'comparison_summary')  # Ensure comparison_summary is always first
        
        # Note: Demographic sections (age_distribution, lifestyle_dna) are auto-included
        # in report_generator.py with proper positioning after neighborhood_overview
        
        logger.info(f"🔧 Schema generation started with sections: {section_keys}")
        logger.info(f"🔧 User preferences provided: {user_preferences is not None}")

        # Step 1: Instantiate and get full schema
        report = ComparisonReport(report_customization=report_customization) if compare else FullReport(report_customization=report_customization)
        full_schema = report.schema(report_customization=report_customization)

        # Step 2: Build filtered properties (just copy the base schema structure)
        properties = {}
        for section_key in section_keys:
            if section_key not in full_schema.get("properties", {}):
                logger.warning(f"⚠️ Section key '{section_key}' missing in full schema, skipping.")
                continue
            
            # Just copy the base section schema structure (with $ref)
            properties[section_key] = deepcopy(full_schema["properties"][section_key])

        # Step 3: Include ALL model definitions (main models + nested models)
        # We need to include all referenced models, not just the main section models
        original_defs = full_schema.get("$defs", {})
        
        # Include all definitions from the original schema to ensure nested models are present
        enhanced_defs = deepcopy(original_defs)
        
        # Step 3.1: Manually add missing nested model definitions that Pydantic doesn't include automatically
        from app.models.report_models import (
            AppsPopularity, SchoolInfo, Restaurant, Activity, Park, UtilityCosts
        )
        
        missing_models = {
            'AppsPopularity': AppsPopularity,
            'SchoolInfo': SchoolInfo,
            'Restaurant': Restaurant,
            'Activity': Activity,
            'Park': Park,
            'UtilityCosts': UtilityCosts
        }
        
        # Add missing nested model schemas to enhanced_defs
        for model_name, model_class in missing_models.items():
            if model_name not in enhanced_defs:
                try:
                    model_schema = model_class.schema()
                    enhanced_defs[model_name] = model_schema
                    logger.info(f"✅ Added missing nested model definition: {model_name}")
                except Exception as e:
                    logger.warning(f"❌ Failed to add nested model {model_name}: {e}")
        
        description_map = {
            "NeighborhoodOverview": "Comprehensive overview of the neighborhood including demographics, culture, and community characteristics",
            "Demographics": "Population demographics including age, gender, race, and lifestyle distribution",
            "Safety": "Safety and crime information including ratings, police presence, and risks",
            "CultureAndEvents": "Community events, cultural dynamics, and local traditions",
            "SocialCharacter": "Community tone including income, religiosity, and social cohesion",
            "LocalAmenities": "Nearby restaurants, parks, activities, and local gems",
            "Commute": "Walkability, traffic, and public transit access",
            "FamilyFriendly": "Child- and family-centric aspects including schools and parks",
            "NightlifeAndDating": "Local dating dynamics, nightlife ratings, and popular venues",
            "Development": "Zoning changes, gentrification trends, and neighborhood evolution",
            "EnvironmentUtilities": "Air/water quality, utility costs, internet, pollution",
            "FinancialInformation": "Property cost, taxes, and investment potential",
            "Schools": "School quality, ratings, college-bound indicators",
            "ExtraTips": "Parking, pet rules, mobile service, and miscellaneous local hacks"
        }

        # Add personalization only to main section models that are selected
        for def_name, def_schema in enhanced_defs.items():
            # Add description if available
            if def_name in description_map:
                enhanced_defs[def_name]["description"] = description_map[def_name]
            
            # Only add personalization for main section models that are selected
            section_key = _get_section_key_from_def_name(def_name)
            if section_key and section_key in section_keys:
                # Inject personalized examples - use direct model mapping
                try:
                    # Direct mapping of section keys to model classes
                    section_model_map = {
                        'neighborhood_overview': 'NeighborhoodOverview',
                        'safety': 'Safety', 
                        'culture_and_events': 'CultureAndEvents',
                        'social_character': 'SocialCharacter',
                        'local_amenities': 'LocalAmenities',
                        'commute': 'Commute',
                        'family_friendly': 'FamilyFriendly',
                        'nightlife_and_dating': 'NightlifeAndDating',
                        'development': 'Development',
                        'environment_utilities': 'EnvironmentUtilities',
                        'financial_information': 'FinancialInformation',
                        'schools': 'Schools',
                        'extra_tips': 'ExtraTips'
                    }
                    
                    model_class_name = section_model_map.get(section_key)
                    if model_class_name:
                        # Import and get the actual model class
                        from app.models.report_models import (
                            NeighborhoodOverview, Safety, CultureAndEvents, SocialCharacter,
                            LocalAmenities, Commute, FamilyFriendly, NightlifeAndDating,
                            Development, EnvironmentUtilities, FinancialInformation,
                            Schools, ExtraTips
                        )
                        
                        model_classes = {
                            'NeighborhoodOverview': NeighborhoodOverview,
                            'Safety': Safety,
                            'CultureAndEvents': CultureAndEvents,
                            'SocialCharacter': SocialCharacter,
                            'LocalAmenities': LocalAmenities,
                            'Commute': Commute,
                            'FamilyFriendly': FamilyFriendly,
                            'NightlifeAndDating': NightlifeAndDating,
                            'Development': Development,
                            'EnvironmentUtilities': EnvironmentUtilities,
                            'FinancialInformation': FinancialInformation,
                            'Schools': Schools,
                            'ExtraTips': ExtraTips
                        }
                        
                        model_class = model_classes.get(model_class_name)
                        if model_class and hasattr(model_class, 'get_example'):
                            logger.info(f"🎯 Using dynamic example for {section_key} -> {model_class_name}")
                            example = model_class.get_example(user_preferences)
                            enhanced_defs[def_name]["example"] = example
                            logger.info(f"✅ Injected example for {def_name} (section: {section_key})")
                        else:
                            logger.warning(f"📝 No get_example() method found for {section_key} -> {model_class_name}")
                    else:
                        logger.warning(f"📝 No model mapping found for section: {section_key}")
                except Exception as e:
                    logger.warning(f"❌ Failed to get example for '{def_name}': {e}")
                
                # Inject personalized field descriptions using the same direct mapping
                try:
                    model_class_name = section_model_map.get(section_key)
                    if model_class_name:
                        model_class = model_classes.get(model_class_name)
                        if model_class and hasattr(model_class, 'get_description'):
                            field_descriptions = model_class.get_description(user_preferences)
                            if "properties" in enhanced_defs[def_name]:
                                for field_name, desc in field_descriptions.items():
                                    if field_name in enhanced_defs[def_name]["properties"]:
                                        enhanced_defs[def_name]["properties"][field_name]["description"] = desc
                            logger.info(f"✅ Injected descriptions for {def_name} (section: {section_key})")
                except Exception as e:
                    logger.warning(f"❌ Failed to get descriptions for '{def_name}': {e}")

        # Step 4: Final schema assembly
        # Filter required fields to only include those actually present in properties
        valid_required = [key for key in section_keys if key in properties]
        
        schema = {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "title": "Property Report Schema",
            "type": "object",
            "properties": properties,
            "required": valid_required,
            "$defs": enhanced_defs,
        }
        
        logger.info(f"📋 Schema required fields: {valid_required}")
        logger.info(f"📋 Schema properties keys: {list(properties.keys())}")
        
        # Step 5: Debug and validate schema before cleaning
        logger.info(f"🔍 DEBUG: Original $defs keys: {list(original_defs.keys())}")
        logger.info(f"🔍 DEBUG: Enhanced $defs keys: {list(enhanced_defs.keys())}")
        
        # Step 7: Validate and clean $defs to prevent unconstrained fields
        _validate_and_clean_schema_defs(schema)
        
        # Step 7: Final validation - log what's in the final schema
        logger.info(f"🔍 DEBUG: Final $defs keys: {list(schema.get('$defs', {}).keys())}")

        # Log final schema structure for debugging
        for section_key in section_keys:
            def_name = None
            for name, mapping in {"NeighborhoodOverview": "neighborhood_overview", "CultureAndEvents": "culture_and_events", "Safety": "safety", "SocialCharacter": "social_character"}.items():
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


def _validate_and_clean_schema_defs(schema: Dict[str, Any]) -> None:
    """Validate and clean schema $defs to prevent unconstrained fields."""
    logger = logging.getLogger(__name__)
    
    if "$defs" not in schema:
        return
    
    # Step 1: Clean up main properties that have conflicting allOf + type definitions
    if "properties" in schema:
        for prop_name, prop_schema in schema["properties"].items():
            # Fix conflicting allOf + $ref + type definitions
            if "allOf" in prop_schema and "type" in prop_schema:
                logger.warning(f"⚠️ Property '{prop_name}' has conflicting allOf + type, removing type")
                del prop_schema["type"]
            
            # Simplify allOf with single $ref to direct $ref
            if "allOf" in prop_schema and len(prop_schema["allOf"]) == 1 and "$ref" in prop_schema["allOf"][0]:
                ref_value = prop_schema["allOf"][0]["$ref"]
                description = prop_schema.get("description", "")
                prop_schema.clear()
                prop_schema["$ref"] = ref_value
                if description:
                    prop_schema["description"] = description
                logger.info(f"✅ Simplified '{prop_name}' from allOf to direct $ref")
    
    # Step 2: Validate and clean $defs
    for def_name, def_schema in schema["$defs"].items():
        # Ensure all definitions have proper type constraints
        if "type" not in def_schema:
            logger.warning(f"⚠️ Definition '{def_name}' missing type, adding 'object'")
            def_schema["type"] = "object"
        
        # Ensure additionalProperties is explicitly set to false for objects
        if def_schema.get("type") == "object" and "additionalProperties" not in def_schema:
            logger.warning(f"⚠️ Definition '{def_name}' missing additionalProperties, setting to false")
            def_schema["additionalProperties"] = False
        
        # Filter required fields to only include those present in properties
        if "required" in def_schema and "properties" in def_schema:
            original_required = def_schema["required"]
            valid_required = [field for field in original_required if field in def_schema["properties"]]
            
            if len(valid_required) != len(original_required):
                removed_fields = set(original_required) - set(valid_required)
                logger.warning(f"⚠️ Removed invalid required fields from '{def_name}': {removed_fields}")
                def_schema["required"] = valid_required
        
        # Clean up properties with conflicting definitions
        if "properties" in def_schema:
            for prop_name, prop_schema in def_schema["properties"].items():
                # Fix conflicting allOf + type definitions in nested properties
                if "allOf" in prop_schema and "type" in prop_schema:
                    logger.warning(f"⚠️ Property '{prop_name}' in '{def_name}' has conflicting allOf + type, removing type")
                    del prop_schema["type"]
                
                # Ensure properties have proper type constraints
                if "type" not in prop_schema and "$ref" not in prop_schema and "anyOf" not in prop_schema and "allOf" not in prop_schema:
                    logger.warning(f"⚠️ Property '{prop_name}' in '{def_name}' missing type, adding 'string'")
                    prop_schema["type"] = "string"
    
    logger.info(f"✅ Schema validation completed for {len(schema['$defs'])} definitions")


def _get_section_key_from_def_name(def_name: str) -> str:
    """Map definition names to section keys"""
    mapping = {
        "NeighborhoodOverview": "neighborhood_overview",
        "Demographics": "demographics", 
        "Safety": "safety",
        "CultureAndEvents": "culture_and_events",
        "SocialCharacter": "social_character",
        "LocalAmenities": "local_amenities",
        "Commute": "commute",
        "FamilyFriendly": "family_friendly",
        "NightlifeAndDating": "nightlife_and_dating",
        "Development": "development",
        "EnvironmentUtilities": "environment_utilities",
        "FinancialInformation": "financial_information",
        "Schools": "schools",
        "ExtraTips": "extra_tips"
    }
    return mapping.get(def_name, def_name.lower())
