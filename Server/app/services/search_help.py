#!/usr/bin/env python3
"""
Extract a comma-separated list of normalized property features from a Zillow-style JSON.
Also provides property analysis using Perplexity Sonar Pro API.

Usage:
  python features.py listing.json
  cat listing.json | python features.py
"""

from __future__ import annotations
import sys, json, re, os, logging, time
from typing import Any, Dict, Iterable, List, Optional
import requests
from pydantic import BaseModel, Field
import os
from openai import OpenAI
import json
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
import math
import concurrent.futures
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

client = OpenAI(api_key=os.getenv("OPENAI_KEY"))

# Perplexity API configuration for report sections
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_HEADERS = {
    "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
    "Content-Type": "application/json",
} if PERPLEXITY_API_KEY else {}
PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions"
PERPLEXITY_MODEL = os.getenv("PERPLEXITY_MODEL", "sonar-pro")


def _safe_json_parse(s: str) -> Dict[str, Any]:
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        # Fallback: try to extract the last {...} block
        start = s.find("{")
        end = s.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(s[start:end+1])
            except json.JSONDecodeError:
                pass
        return {}

def extract_features_from_batch(image_batch: List[str], batch_num: int) -> List[str]:
    """
    Extract features from a batch of images using OpenAI vision API.
    """
    try:
        content = [
            {"type": "text", "text": (
                "You are a real estate feature spotter. "
                "From the following photos, list every visible home feature or amenity. "
                "Prefer concise nouns, e.g., 'in-ground pool', 'brick pizza oven', "
                "'swing set', 'solar panels', 'vaulted ceiling', 'granite countertops', "
                "'hardwood floors', 'two-car garage'. If unsure, omit. No hallucinations. "
                "Return strictly valid JSON with a top-level 'features' array of strings."
            )}
        ] + [{"type": "image_url", "image_url": {"url": url}} for url in image_batch]

        schema = {
            "name": "RawFeatureList",
            "schema": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "features": {
                        "type": "array",
                        "items": {"type": "string", "minLength": 1},
                        "description": "Flat list of short feature strings seen in the photos."
                    }
                },
                "required": ["features"]
            }
        }

        resp = client.chat.completions.create(
            model="gpt-4o-mini",  # vision-capable + cheap
            messages=[{"role": "user", "content": content}],
            response_format={"type": "json_schema", "json_schema": schema},
            max_tokens=600,
            temperature=0
        )

        content_str = resp.choices[0].message.content or "{}"
        data = _safe_json_parse(content_str)
        features = data.get("features", [])
        
        return features
        
    except Exception as e:
        logger.error(f"🔍 [BATCH {batch_num}] Error extracting features: {str(e)}")
        return []

def extract_features_from_images(image_urls: List[str]) -> List[str]:
    """
    Concurrently extract features from all images using multithreading.
    Returns a list of raw (possibly redundant) features.
    """
    if not image_urls:
        return []
    # Split images into batches of 5 for API efficiency (vision API works better with smaller batches)
    batch_size = 5
    batches = [image_urls[i:i + batch_size] for i in range(0, len(image_urls), batch_size)]
    total_batches = len(batches)
        
    all_features = []
    
    # Use ThreadPoolExecutor for concurrent processing
    with ThreadPoolExecutor(max_workers=min(8, total_batches)) as executor:
        # Submit all batch processing tasks
        future_to_batch = {
            executor.submit(extract_features_from_batch, batch, i + 1): i + 1 
            for i, batch in enumerate(batches)
        }
        
        # Collect results as they complete
        for future in as_completed(future_to_batch):
            batch_num = future_to_batch[future]
            try:
                batch_features = future.result()
                all_features.extend(batch_features)
            except Exception as e:
                logger.error(f"🔍 [BATCH {batch_num}] Failed with error: {str(e)}")
    
    return all_features

