import os
import json
import logging
import re
import uuid
import time
import traceback
from io import BytesIO
from typing import Dict, Optional

import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

# --- ReportLab (for placeholder PDF only) ---
try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
except Exception:  # pragma: no cover
    canvas = None
    letter = None

# If you have your own PDF module, keep this import.
# Expecting a function named `_create_pdf(data, address, filename, comparison_address=None, user_preferences=None)`
try:
    from .pdf import _pdf  # type: ignore
except Exception:
    _pdf = None  # we'll fall back to a placeholder if missing

# -------------------------------------------------
# Logging
# -------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -------------------------------------------------
# Perplexity API config
# -------------------------------------------------
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
if not PERPLEXITY_API_KEY:
    logger.critical("PERPLEXITY_API_KEY environment variable is not set.")
    raise ValueError("PERPLEXITY_API_KEY environment variable is not set")

HEADERS = {
    "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
    "Content-Type": "application/json",
}

PPLX_URL = "https://api.perplexity.ai/chat/completions"
PPLX_MODEL = os.getenv("PERPLEXITY_MODEL", "sonar-pro")

# -------------------------------------------------
# Utility: placeholder PDF
# -------------------------------------------------
def create_placeholder_pdf() -> bytes:
    if not canvas or not letter:
        return b"%PDF-1.4\n% placeholder\n"
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.drawString(72, 750, "Report is generating...")
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()

# -------------------------------------------------
# Utility: address validation
# -------------------------------------------------
def validate_address(address: str) -> bool:
    if not address or not isinstance(address, str):
        logger.error("❌ Address is empty or not a string")
        return False
    if len(address.strip()) == 0:
        logger.error("❌ Address is empty after stripping whitespace")
        return False
    return True

# -------------------------------------------------
# Utility: remove empty fields
# -------------------------------------------------
def _remove_empty_fields(obj):
    """
    Recursively remove fields that are None, empty strings, empty lists, or empty dicts.
    """
    if isinstance(obj, dict):
        return {k: _remove_empty_fields(v) for k, v in obj.items() 
                if v is not None and v != "" and v != [] and v != {}}
    elif isinstance(obj, list):
        return [_remove_empty_fields(item) for item in obj 
                if item is not None and item != "" and item != [] and item != {}]
    else:
        return obj

