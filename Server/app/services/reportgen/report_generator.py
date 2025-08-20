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
import traceback
from sqlalchemy.exc import OperationalError, DisconnectionError
from .pdf_creator import _create_pdf
from io import BytesIO
from .schema_generator import get_individual_section_schema
from app.models.user_preferences import UserPreferences
from app import db
from .age_data import get_age_distribution, get_population_total

# Import utilities
from ...utils.app_logging import get_logger
from ...utils.env_validator import get_env_var

# Configure logging using centralized utility
logger = get_logger()

PERPLEXITY_API_KEY = get_env_var('PERPLEXITY_API_KEY', required=True)

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
        
        return normalized
        
    except Exception as e:
        logger.warning(f"⚠️ RATING: Error normalizing rating '{value}' for field '{field_name}': {e}")
        return str(value)  # Return original value if normalization fails

def _safe_parse_json(text: str, report_customization: dict = None) -> dict:
    try:
        # Strip any non-JSON hallucinated wrappers just in case
        cleaned = re.sub(r'(<think>.*?</think>|&lt;think&gt;.*?&lt;/think&gt;)', '', text, flags=re.DOTALL | re.IGNORECASE).strip()
        cleaned = cleaned.replace("“", '"').replace("”", '"').replace("’", "'")
        cleaned = re.sub(r',(\s*[}\]])', r'\1', cleaned)
        # Try multiple parsing strategies for common Perplexity issues
        parsed = None
        
        try:
            # Strategy 1: Direct JSON parsing
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as e:
           logger.error(f"🛑 Failed to parse structured JSON: {e}")
           logger.error(f"🧵 Traceback:\n{traceback.format_exc()}")
           raise ValueError("Failed to parse structured JSON from model output") from e


        # Remove empty fields (empty strings, null, empty arrays)
        parsed = _remove_empty_fields(parsed)
        
        # Return the successfully parsed and cleaned JSON
        return parsed

    except Exception as e:
        logger.error(f"🛑 Failed to parse structured JSON: {e}")
        logger.error(f"🧵 Traceback:\n{traceback.format_exc()}")
        raise ValueError("Failed to parse structured JSON from model output") from e

# -------------------- HELPER FUNCTIONS --------------------

from collections import OrderedDict
import traceback

def inject_real_age_distribution(combined_report: dict, address: str) -> dict:
    """
    Inject real Census age distribution data into the top-level of the report,
    immediately after the 'neighborhood_overview' section. Removes any nested 
    'age_distribution' inside 'neighborhood_overview'.

    Args:
        combined_report: The combined report dictionary
        address: The property address to get age data for

    Returns:
        Updated combined_report with real age distribution data at top level
    """    
    try:
        # Check if neighborhood_overview exists
        if 'neighborhood_overview' not in combined_report:
            logger.warning("⚠️ No neighborhood_overview section found - skipping age distribution injection")
            return combined_report

        neighborhood_section = combined_report['neighborhood_overview']
        if not isinstance(neighborhood_section, dict):
            logger.warning("⚠️ neighborhood_overview is not a dictionary - skipping age distribution injection")
            return combined_report

        # Remove any nested age_distribution if it exists
        if 'age_distribution' in neighborhood_section:
            neighborhood_section.pop('age_distribution')

        # Fetch real age distribution data from Census API
        real_age_data = get_age_distribution(address)

        if not real_age_data:
            logger.warning("⚠️ Failed to get real age distribution data - skipping")
            return combined_report

        # Format real age data for output
        age_distribution = {
            "0-19": f"{real_age_data.get('0-19', 0)}%",
            "20-34": f"{real_age_data.get('20-34', 0)}%",
            "35-49": f"{real_age_data.get('35-49', 0)}%",
            "50-64": f"{real_age_data.get('50-64', 0)}%",
            "65+": f"{real_age_data.get('65+', 0)}%"
        }

        # Insert age_distribution at top-level after neighborhood_overview
        new_combined_report = OrderedDict()
        for key, value in combined_report.items():
            new_combined_report[key] = value
            if key == 'neighborhood_overview':
                new_combined_report['age_distribution'] = age_distribution

        return dict(new_combined_report)

    except Exception as e:
        logger.error(f"❌ Error injecting real age distribution data: {str(e)}")
        logger.error(f"🔍 Traceback: {traceback.format_exc()}")
        logger.warning("⚠️ Continuing with original report data")
        return combined_report


