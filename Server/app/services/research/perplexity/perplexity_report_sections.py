"""
Generate report sections for property analysis (batch and streaming).
Uses Perplexity API and schema_generator. Import config and _safe_parse_json from perplexity_analysis.
"""

import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.config.llm_models import perplexity_model_report

from .perplexity_analysis import _safe_parse_json
from .perplexity_config import PERPLEXITY_API_KEY, PERPLEXITY_HEADERS, PERPLEXITY_URL

logger = logging.getLogger(__name__)

# Rate limiting configuration based on Perplexity API tiers
# Tier 0: 50 RPM, Tier 1: 150 RPM, Tier 2: 500 RPM, Tier 3+: 1000+ RPM
# Default to Tier 0 (conservative) - can be overridden via env var
PERPLEXITY_TIER = int(os.getenv("PERPLEXITY_TIER", "0"))
RPM_LIMITS = {0: 50, 1: 150, 2: 500, 3: 1000, 4: 4000, 5: 4000}
RPM_LIMIT = RPM_LIMITS.get(PERPLEXITY_TIER, 50)
# Calculate delay: 60 seconds / RPM, with 10% safety margin
REQUEST_DELAY = (60.0 / RPM_LIMIT) * 1.1
# Max concurrent requests: allow up to 5 concurrent or RPM/20 (whichever is smaller)
MAX_CONCURRENT = min(5, max(2, RPM_LIMIT // 20))

logger.info(
    f"🚀 [PERPLEXITY_CONFIG] Tier {PERPLEXITY_TIER}: {RPM_LIMIT} RPM limit, "
    f"{REQUEST_DELAY:.2f}s delay, {MAX_CONCURRENT} max concurrent requests"
)

_SYSTEM_CONTENT = (
    "You are a comprehensive factual property research assistant. "
    "Given an address, {address}, you must provide a detailed property report in valid JSON format.\n\n"
    "OBJECTIVITY:\n"
    "Provide factual, objective information about the property and its surroundings. "
    "Do NOT tailor the analysis to any specific buyer's preferences. "
    "Report data that any prospective buyer would find useful.\n"
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


class RateLimiter:
    """Simple rate limiter using time-based throttling."""

    def __init__(self, requests_per_minute: int):
        self.min_interval = 60.0 / requests_per_minute
        self.last_request_time = 0.0

    def wait_if_needed(self):
        """Wait if necessary to respect rate limit."""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.min_interval:
            sleep_time = self.min_interval - time_since_last
            time.sleep(sleep_time)
        self.last_request_time = time.time()


def _process_section(payload_info, max_retries=2):
    """Process a single section with retry logic and rate limit handling."""
    payload, section_name = payload_info
    for attempt in range(max_retries + 1):
        try:
            session = requests.Session()
            retries = Retry(
                total=0,  # Let our custom logic handle retries
                backoff_factor=0.5,
                status_forcelist=[500, 502, 503, 504],  # Don't auto-retry 429
                raise_on_status=False,
            )
            session.mount("https://", HTTPAdapter(max_retries=retries))  # type: ignore[arg-type]
            response = session.post(
                PERPLEXITY_URL,
                headers=PERPLEXITY_HEADERS,
                json=payload,
                timeout=300,
            )
            if response.status_code == 200:
                content = response.json()
                if "choices" not in content or not content["choices"]:
                    if attempt < max_retries:
                        continue
                    return {
                        "section": section_name,
                        "success": False,
                        "error": "Malformed API response",
                    }
                raw_json_text = content["choices"][0]["message"]["content"]
                try:
                    section_data = _safe_parse_json(raw_json_text, None)
                    if section_name in section_data and section_data[section_name] is not None:
                        return {
                            "section": section_name,
                            "success": True,
                            "data": {section_name: section_data[section_name]},
                        }
                    if section_data and len(section_data) > 0:
                        return {
                            "section": section_name,
                            "success": True,
                            "data": {section_name: section_data},
                        }
                    if attempt < max_retries:
                        continue
                    return {"section": section_name, "success": False, "error": "Empty response"}
                except Exception as pe:
                    if attempt < max_retries:
                        continue
                    return {
                        "section": section_name,
                        "success": False,
                        "error": f"Parse error: {str(pe)}",
                    }
            # Handle rate limiting with exponential backoff
            if response.status_code == 429:
                if attempt < max_retries:
                    # Extract retry-after from headers or use exponential backoff
                    retry_after = response.headers.get("Retry-After")
                    if retry_after:
                        wait_time = float(retry_after)
                    else:
                        wait_time = (2**attempt) * REQUEST_DELAY
                    logger.warning(
                        f"⏱️ [PROPERTY_ANALYSIS] Rate limited on {section_name}, "
                        f"waiting {wait_time:.1f}s (attempt {attempt + 1}/{max_retries + 1})"
                    )
                    time.sleep(wait_time)
                    continue
                return {
                    "section": section_name,
                    "success": False,
                    "error": "Rate limit exceeded after retries",
                }
            # Retry server errors
            if attempt < max_retries and response.status_code in [500, 502, 503, 504]:
                wait_time = 2**attempt
                logger.warning(
                    f"⏱️ [PROPERTY_ANALYSIS] Server error {response.status_code} on {section_name}, "
                    f"waiting {wait_time}s (attempt {attempt + 1}/{max_retries + 1})"
                )
                time.sleep(wait_time)
                continue
            return {
                "section": section_name,
                "success": False,
                "error": f"API error {response.status_code}",
            }
        except requests.exceptions.Timeout:
            if attempt < max_retries:
                logger.warning(
                    f"⏱️ [PROPERTY_ANALYSIS] Timeout on {section_name}, "
                    f"retrying (attempt {attempt + 1}/{max_retries + 1})"
                )
                continue
            return {"section": section_name, "success": False, "error": "Request timeout"}
        except Exception as e:
            if attempt < max_retries:
                logger.warning(
                    f"⚠️ [PROPERTY_ANALYSIS] Error on {section_name}: {str(e)}, "
                    f"retrying (attempt {attempt + 1}/{max_retries + 1})"
                )
                continue
            return {
                "section": section_name,
                "success": False,
                "error": f"Unexpected error: {str(e)}",
            }
    return {"section": section_name, "success": False, "error": "Max retries exceeded"}


def _build_section_payloads(
    section_names, address, user_preferences, recent_sections, section_priorities, mode
):
    """Build list of (payload, section_name) for sections that should be generated."""
    from app.services.research.report_generation import get_individual_section_schema

    payloads = []
    for section_name in section_names:
        try:
            if recent_sections and section_name in recent_sections:
                recent_info = recent_sections[section_name]
                recent_data = recent_info.get("data", {})
                if isinstance(recent_data, dict) and recent_data:
                    priority_index = (
                        section_priorities.index(section_name)
                        if section_name in section_priorities
                        else 999
                    )
                    if priority_index >= 5 and len(recent_data) >= 3:
                        logger.info(
                            "⏭️ [PROPERTY_ANALYSIS] Skipping %s (recent complete data exists, low priority)",
                            section_name,
                        )
                        continue
            section_schema = get_individual_section_schema(
                section_name,
                user_preferences,
                mode=mode,
                recent_sections=recent_sections,
                section_priorities=section_priorities,
            )
            if "error" in section_schema:
                logger.warning(
                    "⚠️ [PROPERTY_ANALYSIS] Skipping section %s: %s",
                    section_name,
                    section_schema.get("error"),
                )
                continue
            payload = {
                "model": perplexity_model_report(),
                "messages": [
                    {"role": "system", "content": _SYSTEM_CONTENT.format(address=address)},
                    {
                        "role": "user",
                        "content": f"Provide a factual analysis of the property at {address}. CRITICAL: Always provide a concrete answer, estimate, or just give your best guess\n",
                    },
                ],
                "search_mode": "web",
                "reasoning_effort": "medium",
                "temperature": 0.1,
                "max_tokens": 2500,
                "stream": False,
                "return_images": False,
                "return_citations": False,
                "response_format": section_schema,
            }
            payloads.append((payload, section_name))
        except Exception as e:
            logger.error(
                "❌ [PROPERTY_ANALYSIS] Error building payload for section %s: %s", section_name, e
            )
    return payloads


def generate_report_sections_for_property(
    section_names: list[str],
    address: str,
    user_preferences: dict[str, Any],
    property_data: dict[str, Any],
    recent_sections: dict[str, dict[str, Any]] | None = None,
    mode: str = "report",
) -> dict[str, Any]:
    """
    Generate report sections for property analysis using smart schema generation.
    Returns dict containing all generated sections (and synthesized with recent_sections if provided).
    Uses concurrent processing with rate limiting for optimal speed.
    """
    if not section_names or not PERPLEXITY_API_KEY:
        return {}
    try:
        from app.services.research.report_generation import synthesize_property_analysis_sections

        section_priorities = section_names
        payloads = _build_section_payloads(
            section_names,
            address,
            user_preferences,
            recent_sections or {},
            section_priorities,
            mode,
        )
        if not payloads:
            logger.warning("⚠️ [PROPERTY_ANALYSIS] No valid payloads generated")
            return {}

        newly_generated_sections = {}
        rate_limiter = RateLimiter(RPM_LIMIT)

        # Process sections concurrently with rate limiting
        logger.info(
            f"🚀 [PROPERTY_ANALYSIS] Processing {len(payloads)} sections with "
            f"{MAX_CONCURRENT} concurrent workers (rate limit: {RPM_LIMIT} RPM)"
        )

        with ThreadPoolExecutor(max_workers=MAX_CONCURRENT) as executor:
            # Submit all tasks
            future_to_section = {}
            for payload_info in payloads:
                # Wait for rate limit before submitting
                rate_limiter.wait_if_needed()
                future = executor.submit(_process_section, payload_info)
                future_to_section[future] = payload_info[1]  # section_name

            # Collect results as they complete
            completed = 0
            for future in as_completed(future_to_section):
                section_name = future_to_section[future]
                completed += 1
                try:
                    result = future.result()
                    if result["success"]:
                        newly_generated_sections.update(result["data"])
                        logger.info(
                            f"✅ [PROPERTY_ANALYSIS] Section {section_name} completed "
                            f"({completed}/{len(payloads)})"
                        )
                    else:
                        logger.warning(
                            f"⚠️ [PROPERTY_ANALYSIS] Section {section_name} failed: "
                            f"{result.get('error')} ({completed}/{len(payloads)})"
                        )
                except Exception as e:
                    logger.error(
                        f"❌ [PROPERTY_ANALYSIS] Exception processing section {section_name}: {e}"
                    )

        if recent_sections:
            synthesized = synthesize_property_analysis_sections(
                recent_sections, newly_generated_sections
            )
            logger.info(
                "✅ [PROPERTY_ANALYSIS] Synthesized %s sections (merged %s new with %s existing)",
                len(synthesized),
                len(newly_generated_sections),
                len(recent_sections),
            )
            return synthesized
        return newly_generated_sections
    except Exception as e:
        logger.error("❌ [PROPERTY_ANALYSIS] Error generating report sections: %s", e)
        return {}


def generate_report_sections_for_property_streaming(
    section_names: list[str],
    address: str,
    user_preferences: dict[str, Any],
    property_data: dict[str, Any],
    recent_sections: dict[str, dict[str, Any]] | None = None,
    existing_sections: dict[str, Any] | None = None,
    mode: str = "report",
):
    """
    Generator that yields sections individually as they complete.
    Yields dict with section_name, section_data, from_cache.
    Uses concurrent processing with rate limiting for optimal speed.
    """
    if not section_names or not PERPLEXITY_API_KEY:
        return
    try:
        from app.services.research.report_generation import get_individual_section_schema

        section_priorities = section_names
        payloads = []
        for section_name in section_names:
            try:
                if existing_sections and section_name in existing_sections:
                    existing_data = existing_sections[section_name]
                    if existing_data is not None and existing_data != {}:
                        logger.info(
                            "⏭️ [PROPERTY_ANALYSIS] Skipping %s (already exists, not regenerating)",
                            section_name,
                        )
                        yield {
                            "section_name": section_name,
                            "section_data": existing_data,
                            "from_cache": True,
                        }
                        continue
                if recent_sections and section_name in recent_sections:
                    recent_info = recent_sections[section_name]
                    recent_data = recent_info.get("data", {})
                    if isinstance(recent_data, dict) and recent_data:
                        priority_index = (
                            section_priorities.index(section_name)
                            if section_name in section_priorities
                            else 999
                        )
                        if priority_index >= 5 and len(recent_data) >= 3:
                            logger.info(
                                "⏭️ [PROPERTY_ANALYSIS] Skipping %s (recent complete data exists, low priority)",
                                section_name,
                            )
                            yield {
                                "section_name": section_name,
                                "section_data": recent_data,
                                "from_cache": True,
                            }
                            continue
                section_schema = get_individual_section_schema(
                    section_name,
                    user_preferences,
                    mode=mode,
                    recent_sections=recent_sections or {},
                    section_priorities=section_priorities,
                )
                if "error" in section_schema:
                    logger.warning(
                        "⚠️ [PROPERTY_ANALYSIS] Skipping section %s: %s",
                        section_name,
                        section_schema.get("error"),
                    )
                    continue
                payload = {
                    "model": perplexity_model_report(),
                    "messages": [
                        {"role": "system", "content": _SYSTEM_CONTENT.format(address=address)},
                        {
                            "role": "user",
                            "content": f"Provide a factual analysis of the property at {address}. CRITICAL: Always provide a concrete answer, estimate, or just give your best guess\n",
                        },
                    ],
                    "search_mode": "web",
                    "reasoning_effort": "medium",
                    "temperature": 0.1,
                    "max_tokens": 2500,
                    "stream": False,
                    "return_images": False,
                    "return_citations": False,
                    "response_format": section_schema,
                }
                payloads.append((payload, section_name))
            except Exception as e:
                logger.error(
                    "❌ [PROPERTY_ANALYSIS] Error building payload for section %s: %s",
                    section_name,
                    e,
                )
        if not payloads:
            logger.warning("⚠️ [PROPERTY_ANALYSIS] No valid payloads generated")
            return

        rate_limiter = RateLimiter(RPM_LIMIT)

        # Process sections concurrently with rate limiting and yield as they complete
        logger.info(
            f"🚀 [PROPERTY_ANALYSIS] Processing {len(payloads)} sections with "
            f"{MAX_CONCURRENT} concurrent workers (rate limit: {RPM_LIMIT} RPM)"
        )

        with ThreadPoolExecutor(max_workers=MAX_CONCURRENT) as executor:
            # Submit all tasks
            future_to_section = {}
            for payload_info in payloads:
                # Wait for rate limit before submitting
                rate_limiter.wait_if_needed()
                future = executor.submit(_process_section, payload_info)
                future_to_section[future] = payload_info[1]  # section_name

            # Yield results as they complete
            completed = 0
            for future in as_completed(future_to_section):
                section_name = future_to_section[future]
                completed += 1
                try:
                    result = future.result()
                    if result["success"]:
                        section_data = result["data"][section_name]
                        logger.info(
                            f"✅ [PROPERTY_ANALYSIS] Section {section_name} completed "
                            f"({completed}/{len(payloads)})"
                        )
                        yield {
                            "section_name": section_name,
                            "section_data": section_data,
                            "from_cache": False,
                        }
                    else:
                        logger.warning(
                            f"⚠️ [PROPERTY_ANALYSIS] Section {section_name} failed: "
                            f"{result.get('error')} ({completed}/{len(payloads)})"
                        )
                except Exception as e:
                    logger.error(
                        f"❌ [PROPERTY_ANALYSIS] Exception processing section {section_name}: {e}"
                    )
    except Exception as e:
        logger.error("❌ [PROPERTY_ANALYSIS] Error generating report sections: %s", e)