def _fix_object_placeholders(obj):
    """
    Recursively fix [object Object] placeholders and other problematic content.
    """
    if isinstance(obj, dict):
        return {k: _fix_object_placeholders(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        fixed_list = []
        for item in obj:
            if isinstance(item, str):
                # Remove [object Object] placeholders
                if item == "[object Object]" or item.strip() == "[object Object]":
                    continue  # Skip this item entirely
                # Fix other placeholder patterns
                item = item.replace("[object Object]", "").strip()
                if item:  # Only add non-empty items
                    fixed_list.append(item)
            else:
                fixed_item = _fix_object_placeholders(item)
                if fixed_item:  # Only add non-empty items
                    fixed_list.append(fixed_item)
        return fixed_list
    elif isinstance(obj, str):
        # Fix string placeholders
        if obj == "[object Object]" or obj.strip() == "[object Object]":
            return ""
        return obj.replace("[object Object]", "").strip()
    else:
        return obj

# -------------------------------------------------
# JSON parse w/ cleanup
# -------------------------------------------------
def _safe_parse_json(text: str, report_customization: Optional[dict] = None) -> dict:
    try:

        # strip think tags and smart quotes
        cleaned = re.sub(
            r"(<think>.*?</think>|&lt;think&gt;.*?&lt;/think&gt;)",
            "",
            text,
            flags=re.DOTALL | re.IGNORECASE,
        ).strip()
        cleaned = cleaned.replace("“", '"').replace("”", '"').replace("’", "'")
        # remove trailing commas before ] or }
        cleaned = re.sub(r",(\s*[}\]])", r"\1", cleaned)
        
        # Additional JSON cleaning for malformed strings
        # Fix unterminated strings by finding and closing them
        lines = cleaned.split('\n')
        fixed_lines = []
        
        for line in lines:
            # Fix lines with unterminated strings
            if '"' in line and line.count('"') % 2 != 0:
                # Odd number of quotes - likely unterminated string
                if line.strip().endswith(',') or line.strip().endswith('{') or line.strip().endswith('['):
                    # Add closing quote before comma/brace
                    line = re.sub(r'([^"]*"[^"]*)(,|\{|\[)\s*$', r'\1"\2', line)
                elif not line.strip().endswith('"'):
                    # Add closing quote at end
                    line = line.rstrip() + '"'
            fixed_lines.append(line)
        
        cleaned = '\n'.join(fixed_lines)
        
        # Remove any remaining malformed JSON patterns
        cleaned = re.sub(r'"\s*"\s*:', '"":', cleaned)  # Fix empty key patterns
        cleaned = re.sub(r':\s*"\s*"\s*,', ': "",', cleaned)  # Fix empty value patterns
        
        # Fix repetitive "buy", "sell" patterns that break JSON
        # This pattern occurs when AI generates malformed arrays with endless repetition
        cleaned = re.sub(r'("buy",\s*"sell",\s*){3,}("buy",?\s*)', r'"buy", "sell"', cleaned)
        cleaned = re.sub(r'("sell",\s*"buy",\s*){3,}("sell",?\s*)', r'"sell", "buy"', cleaned)
        
        # Remove trailing repetitive patterns at end of arrays
        cleaned = re.sub(r',\s*("buy",\s*"sell",?\s*)+\]', ']', cleaned)
        cleaned = re.sub(r',\s*("sell",\s*"buy",?\s*)+\]', ']', cleaned)

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"🛑 Failed to parse structured JSON: {e}")
            logger.error(f"🔍 Problematic JSON around character {e.pos}:")
            start = max(0, e.pos - 100)
            end = min(len(cleaned), e.pos + 100)
            logger.error(f"📝 Context: ...{cleaned[start:end]}...")
            logger.error("🧵 Traceback:\n%s", traceback.format_exc())
            
            # Try one more fix attempt - truncate at the error position and close JSON
            try:
                truncated = cleaned[:e.pos]
                # Count open braces/brackets and close them
                open_braces = truncated.count('{') - truncated.count('}')
                open_brackets = truncated.count('[') - truncated.count(']')
                
                # Remove any incomplete key-value pair at the end
                truncated = re.sub(r',\s*"[^"]*"?\s*$', '', truncated)
                truncated = re.sub(r',\s*$', '', truncated)
                
                # Close open structures
                for _ in range(open_brackets):
                    truncated += ']'
                for _ in range(open_braces):
                    truncated += '}'
                
                parsed = json.loads(truncated)
            except:
                raise ValueError("Failed to parse structured JSON from model output") from e

        parsed = _remove_empty_fields(parsed)
        parsed = _fix_object_placeholders(parsed)
        return parsed

    except Exception as e:
        logger.error(f"🛑 Failed to parse structured JSON: {e}")
        logger.error("🧵 Traceback:\n%s", traceback.format_exc())
        raise ValueError("Failed to parse structured JSON from model output") from e

# -------------------------------------------------
# Response format mapping for different section types
# -------------------------------------------------
def _response_format_for(section_type: str) -> dict:
    """
    Returns the appropriate response format schema for the given section_type.
    For 'strategy' type, uses the NegotiationStrategy model from strategy_model.py.
    """
    if section_type == "strategy" or section_type == "negotiation_strategy":
        try:
            from .strategy_model import NegotiationStrategy
            # Get the Pydantic model schema for structured response
            schema = NegotiationStrategy.model_json_schema()
            return {
                "type": "json_schema",
                "json_schema": {
                    "name": "negotiation_strategy",
                    "description": "A comprehensive negotiation strategy for real estate offers",
                    "schema": schema,
                    "strict": True
                }
            }
        except ImportError as e:
            logger.error(f"Failed to import strategy_model: {e}")
            # Fallback to basic JSON format
            return {"type": "json_object"}
    
    # Default fallback for other section types
    return {"type": "json_object"}

# -------------------------------------------------
# Simple single-call runner
# -------------------------------------------------
def _requests_session() -> requests.Session:
    session = requests.Session()
    retries = Retry(
        total=2,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
        raise_on_status=False,
    )
    session.mount("https://", HTTPAdapter(max_retries=retries))
    return session


def _build_payload(
    section_type: str,
    address: str,
    params: Optional[dict] = None,
    report_customization: Optional[dict] = None,
    user_preferences: Optional[dict] = None,
) -> dict:
    """
    Creates exactly ONE payload for the specified section_type.
    No multithreading, no multi-schema fanout.
    Enhanced for strategy generation with user preferences integration.
    """
    params = params or {}
    response_format = _response_format_for(section_type)

    # Enhanced system content for strategy generation
    if section_type == "strategy" or section_type == "negotiation_strategy":
        system_message = (
            f"You are an expert real estate negotiation strategist. "
            f"Generate a comprehensive negotiation strategy for the property at {address}. "
            "Focus on practical, actionable advice with comp-based rationale and seller pain point leverage. "
            "\n\nCRITICAL REQUIREMENTS:\n"
            "1. COMP-BASED OPENING RATIONALE: Reference specific comparable sales data (e.g., 'Comps in original condition within 0.5 miles sold $515k-$540k, supporting this opening'). "
            "2. SELLER PAIN POINT CONCESSIONS: Tie each concession directly to seller pain points with give-to-get logic (e.g., 'If seller covers demo permit fees, buyer closes in 30 days'). "
            "3. AGGRESSIVE HOLDING COST LEVERAGE: Work holding costs into negotiation sequence - 'Every 30 days costs seller ~$5k, use after round one to pressure acceptance'. "
            "4. ACTIONABLE URGENCY STRATEGY: Clear actions like 'Slow-play negotiations to increase holding cost pressure' or 'Accelerate timeline to close before year-end'. "
            "5. CONDITION TOLERANCE CLARITY: Specify repair tolerance and credit expectations based on buyer's renovation preference. "
            "6. FIELD CONSOLIDATION: Remove empty/placeholder fields, merge duplicates, consolidate market data into bullet points. "
            "\n\nIMPORTANT: Return ONLY valid, well-formed JSON. Ensure all strings are properly quoted and terminated. "
            "No markdown, no prose, no truncated strings—complete, valid JSON object only. "
            "Keep field values concise to avoid JSON parsing issues. Use simple strings instead of complex nested structures where possible."
        )
        
        # Enhanced user content with preferences and property data integration
        user_preferences_text = ""
        property_data_text = ""
        commute_data_text = ""
        property_analysis_text = ""
        
        if user_preferences:
            # Extract key preferences for strategy personalization
            budget_min = user_preferences.get('home_budget_min')
            budget_max = user_preferences.get('home_budget_max')
            
            # Store numeric budget for calculations
            budget_numeric = budget_max if budget_max else 0
            
            # Format budget string for display
            if budget_min and budget_max:
                budget = f"${int(budget_min):,} - ${int(budget_max):,}"
            elif budget_max:
                budget = f"Up to ${int(budget_max):,}"
            else:
                budget = 'Not specified'
                
            financing = user_preferences.get('financing_preference', 'conventional')
            timeline = user_preferences.get('desired_closing_date', 'flexible')
            priorities = user_preferences.get('preferred_home_features', [])
            
            # Enhanced buyer profile with urgency and leverage analysis
            search_stage = user_preferences.get('property_search_stage', 'actively_searching') or 'actively_searching'
            experience = user_preferences.get('home_buying_experience', 'first_time') or 'first_time'
            down_payment = user_preferences.get('down_payment', 0) or 0
            credit_score = user_preferences.get('credit_score_range', 'good') or 'good'
            
            # Ensure all values are not None
            financing = financing or 'conventional'
            timeline = timeline or 'flexible'
            
            # Determine buyer urgency level for strategy
            urgency_level = 'moderate'
            if search_stage == 'ready_to_buy':
                urgency_level = 'high'
            elif search_stage == 'just_looking':
                urgency_level = 'low'
            
            # Calculate down payment percentage
            down_payment_pct = 'Unknown'
            if isinstance(down_payment, (int, float)) and down_payment > 0 and budget_numeric > 0:
                down_payment_pct = f"{int((down_payment/budget_numeric)*100)}%"
            
            # Format down payment display
            down_payment_display = f"${down_payment:,.0f}" if isinstance(down_payment, (int, float)) else "Not specified"
            
            user_preferences_text = f"""
            
Buyer Profile & Strategy Context:
- Budget: {budget}
- Financing: {financing} 
- Experience: {experience}
- Down Payment: {down_payment_display} ({down_payment_pct} down)
- Credit Score: {credit_score}
- Search Stage: {search_stage}
- URGENCY LEVEL: {urgency_level} (low = slow-play for concessions, high = accelerate timeline)
- Renovation Preference: {user_preferences.get('renovation_preference', 'minor') or 'minor'} (affects condition tolerance)
- Key Priorities: {', '.join(priorities) if priorities else 'Not specified'}
"""
        
        # Include detailed property data if available
        if params.get('property_data'):
            property_data = params['property_data']
            price = property_data.get('price', property_data.get('listPrice', 'Not available'))
            bedrooms = property_data.get('bedrooms', property_data.get('beds', 'Not available'))
            bathrooms = property_data.get('bathrooms', property_data.get('baths', 'Not available'))
            sqft = property_data.get('livingArea', property_data.get('sqft', 'Not available'))
            property_type = property_data.get('propertyType', property_data.get('homeType', 'Not available'))
            listing_status = property_data.get('listingStatus', 'Not available')
            lot_size = property_data.get('lotAreaValue', 'Not available')
            
            # Enhanced property analysis with seller motivation indicators
            days_on_market = property_data.get('daysOnMarket', property_data.get('dom', 'Unknown'))
            price_history = property_data.get('priceHistory', [])
            price_reductions = len([p for p in price_history if p.get('event') == 'Price reduction']) if price_history else 0
            
            # Calculate estimated monthly holding costs for leverage analysis
            estimated_monthly_costs = 'Unknown'
            if isinstance(price, (int, float)):
                # Rough estimate: 0.5-1% of home value per month (mortgage, taxes, insurance, maintenance)
                estimated_monthly_costs = f"${int(price * 0.007):,} - ${int(price * 0.012):,}"
            
            property_data_text = f"""

Property Details & Seller Leverage Analysis:
- List Price: ${price:,} if isinstance(price, (int, float)) else price
- Days on Market: {days_on_market} {'(LEVERAGE: Extended DOM suggests seller urgency)' if isinstance(days_on_market, int) and days_on_market > 60 else ''}
- Price Reductions: {price_reductions} {'(LEVERAGE: Multiple cuts indicate motivated seller)' if price_reductions > 1 else ''}
- Estimated Monthly Holding Costs: {estimated_monthly_costs}
- Bedrooms: {bedrooms} | Bathrooms: {bathrooms} | Sq Ft: {sqft:,} if isinstance(sqft, (int, float)) else sqft
- Property Type: {property_type} {'(LEVERAGE: Tear-down potential = price flexibility)' if 'tear' in str(property_type).lower() else ''}
- Listing Status: {listing_status}
- Lot Size: {lot_size}
"""
        
        # Include commute data if available
        if params.get('commute_data'):
            commute_data = params['commute_data']
            travel_times = commute_data.get('travel_times', [])
            if travel_times:
                commute_info = []
                for travel in travel_times:
                    name = travel.get('name', 'Location')
                    time = travel.get('travel_time', 'Unknown')
                    tolerance = travel.get('commute_tolerance', 30)
                    status = "✅ Within tolerance" if isinstance(time, str) and "min" in time and int(time.split()[0]) <= tolerance else "⚠️ May exceed tolerance"
                    commute_info.append(f"  - {name}: {time} ({status})")
                
                commute_data_text = f"""

Commute Analysis:
{chr(10).join(commute_info)}
"""
        
        # Include property analysis if available
        if params.get('property_analysis'):
            analysis = params['property_analysis']
            pros = analysis.get('pros', [])
            cons = analysis.get('cons', [])
            neighborhood = analysis.get('neighborhood_overview', '')
            crime_stats = analysis.get('crime_stats', '')
            gentrification = analysis.get('gentrification_index', '')
            roi = analysis.get('roi_explanation', '')
            
            property_analysis_text = f"""

Property Analysis:
- Pros: {', '.join(pros) if pros else 'Not available'}
- Cons: {', '.join(cons) if cons else 'Not available'}
- Neighborhood: {neighborhood[:200] + '...' if len(neighborhood) > 200 else neighborhood}
- Crime Stats: {crime_stats}
- Gentrification Index: {gentrification}
- ROI Potential: {roi[:200] + '...' if len(roi) > 200 else roi}
"""
        
        user_content = f"""
Generate a negotiation strategy for: {address}

{user_preferences_text}
{property_data_text}
{commute_data_text}
{property_analysis_text}

CRITICAL: Provide strategy with these specific improvements:
1. COMP-BASED OPENING: Reference specific comparable sales in opening offer rationale
2. SELLER PAIN POINT CONCESSIONS: Link each concession to seller pain points with clear give-to-get value
3. HOLDING COST SEQUENCE: Specify how to use holding costs in negotiation rounds (not just opening)
4. ACTIONABLE URGENCY: Clear strategy like 'slow-play' or 'accelerate timeline' based on buyer urgency
5. CONDITION TOLERANCE: Specific repair tolerance based on renovation preference
6. CONSOLIDATED FIELDS: No empty/placeholder fields, merge duplicates, bullet-point market data

IMPORTANT JSON REQUIREMENTS:
- Keep all array values SHORT and DESCRIPTIVE (max 100 chars per item)
- NO repetitive patterns like 'buy, sell, buy, sell'
- Use meaningful strings like 'Waive inspection for $5k credit' instead of generic terms
- Limit arrays to 3-5 items maximum to prevent JSON bloat
- All field values must be complete, well-formed strings

Ensure all fields are populated with specific, actionable content. Remove any '[object Object]' or 'No data' placeholders.
"""
        
        # Increase token limit for comprehensive strategy
        max_tokens = params.get("max_tokens", 3000)
        temperature = params.get("temperature", 0.2)  # Slightly higher for creativity
        
    else:
        # Default system content for other section types
        system_message = (
            f"You are an expert real estate analyst. Generate a detailed {section_type} for the property at {address}. Focus on practical insights and actionable recommendations with specific data and clear rationale. Return ONLY valid JSON matching the provided response_format schema. Avoid empty fields and placeholder content."
            "\n\nNo markdown, no prose—structured JSON object only."
        )
        
        # Default user content
        user_content = (
            f"Generate the '{section_type}' object for the property at {address}. "
            "Fill reasonable defaults if unspecified. Return valid JSON only."
        )
        
        max_tokens = params.get("max_tokens", 1500)
        temperature = params.get("temperature", 0.1)

    payload = {
        "model": PPLX_MODEL,
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_content}
        ],
        "response_format": response_format,
        "temperature": params.get("temperature", 0.3),
        "max_tokens": max_tokens,
    }

    return payload