def inject_real_population_total(combined_report: dict, address: str) -> dict:
    """
    Inject real Census population total data into the top-level of the report,
    immediately after the 'things_to_watch_out_for' field in 'neighborhood_overview'.

    Args:
        combined_report: The combined report dictionary
        address: The property address to get population data for

    Returns:
        Updated combined_report with real population total data at top level
    """
    
    try:
        # Check if neighborhood_overview exists
        if 'neighborhood_overview' not in combined_report:
            logger.warning("⚠️ No neighborhood_overview section found - skipping population total injection")
            return combined_report

        neighborhood_section = combined_report['neighborhood_overview']
        if not isinstance(neighborhood_section, dict):
            logger.warning("⚠️ neighborhood_overview is not a dictionary - skipping population total injection")
            return combined_report

        # Check if things_to_watch_out_for exists (our insertion point)
        if 'things_to_watch_out_for' not in neighborhood_section:
            logger.warning("⚠️ No things_to_watch_out_for field found in neighborhood_overview - skipping population total injection")
            return combined_report

        # Fetch real population total data from Census API
        real_population_data = get_population_total(address)

        if not real_population_data or 'error' in real_population_data:
            logger.warning("⚠️ Failed to get real population total data - skipping")
            return combined_report

        # Format real population data for output
        population_total = real_population_data.get('total_population', 0)
        
        # Insert population_total at top-level after things_to_watch_out_for
        new_combined_report = OrderedDict()
        
        for key, value in combined_report.items():
            if key == 'neighborhood_overview':
                # Reconstruct neighborhood_overview with population_total after things_to_watch_out_for
                new_neighborhood = OrderedDict()
                for nkey, nvalue in value.items():
                    new_neighborhood[nkey] = nvalue
                    if nkey == 'things_to_watch_out_for':
                        new_neighborhood['population_total'] = f"{population_total:,} residents"
                new_combined_report[key] = new_neighborhood
            else:
                new_combined_report[key] = value

        return dict(new_combined_report)

    except Exception as e:
        logger.error(f"❌ Error injecting real population total data: {str(e)}")
        logger.error(f"🔍 Traceback: {traceback.format_exc()}")
        logger.warning("⚠️ Continuing with original report data")
        return combined_report


def start_property_data_collection(address: str, user_id: str = None):
    """
    Start asynchronous collection of property data from the search endpoint.
    This should be called early in the report generation process.

    Args:
        address: The property address to get data for
        user_id: Optional user ID for personalized data (commute calculations)

    Returns:
        Future object that will contain the property data when complete
    """
    import concurrent.futures
    import threading
    from flask import current_app
        
    # Capture the base URL from the current app context before threading
    base_url = current_app.config.get('BASE_URL', 'http://localhost:5000')
    
    def fetch_property_data():
        """Internal function to fetch property data"""
        try:
            import requests
            import json
            
            # Use the captured base URL instead of accessing current_app in thread
            search_url = f"{base_url}/api/v1/search/property"
            
            # Prepare request payload
            payload = {"address": address}
                        
            # Make the request to our own search endpoint
            response = requests.post(search_url, json=payload, timeout=30)
            
            if response.status_code != 200:
                logger.warning(f"⚠️ Search endpoint returned status {response.status_code}")
                return None
            
            property_data = response.json()
            
            if not property_data.get('success', False):
                logger.warning("⚠️ Search endpoint returned unsuccessful response")
                return None
            
            return property_data
            
        except Exception as e:
            logger.error(f"❌ Error in property data collection: {str(e)}")
            logger.error(f"🔍 Traceback: {traceback.format_exc()}")
            return None
    
    # Create thread pool executor for async execution
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    future = executor.submit(fetch_property_data)
    
    # Store executor reference to ensure proper cleanup
    future.executor = executor
    
    return future


