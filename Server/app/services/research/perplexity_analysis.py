"""
Perplexity API integration for property analysis.
Contains functions for analyzing properties using Perplexity Sonar Pro API.
"""
from typing import Dict, Any, Optional, List
import json
import logging
import os
import time
import concurrent.futures
import requests
from pydantic import BaseModel, Field
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

# Perplexity API configuration
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_HEADERS = {
    "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
    "Content-Type": "application/json",
} if PERPLEXITY_API_KEY else {}
PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions"
PERPLEXITY_MODEL = os.getenv("PERPLEXITY_MODEL", "sonar-pro")


# Pydantic models for structured response
class PropertyAnalysis(BaseModel):
    """Structured property analysis response from Perplexity Sonar Pro"""
    pros: List[str] = Field(description="2-5 key advantages of this property/location", min_items=2, max_items=5)
    cons: List[str] = Field(description="2-5 key disadvantages of this property/location", min_items=2, max_items=5)


def _safe_parse_json(s: str, default: Any = None) -> Any:
    """Safely parse JSON string with fallback."""
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        # Try to extract JSON block if wrapped in markdown
        if s.startswith('```json'):
            s = s.replace('```json', '').replace('```', '').strip()
        elif s.startswith('```'):
            s = s.replace('```', '').strip()
        try:
            return json.loads(s)
        except json.JSONDecodeError:
            # Try to extract the last {...} block
            start = s.find("{")
            end = s.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(s[start:end+1])
                except json.JSONDecodeError:
                    pass
        return default


