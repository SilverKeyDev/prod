"""
Generate report sections for property analysis (batch and streaming).
Uses Perplexity API and schema_generator. Import config and _safe_parse_json from perplexity_analysis.
"""

import concurrent.futures
import logging
import time
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .perplexity_analysis import (
    PERPLEXITY_API_KEY,
    PERPLEXITY_HEADERS,
    PERPLEXITY_MODEL,
    PERPLEXITY_URL,
    _safe_parse_json,
)

logger = logging.getLogger(__name__)

_SYSTEM_CONTENT = (
    "You are a comprehensive PERSONALIZED property research assistant. "
    "Given an address, {address}, you must provide a detailed property report in valid JSON format.\n\n"
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


def _process_section(payload_info, max_retries=1):
    """Process a single section with retry logic."""
    payload, section_name = payload_info
    for attempt in range(max_retries + 1):
        try:
            session = requests.Session()
            retries = Retry(
                total=1,
                backoff_factor=0.5,
                status_forcelist=[429, 500, 502, 503, 504],
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
            if attempt < max_retries and response.status_code in [429, 500, 502, 503, 504]:
                time.sleep(2**attempt)
                continue
            return {
                "section": section_name,
                "success": False,
                "error": f"API error {response.status_code}",
            }
        except requests.exceptions.Timeout:
            if attempt < max_retries:
                continue
            return {"section": section_name, "success": False, "error": "Request timeout"}
        except Exception as e:
            if attempt < max_retries:
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
    from app.services.research.schema_generator import get_individual_section_schema

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
                "model": PERPLEXITY_MODEL,
                "messages": [
                    {"role": "system", "content": _SYSTEM_CONTENT.format(address=address)},
                    {
                        "role": "user",
                        "content": f"Analyze the property at {address} based on my preferences. CRITICAL: Always provide a concrete answer, estimate, or just give your best guess\n",
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
    """
    if not section_names or not PERPLEXITY_API_KEY:
        return {}
    try:
        from app.services.research.schema_generator import synthesize_property_analysis_sections

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
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(payloads), 10)) as executor:
            futures = {
                executor.submit(_process_section, payload_info): payload_info[1]
                for payload_info in payloads
            }
            for future in concurrent.futures.as_completed(futures):
                section_name = futures[future]
                try:
                    result = future.result()
                    if result["success"]:
                        newly_generated_sections.update(result["data"])
                    else:
                        logger.warning(
                            "⚠️ [PROPERTY_ANALYSIS] Section %s failed: %s",
                            section_name,
                            result.get("error"),
                        )
                except Exception as e:
                    logger.error(
                        "❌ [PROPERTY_ANALYSIS] Exception processing section %s: %s",
                        section_name,
                        e,
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
    """
    if not section_names or not PERPLEXITY_API_KEY:
        return
    try:
        from app.services.research.schema_generator import get_individual_section_schema

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
                    "model": PERPLEXITY_MODEL,
                    "messages": [
                        {"role": "system", "content": _SYSTEM_CONTENT.format(address=address)},
                        {
                            "role": "user",
                            "content": f"Analyze the property at {address} based on my preferences. CRITICAL: Always provide a concrete answer, estimate, or just give your best guess\n",
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
        newly_generated_sections = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(payloads), 10)) as executor:
            futures = {
                executor.submit(_process_section, payload_info): payload_info[1]
                for payload_info in payloads
            }
            for future in concurrent.futures.as_completed(futures):
                section_name = futures[future]
                try:
                    result = future.result()
                    if result["success"]:
                        section_data = result["data"][section_name]
                        newly_generated_sections[section_name] = section_data
                        yield {
                            "section_name": section_name,
                            "section_data": section_data,
                            "from_cache": False,
                        }
                    else:
                        logger.warning(
                            "⚠️ [PROPERTY_ANALYSIS] Section %s failed: %s",
                            section_name,
                            result.get("error"),
                        )
                except Exception as e:
                    logger.error(
                        "❌ [PROPERTY_ANALYSIS] Exception processing section %s: %s",
                        section_name,
                        e,
                    )
    except Exception as e:
        logger.error("❌ [PROPERTY_ANALYSIS] Error generating report sections: %s", e)