def inject_property_data_result(combined_report: dict, address: str, property_data_future) -> dict:
    """
    Inject property data from the async collection into the top-level of the report,
    immediately after the 'neighborhood_overview' section.

    Args:
        combined_report: The combined report dictionary
        address: The property address (for logging)
        property_data_future: Future object containing the property data

    Returns:
        Updated combined_report with real property data at top level
    """
    
    try:
        # Check if neighborhood_overview exists
        if 'neighborhood_overview' not in combined_report:
            logger.warning("⚠️ No neighborhood_overview section found - skipping property data injection")
            return combined_report

        # Wait for the property data collection to complete (with timeout)
        try:
            property_data = property_data_future.result(timeout=60)  # 60 second timeout
            
            # Clean up the executor
            if hasattr(property_data_future, 'executor'):
                property_data_future.executor.shutdown(wait=False)
                
        except concurrent.futures.TimeoutError:
            logger.error("⏰ Property data collection timed out")
            return combined_report
        except Exception as e:
            logger.error(f"❌ Error waiting for property data: {str(e)}")
            return combined_report

        if not property_data:
            logger.warning("⚠️ No property data received from collection - skipping injection")
            return combined_report

        # Extract relevant property information
        property_info = {}
        
        # Helper function to format property type
        def format_property_type(prop_type):
            if not prop_type:
                return None
            # Convert SINGLE_FAMILY to Single Family, CONDO to Condo, etc.
            return prop_type.replace('_', ' ').title()

        # Basic property details from the main data
        main_data = property_data.get('data', {})
        if isinstance(main_data, dict):
            raw_property_type = main_data.get('propertyType', main_data.get('homeType'))
            property_info.update({
                'price': main_data.get('price', main_data.get('listPrice')),
                'bedrooms': main_data.get('bedrooms', main_data.get('beds')),
                'bathrooms': main_data.get('bathrooms', main_data.get('baths')),
                'living_area': main_data.get('livingArea', main_data.get('sqft')),
                'property_type': format_property_type(raw_property_type),
                'lot_area': main_data.get('lotAreaValue'),
                'lot_unit': main_data.get('lotAreaUnit'),
                'listing_status': main_data.get('listingStatus'),
            })

        # Commute data
        commute_data = property_data.get('commute_data', {})
        if isinstance(commute_data, dict) and 'travel_times' in commute_data:
            property_info['commute_times'] = commute_data['travel_times']
            property_info['commute_map_url'] = commute_data.get('map_url')

  
        # Zillow URL and images
        property_info['zillow_url'] = property_data.get('zillow_url')
        zillow_images = property_data.get('zillow_api_images', [])
        if zillow_images:
            property_info['additional_images'] = zillow_images[:10]  # Limit to 10 images

        # Remove None values
        property_info = {k: v for k, v in property_info.items() if v is not None}

        if not property_info:
            logger.warning("⚠️ No valid property data extracted - skipping injection")
            return combined_report

        # Insert property_data as the very first section
        new_combined_report = OrderedDict()
        new_combined_report['property_data'] = property_info
        
        # Add all other sections after property_data
        for key, value in combined_report.items():
            new_combined_report[key] = value
        return dict(new_combined_report)

    except Exception as e:
        logger.error(f"❌ Error injecting property data result: {str(e)}")
        logger.error(f"🔍 Traceback: {traceback.format_exc()}")
        logger.warning("⚠️ Continuing with original report data")
        return combined_report


def get_preferences(user_id: str) -> Dict:
    """Get user preferences by user_id"""
    try:
        preferences = UserPreferences.query.filter_by(user_id=user_id).first()
        if preferences:
            prefs_dict = preferences.to_dict()
            if not prefs_dict and 'report_section_priorities' in prefs_dict:
                logger.warning(f"⚠️ PREFERENCES: No report_section_priorities found in preferences for user_id {user_id}")
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
    
    return sections

def response_sort(report_responses: list, section_names: list) -> list:
    """
    Sort report responses to match the order of section_names with comprehensive error handling.
    
    Args:
        report_responses: List of parsed report response dictionaries
        section_names: List of section names in the desired order
        
    Returns:
        List of report responses sorted to match section_names order
        
    Raises:
        ValueError: If critical mismatches are detected that could indicate data corruption
    """
    
    if not report_responses:
        logger.error("❌ No report responses provided to response_sort")
        raise ValueError("Cannot sort empty response list")
    
    if not section_names:
        logger.error("❌ No section names provided to response_sort")
        raise ValueError("Cannot sort without section names reference")
        
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
        
        # Try to match this response to a section name
        matched = False
        for section_name in response_sections:
            if section_name in section_names:
                if section_name in response_map:
                    logger.warning(f"⚠️ Duplicate response for section '{section_name}' - keeping first occurrence")
                else:
                    response_map[section_name] = response
                matched = True
                break
        
        if not matched:
            logger.warning(f"⚠️ Response {i} with sections {response_sections} did not match any expected schema sections")
            unmatched_responses.append({"index": i, "sections": response_sections, "response": response})
    
    # Comprehensive analysis and error reporting
    expected_sections = set(section_names)
    found_sections = set(response_map.keys())
    missing_sections = expected_sections - found_sections
    unexpected_sections = all_response_sections - expected_sections
    
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
    
    # Add responses in section_names order
    for section_name in section_names:
        if section_name in response_map:
            sorted_responses.append(response_map[section_name])
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
    
    return sorted_responses