def analyze_property_with_sonar_pro(user_preferences: Dict[str, Any], home_object: Dict[str, Any]) -> Optional[PropertyAnalysis]:
    """
    Analyze a property using Perplexity's Sonar Pro API based on user preferences.
    
    Args:
        user_preferences: User's preferences and profile information
        home_object: Property/home data object containing address, price, features, etc.
        
    Returns:
        PropertyAnalysis object with pros, cons
        Returns None if API key is not configured or request fails
    """
    if not PERPLEXITY_API_KEY:
        logger.error("Cannot analyze property: PERPLEXITY_API_KEY not configured")
        return None
    
    try:
        # Extract key information from home object
        address = home_object.get('address', 'Unknown address')
        price = home_object.get('price', home_object.get('listPrice', 'Unknown price'))
        bedrooms = home_object.get('bedrooms', home_object.get('beds', 'Unknown'))
        bathrooms = home_object.get('bathrooms', home_object.get('baths', 'Unknown'))
        sqft = home_object.get('livingArea', home_object.get('sqft', 'Unknown'))
        property_type = home_object.get('propertyType', home_object.get('homeType', 'Unknown'))
        
        # Extract user preferences for context
        budget_min = user_preferences.get('home_budget_min')
        budget_max = user_preferences.get('home_budget_max')
        if budget_min and budget_max:
            budget = f"${int(budget_min):,} - ${int(budget_max):,}"
        elif budget_max:
            budget = f"Up to ${int(budget_max):,}"
        else:
            budget = 'Not specified'
        occupation = user_preferences.get('occupation', 'Not specified')
        age = user_preferences.get('age', 'Not specified')
        important_locations = user_preferences.get('important_locations', [])
        preferred_features = user_preferences.get('preferred_home_features', [])
        deal_breakers = user_preferences.get('deal_breakers', [])
        
        # Format price with comma separator if numeric
        price_str = f"${int(price):,}" if isinstance(price, (int, float)) else str(price)
        
        # Build comprehensive prompt for Sonar Pro
        prompt = f"""
        Analyze this property for a potential buyer with the following profile and preferences:

        PROPERTY DETAILS:
        - Address: {address}
        - Price: {price_str}
        - Bedrooms: {bedrooms}
        - Bathrooms: {bathrooms}
        - Square Feet: {sqft}
        - Property Type: {property_type}

        BUYER PROFILE:
        - Budget: {budget}
        - Occupation: {occupation}
        - Age: {age}
        - Important Locations: {', '.join([loc.get('name', 'Unknown') for loc in important_locations]) if important_locations else 'None specified'}
        - Preferred Features: {', '.join(preferred_features) if preferred_features else 'None specified'}
        - Deal Breakers: {', '.join(deal_breakers) if deal_breakers else 'None specified'}

        Do not include any '*' characters or other special characters, besides '-' at the start of each bullet point.
        Do not include any inline citations, reference numbers, or source attributions in your response.

        Please provide a comprehensive analysis in the following JSON format:
        {{
            "pros": ["2-5 key advantages of this property/location based on buyer profile"],
            "cons": ["2-5 key disadvantages of this property/location based on buyer profile"],
            "neighborhood_overview": {{
                "description": "2-3 sentence overview of the neighborhood character, demographics, and general atmosphere",
                "vibe": "brief description of the neighborhood vibe/personality (e.g., trendy, family-friendly, artistic, professional, etc.)"
            }}
        }}

        Focus on current, accurate data from reliable sources. Consider the buyer's specific needs, budget, and preferences in your analysis.
        """

        # Prepare API payload
        payload = {
            "model": PERPLEXITY_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a real estate analysis expert. Provide accurate, data-driven property analysis using current market information and reliable sources. Always respond in valid JSON format."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            "max_tokens": 2000,
            "temperature": 0.1,
            "top_p": 0.9
        }

        # Make API request with retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:                
                response = requests.post(
                    PERPLEXITY_URL,
                    headers=PERPLEXITY_HEADERS,
                    json=payload,
                    timeout=60
                )
                
                if response.status_code == 200:
                    response_data = response.json()
                    content = response_data.get('choices', [{}])[0].get('message', {}).get('content', '')
                    
                    if not content:
                        logger.error("Empty content in Perplexity response")
                        if attempt < max_retries - 1:
                            continue
                        return None
                    
                    # Parse JSON response
                    try:
                        # Clean up response if it has markdown formatting
                        if content.startswith('```json'):
                            content = content.replace('```json', '').replace('```', '').strip()
                        elif content.startswith('```'):
                            content = content.replace('```', '').strip()
                        
                        analysis_data = json.loads(content)
                        
                        # Check specifically for neighborhood_overview
                        if not 'neighborhood_overview' in analysis_data:
                            logger.warning(f"⚠️ [PERPLEXITY] Missing neighborhood_overview in response")
                        
                        # Validate and create PropertyAnalysis object
                        property_analysis = PropertyAnalysis(**analysis_data)
                       
                        if not hasattr(property_analysis, 'neighborhood_overview'):
                            logger.warning(f"⚠️ [PROPERTY_ANALYSIS] neighborhood_overview missing from object")
                        
                        return property_analysis
                        
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse JSON response: {e}")
                        logger.error(f"Raw content: {content[:500]}...")
                        if attempt < max_retries - 1:
                            continue
                        return None
                    except Exception as e:
                        logger.error(f"Failed to create PropertyAnalysis object: {e}")
                        if attempt < max_retries - 1:
                            continue
                        return None
                
                else:
                    logger.error(f"Perplexity API error: HTTP {response.status_code}")
                    try:
                        error_data = response.json()
                        logger.error(f"Error details: {error_data}")
                    except:
                        logger.error(f"Error response: {response.text[:500]}")
                    
                    if attempt < max_retries - 1:
                        time.sleep(2 ** attempt)  # Exponential backoff
                        continue
                    return None
                    
            except requests.exceptions.RequestException as e:
                logger.error(f"Request exception: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                return None
            except Exception as e:
                logger.error(f"Unexpected error in property analysis: {e}")
                if attempt < max_retries - 1:
                    continue
                return None
        
        return None
        
    except Exception as e:
        logger.error(f"Failed to analyze property: {e}")
        return None


def generate_report_sections_for_property(
    section_names: List[str],
    address: str,
    user_preferences: Dict[str, Any],
    property_data: Dict[str, Any],
    recent_sections: Dict[str, Dict[str, Any]] = None,
    mode: str = "report"
) -> Dict[str, Any]:
    """
    Generate report sections for property analysis using smart schema generation.
    Checks recent database entries and user priorities to optimize what gets generated.
    
    Args:
        section_names: List of section names to generate (from report_section_priorities)
        address: Property address
        user_preferences: User preferences dict
        property_data: Property data from Zillow API
        recent_sections: Dict of recently generated sections with metadata (from last 2 weeks)
        mode: Schema mode ("report", "comparison", or "marketing")
        
    Returns:
        Dict containing all generated sections
    """
    if not section_names or not PERPLEXITY_API_KEY:
        return {}
    
    try:
        from app.services.research.schema_generator import get_individual_section_schema, synthesize_property_analysis_sections
        
        # Use section_names as priorities (ordered list)
        section_priorities = section_names
        
        # Build payloads for each section
        payloads = []
        for section_name in section_names:
            try:
                # Check if we should skip this section (if recent data exists and it's complete)
                if recent_sections and section_name in recent_sections:
                    recent_info = recent_sections[section_name]
                    recent_data = recent_info.get('data', {})
                    # Skip if recent data exists and section is not high priority
                    if isinstance(recent_data, dict) and recent_data:
                        priority_index = section_priorities.index(section_name) if section_name in section_priorities else 999
                        # Only skip if low priority and data looks complete
                        if priority_index >= 5 and len(recent_data) >= 3:
                            logger.info(f"⏭️ [PROPERTY_ANALYSIS] Skipping {section_name} (recent complete data exists, low priority)")
                            continue
                
                section_schema = get_individual_section_schema(
                    section_name, 
                    user_preferences, 
                    mode=mode,
                    recent_sections=recent_sections,
                    section_priorities=section_priorities
                )
                if "error" in section_schema:
                    logger.warning(f"⚠️ [PROPERTY_ANALYSIS] Skipping section {section_name}: {section_schema.get('error')}")
                    continue
                    
                payload = {
                    "model": PERPLEXITY_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                f"You are a comprehensive PERSONALIZED property research assistant. "
                                f"Given an address, {address}, you must provide a detailed property report in valid JSON format.\n\n"
                                "RESEARCH:\n"
                                "Use the recommended sources first in research. If a decent answer is found, do not continue to search the web for that field\n"
                                "CITATIONS:\n"
                                "Do not include citations in the response\n"
                                "STYLE & LENGTH:\n"
                                "Each individual section field must be EXTREMELY SHORT - maximum one brief phrase. Keep responses as concise as possible—prioritize brevity and precision.\n"
                                "SCORE FORMATTING:\n"
                                "All rating/score fields must be formatted as a decimal to the tenths place (e.g., 8.5, 7.2, 9.0) without any additional text like '/10'. The score should appear as the first part of the field value.\n"
                                "CRITICAL: Always provide a concrete answer, estimate, or educated guess.\n"
                            )
                        },
                        {
                            "role": "user",
                            "content": f"Analyze the property at {address} based on my preferences. CRITICAL: Always provide a concrete answer, estimate, or just give your best guess\n"
                        }
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
                payloads.append((payload, section_name))
            except Exception as e:
                logger.error(f"❌ [PROPERTY_ANALYSIS] Error building payload for section {section_name}: {e}")
                continue
        
        if not payloads:
            logger.warning("⚠️ [PROPERTY_ANALYSIS] No valid payloads generated")
            return {}
        
        # Process sections concurrently
        def process_section(payload_info, max_retries=1):
            """Process a single section with retry logic"""
            payload, section_name = payload_info
            
            for attempt in range(max_retries + 1):
                try:
                    session = requests.Session()
                    retries = Retry(
                        total=1,
                        backoff_factor=0.5,
                        status_forcelist=[429, 500, 502, 503, 504],
                        raise_on_status=False
                    )
                    session.mount("https://", HTTPAdapter(max_retries=retries))
                    
                    response = session.post(
                        PERPLEXITY_URL,
                        headers=PERPLEXITY_HEADERS,
                        json=payload,
                        timeout=300
                    )
                    
                    if response.status_code == 200:
                        content = response.json()
                        if "choices" not in content or not content["choices"]:
                            if attempt < max_retries:
                                continue
                            return {"section": section_name, "success": False, "error": "Malformed API response"}
                        
                        raw_json_text = content["choices"][0]["message"]["content"]
                        
                        try:
                            section_data = _safe_parse_json(raw_json_text, None)
                            if section_name in section_data and section_data[section_name] is not None:
                                return {"section": section_name, "success": True, "data": {section_name: section_data[section_name]}}
                            elif section_data and len(section_data) > 0:
                                return {"section": section_name, "success": True, "data": {section_name: section_data}}
                            else:
                                if attempt < max_retries:
                                    continue
                                return {"section": section_name, "success": False, "error": "Empty response"}
                        except Exception as pe:
                            if attempt < max_retries:
                                continue
                            return {"section": section_name, "success": False, "error": f"Parse error: {str(pe)}"}
                    else:
                        if attempt < max_retries and response.status_code in [429, 500, 502, 503, 504]:
                            time.sleep(2 ** attempt)
                            continue
                        return {"section": section_name, "success": False, "error": f"API error {response.status_code}"}
                        
                except requests.exceptions.Timeout:
                    if attempt < max_retries:
                        continue
                    return {"section": section_name, "success": False, "error": "Request timeout"}
                except Exception as e:
                    if attempt < max_retries:
                        continue
                    return {"section": section_name, "success": False, "error": f"Unexpected error: {str(e)}"}
            
            return {"section": section_name, "success": False, "error": "Max retries exceeded"}
        
        # Execute sections concurrently
        newly_generated_sections = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(payloads), 10)) as executor:
            futures = {executor.submit(process_section, payload_info): payload_info[1] for payload_info in payloads}
            
            for future in concurrent.futures.as_completed(futures):
                section_name = futures[future]
                try:
                    result = future.result()
                    if result["success"]:
                        newly_generated_sections.update(result["data"])
                    else:
                        logger.warning(f"⚠️ [PROPERTY_ANALYSIS] Section {section_name} failed: {result.get('error')}")
                except Exception as e:
                    logger.error(f"❌ [PROPERTY_ANALYSIS] Exception processing section {section_name}: {e}")
        
        # Synthesize newly generated sections with existing recent sections
        if recent_sections:
            synthesized = synthesize_property_analysis_sections(recent_sections, newly_generated_sections)
            logger.info(f"✅ [PROPERTY_ANALYSIS] Synthesized {len(synthesized)} sections (merged {len(newly_generated_sections)} new with {len(recent_sections)} existing)")
            return synthesized
        
        return newly_generated_sections
        
    except Exception as e:
        logger.error(f"❌ [PROPERTY_ANALYSIS] Error generating report sections: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {}
