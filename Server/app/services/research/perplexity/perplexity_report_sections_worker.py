"""Per-section HTTP calls and payload building for property report generation."""

import os
import time

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.config.llm_models import perplexity_model_report
from logger import log

from .perplexity_analysis import _safe_parse_json
from .perplexity_config import PERPLEXITY_HEADERS, PERPLEXITY_URL

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

log.info(
    "API",
    "Perplexity rate limit configuration",
    {
        "tier": PERPLEXITY_TIER,
        "rpm_limit": RPM_LIMIT,
        "request_delay_s": round(REQUEST_DELAY, 2),
        "max_concurrent": MAX_CONCURRENT,
    },
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
                    log.warn(
                        "API",
                        "Rate limited on property analysis section",
                        {
                            "section_name": section_name,
                            "wait_time_s": round(wait_time, 1),
                            "attempt": attempt + 1,
                            "max_retries": max_retries + 1,
                        },
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
                log.warn(
                    "API",
                    "Server error on property analysis section",
                    {
                        "section_name": section_name,
                        "status_code": response.status_code,
                        "wait_time_s": wait_time,
                        "attempt": attempt + 1,
                        "max_retries": max_retries + 1,
                    },
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
                log.warn(
                    "API",
                    "Timeout on property analysis section",
                    {
                        "section_name": section_name,
                        "attempt": attempt + 1,
                        "max_retries": max_retries + 1,
                    },
                )
                continue
            return {"section": section_name, "success": False, "error": "Request timeout"}
        except Exception as e:
            if attempt < max_retries:
                log.warn(
                    "API",
                    "Error on property analysis section, retrying",
                    {
                        "section_name": section_name,
                        "error": str(e),
                        "attempt": attempt + 1,
                        "max_retries": max_retries + 1,
                    },
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
                        log.info(
                            "PROPERTY_DETAILS",
                            "Skipping section (recent complete data exists, low priority)",
                            {"section_name": section_name},
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
                log.warn(
                    "PROPERTY_DETAILS",
                    "Skipping section (schema error)",
                    {"section_name": section_name},
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
            log.error(
                "ERRORS",
                "Error building payload for section",
                {"section_name": section_name, "error": str(e)},
            )
    return payloads
