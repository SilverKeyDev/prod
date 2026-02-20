"""
Extract property features from images using OpenAI Vision API.
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, cast

from openai import APIError, OpenAI, RateLimitError

client = OpenAI(api_key=os.getenv("OPENAI_KEY"))
logger = logging.getLogger(__name__)


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


def _make_openai_request_with_retry(request_func, max_retries: int = 3):
    """Make OpenAI API request with retry logic that respects retry-after time."""
    for attempt in range(max_retries):
        try:
            return request_func()
        except RateLimitError as e:
            error_str = str(e)
            wait_time = _extract_retry_after_time(error_str)

            if wait_time is None:
                wait_time = 2**attempt
                logger.warning(
                    f"⏳ Rate limit hit on attempt {attempt + 1}, using exponential backoff: {wait_time}s"
                )
            else:
                wait_time = max(wait_time + 0.1, 0.1)
                logger.warning(
                    f"⏳ Rate limit hit on attempt {attempt + 1}, waiting {wait_time:.3f}s (as requested by API)..."
                )

            if attempt < max_retries - 1:
                time.sleep(wait_time)
            else:
                logger.error(f"❌ Rate limit exceeded after {max_retries} attempts: {e}")
                raise
        except APIError as e:
            wait_time = 2**attempt
            if attempt < max_retries - 1:
                logger.warning(
                    f"⚠️ API error on attempt {attempt + 1}: {e}, waiting {wait_time}s before retry..."
                )
                time.sleep(wait_time)
            else:
                logger.error(f"❌ API error after {max_retries} attempts: {e}")
                raise
        except Exception as e:
            if attempt == max_retries - 1:
                logger.error(f"❌ Unexpected error after {max_retries} attempts: {e}")
                raise
            else:
                logger.warning(
                    f"⚠️ Unexpected error on attempt {attempt + 1}: {e}, retrying in 1s..."
                )
                time.sleep(1)


def _safe_json_parse(s: str) -> dict:
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


def extract_features_from_batch(image_batch: list[str], batch_num: int) -> list[str]:
    """
    Extract features from a batch of images using OpenAI vision API.

    Args:
        image_batch: List of image URLs
        batch_num: Batch number for logging

    Returns:
        List of raw feature strings
    """
    try:
        content = [
            {
                "type": "text",
                "text": (
                    "You are a real estate feature spotter. "
                    "From the following photos, list every visible home feature or amenity. "
                    "Prefer concise nouns, e.g., 'in-ground pool', 'brick pizza oven', "
                    "'swing set', 'solar panels', 'vaulted ceiling', 'granite countertops', "
                    "'hardwood floors', 'two-car garage'. If unsure, omit. No hallucinations. "
                    "Return strictly valid JSON with a top-level 'features' array of strings."
                ),
            }
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
                        "description": "Flat list of short feature strings seen in the photos.",
                    }
                },
                "required": ["features"],
            },
        }

        user_message: list[Any] = [cast(Any, {"role": "user", "content": content})]
        response_format_param = cast(Any, {"type": "json_schema", "json_schema": schema})

        def make_request():
            return client.chat.completions.create(
                model="gpt-4o-mini",  # vision-capable + cheap
                messages=user_message,
                response_format=response_format_param,
                max_tokens=600,
                temperature=0,
            )

        resp = _make_openai_request_with_retry(make_request)
        if not resp or not resp.choices:
            return []

        content_str = resp.choices[0].message.content or "{}"
        data = _safe_json_parse(content_str)
        features = data.get("features", [])

        return features

    except Exception as e:
        logger.error(f"🔍 [BATCH {batch_num}] Error extracting features: {str(e)}")
        return []


def extract_features_from_images(image_urls: list[str]) -> list[str]:
    """
    Concurrently extract features from all images using multithreading.

    Args:
        image_urls: List of image URLs to analyze

    Returns:
        List of raw (possibly redundant) features
    """
    if not image_urls:
        return []

    # Split images into batches of 5 for API efficiency (vision API works better with smaller batches)
    batch_size = 5
    batches = [image_urls[i : i + batch_size] for i in range(0, len(image_urls), batch_size)]
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


def normalize_and_dedupe_features(raw_features: list[str]) -> list[str]:
    """
    Use GPT-4o to normalize synonyms and remove duplicates.

    Args:
        raw_features: List of raw feature strings

    Returns:
        Clean, deduplicated, consistently formatted list
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
                    "description": "Canonical, deduplicated feature names (snake case avoided).",
                }
            },
            "required": ["features"],
        },
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

    normalize_messages: list[Any] = [
        cast(Any, {"role": "system", "content": system}),
        cast(Any, {"role": "user", "content": user}),
    ]
    normalize_response_format = cast(Any, {"type": "json_schema", "json_schema": schema})

    def make_request():
        return client.chat.completions.create(
            model="gpt-4o",
            messages=normalize_messages,
            response_format=normalize_response_format,
            max_tokens=600,
            temperature=0,
        )

    resp = _make_openai_request_with_retry(make_request)
    if not resp or not resp.choices:
        return []

    content_str = resp.choices[0].message.content or "{}"
    data = _safe_json_parse(content_str)
    return data.get("features", [])


def extract_and_clean_features(image_urls: list[str]) -> dict[str, list[str]]:
    """
    Extract features from images and normalize them.

    Args:
        image_urls: List of image URLs to analyze

    Returns:
        Dict with 'raw' and 'clean' feature lists
    """
    raw = extract_features_from_images(image_urls)
    clean = normalize_and_dedupe_features(raw) if raw else []
    return {"raw": raw, "clean": clean}