# -------------------------------------------------
# PDF wrapper (call your existing _pdf if present)
# -------------------------------------------------
def _render_pdf_or_placeholder(
    data: dict,
    address: str,
    filename: str,
):
    """
    Tries to call your existing _pdf function; falls back to placeholder.
    """
    if _pdf and callable(_pdf):
        try:
            # The _pdf function expects (report, address, filename, title)
            title = f"Offer Document - {filename}"
            _pdf(data, address, filename, title)  # type: ignore
            return True
        except Exception as e:
            logger.error("❌ _pdf generation failed: %s", str(e))
            logger.error("📋 Traceback: %s", traceback.format_exc())
            # fall through to placeholder
    
    # Generate placeholder PDF as fallback
    placeholder_content = create_placeholder_pdf()

    return False

# -------------------------------------------------
# Public: generate_report (single section)
# -------------------------------------------------
def generate_report(
    section_type: str,
    address: str,
    filename: str,
    user_id: str,
    *,
    params: Optional[dict] = None,
    report_customization: Optional[dict] = None,
    comparison_address: Optional[str] = None,
    user_preferences: Optional[dict] = None,
    max_retries: int = 2,
) -> Dict:
    """
    Generate a SINGLE section (by section_type) using a SINGLE Perplexity call.
    No multithreading. No multi-schema fanout. Clean JSON parsing with retries.
    Returns the parsed JSON (and attempts PDF render via your _pdf hook).
    """
    task_id = str(uuid.uuid4())
    section_name = section_type  # alias used in logs

    if not validate_address(address):
        raise ValueError("Invalid address")

    payload = _build_payload(
        section_type, 
        address, 
        params=params, 
        report_customization=report_customization,
        user_preferences=user_preferences
    )
    session = _requests_session()

    last_error = None
    for attempt in range(max_retries + 1):
        attempt_num = attempt + 1
        start_time = time.perf_counter()
        try:
            resp = session.post(PPLX_URL, headers=HEADERS, json=payload, timeout=300)
        except Exception as e:
            duration = time.perf_counter() - start_time
            last_error = f"Request error: {e}"
            logger.error(f"❌ {section_name}: {last_error} ({duration:.2f}s)")
            if attempt < max_retries:
                continue
            raise

        duration = time.perf_counter() - start_time

        if resp.status_code != 200:
            # try to expose Perplexity error details
            err = f"API error {resp.status_code}"
            try:
                ed = resp.json()
                rid = ed.get("request_id") or ed.get("error", {}).get("request_id")
                msg = ed.get("error", {}).get("message") or ed.get("message")
                if rid:
                    err += f" (Request ID: {rid})"
                if msg:
                    err += f" - {msg}"
                logger.error("🔍 API error details: %s", json.dumps(ed, indent=2))
            except Exception:
                logger.error("🔍 Non-JSON error response: %s", resp.text[:1000])
            last_error = err
            if attempt < max_retries:
                continue
            raise RuntimeError(err)

        # Success path
        try:
            content = resp.json()
        except Exception as e:
            last_error = f"JSON decode error: {e}"
            logger.error(f"❌ {section_name}: {last_error}")
            if attempt < max_retries:
                continue
            raise

        # Validate response structure
        if "choices" not in content or not content["choices"]:
            last_error = "Malformed API response: missing 'choices'"
            logger.error(f"❌ {section_name}: {last_error}")
            if attempt < max_retries:
                continue
            raise RuntimeError(last_error)

        raw = content["choices"][0]["message"]["content"]

        try:
            parsed = _safe_parse_json(raw, report_customization)
        except Exception as pe:
            last_error = f"Parse error: {pe}"
            logger.error(f"❌ {section_name}: {last_error}")
            if attempt < max_retries:
                continue
            raise

        # Render PDF (best-effort)
        try:
            _render_pdf_or_placeholder(parsed, address, filename)
        except Exception as pdf_e:
            # Non-fatal for the JSON generation path
            logger.error(f"⚠️ PDF generation failed (non-fatal): {pdf_e}")

        return {"task_id": task_id, "section": section_type, "success": True, "data": parsed}

    # Should not reach here
    raise RuntimeError(last_error or "Unknown error during report generation")
