"""
Perplexity API integration for property analysis.
Contains PropertyAnalysis model, _safe_parse_json, and analyze_property_with_sonar_pro.
Re-exports generate_report_sections_for_property and generate_report_sections_for_property_streaming.
"""

import json
import logging
import os
import time
from typing import Any

import requests
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_HEADERS = (
    {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json",
    }
    if PERPLEXITY_API_KEY
    else {}
)
PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions"
PERPLEXITY_MODEL = os.getenv("PERPLEXITY_MODEL", "sonar-pro")


class PropertyAnalysis(BaseModel):
    """Structured property analysis response from Perplexity Sonar Pro"""

    pros: list[str] = Field(
        description="2-5 key advantages of this property/location", min_length=2, max_length=5
    )
    cons: list[str] = Field(
        description="2-5 key disadvantages of this property/location", min_length=2, max_length=5
    )


def _safe_parse_json(s: str, default: Any = None) -> Any:
    """Safely parse JSON string with fallback."""
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        if s.startswith("```json"):
            s = s.replace("```json", "").replace("```", "").strip()
        elif s.startswith("```"):
            s = s.replace("```", "").strip()
        try:
            return json.loads(s)
        except json.JSONDecodeError:
            start = s.find("{")
            end = s.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(s[start : end + 1])
                except json.JSONDecodeError:
                    pass
        return default


def analyze_property_with_sonar_pro(
    user_preferences: dict[str, Any], home_object: dict[str, Any]
) -> PropertyAnalysis | None:
    """
    Analyze a property using Perplexity's Sonar Pro API based on user preferences.
    Returns PropertyAnalysis with pros, cons; or None if not configured or request fails.
    """
    if not PERPLEXITY_API_KEY:
        logger.error("Cannot analyze property: PERPLEXITY_API_KEY not configured")
        return None
    try:
        address = home_object.get("address", "Unknown address")
        price = home_object.get("price", home_object.get("listPrice", "Unknown price"))
        bedrooms = home_object.get("bedrooms", home_object.get("beds", "Unknown"))
        bathrooms = home_object.get("bathrooms", home_object.get("baths", "Unknown"))
        sqft = home_object.get("livingArea", home_object.get("sqft", "Unknown"))
        property_type = home_object.get("propertyType", home_object.get("homeType", "Unknown"))
        budget_min = user_preferences.get("home_budget_min")
        budget_max = user_preferences.get("home_budget_max")
        budget = (
            f"${int(budget_min):,} - ${int(budget_max):,}"
            if budget_min and budget_max
            else (f"Up to ${int(budget_max):,}" if budget_max else "Not specified")
        )
        age = user_preferences.get("age", "Not specified")
        important_locations = user_preferences.get("important_locations", [])
        preferred_features = user_preferences.get("preferred_home_features", [])
        deal_breakers = user_preferences.get("deal_breakers", [])
        price_str = f"${int(price):,}" if isinstance(price, int | float) else str(price)
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
        - Age: {age}
        - Important Locations: {", ".join([loc.get("name") or loc.get("address", "Unknown") for loc in important_locations]) if important_locations else "None specified"}
        - Preferred Features: {", ".join(preferred_features) if preferred_features else "None specified"}
        - Deal Breakers: {", ".join(deal_breakers) if deal_breakers else "None specified"}

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
        payload = {
            "model": PERPLEXITY_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a real estate analysis expert. Provide accurate, data-driven property analysis using current market information and reliable sources. Always respond in valid JSON format.",
                },
                {"role": "user", "content": prompt},
            ],
            "max_tokens": 2000,
            "temperature": 0.1,
            "top_p": 0.9,
        }
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    PERPLEXITY_URL, headers=PERPLEXITY_HEADERS, json=payload, timeout=60
                )
                if response.status_code == 200:
                    response_data = response.json()
                    content = (
                        response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    )
                    if not content:
                        if attempt < max_retries - 1:
                            continue
                        return None
                    if content.startswith("```json"):
                        content = content.replace("```json", "").replace("```", "").strip()
                    elif content.startswith("```"):
                        content = content.replace("```", "").strip()
                    analysis_data = json.loads(content)
                    return PropertyAnalysis(**analysis_data)
                if attempt < max_retries - 1:
                    time.sleep(2**attempt)
                    continue
                return None
            except requests.exceptions.RequestException:
                if attempt < max_retries - 1:
                    time.sleep(2**attempt)
                    continue
                return None
            except (json.JSONDecodeError, Exception):
                if attempt < max_retries - 1:
                    continue
                return None
        return None
    except Exception as e:
        logger.error("Failed to analyze property: %s", e)
        return None