def normalize_and_dedupe_features(raw_features: List[str]) -> List[str]:
    """
    Polishing pass: use gpt-4o (text-only) to normalize synonyms and remove dupes.
    Returns a clean, deduplicated, consistently formatted list.
    """
    schema = {
        "name": "NormalizedFeatures",
        "schema": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "features": {
                    "type": "array",
                    "items": {"type": "string", "minLength": 1},
                    "description": "Canonical, deduplicated feature names (snake case avoided)."
                }
            },
            "required": ["features"]
        }
    }

    system = (
        "You normalize real estate features. "
        "Rules: (1) lowercase then Title Case; (2) singularize common nouns; "
        "(3) merge synonyms to common US real-estate terms "
        "(e.g., 'swing set' vs 'swingset' -> 'Swing Set', "
        "'pizza oven'/'brick oven' -> 'Brick Pizza Oven', "
        "'two car garage' -> 'Two-Car Garage'); "
        "(4) remove duplicates and near-duplicates; "
        "(5) keep high-signal terms only."
    )

    user = (
        "Normalize and dedupe these features. "
        "Return strictly valid JSON with a top-level 'features' array.\n\n"
        f"RAW FEATURES:\n{raw_features}"
    )

    resp = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_schema", "json_schema": schema},
        max_tokens=600,
        temperature=0
    )

    # ✅ FIX: use .content and json.loads (NOT .parsed)
    content_str = resp.choices[0].message.content or "{}"
    data = _safe_json_parse(content_str)
    return data.get("features", [])

def extract_and_clean_features(image_urls: List[str]) -> Dict[str, List[str]]:
    raw = extract_features_from_images(image_urls)
    clean = normalize_and_dedupe_features(raw) if raw else []
    return {"raw": raw, "clean": clean}


# Configure logging
logger = logging.getLogger(__name__)

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
   
