"""
Perplexity API payload construction for research report section generation.
"""

from logger import log


def _response_format_for(section_type: str) -> dict:
    """
    Returns the appropriate response format schema for the given section_type.
    For 'strategy' type, uses the NegotiationStrategy model from strategy_model if available.
    """
    if section_type == "strategy" or section_type == "negotiation_strategy":
        try:
            from .strategy_model import NegotiationStrategy  # type: ignore

            schema = NegotiationStrategy.model_json_schema()
            return {
                "type": "json_schema",
                "json_schema": {
                    "name": "negotiation_strategy",
                    "description": "A comprehensive negotiation strategy for real estate offers",
                    "schema": schema,
                    "strict": True,
                },
            }
        except ImportError as e:
            log.error("PROPERTY_DETAILS", "Failed to import strategy_model", {"error": str(e)})
            return {"type": "json_object"}
    return {"type": "json_object"}


def build_payload(
    section_type: str,
    address: str,
    pplx_model: str,
    params: dict | None = None,
    report_customization: dict | None = None,
    user_preferences: dict | None = None,
) -> dict:
    """
    Creates exactly ONE payload for the specified section_type.
    Supports strategy/negotiation_strategy and default section types.
    """
    params = params or {}
    response_format = _response_format_for(section_type)

    if section_type == "strategy" or section_type == "negotiation_strategy":
        system_message = (
            f"You are an expert real estate negotiation strategist. "
            f"Generate a comprehensive negotiation strategy for the property at {address}. "
            "Focus on practical, actionable advice with comp-based rationale and seller pain point leverage. "
            "\n\nCRITICAL REQUIREMENTS:\n"
            "1. DETAILED COMP-BASED OPENING RATIONALE: Create sophisticated price rationale that references specific comparable properties with detailed comparisons. Include:\n"
            "   - Specific addresses and sale prices of comparable properties\n"
            "   - Detailed property comparisons (bedrooms, bathrooms, square footage differences)\n"
            "   - Price positioning analysis (above/below/within comp range)\n"
            "   - Market rationale supporting the opening offer amount\n"
            "   Example: 'Opening at $525,000 based on detailed comparable analysis: 123 Main St sold $540,000 (+1 bed, +200 sqft), 456 Oak Ave sold $510,000 (-1 bath, -150 sqft). This positioning at $525,000 represents competitive pricing within the $510k-$540k comp range.'\n"
            "2. SELLER PAIN POINT CONCESSIONS: Tie each concession directly to seller pain points with give-to-get logic (e.g., 'If seller covers demo permit fees, buyer closes in 30 days'). "
            "3. AGGRESSIVE HOLDING COST LEVERAGE: Work holding costs into negotiation sequence - 'Every 30 days costs seller ~$5k, use after round one to pressure acceptance'. "
            "4. ACTIONABLE URGENCY STRATEGY: Clear actions like 'Slow-play negotiations to increase holding cost pressure' or 'Accelerate timeline to close before year-end'. "
            "5. CONDITION TOLERANCE CLARITY: Specify repair tolerance and credit expectations based on buyer's renovation preference. "
            "6. FIELD CONSOLIDATION: Remove empty/placeholder fields, merge duplicates, consolidate market data into bullet points. "
            "\n\nIMPORTANT: Return ONLY valid, well-formed JSON. Ensure all strings are properly quoted and terminated. "
            "No markdown, no prose, no truncated strings—complete, valid JSON object only. "
            "Keep field values concise to avoid JSON parsing issues. Use simple strings instead of complex nested structures where possible."
        )
        user_preferences_text = ""
        property_data_text = ""
        commute_data_text = ""
        property_analysis_text = ""

        if user_preferences:
            budget_min = user_preferences.get("home_budget_min")
            budget_max = user_preferences.get("home_budget_max")
            budget_numeric = budget_max if budget_max else 0
            if budget_min and budget_max:
                budget = f"${int(budget_min):,} - ${int(budget_max):,}"
            elif budget_max:
                budget = f"Up to ${int(budget_max):,}"
            else:
                budget = "Not specified"
            financing = (
                user_preferences.get("financing_preference", "conventional") or "conventional"
            )
            priorities = user_preferences.get("preferred_home_features", [])
            search_stage = (
                user_preferences.get("property_search_stage", "actively_searching")
                or "actively_searching"
            )
            experience = (
                user_preferences.get("home_buying_experience", "first_time") or "first_time"
            )
            down_payment = user_preferences.get("down_payment", 0) or 0
            credit_score = user_preferences.get("credit_score_range", "good") or "good"
            urgency_level = "moderate"
            if search_stage == "ready_to_buy":
                urgency_level = "high"
            elif search_stage == "just_looking":
                urgency_level = "low"
            down_payment_pct = "Unknown"
            if isinstance(down_payment, int | float) and down_payment > 0 and budget_numeric > 0:
                down_payment_pct = f"{int((down_payment / budget_numeric) * 100)}%"
            down_payment_display = (
                f"${down_payment:,.0f}"
                if isinstance(down_payment, int | float)
                else "Not specified"
            )
            user_preferences_text = f"""
Buyer Profile & Strategy Context:
- Budget: {budget}
- Financing: {financing}
- Experience: {experience}
- Down Payment: {down_payment_display} ({down_payment_pct} down)
- Credit Score: {credit_score}
- Search Stage: {search_stage}
- URGENCY LEVEL: {urgency_level} (low = slow-play for concessions, high = accelerate timeline)
- Renovation Preference: {user_preferences.get("renovation_preference", "minor") or "minor"} (affects condition tolerance)
- Key Priorities: {", ".join(priorities) if priorities else "Not specified"}
"""

        if params.get("property_data"):
            property_data = params["property_data"]
            price = property_data.get("price", property_data.get("listPrice", "Not available"))
            bedrooms = property_data.get("bedrooms", property_data.get("beds", "Not available"))
            bathrooms = property_data.get("bathrooms", property_data.get("baths", "Not available"))
            sqft = property_data.get("livingArea", property_data.get("sqft", "Not available"))
            property_type = property_data.get(
                "propertyType", property_data.get("homeType", "Not available")
            )
            listing_status = property_data.get("listingStatus", "Not available")
            lot_size = property_data.get("lotAreaValue", "Not available")
            days_on_market = property_data.get("daysOnMarket", property_data.get("dom", "Unknown"))
            price_history = property_data.get("priceHistory", [])
            price_reductions = (
                len([p for p in price_history if p.get("event") == "Price reduction"])
                if price_history
                else 0
            )
            estimated_monthly_costs = "Unknown"
            if isinstance(price, int | float):
                estimated_monthly_costs = f"${int(price * 0.007):,} - ${int(price * 0.012):,}"
            sqft_fmt = f"{sqft:,}" if isinstance(sqft, int | float) else sqft
            price_fmt = f"${price:,}" if isinstance(price, int | float) else price
            dom_note = (
                " (LEVERAGE: Extended DOM suggests seller urgency)"
                if isinstance(days_on_market, int) and days_on_market > 60
                else ""
            )
            reductions_note = (
                " (LEVERAGE: Multiple cuts indicate motivated seller)"
                if price_reductions > 1
                else ""
            )
            tear_note = (
                " (LEVERAGE: Tear-down potential = price flexibility)"
                if "tear" in str(property_type).lower()
                else ""
            )
            property_data_text = f"""
Property Details & Seller Leverage Analysis:
- List Price: {price_fmt}
- Days on Market: {days_on_market}{dom_note}
- Price Reductions: {price_reductions}{reductions_note}
- Estimated Monthly Holding Costs: {estimated_monthly_costs}
- Bedrooms: {bedrooms} | Bathrooms: {bathrooms} | Sq Ft: {sqft_fmt}
- Property Type: {property_type}{tear_note}
- Listing Status: {listing_status}
- Lot Size: {lot_size}
"""

        if params.get("commute_data"):
            commute_data = params["commute_data"]
            travel_times = commute_data.get("travel_times", [])
            if travel_times:
                commute_info = []
                for travel in travel_times:
                    name = travel.get("name", "Location")
                    time_val = travel.get("travel_time", "Unknown")
                    tolerance = travel.get("commute_tolerance", 30)
                    status = (
                        "✅ Within tolerance"
                        if isinstance(time_val, str)
                        and "min" in time_val
                        and int(time_val.split()[0]) <= tolerance
                        else "⚠️ May exceed tolerance"
                    )
                    commute_info.append(f"  - {name}: {time_val} ({status})")
                commute_data_text = "\n\nCommute Analysis:\n" + "\n".join(commute_info)

        if params.get("property_analysis"):
            analysis = params["property_analysis"]
            pros = analysis.get("pros", [])
            cons = analysis.get("cons", [])
            neighborhood = analysis.get("neighborhood_overview", "")
            crime_stats = analysis.get("crime_stats", "")
            gentrification = analysis.get("gentrification_index", "")
            roi = analysis.get("roi_explanation", "")
            property_analysis_text = f"""
Property Analysis:
- Pros: {", ".join(pros) if pros else "Not available"}
- Cons: {", ".join(cons) if cons else "Not available"}
- Neighborhood: {neighborhood[:200] + "..." if len(neighborhood) > 200 else neighborhood}
- Crime Stats: {crime_stats}
- Gentrification Index: {gentrification}
- ROI Potential: {roi[:200] + "..." if len(roi) > 200 else roi}
"""

        user_content = f"""
Generate a negotiation strategy for: {address}

{user_preferences_text}
{property_data_text}
{commute_data_text}
{property_analysis_text}

CRITICAL: Provide strategy with these specific improvements:
1. DETAILED COMP-BASED OPENING: Create sophisticated price rationale that references specific comparable properties with detailed comparisons. Include specific addresses, sale prices, and property differences (bedrooms, bathrooms, sqft) compared to the target property. Show price positioning analysis and market rationale.
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
        max_tokens = params.get("max_tokens", 3000)
    else:
        system_message = (
            f"You are an expert real estate analyst. Generate a detailed {section_type} for the property at {address}. Focus on practical insights and actionable recommendations with specific data and clear rationale. Return ONLY valid JSON matching the provided response_format schema. Avoid empty fields and placeholder content."
            "\n\nNo markdown, no prose—structured JSON object only."
        )
        user_content = (
            f"Generate the '{section_type}' object for the property at {address}. "
            "Fill reasonable defaults if unspecified. Return valid JSON only."
        )
        max_tokens = params.get("max_tokens", 1500)

    return {
        "model": pplx_model,
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_content},
        ],
        "response_format": response_format,
        "temperature": params.get("temperature", 0.3),
        "max_tokens": max_tokens,
    }
