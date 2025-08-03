import os
import json
import logging
import re
from typing import Dict, Any
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
import uuid
import time
from flask import jsonify
import traceback
from .pdf_creator import _create_pdf
from io import BytesIO
from .schema_generator import generate_report_schema
from ..models.report_models import FullReport
from ..models.marketing_model import MarketingReport
from ..models.user_preferences import UserPreferences
from ..services.s3_service import s3_service
from flask import current_app
from app import db

# Configure verbose logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Optional: Enable HTTP-level debugging for requests
# Uncomment the following lines for detailed HTTP debugging:
# import urllib3
# urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
# logging.getLogger("urllib3.connectionpool").setLevel(logging.DEBUG)
# logging.getLogger("requests.packages.urllib3").setLevel(logging.DEBUG)

# Perplexity API configuration
PERPLEXITY_API_KEY = os.getenv('PERPLEXITY_API_KEY')
if not PERPLEXITY_API_KEY:
    logger.critical("PERPLEXITY_API_KEY environment variable is not set.")
    raise ValueError("PERPLEXITY_API_KEY environment variable is not set")

HEADERS = {
    "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
    "Content-Type": "application/json"
}


# -------------------- UTILS --------------------

def create_placeholder_pdf() -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.drawString(100, 750, "Report is generating...")
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()


def validate_address(address: str) -> bool:
    """Validate that the address is provided and is a string"""
    if not address:
        logger.error("❌ Address is empty or None")
        return False
    
    if len(address.strip()) == 0:
        logger.error("❌ Address is empty after stripping whitespace")
        return False
    
    logger.debug(f"✅ Address validation passed: {address}")
    return True

def _remove_empty_fields(data):
    """
    Recursively remove fields that are empty strings, null, or empty arrays/objects.
    
    Args:
        data: The data structure to clean (dict, list, or primitive)
        
    Returns:
        Cleaned data structure with empty fields removed
    """
    if isinstance(data, dict):
        cleaned = {}
        for key, value in data.items():
            # Recursively clean the value first
            cleaned_value = _remove_empty_fields(value)
            
            # Only include the field if it's not empty
            if not _is_empty_field(cleaned_value):
                cleaned[key] = cleaned_value
        return cleaned
    elif isinstance(data, list):
        # Clean each item in the list and filter out empty ones
        cleaned_list = []
        for item in data:
            cleaned_item = _remove_empty_fields(item)
            if not _is_empty_field(cleaned_item):
                cleaned_list.append(cleaned_item)
        return cleaned_list
    else:
        # For primitive values, return as-is
        return data

def _is_empty_field(value):
    """
    Check if a field should be considered empty and omitted.
    
    Args:
        value: The value to check
        
    Returns:
        True if the field should be omitted, False otherwise
    """
    # Check for None/null
    if value is None:
        return True
    
    # Check for empty string or strings with only whitespace
    if isinstance(value, str):
        stripped = value.strip()
        if stripped == "":
            return True
        # Check for strings that contain only punctuation/symbols (like ",", "}, ", etc.)
        if stripped in [",", "}", "{", "]", "[", "}, ", "{ ", "] ", "[ ", ".,", ";", ":"]:
            return True
        # Check for strings that are just whitespace with punctuation
        import re
        if re.match(r'^[\s\W]*$', stripped):
            return True
    
    # Check for empty list
    if isinstance(value, list) and len(value) == 0:
        return True
    
    # Check for empty dict
    if isinstance(value, dict) and len(value) == 0:
        return True
    
    # Check for numeric values that are 0 or negative (for ratings that shouldn't be 0)
    if isinstance(value, (int, float)):
        # For rating fields, 0 is typically invalid
        if value <= 0:
            return True
    
    return False

def _normalize_ratings(data):
    """
    Recursively find and normalize rating fields to ensure they're in X.X/10 format.
    
    Args:
        data: The data structure to normalize (dict, list, or primitive)
        
    Returns:
        Data structure with normalized rating fields
    """
    if isinstance(data, dict):
        normalized = {}
        for key, value in data.items():
            # Recursively normalize the value first
            normalized_value = _normalize_ratings(value)
            
            # Check if this is a rating field and normalize it
            if "_rating" in key.lower() and isinstance(normalized_value, (str, int, float)):
                normalized_value = _normalize_rating_value(normalized_value, key)
            
            normalized[key] = normalized_value
        return normalized
    elif isinstance(data, list):
        # Normalize each item in the list
        return [_normalize_ratings(item) for item in data]
    else:
        # For primitive values, return as-is
        return data