def extract_property_features(listing: Dict[str, Any]) -> Dict[str, List[str]]:
    rf: Dict[str, Any] = (listing.get("resoFacts") or {}) if isinstance(listing, dict) else {}

    # Categorized features
    categories = {
        "Architectural Style": [],
        "Interior Features": [],
        "Exterior Features": [],
        "Systems & Utilities": [],
        "Rooms & Spaces": [],
        "Parking & Storage": [],
        "Outdoor Living": [],
        "Green & Efficiency": [],
        "Community Features": []
    }

    def add_to_category(category: str, raw: Optional[str]) -> None:
        v = str(raw or "").strip()
        if not v:
            return
        pretty = _prettify(v)
        if pretty not in categories[category]:
            categories[category].append(pretty)

    def add_each_to_category(category: str, vals: Optional[Iterable[Any]], transform=None) -> None:
        if not vals:
            return
        for val in vals:
            if val is None:
                continue
            s = str(val)
            processed = transform(s) if transform else s
            add_to_category(category, processed)

    # ---------- Description keyword mining ----------
    desc = str(listing.get("description") or "").lower()
    desc_hits: List[tuple[re.Pattern, str, str]] = [
        (re.compile(r"\bmid[-\s]?century\b"), "Mid-century modern", "Architectural Style"),
        (re.compile(r"\bopen[-\s]?concept\b"), "Open-concept layout", "Interior Features"),
        (re.compile(r"\bscreened[ -]?in\b.*\b(patio|porch)\b"), "Screened porch/patio", "Outdoor Living"),
        (re.compile(r"\bcovered\b.*\b(patio|porch)\b"), "Covered patio", "Outdoor Living"),
        (re.compile(r"\bfront porch\b"), "Front porch", "Outdoor Living"),
        (re.compile(r"\b(private|large)\s+back(yard)?\b"), "Private backyard", "Outdoor Living"),
        (re.compile(r"\bnew\b.*\bhvac\b"), "New HVAC", "Systems & Utilities"),
        (re.compile(r"\byoung\b.*\broof\b|\bnew(er)?\s+roof\b"), "Newer roof", "Exterior Features"),
        (re.compile(r"\bhot water heater\b"), "Newer water heater", "Systems & Utilities"),
        (re.compile(r"\bbeam(ed)? ceilings?\b"), "Beamed ceilings", "Interior Features"),
    ]
    for rx, feat, cat in desc_hits:
        if rx.search(desc):
            add_to_category(cat, feat)

    # ---------- Zillow "phrases" from homeInsights ----------
    try:
        insights = listing.get("homeInsights") or []
        phrases = []
        if insights and isinstance(insights, list):
            for block in insights:
                items = (block or {}).get("insights") or []
                for it in items:
                    phrases.extend((it or {}).get("phrases") or [])
        for phrase in phrases:
            clean_phrase = _keep_nice(phrase)
            # Categorize phrases based on content
            if any(word in clean_phrase.lower() for word in ['kitchen', 'bathroom', 'bedroom', 'living', 'dining', 'family room']):
                add_to_category("Rooms & Spaces", clean_phrase)
            elif any(word in clean_phrase.lower() for word in ['heating', 'cooling', 'hvac', 'plumbing', 'electrical']):
                add_to_category("Systems & Utilities", clean_phrase)
            elif any(word in clean_phrase.lower() for word in ['patio', 'deck', 'yard', 'garden', 'outdoor']):
                add_to_category("Outdoor Living", clean_phrase)
            else:
                add_to_category("Interior Features", clean_phrase)
    except Exception:
        pass

    # ---------- Core RESO facts ----------
    add_to_category("Architectural Style", rf.get("architecturalStyle"))

    # Materials → "... exterior"
    add_each_to_category("Exterior Features", rf.get("constructionMaterials"), lambda m: f"{_keep_nice(m)} exterior")

    # Interior
    add_each_to_category("Interior Features", rf.get("interiorFeatures"), _keep_nice)
    add_each_to_category("Interior Features", rf.get("flooring"), lambda f: f"{_keep_nice(f)} floors")

    # Fireplaces
    add_each_to_category("Interior Features", rf.get("fireplaceFeatures"), _keep_nice)
    if _is_num(rf.get("fireplaces")) and float(rf.get("fireplaces")) > 0:
        n = int(float(rf.get("fireplaces")))
        add_to_category("Interior Features", "1 fireplace" if n == 1 else f"{n} fireplaces")

    # Basement (can be comma-separated string)
    b = rf.get("basement")
    if b:
        parts = [p.strip() for p in str(b).split("/") for p in p.split(",")]
        for part in filter(None, parts):
            if re.search(r"crawl", part, re.I):
                add_to_category("Interior Features", "Crawl space")
            else:
                add_to_category("Interior Features", f"Basement: {_keep_nice(part)}")

    # Laundry
    add_each_to_category("Interior Features", rf.get("laundryFeatures"), lambda x: f"Laundry: {_keep_nice(x)}")

    # Patio / Porch normalization
    pp = [ _keep_nice(x) for x in (rf.get("patioAndPorchFeatures") or []) ]
    if pp:
        has_porch = any(re.search(r"porch", x, re.I) for x in pp)
        is_screened = any(re.search(r"screened", x, re.I) for x in pp)
        if has_porch and is_screened:
            add_to_category("Outdoor Living", "Screened porch")
            # also add any other distinct patio/porch items
            for x in pp:
                if not re.search(r"screened|porch", x, re.I):
                    add_to_category("Outdoor Living", x)
        else:
            for feature in pp:
                add_to_category("Outdoor Living", _keep_nice(feature))

    # Lot / exterior
    add_each_to_category("Outdoor Living", rf.get("lotFeatures"), _keep_nice)
    fenc = rf.get("fencing")
    if fenc:
        fenc_s = str(fenc)
        add_to_category("Outdoor Living", "Fenced back yard" if re.search(r"back", fenc_s, re.I) else f"Fencing: {_keep_nice(fenc_s)}")

    if rf.get("roofType"):
        add_to_category("Exterior Features", f"{_keep_nice(rf['roofType'])} roof")

    view = rf.get("view")
    if isinstance(view, list) and view:
        add_each_to_category("Outdoor Living", view, lambda v: f"{_keep_nice(v)} view")
    elif rf.get("hasView"):
        add_to_category("Outdoor Living", "View")

    # Water adjacency / view
    if listing.get("waterView") is True or (rf.get("waterViewYN") is True):
        add_to_category("Outdoor Living", "Water view")
    if rf.get("waterfrontFeatures"):
        add_to_category("Outdoor Living", f"Waterfront: {_keep_nice(rf['waterfrontFeatures'])}")

    # Systems
    add_each_to_category("Systems & Utilities", rf.get("heating"), lambda h: _normalize_hvac(h, "heat"))
    add_each_to_category("Systems & Utilities", rf.get("cooling"), lambda c: _normalize_hvac(c, "cool"))
    add_each_to_category("Systems & Utilities", rf.get("sewer"), lambda s: _normalize_sewer_water(s, "sewer"))
    add_each_to_category("Systems & Utilities", rf.get("waterSource"), lambda w: _normalize_sewer_water(w, "water"))

    # Rooms & features
    add_each_to_category("Rooms & Spaces", rf.get("roomTypes"), _keep_nice)
    rooms = rf.get("rooms")
    if isinstance(rooms, list):
        for r in rooms:
            if not isinstance(r, dict):
                continue
            if r.get("roomType"):
                add_to_category("Rooms & Spaces", _keep_nice(r["roomType"]))
            add_each_to_category("Rooms & Spaces", r.get("roomFeatures"), _keep_nice)
            if r.get("roomDescription"):
                add_to_category("Rooms & Spaces", _keep_nice(r["roomDescription"]))

    # Appliances
    add_each_to_category("Interior Features", rf.get("appliances"), _keep_nice)

    # Parking
    add_each_to_category("Parking & Storage", rf.get("parkingFeatures"), _keep_nice)
    if _is_num(rf.get("parkingCapacity")) and float(rf.get("parkingCapacity")) > 0:
        n = int(float(rf.get("parkingCapacity")))
        add_to_category("Parking & Storage", "Parking (1 space)" if n == 1 else f"Parking ({n} spaces)")

    if (rf.get("garageParkingCapacity") or 0) > 0: add_to_category("Parking & Storage", "Garage")
    if (rf.get("carportParkingCapacity") or 0) > 0: add_to_category("Parking & Storage", "Carport")
    if (rf.get("coveredParkingCapacity") or 0) > 0: add_to_category("Parking & Storage", "Covered parking")
    if (rf.get("openParkingCapacity") or 0) > 0 or rf.get("hasOpenParking"): add_to_category("Parking & Storage", "Open parking")
    if rf.get("hasAttachedGarage"): add_to_category("Parking & Storage", "Attached garage")

    # Boolean toggles (fallbacks)
    if rf.get("hasCooling"): add_to_category("Systems & Utilities", "Has cooling")
    if rf.get("hasHeating"): add_to_category("Systems & Utilities", "Has heating")
    if rf.get("hasFireplace"): add_to_category("Interior Features", "Fireplace")
    if rf.get("hasHomeWarranty"): add_to_category("Interior Features", "Home warranty")

    # Community / HOA
    add_each_to_category("Community Features", rf.get("communityFeatures"), _keep_nice)

    # Green / accessibility / security
    add_each_to_category("Green & Efficiency", rf.get("greenEnergyEfficient"), _keep_nice)
    add_each_to_category("Green & Efficiency", rf.get("greenEnergyGeneration"), _keep_nice)
    add_each_to_category("Green & Efficiency", rf.get("greenIndoorAirQuality"), _keep_nice)
    add_each_to_category("Green & Efficiency", rf.get("greenSustainability"), _keep_nice)
    add_each_to_category("Green & Efficiency", rf.get("greenWaterConservation"), _keep_nice)
    add_each_to_category("Interior Features", rf.get("accessibilityFeatures"), _keep_nice)
    add_each_to_category("Interior Features", rf.get("securityFeatures"), _keep_nice)

    # Property subtype / structure / type
    add_each_to_category("Architectural Style", rf.get("propertySubType"), _keep_nice)
    if listing.get("homeType"): add_to_category("Architectural Style", _keep_nice(listing["homeType"]))
    if listing.get("propertyTypeDimension"): add_to_category("Architectural Style", _keep_nice(listing["propertyTypeDimension"]))
    if rf.get("structureType"): add_to_category("Architectural Style", _keep_nice(rf["structureType"]))

    # Sort features within each category and remove empty categories
    sorted_categories = {}
    for category, feature_list in categories.items():
        if feature_list:
            sorted_categories[category] = sorted(list(set(feature_list)))  # Remove duplicates and sort
    
    return sorted_categories

