"""
LLM helper functions to check overlap between property features and user preferences.
"""

from __future__ import annotations

import json
import os
import re
import time
from typing import Any, cast

from openai import APIError, OpenAI, RateLimitError

from app.config.llm_models import openai_chat_token_limit_params, openai_model_feature_overlap
from logger import log


def _extract_retry_after_time(error_message: str) -> float | None:
    """
    Extract retry-after time from OpenAI rate limit error message.

    Error format: "Please try again in 68ms" or "Please try again in 1.5s"
    Returns time in seconds, or None if not found.
    """
    pattern = r"Please try again in ([\d.]+)(ms|s|seconds?)"
    match = re.search(pattern, error_message, re.IGNORECASE)
    if match:
        value = float(match.group(1))
        unit = match.group(2).lower()
        if unit == "ms":
            return value / 1000.0
        else:
            return value
    return None


def _make_openai_request_with_retry(client, request_func, max_retries: int = 3):
    """Make OpenAI API request with retry logic that respects retry-after time."""
    for attempt in range(max_retries):
        try:
            return request_func()
        except RateLimitError as e:
            error_str = str(e)
            wait_time = _extract_retry_after_time(error_str)

            if wait_time is None:
                wait_time = 2**attempt
                log.warn(
                    "SEARCH",
                    f"⏳ Rate limit hit on attempt {attempt + 1}, using exponential backoff: {wait_time}s",
                )
            else:
                wait_time = max(wait_time + 0.1, 0.1)
                log.warn(
                    "SEARCH",
                    f"⏳ Rate limit hit on attempt {attempt + 1}, waiting {wait_time:.3f}s (as requested by API)...",
                )

            if attempt < max_retries - 1:
                time.sleep(wait_time)
            else:
                log.error("ERRORS", f"❌ Rate limit exceeded after {max_retries} attempts: {e}")
                raise
        except APIError as e:
            wait_time = 2**attempt
            if attempt < max_retries - 1:
                log.warn(
                    "SEARCH",
                    f"⚠️ API error on attempt {attempt + 1}: {e}, waiting {wait_time}s before retry...",
                )
                time.sleep(wait_time)
            else:
                log.error("ERRORS", f"❌ API error after {max_retries} attempts: {e}")
                raise
        except Exception as e:
            if attempt == max_retries - 1:
                log.error("ERRORS", f"❌ Unexpected error after {max_retries} attempts: {e}")
                raise
            else:
                log.warn(
                    "SEARCH", f"⚠️ Unexpected error on attempt {attempt + 1}: {e}, retrying in 1s..."
                )
                time.sleep(1)


# Initialize OpenAI client
_client = None


def get_openai_client() -> OpenAI:
    """Get or create OpenAI client."""
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_KEY")
        if not api_key:
            raise ValueError("OPENAI_KEY not found in environment variables")
        _client = OpenAI(api_key=api_key)
    return _client


def _safe_json_parse(s: str) -> dict[str, Any]:
    """Safely parse JSON string, with fallback to extract JSON block."""
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        # Fallback: try to extract the last {...} block
        start = s.find("{")
        end = s.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(s[start : end + 1])
            except json.JSONDecodeError:
                pass
        return {}