def _normalize_rating_value(value, field_name):
    """
    Normalize a single rating value to X.X/10 format.
    
    Args:
        value: The rating value to normalize
        field_name: The name of the field (for logging)
        
    Returns:
        Normalized rating string in X.X/10 format
    """
    try:
        # Convert to string for processing
        str_value = str(value).strip()
        
        # If already in correct format, return as-is
        if re.match(r'^\d+(\.\d+)?/10$', str_value):
            return str_value
        
        # Extract numeric value from various formats
        numeric_value = None
        
        # Try to extract from formats like "8.5/10", "8.5 out of 10", "8.5", "85%", etc.
        patterns = [
            r'(\d+(?:\.\d+)?)/10',  # "8.5/10"
            r'(\d+(?:\.\d+)?)\s*out\s*of\s*10',  # "8.5 out of 10"
            r'(\d+(?:\.\d+)?)%',  # "85%" (convert from percentage)
            r'^(\d+(?:\.\d+)?)$',  # Just a number "8.5"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, str_value, re.IGNORECASE)
            if match:
                numeric_value = float(match.group(1))
                
                # If it's a percentage, convert to 0-10 scale
                if '%' in str_value:
                    numeric_value = numeric_value / 10.0
                
                break
        
        # If we couldn't extract a numeric value, try direct conversion
        if numeric_value is None:
            try:
                numeric_value = float(str_value)
            except ValueError:
                logger.warning(f"⚠️ RATING: Could not parse rating value '{value}' for field '{field_name}', keeping original")
                return str_value
        
        # Ensure the value is within 0-10 range
        if numeric_value < 0:
            numeric_value = 0.0
        elif numeric_value > 10:
            # If it's over 10, it might be on a different scale (like 0-100)
            if numeric_value <= 100:
                numeric_value = numeric_value / 10.0
            else:
                numeric_value = 10.0
        
        # Format to one decimal place and add /10
        normalized = f"{numeric_value:.1f}/10"
        
        if normalized != str_value:
            logger.info(f"📊 RATING: Normalized '{field_name}': '{value}' → '{normalized}'")
        
        return normalized
        
    except Exception as e:
        logger.warning(f"⚠️ RATING: Error normalizing rating '{value}' for field '{field_name}': {e}")
        return str(value)  # Return original value if normalization fails

def _safe_parse_json(text: str, report_customization: dict = None) -> dict:
    try:
        logger.debug("🔧 Attempting to parse model output as structured JSON")
        logger.debug(f"📝 Raw model output (first 500 chars): {text[:500]}...")
        logger.info(f"🎛️ Report customization passed to FullReport: {json.dumps(report_customization, indent=2) if report_customization else 'None'}")

        # Strip any non-JSON hallucinated wrappers just in case
        cleaned = re.sub(r'(<think>.*?</think>|&lt;think&gt;.*?&lt;/think&gt;)', '', text, flags=re.DOTALL | re.IGNORECASE).strip()

        # Try multiple parsing strategies for common Perplexity issues
        parsed = None
        parse_method = "unknown"
        
        try:
            # Strategy 1: Direct JSON parsing
            parsed = json.loads(cleaned)
            parse_method = "json.loads"
        except json.JSONDecodeError as e:
            logger.warning(f"⚠️ json.loads failed: {e}")
            
            try:
                # Strategy 2: Strip markdown code blocks (```json...```)
                if cleaned.startswith('```') and cleaned.endswith('```'):
                    # Remove ```json and ``` wrappers
                    stripped = re.sub(r'^```(?:json)?\s*|\s*```$', '', cleaned, flags=re.MULTILINE).strip()
                    parsed = json.loads(stripped)
                    parse_method = "markdown-stripped"
                    logger.info("✅ Parsed after stripping markdown code blocks")
                else:
                    raise json.JSONDecodeError("Not markdown wrapped", cleaned, 0)
                    
            except json.JSONDecodeError:
                try:
                    # Strategy 3: Remove trailing commas (common AI mistake)
                    comma_fixed = re.sub(r',\s*([}\]])', r'\1', cleaned)
                    parsed = json.loads(comma_fixed)
                    parse_method = "comma-fixed"
                    logger.info("✅ Parsed after fixing trailing commas")
                    
                except json.JSONDecodeError:
                    try:
                        # Strategy 4: Fix unterminated strings and malformed JSON
                        string_fixed = cleaned
                        
                        # Fix unterminated strings by adding closing quotes before } or ]
                        string_fixed = re.sub(r'"([^"]*?)"\s*([,}\]])', r'"\1"\2', string_fixed)
                        
                        # Fix cases where quotes are missing after colons
                        string_fixed = re.sub(r':\s*([^"\{\[\d][^,}\]]*?)\s*([,}\]])', r': "\1"\2', string_fixed)
                        
                        # Fix unterminated strings at end of values
                        string_fixed = re.sub(r'"([^"]*?)\s*([,}\]])', r'"\1"\2', string_fixed)
                        
                        # Remove any duplicate quotes
                        string_fixed = re.sub(r'""', r'"', string_fixed)
                        
                        parsed = json.loads(string_fixed)
                        parse_method = "string-repaired"
                        logger.info("✅ Parsed after repairing malformed strings")
                        
                    except json.JSONDecodeError:
                        try:
                            # Strategy 5: Try to extract JSON from HTML/mixed content
                            json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
                            if json_match:
                                extracted = json_match.group(0)
                                parsed = json.loads(extracted)
                                parse_method = "extracted-from-html"
                                logger.info("✅ Parsed after extracting JSON from mixed content")
                            else:
                                raise json.JSONDecodeError("No JSON found in content", cleaned, 0)
                                
                        except json.JSONDecodeError as final_error:
                            logger.error(f"❌ All parsing strategies failed. Final error: {final_error}")
                            logger.error(f"🔍 Content preview (first 200 chars): {cleaned[:200]}")
                            raise ValueError(f"Failed to parse JSON with all strategies: {final_error}") from final_error
        
        logger.debug(f"✅ Parsed with strategy: {parse_method}")
        logger.info(f"📊 Parsed JSON keys: {list(parsed.keys()) if isinstance(parsed, dict) else 'Not a dict'}")

        # Normalize field names to match schema requirements
        if isinstance(parsed, dict):
            logger.info("🔧 NORMALIZE: Starting field name normalization...")
            normalized_parsed = normalize_field_names(parsed)
            logger.info(f"✅ NORMALIZE: Field normalization completed")
            parsed = normalized_parsed
        else:
            logger.warning("⚠️ NORMALIZE: Skipping normalization - parsed data is not a dictionary")

        # Remove empty fields (empty strings, null, empty arrays)
        logger.info("🧹 CLEANUP: Removing empty fields...")
        original_keys = list(parsed.keys()) if isinstance(parsed, dict) else []
        cleaned_parsed = _remove_empty_fields(parsed)
        cleaned_keys = list(cleaned_parsed.keys()) if isinstance(cleaned_parsed, dict) else []
        
        removed_keys = set(original_keys) - set(cleaned_keys)
        if removed_keys:
            logger.info(f"🗑️ CLEANUP: Removed empty fields: {sorted(removed_keys)}")
        else:
            logger.info("✅ CLEANUP: No empty fields found to remove")
        
        parsed = cleaned_parsed

        # Normalize rating fields to X.X/10 format
        logger.info("📊 RATING: Normalizing rating fields...")
        rating_normalized_parsed = _normalize_ratings(parsed)
        logger.info("✅ RATING: Rating normalization completed")
        parsed = rating_normalized_parsed

        # Validate with FullReport schema
        try:
            logger.info("🏗️ Instantiating FullReport with report_customization...")
            validated = FullReport(report_customization=report_customization, **parsed)
            logger.info("🎯 FullReport validation with Pydantic successful")
            
            # Log the final validated report structure using custom dict() method
            validated_dict = validated.dict()  # Use custom dict() method that filters by priorities
            logger.info(f"📋 Final FullReport sections: {list(validated_dict.keys())}")
            logger.debug(f"📋 Full validated FullReport JSON:\n{json.dumps(validated_dict, indent=2)}")
       
            return validated_dict
        except Exception as ve:
            logger.error(f"❌ FullReport validation failed: {ve}")
            logger.error(f"❌ Validation error type: {type(ve).__name__}")
            logger.error(f"❌ Full traceback:\n{traceback.format_exc()}")
            logger.warning("📋 Returning unvalidated parsed JSON")
            
            return parsed

    except Exception as e:
        logger.error(f"🛑 Failed to parse structured JSON: {e}")
        logger.error(f"🧵 Traceback:\n{traceback.format_exc()}")
        raise ValueError("Failed to parse structured JSON from model output") from e

# -------------------- FIELD NORMALIZATION --------------------

def normalize_field_names(data: dict) -> dict:
    """
    Normalize AI-generated field names to match schema requirements.
    
    This function fixes common issues where the AI generates incorrect field names
    for age_distribution and lifestyle_dna sections.
    """
    if not isinstance(data, dict):
        return data
    
    normalized_data = {}
    
    for section_key, section_value in data.items():
        if section_key == "age_distribution" and isinstance(section_value, dict):
            logger.info(f"🔧 NORMALIZE: Processing age_distribution section")
            normalized_age = normalize_age_distribution(section_value)
            normalized_data[section_key] = normalized_age
            logger.info(f"✅ NORMALIZE: age_distribution normalized from {list(section_value.keys())} to {list(normalized_age.keys())}")
            
        elif section_key == "lifestyle_dna" and isinstance(section_value, dict):
            logger.info(f"🔧 NORMALIZE: Processing lifestyle_dna section")
            normalized_lifestyle = normalize_lifestyle_dna(section_value)
            normalized_data[section_key] = normalized_lifestyle
            logger.info(f"✅ NORMALIZE: lifestyle_dna normalized from {list(section_value.keys())} to {list(normalized_lifestyle.keys())}")
            
        else:
            # For other sections, recursively normalize if they contain nested dicts
            if isinstance(section_value, dict):
                normalized_data[section_key] = normalize_field_names(section_value)
            else:
                normalized_data[section_key] = section_value
    
    return normalized_data

def normalize_age_distribution(age_data: dict) -> dict:
    """
    Normalize age distribution field names to match schema requirements.
    Required fields: "18-24", "25-34", "35-49", "50-64", "65+"
    """
    # Define the mapping from various AI-generated names to schema names
    age_mappings = {
        # Standard variations
        "18-24": "18-24",
        "25-34": "25-34", 
        "35-49": "35-49",
        "50-64": "50-64",
        "65+": "65+",
        
        # AI-generated variations (from logs)
        "age_18_24": "18-24",
        "age_25_34": "25-34",
        "age_35_49": "35-49",
        "age_50_64": "50-64",
        "age_65_plus": "65+",
        
        # Other common variations
        "18_24": "18-24",
        "25_34": "25-34",
        "35_49": "35-49",
        "50_64": "50-64",
        "65_plus": "65+",
        "65plus": "65+",
        
        # Underscore variations
        "under_25": "18-24",
        "young_adult": "18-24",
        "adult": "25-34",
        "middle_aged": "35-49",
        "older_adult": "50-64",
        "senior": "65+",
        "elderly": "65+"
    }
    
    normalized = {}
    required_fields = ["18-24", "25-34", "35-49", "50-64", "65+"]
    
    # Map existing fields
    for ai_field, value in age_data.items():
        if ai_field in age_mappings:
            schema_field = age_mappings[ai_field]
            normalized[schema_field] = value
            logger.debug(f"🔄 NORMALIZE: Mapped '{ai_field}' -> '{schema_field}' = '{value}'")
        else:
            logger.warning(f"⚠️ NORMALIZE: Unknown age field '{ai_field}' with value '{value}'")
    
    # Ensure all required fields are present
    for required_field in required_fields:
        if required_field not in normalized:
            normalized[required_field] = "0%"
            logger.debug(f"➕ NORMALIZE: Added missing age field '{required_field}' = '0%'")
    
    # Normalize percentages to sum to 100%
    normalized = normalize_percentages_to_100(normalized, "age_distribution")
    
    return normalized

def normalize_lifestyle_dna(lifestyle_data: dict) -> dict:
    """
    Normalize lifestyle DNA field names to match schema requirements.
    Required fields: "Artistic", "Professional", "Family_Oriented", "Active_Outdoor", 
                    "Tech_Remote", "Retiree", "Student", "Suburban", "Urban"
    """
    # Define the mapping from various AI-generated names to schema names
    lifestyle_mappings = {
        # Exact schema matches
        "Artistic": "Artistic",
        "Professional": "Professional",
        "Family_Oriented": "Family_Oriented",
        "Active_Outdoor": "Active_Outdoor",
        "Tech_Remote": "Tech_Remote",
        "Retiree": "Retiree",
        "Student": "Student",
        "Suburban": "Suburban",
        "Urban": "Urban",
        
        # Common variations
        "artistic": "Artistic",
        "professional": "Professional",
        "family_oriented": "Family_Oriented",
        "family-oriented": "Family_Oriented",
        "families": "Family_Oriented",
        "active_outdoor": "Active_Outdoor",
        "active-outdoor": "Active_Outdoor",
        "outdoor_enthusiasts": "Active_Outdoor",
        "outdoor": "Active_Outdoor",
        "tech_remote": "Tech_Remote",
        "tech-remote": "Tech_Remote",
        "remote_workers": "Tech_Remote",
        "tech_workers": "Tech_Remote",
        "retiree": "Retiree",
        "retirees": "Retiree",
        "retired": "Retiree",
        "student": "Student",
        "students": "Student",
        "suburban": "Suburban",
        "urban": "Urban",
        
        # Additional lifestyle categories that might be generated
        "creative": "Artistic",
        "artist": "Artistic",
        "business": "Professional",
        "corporate": "Professional",
        "family": "Family_Oriented",
        "parents": "Family_Oriented",
        "active": "Active_Outdoor",
        "fitness": "Active_Outdoor",
        "tech": "Tech_Remote",
        "remote": "Tech_Remote",
        "senior": "Retiree",
        "college": "Student",
        "university": "Student"
    }
    
    normalized = {}
    required_fields = ["Artistic", "Professional", "Family_Oriented", "Active_Outdoor", 
                      "Tech_Remote", "Retiree", "Student", "Suburban", "Urban"]
    
    # Map existing fields
    for ai_field, value in lifestyle_data.items():
        if ai_field in lifestyle_mappings:
            schema_field = lifestyle_mappings[ai_field]
            # If the field already exists, combine the values (take the higher percentage)
            if schema_field in normalized:
                existing_val = normalized[schema_field].rstrip('%')
                new_val = str(value).rstrip('%')
                try:
                    existing_num = float(existing_val) if existing_val != '0' else 0
                    new_num = float(new_val) if new_val != '0' else 0
                    combined_val = max(existing_num, new_num)
                    normalized[schema_field] = f"{combined_val}%"
                    logger.debug(f"🔄 NORMALIZE: Combined '{ai_field}' -> '{schema_field}' = '{normalized[schema_field]}' (was '{existing_val}%', new '{new_val}%')")
                except (ValueError, TypeError):
                    normalized[schema_field] = str(value)
                    logger.debug(f"🔄 NORMALIZE: Non-numeric combine '{ai_field}' -> '{schema_field}' = '{value}'")
            else:
                normalized[schema_field] = str(value)
                logger.debug(f"🔄 NORMALIZE: Mapped '{ai_field}' -> '{schema_field}' = '{value}'")
        else:
            logger.warning(f"⚠️ NORMALIZE: Unknown lifestyle field '{ai_field}' with value '{value}'")
    
    # Ensure all required fields are present
    for required_field in required_fields:
        if required_field not in normalized:
            normalized[required_field] = "0%"
            logger.debug(f"➕ NORMALIZE: Added missing lifestyle field '{required_field}' = '0%'")
    
    # Normalize percentages to sum to 100%
    normalized = normalize_percentages_to_100(normalized, "lifestyle_dna")
    
    # Keep all fields including those with 0% values since Pydantic model requires all fields
    logger.info(f"✅ NORMALIZE: Keeping all lifestyle DNA fields including 0% values for Pydantic validation")
    
    return normalized

def normalize_percentages_to_100(data: dict, section_name: str) -> dict:
    """
    Normalize percentage values to sum to exactly 100%.
    
    This function takes a dictionary of percentage values (like "25%", "30%", etc.)
    and redistributes them proportionally so they sum to exactly 100%.
    """
    if not isinstance(data, dict):
        return data
    
    # Extract numeric values from percentage strings
    numeric_values = {}
    total_sum = 0
    
    for key, value in data.items():
        try:
            # Handle both string percentages ("25%") and numeric values (25)
            if isinstance(value, str):
                numeric_val = float(value.rstrip('%'))
            else:
                numeric_val = float(value)
            
            numeric_values[key] = numeric_val
            total_sum += numeric_val
            
        except (ValueError, TypeError):
            logger.warning(f"⚠️ NORMALIZE: Could not parse percentage value '{value}' for field '{key}' in {section_name}")
            numeric_values[key] = 0.0
    
    logger.debug(f"🔢 NORMALIZE: {section_name} original sum: {total_sum}%")
    
    # If total is 0, distribute equally
    if total_sum == 0:
        equal_share = 100.0 / len(numeric_values)
        # Return integers for Pydantic validation
        normalized_data = {key: int(round(equal_share)) for key in numeric_values.keys()}
        logger.info(f"📊 NORMALIZE: {section_name} had zero sum, distributed equally: {equal_share:.1f}% each")
        return normalized_data
    
    # If total is already 100, return as-is (with integer formatting)
    if abs(total_sum - 100.0) < 0.1:
        # Return integers for Pydantic validation
        normalized_data = {key: int(round(val)) for key, val in numeric_values.items()}
        logger.debug(f"✅ NORMALIZE: {section_name} already sums to ~100%, keeping values")
        return normalized_data
    
    # Normalize proportionally to sum to 100%
    normalized_data = {}
    running_total = 0.0
    keys_list = list(numeric_values.keys())
    
    # Normalize all but the last value proportionally
    for i, key in enumerate(keys_list[:-1]):
        normalized_val = (numeric_values[key] / total_sum) * 100.0
        # Store as integer for Pydantic validation
        normalized_data[key] = int(round(normalized_val))
        running_total += normalized_val
    
    # Set the last value to make the total exactly 100%
    last_key = keys_list[-1]
    last_val = 100.0 - running_total
    # Store as integer for Pydantic validation
    normalized_data[last_key] = int(round(last_val))
    
    # Verify the sum (now working with integers)
    verification_sum = sum(normalized_data.values())
    logger.info(f"📊 NORMALIZE: {section_name} normalized from {total_sum:.1f}% to {verification_sum}%")
    
    # Log the transformation
    for key in numeric_values.keys():
        old_val = numeric_values[key]
        new_val = normalized_data[key]
        logger.debug(f"🔄 NORMALIZE: {section_name}.{key}: {old_val:.1f}% → {new_val}%")
    
    return normalized_data

# -------------------- HELPER FUNCTIONS --------------------

def get_preferences(user_id: str) -> Dict:
    """Get user preferences by user_id"""
    try:
        logger.info(f"🔍 PREFERENCES: Looking up preferences for user_id: {user_id}")
        preferences = UserPreferences.query.filter_by(user_id=user_id).first()
        if preferences:
            logger.info(f"✅ PREFERENCES: Found preferences for user_id {user_id}")
            prefs_dict = preferences.to_dict()
            logger.info(f"📊 PREFERENCES: Preferences keys: {list(prefs_dict.keys()) if prefs_dict else 'None'}")
            if prefs_dict and 'report_customization' in prefs_dict:
                logger.info(f"🎯 PREFERENCES: report_customization found with keys: {list(prefs_dict['report_customization'].keys()) if prefs_dict['report_customization'] else 'None'}")
            else:
                logger.warning(f"⚠️ PREFERENCES: No report_customization found in preferences for user_id {user_id}")
            return prefs_dict
        else:
            logger.warning(f"⚠️ PREFERENCES: No preferences record found for user_id {user_id}")
            return None
    except Exception as e:
        logger.error(f"🔥 PREFERENCES: Failed to fetch preferences for user_id {user_id}: {str(e)}")
        logger.error(f"🔥 PREFERENCES: Exception traceback: {traceback.format_exc()}")
        return None

def break_schema_into_sections(schema: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """
    Break a schema into individual top-level sections for modular processing.
    
    Args:
        schema: The full schema dictionary with properties and $defs
        
    Returns:
        Dictionary mapping section names to their individual schemas
    """
    logger.debug("🔧 Breaking schema into individual sections")
    
    if not isinstance(schema, dict) or "properties" not in schema:
        logger.error("❌ Invalid schema format - missing properties")
        return {}
    
    sections = {}
    base_defs = schema.get("$defs", {})
    
    for section_name, section_property in schema["properties"].items():
        # Create individual schema for this section
        section_schema = {
            "$schema": schema.get("$schema", "https://json-schema.org/draft/2020-12/schema"),
            "$id": f"#{section_name}",  # Add $id for better parser identification
            "title": f"{section_name.replace('_', ' ').title()} Section Schema",
            "description": f"Schema for the {section_name} section",
            "type": "object",
            "properties": {
                section_name: section_property
            },
            "required": [section_name],
            "additionalProperties": False
        }
        
        # Include relevant $defs for this section
        section_defs = {}
        
        # Find all referenced definitions for this section
        def find_refs(obj, refs_found=None):
            if refs_found is None:
                refs_found = set()
            
            if isinstance(obj, dict):
                if "$ref" in obj:
                    ref_path = obj["$ref"]
                    if ref_path.startswith("#/$defs/"):
                        def_name = ref_path.replace("#/$defs/", "")
                        refs_found.add(def_name)
                        # Recursively find refs in the referenced definition
                        if def_name in base_defs:
                            find_refs(base_defs[def_name], refs_found)
                else:
                    for value in obj.values():
                        find_refs(value, refs_found)
            elif isinstance(obj, list):
                for item in obj:
                    find_refs(item, refs_found)
            
            return refs_found
        
        # Find all referenced definitions for this section
        referenced_defs = find_refs(section_property)
        
        # Include all referenced definitions
        for def_name in referenced_defs:
            if def_name in base_defs:
                section_defs[def_name] = base_defs[def_name]
        
        # Add $defs if any were found
        if section_defs:
            section_schema["$defs"] = section_defs
        
        sections[section_name] = section_schema
        logger.debug(f"✅ Created schema for section: {section_name} with {len(section_defs)} definitions")
    
    logger.info(f"📋 Successfully broke schema into {len(sections)} sections: {list(sections.keys())}")
    return sections

def response_sort(report_responses: list, schemas: Dict[str, Dict[str, Any]]) -> list:
    """
    Sort report responses to match the order of schemas with comprehensive error handling.
    
    Args:
        report_responses: List of parsed report response dictionaries
        schemas: Dictionary mapping section names to their schemas (ordered)
        
    Returns:
        List of report responses sorted to match schema order
        
    Raises:
        ValueError: If critical mismatches are detected that could indicate data corruption
    """
    logger.info(f"🔄 Starting response sorting: {len(report_responses)} responses, {len(schemas)} expected sections")
    
    if not report_responses:
        logger.error("❌ No report responses provided to response_sort")
        raise ValueError("Cannot sort empty response list")
    
    if not schemas:
        logger.error("❌ No schemas provided to response_sort")
        raise ValueError("Cannot sort without schema reference")
    
    # Get the ordered list of schema section names
    schema_order = list(schemas.keys())
    logger.info(f"📋 Expected schema sections: {schema_order}")
    
    # Track all response sections for comprehensive analysis
    all_response_sections = set()
    response_map = {}
    unmatched_responses = []
    invalid_responses = []
    
    # Analyze each response and build mapping
    for i, response in enumerate(report_responses):
        if not isinstance(response, dict):
            logger.error(f"❌ Response {i} is not a dictionary: {type(response)} - {str(response)[:100]}")
            invalid_responses.append({"index": i, "type": type(response).__name__, "content": str(response)[:200]})
            continue
        
        response_sections = list(response.keys())
        all_response_sections.update(response_sections)
        logger.debug(f"📝 Response {i} contains sections: {response_sections}")
        
        # Try to match this response to a schema section
        matched = False
        for section_name in response_sections:
            if section_name in schema_order:
                if section_name in response_map:
                    logger.warning(f"⚠️ Duplicate response for section '{section_name}' - keeping first occurrence")
                else:
                    response_map[section_name] = response
                    logger.debug(f"✅ Mapped response {i} to section: {section_name}")
                matched = True
                break
        
        if not matched:
            logger.warning(f"⚠️ Response {i} with sections {response_sections} did not match any expected schema sections")
            unmatched_responses.append({"index": i, "sections": response_sections, "response": response})
    
    # Comprehensive analysis and error reporting
    expected_sections = set(schema_order)
    found_sections = set(response_map.keys())
    missing_sections = expected_sections - found_sections
    unexpected_sections = all_response_sections - expected_sections
    
    logger.info(f"📊 Response analysis:")
    logger.info(f"   ❌ Missing sections: {len(missing_sections)}")
    logger.info(f"   ⚠️ Unexpected sections: {len(unexpected_sections)}")
    logger.info(f"   🚫 Invalid responses: {len(invalid_responses)}")
    logger.info(f"   📎 Unmatched responses: {len(unmatched_responses)}")
    
    # Log detailed issues
    if missing_sections:
        logger.warning(f"❌ Missing expected sections: {list(missing_sections)}")
    
    if unexpected_sections:
        logger.warning(f"⚠️ Found unexpected sections: {list(unexpected_sections)}")
    
    if invalid_responses:
        logger.error(f"🚫 Invalid responses detected:")
        for invalid in invalid_responses:
            logger.error(f"   - Response {invalid['index']}: {invalid['type']} - {invalid['content']}")
    
    if unmatched_responses:
        logger.warning(f"📎 Unmatched responses:")
        for unmatched in unmatched_responses:
            logger.warning(f"   - Response {unmatched['index']}: sections {unmatched['sections']}")
    
    # Build sorted response list
    sorted_responses = []
    
    # Add responses in schema order
    for section_name in schema_order:
        if section_name in response_map:
            sorted_responses.append(response_map[section_name])
            logger.debug(f"✅ Added response for section: {section_name}")
        else:
            logger.error(f"❌ CRITICAL: No response found for required section: {section_name}")
    
    # Handle unmatched responses based on severity
    if unmatched_responses:
        logger.warning(f"📎 Adding {len(unmatched_responses)} unmatched responses to end of list")
        for unmatched in unmatched_responses:
            sorted_responses.append(unmatched["response"])
    
    # Final validation
    if len(sorted_responses) != len([r for r in report_responses if isinstance(r, dict)]):
        logger.error(f"❌ CRITICAL: Response count mismatch after sorting")
        logger.error(f"   Original valid responses: {len([r for r in report_responses if isinstance(r, dict)])}")
        logger.error(f"   Sorted responses: {len(sorted_responses)}")
    
    # Determine if we should raise an error for critical issues
    critical_issues = len(invalid_responses) > 0 or len(missing_sections) > len(expected_sections) // 2
    
    if critical_issues:
        error_msg = f"Critical response sorting issues detected: {len(invalid_responses)} invalid responses, {len(missing_sections)} missing sections"
        logger.error(f"🚨 {error_msg}")
        # For now, log the error but don't raise to allow partial success
        # raise ValueError(error_msg)
    
    logger.info(f"✅ Response sorting completed: {len(sorted_responses)} responses sorted")
    return sorted_responses

# -------------------- HELPER FUNCTIONS --------------------

def _download_json_from_s3(file_path: str, address: str) -> Dict:
    """Download JSON report from S3"""
    try:
        from app.services.s3_service import s3_service
        from flask import current_app
        from io import BytesIO
        
        # Construct JSON file path (assuming JSON is stored alongside PDF)
        json_file_path = file_path.replace('.pdf', '.json')
        
        # Try to download JSON from S3
        if s3_service.s3_client is None:
            raise RuntimeError("S3 client not initialised")
        
        bucket_name = current_app.config.get("S3_BUCKET_NAME_PDFS")
        if not bucket_name:
            raise RuntimeError("S3_BUCKET_NAME_PDFS config missing")
        
        logger.debug(f"🔽 Downloading JSON: Bucket={bucket_name}, Key={json_file_path}")
        buffer = BytesIO()
        
        s3_service.s3_client.download_fileobj(bucket_name, json_file_path, buffer)
        buffer.seek(0)
        raw_json = buffer.read().decode("utf-8")
        
        logger.info(f"✅ Retrieved JSON report from S3 for {address}")
        return json.loads(raw_json)
    except Exception as e:
        logger.error(f"❌ Failed to download JSON for {address}: {str(e)}")
        raise e


def _wait_for_report_completion(pdf_doc, address: str, max_wait_time: int = 600) -> Dict:
    """Wait for a report to complete generation and return the JSON data"""
    import time
    from app.models.pdf_document import PDFDocument
    
    logger.info(f"⏳ Waiting for report completion: {pdf_doc.id} for address {address}")
    start_time = time.time()
    
    while time.time() - start_time < max_wait_time:
        # Refresh the PDF document from database
        db.session.refresh(pdf_doc)
        
        if pdf_doc.status in ['completed', 'processed']:
            logger.info(f"✅ Report completed for {address}, downloading JSON")
            return _download_json_from_s3(pdf_doc.file_path, address)
        elif pdf_doc.status == 'error':
            logger.error(f"❌ Report generation failed for {address}")
            raise Exception(f"Report generation failed for {address}")
        
        # Wait 5 seconds before checking again
        time.sleep(5)
        logger.debug(f"⏳ Still waiting for {address} (status: {pdf_doc.status})")
    
    # Timeout reached
    logger.error(f"⏰ Timeout waiting for report completion: {address}")
    raise Exception(f"Timeout waiting for report completion: {address}")


def _get_or_generate_report_json(address: str, user_id: int, filename: str) -> Dict:
    """Get existing JSON report from S3 or generate a new one if it doesn't exist.
    
    This function ensures the report is fully generated before returning JSON data.
    For comparison reports, this guarantees both individual reports are ready.
    """
    try:
        logger.info(f"🔍 Checking for existing JSON report for address: {address}")
        
        # Create a safe filename for S3 lookup
        safe_address = "".join(c for c in address if c.isalnum() or c in (' ', '-', '_')).rstrip().replace(' ', '_')
        user_id_short = str(user_id)[:8] if len(str(user_id)) >= 8 else str(user_id)
        
        # Try to find existing JSON report in S3
        from app.models.pdf_document import PDFDocument
        from app.models.user import User
        
        # Get user object from user_id (no HTTP context needed)
        user = User.query.get(user_id)
        if not user:
            raise Exception(f"User not found with ID: {user_id}")
        
        # Look for existing completed report first
        existing_report = PDFDocument.query.filter(
            PDFDocument.user_id == user_id,
            PDFDocument.primary_address == address,
            PDFDocument.report_type == 'detailed',
            PDFDocument.status.in_(['completed', 'processed'])
        ).first()
        
        if existing_report:
            logger.info(f"📄 Found existing completed report for {address}")
            return _download_json_from_s3(existing_report.file_path, address)
        
        # Check if report is currently generating
        generating_report = PDFDocument.query.filter(
            PDFDocument.user_id == user_id,
            PDFDocument.primary_address == address,
            PDFDocument.report_type == 'detailed',
            PDFDocument.status == 'generating'
        ).first()
        
        if generating_report:
            logger.info(f"⏳ Report is currently generating for {address}, waiting...")
            return _wait_for_report_completion(generating_report, address)
        
        # No existing report - create and generate new one
        logger.info(f"🆕 Creating new report for {address}")
        
        # Check user's report availability
        if user.reports_available <= 0:
            logger.warning(f"User {user.id} has no reports available")
            raise Exception("No reports available. Please purchase a subscription or more reports.")
        
        # Create new PDF document record
        filenamee = f"reports/{safe_address}_{user_id_short}_{uuid.uuid4().hex[:8]}.pdf"
        pdf_doc = PDFDocument(
            id=str(uuid.uuid4()),
            user_id=user.id,
            filename=filenamee,
            file_path=filenamee,
            status='generating',
            primary_address=address,
            report_type='detailed',
        )
        
        try:
            db.session.add(pdf_doc)
            # Decrement reports_available for non-subscription users
            user.reports_available -= 1
            db.session.commit()
            logger.info(f"✅ Created PDF document record: {pdf_doc.id}")
            logger.info(f"✅ Decremented reports_available for user {user.id}: {user.reports_available}")
        except Exception as e:
            logger.error(f"❌ Database error when creating PDF document: {str(e)}")
            db.session.rollback()
            raise e
        
        # Start async task and wait for completion
        from app.celery.tasks import generate_report_async
        task = generate_report_async.delay(address, None, filenamee, pdf_doc.id, user_id)
        logger.info(f"🚀 Started async report generation task: {task.id}")
        
        # Wait for the report to complete and return JSON
        return _wait_for_report_completion(pdf_doc, address)

        # This code should never be reached due to the logic above
        logger.error(f"❌ Unexpected code path in _get_or_generate_report_json for {address}")
        raise Exception(f"Unexpected error in report generation for {address}")
                
            
    except Exception as e:
        logger.error(f"❌ Failed to get or generate report JSON for {address}: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise e

# -------------------- MAIN FUNCTION --------------------

def generate_report(address: str, comparison_address: str, filename: str, user_id: str, marketing_model: bool = False) -> Dict:
    """Generate a comprehensive property report and upload PDF to S3"""
    task_id = str(uuid.uuid4())
    logger.info(f"📝 REPORT_GEN: Starting report generation for address: {address}")
    logger.info(f"🆔 REPORT_GEN: Task ID: {task_id}")
    logger.info(f"🎯 REPORT_GEN: Using user_id for preferences: {user_id}")
    logger.info(f"📈 REPORT_GEN: Marketing model enabled: {marketing_model}")
    
    # Get user preferences
    logger.info(f"🔍 REPORT_GEN: Calling get_preferences with user_id: {user_id}")
    user_preferences = get_preferences(user_id)
    logger.info(f"📊 REPORT_GEN: get_preferences returned: {user_preferences is not None}")
    
    if user_preferences:
        logger.info(f"✅ REPORT_GEN: Successfully retrieved preferences for user_id {user_id}")
        logger.info(f"📋 REPORT_GEN: Preferences summary: {len(user_preferences)} keys found")
    else:
        logger.error(f"❌ REPORT_GEN: No preferences found for user_id {user_id} - this will cause report generation to fail")
    
    # Handle report customization preferences
    if user_preferences and 'report_customization' in user_preferences:
        report_customization = user_preferences['report_customization']
        logger.info(f"✅ REPORT_GEN: Using report_customization from user_id {user_id}")
        logger.info(f"🎯 REPORT_GEN: Customization options: {list(report_customization.keys()) if report_customization else 'None'}")
    else:
        # Default all to True if no preferences found
        logger.error(f"❌ REPORT_GEN: No report_customization found for user_id {user_id}")
        if user_preferences:
            logger.error(f"❌ REPORT_GEN: Available preference keys: {list(user_preferences.keys())}")
        else:
            logger.error(f"❌ REPORT_GEN: user_preferences is None for user_id {user_id}")
        raise Exception(f"No report customization found for user_id {user_id}")

    # Create schema with error handling - use MarketingReport if marketing_model is True
    try:
        # Use the dedicated schema generator for clean, maintainable code
        # Pass user preferences for interpolation in example fields
        # Note: user_preferences is already a dict from get_preferences()
        if marketing_model:
            logger.info(f"🎯 REPORT_GEN: Using MarketingReport schema for marketing model")
            # Use MarketingReport schema directly
            marketing_report = MarketingReport()
            schema = marketing_report.schema(report_customization=report_customization)
            # Add schema metadata
            schema["$schema"] = "https://json-schema.org/draft/2020-12/schema"
            schema["title"] = "Marketing Report Schema"
            schema["description"] = "Structured schema for generating personalized marketing reports"
        elif comparison_address is not None and comparison_address != "":
            logger.info(f"🔄 REPORT_GEN: Using comparison report schema")
            schema = generate_report_schema(report_customization, user_preferences, compare=True)
        else:
            logger.info(f"📋 REPORT_GEN: Using standard FullReport schema")
            schema = generate_report_schema(report_customization, user_preferences)

    except Exception as e:
        logger.error(f"❌ Failed to create FullReport schema: {str(e)}")
        logger.exception("FullReport schema creation error details:")
        raise Exception(f"FullReport schema creation failed: {str(e)}")
    payloads = []
    schemas = break_schema_into_sections(schema)
    
    # Auto-include demographic sections when neighborhood_overview is present
    from collections import OrderedDict
    from ..models.report_models import AgeDistribution, LifestyleDNA

    # Only auto-include demographics if neighborhood_overview exists and not comparing
    if 'neighborhood_overview' in schemas and not comparison_address or comparison_address == "":
        logger.info("🏘️ neighborhood_overview detected and no comparison_address - auto-including demographic sections")

        new_schemas = OrderedDict()
        inserted = False

        for key, schema in schemas.items():
            new_schemas[key] = schema

            if key == 'neighborhood_overview':
                # Insert age_distribution if missing
                if 'age_distribution' not in schemas:
                    age_dist_schema = {
                        "$schema": "https://json-schema.org/draft/2020-12/schema",
                        "$id": "#age_distribution",
                        "title": "Age Distribution Section Schema",
                        "description": "Schema for the age_distribution section",
                        "type": "object",
                        "properties": {
                            "age_distribution": AgeDistribution.model_json_schema()
                        },
                        "required": ["age_distribution"],
                        "additionalProperties": False
                    }
                    new_schemas['age_distribution'] = age_dist_schema
                    logger.info("✅ Inserted age_distribution after neighborhood_overview")

                # Insert lifestyle_dna if missing
                if 'lifestyle_dna' not in schemas:
                    lifestyle_schema = {
                        "$schema": "https://json-schema.org/draft/2020-12/schema",
                        "$id": "#lifestyle_dna",
                        "title": "Lifestyle DNA Section Schema",
                        "description": "Schema for the lifestyle_dna section",
                        "type": "object",
                        "properties": {
                            "lifestyle_dna": LifestyleDNA.model_json_schema()
                        },
                        "required": ["lifestyle_dna"],
                        "additionalProperties": False
                    }
                    new_schemas['lifestyle_dna'] = lifestyle_schema
                    logger.info("✅ Inserted lifestyle_dna after neighborhood_overview")

                inserted = True

        if inserted:
            schemas.clear()
            schemas.update(new_schemas)

    logger.info(f"📋 Final ordered sections to process: {list(schemas.keys())}")

    try:
        # Validate address
        if not validate_address(address):
            logger.error("🚫 Address validation failed")
            raise ValueError("Invalid address format")
        elif marketing_model:
            payload = {
                "model": "sonar-deep-research",
                "messages": [
                    {
                        "role": "system",
                    "content": (
                        f"You are a comprehensive PERSONALIZED property research assistant. Given an address, {address}, you must provide a detailed property report in valid JSON format.\n\n"

                        "SCHEMA COMPLIANCE: You MUST follow the schema structure EXACTLY. Use the examples in the schema to determine how to structure your response.\n\n"
                        "FIELD NAMES: For dictionary fields (like age_distribution, lifestyle_dna), you MUST use the EXACT field names specified in the schema descriptions. Do NOT create your own field names.\n\n"
                        "LIFESTYLE DNA REQUIREMENTS: Return ALL keys in lifestyle_dna (Artistic, Professional, Family_Oriented, Active_Outdoor, Tech_Remote, Retiree, Student, Suburban, Urban). The percentages MUST sum to exactly 100%. Distribute percentages realistically based on the neighborhood demographics. Do NOT omit or return null for any key.\n\n"
                        "AGE DISTRIBUTION REQUIREMENTS: Return ALL keys in age_distribution (18-24, 25-34, 35-49, 50-64, 65+). The percentages MUST sum to exactly 100%. Distribute percentages realistically based on census data or neighborhood demographics. Do NOT omit or return null for any key.\n\n"
                        "PERCENTAGE NORMALIZATION: For both age_distribution and lifestyle_dna, ensure all percentage values are realistic and sum to exactly 100%. Use actual demographic data when available, or make educated estimates based on similar neighborhoods. Example: age_distribution might be '18-24': '15%', '25-34': '25%', '35-49': '30%', '50-64': '20%', '65+': '10%' (totaling 100%).\n\n"
                        "Use the descriptions to figure out how to formulate a response unique to this address and user preferences.\n\n"
                        "Use the guidance schema to determine where to find different data sources and how to use them.\n\n"

                         "RESEARCH:\n"
                                "- Use the recommended sources first in research. If a decent answer is found, do not continue to search the web for that field\n"


                                "FORMATTING:\n"
                                "- _demographics: caption: percentage (total 100%)\n"
                                "- _rating: EXACT number out of 10 (e.g., 6.8/10). NEVER use >=, <=, >, or < symbols. Always provide specific numeric ratings.\n\n"

                        "CRITICAL REQUIREMENTS:\n"
                        "1. Follow all instrucions EXACTLY for ALL fields exactly as in the given guidance - if you don't know a value, research until you find one\n"
                        "2. Be  critical and honest - expose both good and bad aspects of locations\n"
                        "3. If no data exists for a field, provide your best educated estimate based on similar areas\n"
                        "4. All ratings must be EXACT numbers out of 10 (e.g., 7.2/10, 8.5/10). NEVER use comparison operators like >=, <=, >, or <. Always provide a specific numeric rating.\n"
                        "5. You MUST respond with ONLY valid JSON (no markdown, no explanation). Do not wrap your response in ``` or any code fences.\n"
                        "6. Use the recommended sources first in research. If a decent answer is found, do not continue to search the web for that field\n"
                        "7. Do not include citations in the response\n"
                        "8. MANDATORY: You MUST provide ALL required fields in the schema. NEVER return null or omit any field. Every field must have a meaningful value.\n"
                        "9. MANDATORY: If you cannot find specific data for a field, provide a reasonable estimate or placeholder value instead of null.\n"
                    
                        "CRITICAL: Never return 'N/A' for any fields. Always provide a concrete answer, estimate, or remove the field entirely if unknown.\n"

                    )
                }, {"role": "user", "content": f"Sell me the property at {address} CRITICAL: Never return 'N/A' for any fields. Always provide a concrete answer, estimate, or remove the field entirely if unknown.\n"}
            ],
            "search_mode": "web",
            "reasoning_effort": "medium",
            "temperature": 0.1,
            "max_tokens": 20000,
            "stream": False,
            "return_images": False,
            "return_citations": False,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "schema": schema 
                }
            }
        }
            payloads.append(payload)
        elif comparison_address is None or comparison_address == "":
            # Fix: Iterate over schema values, not keys
            for section_name, section_schema in schemas.items():
                logger.debug(f"🔧 Creating payload for section: {section_name}")
                payload = {
                "model": "sonar-deep-research",
                "messages": [
                    {
                        "role": "system",
                    "content": (
                        f"You are a comprehensive PERSONALIZED property research assistant. Given an address, {address}, you must provide a detailed property report in valid JSON format.\n\n"

                        "SCHEMA COMPLIANCE: You MUST follow the schema structure EXACTLY. Use the examples in the schema to determine how to structure your response.\n\n"
                        "FIELD NAMES: For dictionary fields (like age_distribution, lifestyle_dna), you MUST use the EXACT field names specified in the schema descriptions. Do NOT create your own field names.\n\n"
                        "LIFESTYLE DNA REQUIREMENTS: Return ALL keys in lifestyle_dna (Artistic, Professional, Family_Oriented, Active_Outdoor, Tech_Remote, Retiree, Student, Suburban, Urban). The percentages MUST sum to exactly 100%. Distribute percentages realistically based on the neighborhood demographics. Do NOT omit or return null for any key.\n\n"
                        "AGE DISTRIBUTION REQUIREMENTS: Return ALL keys in age_distribution (18-24, 25-34, 35-49, 50-64, 65+). The percentages MUST sum to exactly 100%. Distribute percentages realistically based on census data or neighborhood demographics. Do NOT omit or return null for any key.\n\n"
                        "PERCENTAGE NORMALIZATION: For both age_distribution and lifestyle_dna, ensure all percentage values are realistic and sum to exactly 100%. Use actual demographic data when available, or make educated estimates based on similar neighborhoods. Example: age_distribution might be '18-24': '15%', '25-34': '25%', '35-49': '30%', '50-64': '20%', '65+': '10%' (totaling 100%).\n\n"
                        "Use the descriptions to figure out how to formulate a response unique to this address and user preferences.\n\n"
                        "Use the guidance schema to determine where to find different data sources and how to use them.\n\n"

                         "RESEARCH:\n"
                                "- Use the recommended sources first in research. If a decent answer is found, do not continue to search the web for that field\n"


                                "FORMATTING:\n"
                                "- _demographics: caption: percentage (total 100%)\n"
                                "- _rating: EXACT number out of 10 (e.g., 6.8/10). NEVER use >=, <=, >, or < symbols. Always provide specific numeric ratings.\n\n"

                        "CRITICAL REQUIREMENTS:\n"
                        "1. Follow all instrucions EXACTLY for ALL fields exactly as in the given guidance - if you don't know a value, research until you find one\n"
                        "2. Be  critical and honest - expose both good and bad aspects of locations\n"
                        "3. If no data exists for a field, provide your best educated estimate based on similar areas\n"
                        "4. All ratings must be EXACT numbers out of 10 (e.g., 7.2/10, 8.5/10). NEVER use comparison operators like >=, <=, >, or <. Always provide a specific numeric rating.\n"
                        "5. You MUST respond with ONLY valid JSON (no markdown, no explanation). Do not wrap your response in ``` or any code fences.\n"
                        "6. Use the recommended sources first in research. If a decent answer is found, do not continue to search the web for that field\n"
                        "7. Do not include citations in the response\n"
                        "8. MANDATORY: You MUST provide ALL required fields in the schema. NEVER return null or omit any field. Every field must have a meaningful value.\n"
                        "9. MANDATORY: If you cannot find specific data for a field, provide a reasonable estimate or placeholder value instead of null.\n"
                    
                        "CRITICAL: Never return 'N/A' for any fields. Always provide a concrete answer, estimate, or remove the field entirely if unknown.\n"

                    )
                }, {"role": "user", "content": f"Sell me the property at {address} CRITICAL: Never return 'N/A' for any fields. Always provide a concrete answer, estimate, or remove the field entirely if unknown.\n"}
            ],
            "search_mode": "web",
            "reasoning_effort": "medium",
            "temperature": 0.1,
            "max_tokens": 20000,
            "stream": False,
            "return_images": False,
            "return_citations": False,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "schema": section_schema 
                }
            }
        }
                payloads.append(payload)
        else:
            # Comparison report logic - need to get JSON data for both properties
            logger.info(f"🔄 Generating comparison report for {address} vs {comparison_address}")
            
            # Generate ComparisonReport schema with user preference interpolation
            from ..models.duel_report_models import ComparisonReport
            comparison_report = ComparisonReport(report_customization=report_customization)
            comparison_schema = comparison_report.schema(report_customization=report_customization)
            
            # Get or generate JSON reports for both addresses - these calls will block until reports are ready
            logger.info(f"📋 Ensuring primary report is ready for {address}...")
            primary_report_json = _get_or_generate_report_json(address, user_id, filename)
            logger.info(f"✅ Primary report JSON ready for {address}")
            
            logger.info(f"📋 Ensuring comparison report is ready for {comparison_address}...")
            comparison_report_json = _get_or_generate_report_json(comparison_address, user_id, filename)
            logger.info(f"✅ Comparison report JSON ready for {comparison_address}")
            
            logger.info(f"🎯 Both individual reports are now ready - proceeding with comparison generation")
            
            # Fix: Iterate over schema values, not keys (same fix as above)
            for section_name, section_schema in schemas.items():
                logger.debug(f"🔧 Creating comparison payload for section: {section_name}")
                payload = {
                    "model": "sonar-deep-research",
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                f"You are a critical, strategic, and personalized PROPERTY COMPARISON EXPERT. "
                                f"Help me make a decision on which property to move in to based on my priorities and user preferences.\n\n"

                                "Use the examples in the schema to determine how to structure your response.\n\n"
                                "Use the descriptions to figure out how to formulate a response unique to this address and user preferences.\n\n"
                                "Use the guidance schema to determine where to find different data sources and how to use them.\n\n"

                                "CRITICAL OBJECTIVES:\n"
                                "You are filling out a structured JSON response using the provided schema. Each field represents a distinct dimension (e.g., crime_rating, police_presence, etc.). When completing each field, you must only consider the named dimension and avoid referencing unrelated factors.\n\n"
                                "For every ComparisonField, you must:\n"
                                "- Provide only dimension-specific analysis in location_a and location_b.\n"
                                "- Select the winner solely based on that dimension.\n"
                                "- Explain the reason as if you are arguing why the winner is better for this specific dimension.\n"
                                "- Use the criteria and user_preference_tags fields to justify the decision traceably.\n\n"
                            
                                "FORMATTING:\n"
                                "- _demographics: caption: percentage (total 100%)\n"
                                "- _rating: EXACT number out of 10 (e.g., 6.8/10). NEVER use >=, <=, >, or < symbols. Always provide specific numeric ratings.\n\n"
                                
                                "CRITICAL: Never return 'N/A' for any fields. Always provide a concrete answer, estimate, or remove the field entirely if unknown.\n"
                            )
                        },
                        {
                            "role": "user",
                            "content": (
                                f"Based on my priorities and user preferences, for each field, tell me which porperty is better, worse, or the same FOR ME:\n\n"
                                f"Property A ({address}):\n{json.dumps(primary_report_json, indent=2)}\n\n"
                                f"Property B ({comparison_address}):\n{json.dumps(comparison_report_json, indent=2)}"
                                "CRITICAL: Never return 'N/A' for any fields. Always provide a concrete answer, estimate, or remove the field entirely if unknown.\n"
                            )
                        }
                    ],
                    "search_mode": "web",
                    "reasoning_effort": "medium",
                    "temperature": 0.1,
                    "max_tokens": 25000,
                    "stream": False,
                    "return_images": False,
                    "return_citations": False,
                    "response_format": {
                        "type": "json_schema",
                        "json_schema": {
                            "schema": section_schema  # Fix: Use section_schema (dict) instead of comparison_schema
                        }
                    }
                }
                
                payloads.append(payload)

        # Concurrent execution with partial failure handling
        import concurrent.futures
        
        def process_single_payload(payload_info):
            """Process a single payload and return result with section info"""
            payload, section_name = payload_info
            
            try:
                # Debug: Check payload type first
                logger.debug(f"🔍 Section {section_name}: Payload type check: {type(payload)}")
                
                # Validate payload is a dictionary
                if not isinstance(payload, dict):
                    error_msg = f"Invalid payload type: expected dict, got {type(payload)}"
                    logger.error(f"❌ Section {section_name}: {error_msg}")
                    logger.error(f"🔍 Section {section_name}: Payload content: {str(payload)[:200]}")
                    return {"section": section_name, "success": False, "error": error_msg}
                
                # Configure session for this thread
                session = requests.Session()
                retries = Retry(
                    total=1,
                    backoff_factor=0.5,
                    status_forcelist=[429, 500, 502, 503, 504],
                    raise_on_status=False
                )
                session.mount("https://", HTTPAdapter(max_retries=retries))
                
                logger.info(f"📨 Starting concurrent request for section: {section_name}")
                
                # Debug: Log payload structure for 400 error diagnosis
                logger.debug(f"🔍 Section {section_name}: Payload structure:")
                logger.debug(f"   - Model: {payload.get('model')}")
                logger.debug(f"   - Messages count: {len(payload.get('messages', []))}")
                logger.debug(f"   - Response format type: {payload.get('response_format', {}).get('type')}")
                                
                start_time = time.perf_counter()
                response = session.post(
                    "https://api.perplexity.ai/chat/completions",
                    headers=HEADERS,
                    json=payload,
                    timeout=300  # 5 minute timeout per section
                )
                
                duration = time.perf_counter() - start_time
                logger.info(f"📊 Section {section_name} completed in {duration:.2f}s → status {response.status_code}")
                
                # Handle successful response
                if response.status_code == 200:
                    try:
                        content = response.json()
                        
                        # Validate response structure
                        if "choices" not in content or not content["choices"]:
                            logger.error(f"❌ Section {section_name}: Missing 'choices' in response")
                            return {"section": section_name, "success": False, "error": "Malformed API response"}
                        
                        # Extract and parse the response
                        raw_json_text = content["choices"][0]["message"]["content"]
                        logger.info(f"📝 Section {section_name}: Received {len(raw_json_text)} characters")
                        
                        # Parse the JSON response
                        try:
                            report = _safe_parse_json(raw_json_text, report_customization)
                            
                            # Extract only the requested section from the full report
                            if section_name in report and report[section_name] is not None:
                                section_data = {section_name: report[section_name]}
                                logger.info(f"✅ Section {section_name}: Successfully parsed and extracted")
                                return {"section": section_name, "success": True, "data": section_data}
                            else:
                                logger.warning(f"⚠️ Section {section_name}: Requested section not found or null in response")
                                logger.debug(f"🔍 Available sections in response: {list(report.keys())}")
                                # Return empty section data to maintain structure
                                section_data = {section_name: None}
                                return {"section": section_name, "success": True, "data": section_data}
                        except Exception as pe:
                            logger.error(f"❌ Section {section_name}: Parse error: {str(pe)}")
                            return {"section": section_name, "success": False, "error": f"Parse error: {str(pe)}"}
                            
                    except json.JSONDecodeError as je:
                        logger.error(f"❌ Section {section_name}: JSON decode error: {str(je)}")
                        return {"section": section_name, "success": False, "error": f"JSON decode error: {str(je)}"}
                
                # Handle API errors
                else:
                    error_msg = f"API error {response.status_code}"
                    full_error_details = ""
                    
                    try:
                        error_data = response.json()
                        if isinstance(error_data, dict):
                            # Log the complete error response for debugging
                            full_error_details = json.dumps(error_data, indent=2)
                            logger.error(f"🔍 Section {section_name}: Full API error response:")
                            logger.error(full_error_details)
                            
                            # Extract request ID if available
                            request_id = error_data.get('request_id') or error_data.get('error', {}).get('request_id')
                            if request_id:
                                error_msg += f" (Request ID: {request_id})"
                            
                            # Extract error message if available
                            error_message = error_data.get('error', {}).get('message') or error_data.get('message')
                            if error_message:
                                error_msg += f" - {error_message}"
                        else:
                            logger.error(f"🔍 Section {section_name}: Non-dict error response: {error_data}")
                    except json.JSONDecodeError:
                        # If response is not JSON, log the raw text
                        try:
                            raw_error = response.text[:1000]  # Limit to first 1000 chars
                            logger.error(f"🔍 Section {section_name}: Raw error response: {raw_error}")
                            full_error_details = raw_error
                        except:
                            logger.error(f"🔍 Section {section_name}: Could not decode error response")
                    except Exception as e:
                        logger.error(f"🔍 Section {section_name}: Error parsing error response: {str(e)}")
                    
                    logger.error(f"❌ Section {section_name}: {error_msg}")
                    return {"section": section_name, "success": False, "error": error_msg, "full_error": full_error_details}
                    
            except requests.exceptions.Timeout:
                logger.error(f"❌ Section {section_name}: Request timeout")
                return {"section": section_name, "success": False, "error": "Request timeout"}
            except requests.exceptions.ConnectionError as ce:
                logger.error(f"❌ Section {section_name}: Connection error: {str(ce)}")
                return {"section": section_name, "success": False, "error": f"Connection error: {str(ce)}"}
            except Exception as e:
                logger.error(f"❌ Section {section_name}: Unexpected error: {str(e)}")
                return {"section": section_name, "success": False, "error": f"Unexpected error: {str(e)}"}
        
        # Prepare payload info with section names
        payload_infos = []
        schema_names = list(schemas.keys())
        
        # Critical: Assert exact match between payloads and schema sections
        if len(payloads) != len(schema_names):
            error_msg = f"CRITICAL MISMATCH: {len(payloads)} payloads vs {len(schema_names)} schema sections"
            logger.error(f"❌ {error_msg}")
            logger.error(f"🔍 Payloads count: {len(payloads)}")
            logger.error(f"🔍 Schema sections: {schema_names}")
            raise ValueError(error_msg)
        
        # Build payload_infos with exact 1:1 mapping
        for i, payload in enumerate(payloads):
            section_name = schema_names[i]
            logger.debug(f"🔗 Mapping payload {i} → section '{section_name}'")
            payload_infos.append((payload, section_name))
        
        logger.info(f"🚀 Starting concurrent execution of {len(payload_infos)} sections")
        logger.info(f"📋 Sections to execute: {[info[1] for info in payload_infos]}")
        
        # Execute all payloads with staggered launch to respect rate limits
        successful_responses = []
        failed_sections = []
        report_responses = []  # Define early to avoid double checks
        
        def staggered_concurrent_execution(payload_infos, max_workers=15):
            """Execute payloads with staggered launch to respect API rate limits"""
            import time
            import random
            
            futures = []
            future_to_section = {}
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(payload_infos), max_workers)) as executor:
                # Submit tasks with tiny randomized delays to avoid burst signatures
                for payload_info in payload_infos:
                    # Tiny randomized delay (5–50ms) between submissions
                    delay = random.uniform(10, 15)
                    time.sleep(delay)
                    
                    section_name = payload_info[1]
                    future = executor.submit(process_single_payload, payload_info)
                    futures.append(future)
                    future_to_section[future] = section_name
                    
                    logger.debug(f"🚀 Submitted section '{section_name}' with {delay*1000:.1f}ms delay")
                
                logger.info(f"📡 All {len(futures)} sections submitted with staggered delays")
                
                # Collect results as they complete
                for future in concurrent.futures.as_completed(futures):
                    section_name = future_to_section[future]
                    try:
                        result = future.result()
                        if result["success"]:
                            successful_responses.append(result["data"])
                            logger.info(f"✅ Section {section_name}: Added to successful responses")
                        else:
                            failed_sections.append({"section": section_name, "error": result["error"]})
                            logger.warning(f"⚠️ Section {section_name}: Failed - {result['error']}")
                    except Exception as e:
                        failed_sections.append({"section": section_name, "error": str(e)})
                        logger.error(f"❌ Section {section_name}: Exception during result collection - {str(e)}")
        
        # Execute with staggered launch
        staggered_concurrent_execution(payload_infos)
        
        logger.info(f"📊 Concurrent execution completed:")
        logger.info(f"   ❌ Failed sections: {len(failed_sections)}")
        
        if failed_sections:
            logger.warning(f"⚠️ Failed sections details:")
            for failure in failed_sections:
                logger.warning(f"   - {failure['section']}: {failure['error']}")
        
        # Handle partial success - continue if we have at least some sections
        if successful_responses:
            logger.info(f"✅ Proceeding with {len(successful_responses)} successful sections (partial success)")
            report_responses = successful_responses
        else:
            logger.error(f"❌ All sections failed - cannot generate report")
            raise Exception(f"All {len(payload_infos)} sections failed to generate. No report data available.")
        
        # Sort responses to match schema order and combine them
        sorted_responses = response_sort(report_responses, schemas)
        
        # Combine all section responses into a single report with metadata
        combined_report = {}
        for response in sorted_responses:
            if isinstance(response, dict):
                combined_report.update(response)
        
        # Log metadata for debugging (but don't include in return value)
        metadata = {
            "total_sections_requested": len(schemas),
            "successful_sections": len(successful_responses),
            "failed_sections": len(failed_sections),
            "generation_timestamp": time.time()
        }
        
        # Log debugging information
        logger.info(f"✅ Combined {len(sorted_responses)} section responses into final report")
        logger.info(f"📋 Report customization: {json.dumps(report_customization, indent=2) if report_customization else 'None'}")
        logger.info(f"📊 Generation metadata: {json.dumps(metadata, indent=2)}")
        logger.info(f"🔍 Raw JSON response:")
        logger.info(json.dumps(combined_report, indent=2))
        
        # Generate PDF using the combined report (raw JSON sections only)
        logger.debug("🖨️ Calling PDF generation helper...")
        try:
            _create_pdf(combined_report, address, filename, comparison_address, user_preferences)
            logger.info(f"✅ Report generation completed successfully for task {task_id}")
            return combined_report  # Return only the raw JSON sections
        except Exception as pdf_error:
            logger.error(f"❌ PDF generation failed: {str(pdf_error)}")
            # PDF generation failure is not retryable, so we raise immediately
            raise Exception(f"PDF generation failed: {str(pdf_error)}")


    except Exception as e:
        logger.error(f"❌ Unhandled error in generate_report: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        raise