# ----------------------------- Helpers -----------------------------

def _normalize_key(s: str) -> str:
    return (
        s.lower()
        .replace("_", " ")
        .replace("(", "")
        .replace(")", "")
        .replace(",", "")
        .replace(";", "")
        .replace(":", "")
        .strip()
    )

def _prettify(s: str) -> str:
    s = re.sub(r"_+", " ", s.strip())
    tokens = s.split()
    out: List[str] = []
    for t in tokens:
        if re.fullmatch(r"(hvac|ac|a/c|usb|led|ev|hoa)", t, re.I):
            out.append(t.upper())
        elif len(t) <= 3:
            out.append(t[:1].upper() + t[1:].lower())
        else:
            out.append(t[:1].upper() + t[1:])
    pretty = " ".join(out)
    pretty = re.sub(r"\bAnd\b", "and", pretty)
    pretty = re.sub(r"\bOn\b", "on", pretty)
    pretty = re.sub(r"\bOf\b", "of", pretty)
    return pretty

def _keep_nice(s: str) -> str:
    return _prettify(re.sub(r"\s{2,}", " ", str(s)).strip())

def _is_num(x: Any) -> bool:
    if isinstance(x, (int, float)):
        return True
    if isinstance(x, str) and x.strip():
        try:
            float(x)
            return True
        except ValueError:
            return False
    return False

