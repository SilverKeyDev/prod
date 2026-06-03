"""
Perplexity API integration for property analysis.
Contains PropertyAnalysis result type, _safe_parse_json, and analyze_property_with_sonar_pro.
Re-exports generate_report_sections_for_property and generate_report_sections_for_property_streaming.
"""

from __future__ import annotations

import json
import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

import requests

from app.config.llm_models import perplexity_model_analysis
from logger import log

from .perplexity_config import PERPLEXITY_API_KEY, PERPLEXITY_HEADERS, PERPLEXITY_URL


@dataclass
class PropertyAnalysis:
    """Structured pros/cons from Perplexity Sonar Pro (list of dicts for API JSON)."""

    pros: list[dict[str, Any]]
    cons: list[dict[str, Any]]


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


def _clamp_score(raw: Any, default: int = 3) -> int:
    try:
        s = int(raw)
    except (TypeError, ValueError):
        return default
    return max(1, min(5, s))


def _normalize_con_severity(raw: Any) -> str:
    s = str(raw or "").strip().lower().replace("-", "_")
    if s in ("red_flag", "redflag"):
        return "red_flag"
    return "warning"


def _coerce_pro_entry(item: Any) -> dict[str, Any] | None:
    if isinstance(item, str):
        t = item.strip()
        if not t:
            return None
        return {"text": t, "score": 3}
    if isinstance(item, dict):
        text = str(item.get("text", "")).strip()
        if not text:
            return None
        return {"text": text, "score": _clamp_score(item.get("score"), 3)}
    return None


def _coerce_con_entry(item: Any) -> dict[str, Any] | None:
    if isinstance(item, str):
        t = item.strip()
        if not t:
            return None
        return {"text": t, "severity": "warning", "score": 3}
    if isinstance(item, dict):
        text = str(item.get("text", "")).strip()
        if not text:
            return None
        return {
            "text": text,
            "severity": _normalize_con_severity(item.get("severity")),
            "score": _clamp_score(item.get("score"), 3),
        }
    return None


def _coerce_item_list(
    items: Any,
    max_len: int,
    coercer: Callable[[Any], dict[str, Any] | None],
) -> list[dict[str, Any]]:
    if not isinstance(items, list):
        return []
    out: list[dict[str, Any]] = []
    for item in items:
        row = coercer(item)
        if row:
            out.append(row)
        if len(out) >= max_len:
            break
    return out


def _coerce_pros_cons(
    analysis_data: dict[str, Any], pros_n: int, cons_n: int
) -> PropertyAnalysis | None:
    pros = _coerce_item_list(analysis_data.get("pros"), pros_n, _coerce_pro_entry)
    cons = _coerce_item_list(analysis_data.get("cons"), cons_n, _coerce_con_entry)
    if len(pros) < 1 or len(cons) < 1:
        return None
    return PropertyAnalysis(pros=pros, cons=cons)


def _audience_instructions(viewer_is_agent: bool, profile_subject: str) -> tuple[str, str, str]:
    """Return (role_line, task_focus, system_extra)."""
    if not viewer_is_agent:
        return (
            "Analyze this property for a potential homebuyer with the following profile and preferences.",
            "Weigh pros and cons against this buyer's budget, commute needs, must-haves, and deal-breakers.",
            "",
        )
    if profile_subject == "client":
        return (
            "You are assisting a real estate agent evaluating a listing for their buyer client.",
            "Frame pros and cons as fit for THIS CLIENT's profile (budget, locations, features, deal-breakers). "
            "Use language the agent can relay to the client.",
            "The reader is a licensed agent; be direct and practical.",
        )
    return (
        "You are assisting a real estate agent doing professional due diligence (not shopping for themselves).",
        "Emphasize transaction risk, disclosure red flags, pricing vs comps, inspection concerns, "
        "timeline/marketability, and how to present the home to buyers. Still ground claims in facts.",
        "The reader is a licensed agent; prioritize accuracy and defensible statements.",
    )


def _bullet_length_instruction(style: str) -> str:
    if style == "short":
        return "Each bullet must be one concise sentence (roughly 15 words or fewer)."
    if style == "long":
        return (
            "Each bullet may be 2-3 sentences when needed for specificity; prefer concrete facts."
        )
    return "Each bullet should be 1-2 sentences, clear and specific."