def check_feature_overlap(
    property_features: list[str], user_preferences: list[str], preference_type: str = "preferred"
) -> list[str]:
    """
    Use LLM to check which property features overlap with user preferences.

    Args:
        property_features: List of property feature strings (combined from features and image_features)
        user_preferences: List of user preference strings (either preferred_features or deal_breakers)
        preference_type: Either "preferred" or "dealbreaker" to indicate the type of preference

    Returns:
        List of overlapping feature strings that match user preferences
    """
    if not property_features or not user_preferences:
        return []

    try:
        client = get_openai_client()

        # Create schema for JSON response
        schema = {
            "name": "FeatureOverlap",
            "schema": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "overlapping_features": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of property features that match or overlap with user preferences. Use exact strings from property_features when possible.",
                    }
                },
                "required": ["overlapping_features"],
            },
        }

        # Create prompt based on preference type
        if preference_type == "dealbreaker":
            system_prompt = (
                "You are a real estate feature matcher. Your task is to identify which property features "
                "match or overlap with the user's deal breakers. A deal breaker means the user does NOT want "
                "this feature. If a property has a feature that matches a deal breaker, include it in the overlap list. "
                "Be strict but reasonable - only include clear matches or overlaps."
            )
            user_prompt = (
                f"Property Features:\n{json.dumps(property_features, indent=2)}\n\n"
                f"User Deal Breakers:\n{json.dumps(user_preferences, indent=2)}\n\n"
                "Identify which property features match or overlap with the user's deal breakers. "
                "Return a JSON object with an 'overlapping_features' array containing the matching features."
            )
        else:  # preferred
            system_prompt = (
                "You are a real estate feature matcher. Your task is to identify which property features "
                "match or overlap with the user's preferred features. Be flexible with synonyms and similar meanings. "
                "For example, 'swimming pool' matches 'pool', 'in-ground pool' matches 'pool', etc."
            )
            user_prompt = (
                f"Property Features:\n{json.dumps(property_features, indent=2)}\n\n"
                f"User Preferred Features:\n{json.dumps(user_preferences, indent=2)}\n\n"
                "Identify which property features match or overlap with the user's preferred features. "
                "Return a JSON object with an 'overlapping_features' array containing the matching features."
            )

        response_format_param = cast(Any, {"type": "json_schema", "json_schema": schema})
        overlap_model = openai_model_feature_overlap()

        def make_request():
            return client.chat.completions.create(
                model=overlap_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format=response_format_param,
                temperature=0,
                **openai_chat_token_limit_params(overlap_model, 500),
            )

        response = _make_openai_request_with_retry(client, make_request)
        if not response or not response.choices:
            return []

        content_str = response.choices[0].message.content or "{}"
        data = _safe_json_parse(content_str)
        overlapping = data.get("overlapping_features", [])

        # Filter to only include features that are actually in property_features
        # (to ensure we return exact strings from the property)
        overlapping_filtered = [
            feat
            for feat in overlapping
            if any(
                prop_feat.lower() == feat.lower()
                or prop_feat.lower() in feat.lower()
                or feat.lower() in prop_feat.lower()
                for prop_feat in property_features
            )
        ]

        return overlapping_filtered

    except Exception as e:
        log.error("ERRORS", f"[FEATURE_OVERLAP] Error checking feature overlap: {e}")
        return []


def combine_and_check_features(
    features: dict[str, list[str]],
    image_features: dict[str, list[str]],
    preferred_features: list[str],
    deal_breakers: list[str],
) -> dict[str, Any]:
    """
    Combine features and image_features, then check overlap with user preferences.

    Args:
        features: Dict mapping category names to lists of feature strings
        image_features: Dict with 'clean' key containing list of image feature strings (or error)
        preferred_features: List of user's preferred feature strings
        deal_breakers: List of user's deal breaker feature strings

    Returns:
        Dict with:
            - 'combined_features': List of all combined feature strings
            - 'preferred_overlap': List of features that match preferred_features
            - 'dealbreaker_overlap': List of features that match deal_breakers
    """
    # Combine all features into a flat list
    combined_features = []

    # Add features from categorized features dict
    if features and isinstance(features, dict):
        for category_features in features.values():
            if isinstance(category_features, list):
                combined_features.extend(category_features)

    # Add image features
    if image_features and isinstance(image_features, dict):
        if "error" not in image_features:
            clean_features = image_features.get("clean", [])
            if isinstance(clean_features, list):
                combined_features.extend(clean_features)

    # Remove duplicates while preserving order
    seen = set()
    unique_features = []
    for feat in combined_features:
        feat_lower = str(feat).lower().strip()
        if feat_lower and feat_lower not in seen:
            seen.add(feat_lower)
            unique_features.append(str(feat).strip())

    # Check overlap with preferred features
    preferred_overlap = []
    if preferred_features and unique_features:
        preferred_overlap = check_feature_overlap(
            unique_features, preferred_features, preference_type="preferred"
        )

    # Check overlap with deal breakers
    dealbreaker_overlap = []
    if deal_breakers and unique_features:
        dealbreaker_overlap = check_feature_overlap(
            unique_features, deal_breakers, preference_type="dealbreaker"
        )

    return {
        "combined_features": unique_features,
        "preferred_overlap": preferred_overlap,
        "dealbreaker_overlap": dealbreaker_overlap,
    }