def _normalize_hvac(val: str, kind: str) -> str:
    v = str(val).lower().strip()
    if kind == "cool":
        if re.search(r"\bcentral\b", v): return "Central air"
        if re.search(r"\bceiling fan", v): return "Ceiling fans"
        if re.search(r"\bwall\b|\bwindow\b", v): return "Wall/window AC"
        return _keep_nice(val)
    # heat
    if re.search(r"\bforced air\b", v): return "Forced air heat"
    if re.search(r"\bnatural gas\b", v): return "Natural gas heat"
    if re.search(r"\bheat pump\b", v): return "Heat pump"
    if re.search(r"\bradiant\b", v): return "Radiant heat"
    if re.search(r"\bbaseboard\b", v): return "Baseboard heat"
    return _keep_nice(val)

def _normalize_sewer_water(s: str, kind: str) -> str:
    t = s.lower()
    if kind == "sewer":
        return _keep_nice(s) if "sewer" in t else f"{_keep_nice(s)} sewer"
    return _keep_nice(s) if "water" in t else f"{_keep_nice(s)} water"

# ----------------------------- Property Analysis with Perplexity Sonar Pro -----------------------------

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
    property_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generate report sections for property analysis using the same logic as reports.
    
    Args:
        section_names: List of section names to generate (from report_section_priorities)
        address: Property address
        user_preferences: User preferences dict
        property_data: Property data from Zillow API
        
    Returns:
        Dict containing all generated sections
    """
    if not section_names or not PERPLEXITY_API_KEY:
        return {}
    
    try:
        from app.services.reportgen.schema_generator import get_individual_section_schema
        from app.services.reportgen.report_generator import _safe_parse_json
        
        # Build payloads for each section
        payloads = []
        for section_name in section_names:
            try:
                section_schema = get_individual_section_schema(section_name, user_preferences, mode="report")
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
        combined_sections = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(payloads), 10)) as executor:
            futures = {executor.submit(process_section, payload_info): payload_info[1] for payload_info in payloads}
            
            for future in concurrent.futures.as_completed(futures):
                section_name = futures[future]
                try:
                    result = future.result()
                    if result["success"]:
                        combined_sections.update(result["data"])
                    else:
                        logger.warning(f"⚠️ [PROPERTY_ANALYSIS] Section {section_name} failed: {result.get('error')}")
                except Exception as e:
                    logger.error(f"❌ [PROPERTY_ANALYSIS] Exception processing section {section_name}: {e}")
        
        return combined_sections
        
    except Exception as e:
        logger.error(f"❌ [PROPERTY_ANALYSIS] Error generating report sections: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {}

# ----------------------------- CLI -----------------------------

def _read_json_from_stdin_or_file() -> Dict[str, Any]:
    data = ""
    if not sys.stdin.isatty():
        data = sys.stdin.read().strip()
    if not data:
        if len(sys.argv) < 2:
            print("Provide a JSON file path or pipe JSON via stdin.", file=sys.stderr)
            sys.exit(1)
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            data = f.read()
    try:
        return json.loads(data)
    except json.JSONDecodeError as e:
        print(f"Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(2)