def analyze_property_with_sonar_pro(
    user_preferences: dict[str, Any],
    home_object: dict[str, Any],
    analysis_context: dict[str, Any] | None = None,
) -> PropertyAnalysis | None:
    """
    Analyze a property using Perplexity's Sonar Pro API based on user preferences.

    analysis_context (optional):
        viewer_is_agent: bool
        profile_subject: "self" | "client"
        pros_count, cons_count: int (1-6)
        bullet_style: "short" | "medium" | "long"
    """
    if not PERPLEXITY_API_KEY:
        log.error("ERRORS", "Cannot analyze property: PERPLEXITY_API_KEY not configured")
        return None

    ctx = analysis_context or {}
    viewer_is_agent = bool(ctx.get("viewer_is_agent", False))
    profile_subject = str(ctx.get("profile_subject", "self"))
    if profile_subject not in ("self", "client"):
        profile_subject = "self"
    pros_n = int(ctx.get("pros_count", 3))
    cons_n = int(ctx.get("cons_count", 3))
    pros_n = max(1, min(6, pros_n))
    cons_n = max(1, min(6, cons_n))
    bullet_style = str(ctx.get("bullet_style", "medium"))
    if bullet_style not in ("short", "medium", "long"):
        bullet_style = "medium"

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

        role_line, task_focus, system_extra = _audience_instructions(
            viewer_is_agent, profile_subject
        )
        bullet_instr = _bullet_length_instruction(bullet_style)

        prompt = f"""
        {role_line}

        PROPERTY DETAILS:
        - Address: {address}
        - Price: {price_str}
        - Bedrooms: {bedrooms}
        - Bathrooms: {bathrooms}
        - Square Feet: {sqft}
        - Property Type: {property_type}

        BUYER / SEARCH PROFILE (use for fit):
        - Budget: {budget}
        - Age: {age}
        - Important Locations: {", ".join([loc.get("name") or loc.get("label") or loc.get("address", "Unknown") for loc in important_locations]) if important_locations else "None specified"}
        - Preferred Features: {", ".join(preferred_features) if preferred_features else "None specified"}
        - Deal Breakers: {", ".join(deal_breakers) if deal_breakers else "None specified"}

        {task_focus}

        Do not include any '*' characters or other special characters, besides '-' at the start of each bullet point.
        Do not include any inline citations, reference numbers, or source attributions in your response.
        Prefer specific, verifiable claims (school names, distances, tax context) when supported by reliable data.

        {bullet_instr}

        For each pro and con, assign an integer score from 1 (weakest) to 5 (strongest impact). Use integers only, not asterisks or star symbols.
        For each con, set severity to "red_flag" for serious defects, disclosure issues, or major deal risk; use "warning" for moderate tradeoffs or minor heads-ups.

        Respond in valid JSON only:
        {{
            "pros": [
                {{"text": "exactly {pros_n} items, each text field is the strength description", "score": 1}}
            ],
            "cons": [
                {{"text": "exactly {cons_n} items, each text field is the concern description", "severity": "red_flag", "score": 1}}
            ],
            "neighborhood_overview": {{
                "description": "2-3 sentence overview of the neighborhood character, demographics, and general atmosphere",
                "vibe": "brief description of the neighborhood vibe/personality (e.g., trendy, family-friendly, artistic, professional, etc.)"
            }}
        }}
        """
        system_content = (
            "You are a real estate analysis expert. Provide accurate, data-driven property analysis "
            "using current market information and reliable sources. Always respond in valid JSON format."
        )
        if system_extra:
            system_content = f"{system_content} {system_extra}"

        temp = 0.06 if bullet_style == "long" else 0.1
        payload = {
            "model": perplexity_model_analysis(),
            "messages": [
                {"role": "system", "content": system_content},
                {"role": "user", "content": prompt},
            ],
            "max_tokens": 2200,
            "temperature": temp,
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
                    if not isinstance(analysis_data, dict):
                        if attempt < max_retries - 1:
                            continue
                        return None
                    coerced = _coerce_pros_cons(analysis_data, pros_n, cons_n)
                    if coerced is not None:
                        return coerced
                    if attempt < max_retries - 1:
                        continue
                    return None
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
        log.error("ERRORS", "Failed to analyze property:", {"detail": str(e)})
        return None