def _download_json_from_s3(file_path: str, address: str) -> Dict[str, Any]:
    """Download JSON report from S3."""
    try:
        from app.services.s3_service import s3_service
        from flask import current_app
        from io import BytesIO

        # Build JSON key
        if "/" in file_path:
            parts = file_path.split("/")
            # Expect: userId/reports/<type>/<filename>.pdf
            if len(parts) >= 4 and parts[1] == "reports":
                user_id = parts[0]
                report_type = parts[2]
                pdf_filename = parts[3]
                stem, ext = os.path.splitext(pdf_filename)
                json_key = f"{user_id}/json/{report_type}/{stem}.json"
            else:
                # Fallback: just swap extension
                stem, _ = os.path.splitext(file_path)
                json_key = f"{stem}.json"
        else:
            # Old flat structure fallback
            stem, _ = os.path.splitext(file_path)
            json_key = f"{stem}.json"

        # S3 client sanity
        if s3_service.s3_client is None:
            raise RuntimeError("S3 client not initialised")

        bucket_name = current_app.config.get("S3_BUCKET_NAME_PDFS")
        if not bucket_name:
            raise RuntimeError("S3_BUCKET_NAME_PDFS config missing")

        buf = BytesIO()
        s3_service.s3_client.download_fileobj(bucket_name, json_key, buf)
        buf.seek(0)
        raw = buf.read().decode("utf-8")

        return json.loads(raw)

    except Exception as e:
        logger.exception(f"❌ Failed to download JSON for {address}: {e}")
        raise

def _wait_for_report_completion(pdf_doc, address: str, max_wait_time: int = 600) -> Dict:
    """Wait for a report to complete generation and return the JSON data"""
    import time
    from app.models.pdf_document import PDFDocument
    from sqlalchemy.exc import OperationalError, DisconnectionError
    
    start_time = time.time()
        
    while time.time() - start_time < max_wait_time:
        # Refresh the database object with retry logic
        max_retries = 3
        retry_delay = 1  # Start with 1 second delay
        
        for attempt in range(max_retries):
            try:
                # Refresh the object from database
                db.session.refresh(pdf_doc)
                break  # Success, exit retry loop
            except (OperationalError, DisconnectionError) as e:
                logger.warning(f"🔄 DB refresh error on attempt {attempt + 1}/{max_retries}: {str(e)}")
                
                # Clean up session
                try:
                    db.session.rollback()
                    db.session.remove()
                except Exception:
                    pass
                
                # Dispose engine to force reconnection
                try:
                    db.engine.dispose()
                except Exception:
                    pass
                
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    logger.error(f"❌ Max retries exceeded for DB refresh")
                    raise
            except Exception as e:
                logger.error(f"❌ Non-connection error during DB refresh: {str(e)}")
                raise
        
        if pdf_doc.status in ['completed', 'processed']:
            # Add a small delay to ensure JSON upload has completed
            time.sleep(2)
            return _download_json_from_s3(pdf_doc.file_path, address)
        elif pdf_doc.status == 'error':
            logger.error(f"❌ Report generation failed for {address}")
            raise Exception(f"Report generation failed for {address}")
        
        # Wait 5 seconds before checking again
        time.sleep(5)
    
    # Timeout reached
    logger.error(f"⏰ Timeout waiting for report completion: {address}")
    raise Exception(f"Timeout waiting for report completion: {address}")


def _get_or_generate_report_json(address: str, user_id: int) -> Dict:
    """Get existing JSON report from S3 or generate a new one if it doesn't exist.
    
    This function ensures the report is fully generated before returning JSON data.
    For comparison reports, this guarantees both individual reports are ready.
    """
    try:        
        # Create a safe filename for S3 lookup
        safe_address = "".join(c for c in address if c.isalnum() or c in (' ', '-', '_')).rstrip().replace(' ', '_')
        filename = f"{uuid.uuid4().hex[:17]}_{safe_address}.pdf"
        # Try to find existing JSON report in S3
        from app.models.pdf_document import PDFDocument
        from app.models.user import User
        
        # Get user object from user_id (no HTTP context needed)
        user = User.query.get(user_id)
        if not user:
            raise Exception(f"User not found with ID: {user_id}")

        # Check if report is currently generating
        generating_report = PDFDocument.query.filter(
            PDFDocument.user_id == user_id,
            PDFDocument.primary_address == address,
            PDFDocument.report_type == 'detailed',
            PDFDocument.status == 'generating'
        ).first()
        
        if generating_report:
            return _wait_for_report_completion(generating_report, address)

        # Create new PDF document record with tree structure: userid/reports/standard/
        path = f"{user_id}/reports/standard/{filename}"
        pdf_doc = PDFDocument(
            id=str(uuid.uuid4()),
            user_id=user.id,
            filename=filename,
            file_path=path,
            status='generating',
            primary_address=address,
            report_type='detailed',
        )
        
        # Dispose engine before database operations for better reliability
        try:
            db.engine.dispose()
        except Exception as e:
            logger.warning(f"⚠️ Failed to dispose engine: {str(e)}")
        
        # Database operations with retry logic
        max_retries = 3
        retry_delay = 1
        
        for attempt in range(max_retries):
            try:
                db.session.add(pdf_doc)
                db.session.commit()
                break  # Success, exit retry loop
            except (OperationalError, DisconnectionError) as e:
                logger.warning(f"🔄 DB commit error on attempt {attempt + 1}/{max_retries}: {str(e)}")
                
                # Clean up session
                try:
                    db.session.rollback()
                    db.session.remove()
                except Exception:
                    pass
                
                # Dispose engine to force reconnection
                try:
                    db.engine.dispose()
                except Exception:
                    pass
                
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    logger.error(f"❌ Max retries exceeded for DB commit")
                    raise
            except Exception as e:
                logger.error(f"❌ Database error when creating PDF document: {str(e)}")
                try:
                    db.session.rollback()
                except Exception:
                    pass
                raise e
        
        # Start async task and wait for completion
        from app.celery.tasks import generate_report_async
        task = generate_report_async.delay(address, None, path, pdf_doc.id, user_id)
        
        # Wait for the report to complete and return JSON
        return _wait_for_report_completion(pdf_doc, address)

    except Exception as e:
        logger.error(f"❌ Failed to get or generate report JSON for {address}: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise e

# -------------------- MAIN FUNCTION --------------------

def generate_report(address: str, comparison_address: str, filename: str, user_id: str, marketing_model: bool = False) -> Dict:
    """Generate a comprehensive property report and upload PDF to S3"""
    task_id = str(uuid.uuid4())
    user_preferences = get_preferences(user_id)
    
    if not user_preferences:
        logger.error(f"❌ REPORT_GEN: No preferences found for user_id {user_id} - this will cause report generation to fail")
    
    # Extract report_section_priorities directly from user_preferences
    section_names = []
    if user_preferences and 'report_section_priorities' in user_preferences:
        section_names = user_preferences['report_section_priorities']
    else:
        # Default to all sections if no preferences found
        logger.error(f"❌ REPORT_GEN: No report_section_priorities found for user_id {user_id}")
        if user_preferences:
            logger.error(f"❌ REPORT_GEN: Available preference keys: {list(user_preferences.keys())}")
        else:
            logger.error(f"❌ REPORT_GEN: user_preferences is None for user_id {user_id}")
        raise Exception(f"No report_section_priorities found for user_id {user_id}")
    
    # Create report_customization dict for backward compatibility with existing code
    report_customization = {
        "report_section_priorities": section_names
    } if section_names else None
    
    # Override section_names for marketing model
    if marketing_model:
        section_names = ["marketing"]
    # Only auto-include demographics if neighborhood_overview exists and not comparing
    elif 'neighborhood_overview' in section_names and (not comparison_address or comparison_address == ""):

        if 'lifestyle_dna' not in section_names:
            section_names.insert(section_names.index('neighborhood_overview') + 1, 'lifestyle_dna')

    payloads = []
    property_data_future = None
    try:
        # Validate address
        if not validate_address(address):
            logger.error("🚫 Address validation failed")
            raise ValueError("Invalid address format")
        
        # Start async property data collection early in the process
        property_data_future = start_property_data_collection(address, user_id)
        
        if marketing_model:
            section_schema = get_individual_section_schema("marketing", user_preferences, mode="marketing")
            payload = {
                "model": "sonar-pro",
                "messages": [
                    {
                        "role": "system",
                    "content": (
                        f"You are a comprehensive PERSONALIZED Marketing report generator. Given an address, {address}, you must provide a detailed property report in valid JSON format.\n\n"

                        "RESEARCH:\n"
                        "Use the recommended sources first in research. If a decent answer is found, do not continue to search the web for that field\n"

                        "CITATIONS:\n"
                        "Do not include citations in the response\n"
                
                        "CRITICAL: Always provide a concrete answer, estimate, or educated guess.\n"
                    )
                }, {"role": "user", "content": f"Sell me the property at {address} CRITICAL: Never return 'N/A' for any fields. Always provide a concrete answer, estimate, or educated guess.\n"}
            ],
            "search_mode": "web",
            "reasoning_effort": "medium",
            "temperature": 0.1,
            "max_tokens": 4000,
            "stream": False,
            "return_images": False,
            "return_citations": False,
            "response_format": section_schema
        }
            payloads.append(payload)
        elif comparison_address is None or comparison_address == "":
            # Fix: Iterate over section_names which contains the list of sections to process
            for section_name in section_names:
                section_schema = get_individual_section_schema(section_name, user_preferences, mode="report")
                payload = {
                "model": "sonar-pro",
                "messages": [
                    {
                    "role": "system",
                    "content": (
                        f"You are a comprehensive PERSONALIZED property research assistant. Given an address, {address}, you must provide a detailed property report in valid JSON format.\n\n"
                       
                        "RESEARCH:\n"
                        "Use the recommended sources first in research. If a decent answer is found, do not continue to search the web for that field\n"

                        "CITATIONS:\n"
                        "Do not include citations in the response\n"
                    
                        "CRITICAL: Always provide a concrete answer, estimate, or educated guess.\n"

                    )
                }, {"role": "user", "content": f"Sell me the property at {address} CRITICAL: Always provide a concrete answer, estimate, or just give your best guess\n"}
            ],
            "search_mode": "web",
            "reasoning_effort": "medium",
            "temperature": 0.1,
            "max_tokens": 2500,
            "stream": False,
            "return_images": False,
            "return_citations": False,
            "response_format": section_schema
            }
                payloads.append(payload)
        else:
            primary_report_json = _get_or_generate_report_json(address, user_id)
            comparison_report_json = _get_or_generate_report_json(comparison_address, user_id)
            
            # Fix: Iterate over schema values, not keys (same fix as above)
            for section_name in section_names:
                section_schema = get_individual_section_schema(section_name, user_preferences, mode="comparison")
                payload = {
                    "model": "sonar-pro",
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a critical, strategic, and personalized PROPERTY COMPARISON EXPERT. "

                                "SCHEMA COMPLIANCE: You MUST follow the schema structure EXACTLY. Use the examples in the schema to determine how to structure your response.\n\n"
                            
                                "RESEARCH:\n"
                                "Use the provided address information for your deisions\n"
                               
                                "CITATIONS:\n"
                                "Do not include citations in the response\n"
                            
                                "CRITICAL: Always provide a concrete answer, estimate, or educated guess.\n"
                            )
                        },
                        {
                            "role": "user",
                            "content": (
                                f"Based on my priorities and user preferences, for each field, tell me which porperty is better, worse, or the same FOR ME:\n\n"
                                f"Property A ({address}):\n{json.dumps(primary_report_json, indent=2)}\n\n"
                                f"Property B ({comparison_address}):\n{json.dumps(comparison_report_json, indent=2)}"
                                "CRITICAL: Always provide a concrete answer, estimate, or just give your best guess.\n"
                            )
                        }
                    ],
                    "search_mode": "web",
                    "reasoning_effort": "medium",
                    "temperature": 0.1,
                    "max_tokens": 800,
                    "stream": False,
                    "return_images": False,
                    "return_citations": False,
                    "response_format": section_schema
                }
                payloads.append(payload)

        # Concurrent execution with partial failure handling
        import concurrent.futures
        
        def process_single_payload_with_retry(payload_info, max_retries=1):
            """Process a single payload with retry logic for timeouts and null responses"""
            payload, section_name = payload_info
            
            for attempt in range(max_retries + 1):  # 0, 1, 2 (total 3 attempts)
                attempt_num = attempt + 1
                
                try:

                    
                    # Validate payload is a dictionary
                    if not isinstance(payload, dict):
                        error_msg = f"Invalid payload type: expected dict, got {type(payload)}"
                        logger.error(f"❌ Section {section_name}: {error_safe_parse_json_msg}")
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
                                                        
                    start_time = time.perf_counter()
                    response = session.post(
                        "https://api.perplexity.ai/chat/completions",
                        headers=HEADERS,
                        json=payload,
                        timeout=300  # 5 minute timeout per section
                    )
                    
                    duration = time.perf_counter() - start_time
                    
                    # Check if request took longer than 5 minutes (300 seconds)
                    if duration > 300:
                        logger.warning(f"⏰ Section {section_name}: Request took {duration:.2f}s (>5min) on attempt {attempt_num}")
                        if attempt < max_retries:
                            continue
                        else:
                            logger.error(f"❌ Section {section_name}: Max retries reached after timeout")
                            return {"section": section_name, "success": False, "error": f"Request timeout after {max_retries + 1} attempts"}
                    
                    # Handle successful response
                    if response.status_code == 200:
                        try:
                            content = response.json()                            
                            # Validate response structure
                            if "choices" not in content or not content["choices"]:
                                logger.error(f"❌ Section {section_name}: Missing 'choices' in response on attempt {attempt_num}")
                                if attempt < max_retries:
                                    continue
                                return {"section": section_name, "success": False, "error": "Malformed API response after all retries"}
                            
                            # Extract and parse the response
                            raw_json_text = content["choices"][0]["message"]["content"]
                            
                            # Parse the JSON response
                            try:
                                report = _safe_parse_json(raw_json_text, report_customization)
                                # Check if the requested section exists and is not null
                                if section_name in report and report[section_name] is not None:
                                    section_data = {section_name: report[section_name]}
                                    return {"section": section_name, "success": True, "data": section_data}
                                # If section not found but we have data, wrap the entire response in the section name
                                elif report and len(report) > 0:
                                    # Wrap the entire response in the section name
                                    section_data = {section_name: report}
                                    return {"section": section_name, "success": True, "data": section_data}
                                else:
                                    logger.warning(f"⚠️ Section {section_name}: Requested section not found or null in response on attempt {attempt_num}")
                                    
                                    # Retry if we got null data and have retries left
                                    if attempt < max_retries:
                                        continue
                                    else:
                                        logger.error(f"❌ Section {section_name}: Still null/missing after {max_retries + 1} attempts")
                                        # Return empty section data to maintain structure
                                        
                                        
                            except Exception as pe:
                                logger.error(f"❌ Section {section_name}: Parse error on attempt {attempt_num}: {str(pe)}")
                                if attempt < max_retries:
                                    continue
                                return {"section": section_name, "success": False, "error": f"Parse error after all retries: {str(pe)}"}
                                
                        except json.JSONDecodeError as je:
                            logger.error(f"❌ Section {section_name}: JSON decode error on attempt {attempt_num}: {str(je)}")
                            if attempt < max_retries:
                                continue
                            return {"section": section_name, "success": False, "error": f"JSON decode error after all retries: {str(je)}"}
                    
                    # Handle API errors
                    else:
                        error_msg = f"API error {response.status_code} on attempt {attempt_num}"
                        full_error_details = ""
                        
                        try:
                            error_data = response.json()
                            if isinstance(error_data, dict):
                                # Log the complete error response for debugging
                                full_error_details = json.dumps(error_data, indent=2)
                                logger.error(f"🔍 Section {section_name}: Full API error response (attempt {attempt_num}):")
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
                        
                        # Retry on certain error codes
                        if response.status_code in [429, 500, 502, 503, 504] and attempt < max_retries:
                            time.sleep(2 ** attempt)  # Exponential backoff
                            continue
                        
                        return {"section": section_name, "success": False, "error": error_msg, "full_error": full_error_details}
                        
                except requests.exceptions.Timeout:
                    logger.error(f"❌ Section {section_name}: Request timeout on attempt {attempt_num}")
                    if attempt < max_retries:
                        continue
                    return {"section": section_name, "success": False, "error": "Request timeout after all retries"}
                except requests.exceptions.ConnectionError as ce:
                    logger.error(f"❌ Section {section_name}: Connection error on attempt {attempt_num}: {str(ce)}")
                    if attempt < max_retries:
                        time.sleep(2 ** attempt)  # Exponential backoff
                        continue
                    return {"section": section_name, "success": False, "error": f"Connection error after all retries: {str(ce)}"}
                except Exception as e:
                    logger.error(f"❌ Section {section_name}: Unexpected error on attempt {attempt_num}: {str(e)}")
                    if attempt < max_retries:
                        continue
                    return {"section": section_name, "success": False, "error": f"Unexpected error after all retries: {str(e)}"}
            
            # This should never be reached, but just in case
            return {"section": section_name, "success": False, "error": "Max retries exceeded"}
        
        # Alias for backward compatibility
        process_single_payload = process_single_payload_with_retry
        
        # Prepare payload info with section names
        payload_infos = []
        
        # Critical: Assert exact match between payloads and schema sections
        if len(payloads) != len(section_names):
            error_msg = f"CRITICAL MISMATCH: {len(payloads)} payloads vs {len(section_names)} schema sections"
            logger.error(f"❌ {error_msg}")
            logger.error(f"🔍 Payloads count: {len(payloads)}")
            logger.error(f"🔍 Schema sections: {section_names}")
            raise ValueError(error_msg)
        
        # Build payload_infos with exact 1:1 mapping
        for i, payload in enumerate(payloads):
            section_name = section_names[i]
            payload_infos.append((payload, section_name))
      
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
                    delay = random.uniform(8, 12)
                    time.sleep(delay)
                    
                    section_name = payload_info[1]
                    future = executor.submit(process_single_payload, payload_info)
                    futures.append(future)
                    future_to_section[future] = section_name
                                                    
                # Collect results as they complete
                for future in concurrent.futures.as_completed(futures):
                    section_name = future_to_section[future]
                    try:
                        result = future.result()
                        if result["success"]:
                            successful_responses.append(result["data"])
                        else:
                            failed_sections.append({"section": section_name, "error": result["error"]})
                            logger.warning(f"⚠️ Section {section_name}: Failed - {result['error']}")
                    except Exception as e:
                        failed_sections.append({"section": section_name, "error": str(e)})
                        logger.error(f"❌ Section {section_name}: Exception during result collection - {str(e)}")
        
        # Execute with staggered launch
        staggered_concurrent_execution(payload_infos)
        
        if failed_sections:
            logger.warning(f"⚠️ Failed sections details:")
            for failure in failed_sections:
                logger.warning(f"   - {failure['section']}: {failure['error']}")
        
        # Handle partial success - continue if we have at least some sections
        if successful_responses:
            report_responses = successful_responses
        else:
            logger.error(f"❌ All sections failed - cannot generate report")
            raise Exception(f"All {len(payload_infos)} sections failed to generate. No report data available.")
        
        # Sort responses to match schema order and combine them
        sorted_responses = response_sort(report_responses, section_names)
        
        # Combine all section responses into a single report with metadata
        combined_report = {}
        for response in sorted_responses:
            if isinstance(response, dict):
                combined_report.update(response)
        
        # Inject real age distribution data from Census API if neighborhood_overview exists
        combined_report = inject_real_age_distribution(combined_report, address)
        
        # Inject real property data from search endpoint if available (only for detailed reports)
        if property_data_future is not None and not marketing_model:
            combined_report = inject_property_data_result(combined_report, address, property_data_future)

        
        # Inject real population total data from Census API after things_to_watch_out_for
        if comparison_address == None or comparison_address == "":
            combined_report = inject_real_population_total(combined_report, address)
        
        # Log metadata for debugging (but don't include in return value)
        metadata = {
            "total_sections_requested": len(section_names),
            "successful_sections": len(successful_responses),
            "failed_sections": len(failed_sections),
            "generation_timestamp": time.time()
        }
        
        try:
            _create_pdf(combined_report, address, filename, comparison_address, user_preferences)
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