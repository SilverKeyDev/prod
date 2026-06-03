"""Generate report sections for property analysis (batch and streaming)."""

from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from app.config.llm_models import perplexity_model_report
from logger import log

from .perplexity_config import PERPLEXITY_API_KEY
from .perplexity_report_sections_worker import (
    _SYSTEM_CONTENT,
    MAX_CONCURRENT,
    RPM_LIMIT,
    RateLimiter,
    _build_section_payloads,
    _process_section,
)


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
            log.warn("PROPERTY_DETAILS", "⚠️ [PROPERTY_ANALYSIS] No valid payloads generated")
            return {}

        newly_generated_sections = {}
        rate_limiter = RateLimiter(RPM_LIMIT)

        # Process sections concurrently with rate limiting
        log.info(
            "PROPERTY_DETAILS",
            "Processing property analysis sections",
            {
                "section_count": len(payloads),
                "max_concurrent": MAX_CONCURRENT,
                "rpm_limit": RPM_LIMIT,
            },
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
                        log.info(
                            "PROPERTY_DETAILS",
                            "Section completed",
                            {
                                "section_name": section_name,
                                "completed": completed,
                                "total": len(payloads),
                            },
                        )
                    else:
                        log.warn(
                            "PROPERTY_DETAILS",
                            "Section failed",
                            {
                                "section_name": section_name,
                                "error": result.get("error"),
                                "completed": completed,
                                "total": len(payloads),
                            },
                        )
                except Exception as e:
                    log.error(
                        "ERRORS",
                        "Exception processing section",
                        {"section_name": section_name, "error": str(e)},
                    )

        if recent_sections:
            synthesized = synthesize_property_analysis_sections(
                recent_sections, newly_generated_sections
            )
            log.info(
                "PROPERTY_DETAILS",
                "Synthesized property analysis sections",
                {
                    "synthesized_count": len(synthesized),
                    "new_count": len(newly_generated_sections),
                    "existing_count": len(recent_sections),
                },
            )
            return synthesized
        return newly_generated_sections
    except Exception as e:
        log.error(
            "ERRORS",
            "Error generating report sections",
            {"error": str(e)},
        )
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
                        log.info(
                            "PROPERTY_DETAILS",
                            "Skipping section (already exists, not regenerating)",
                            {"section_name": section_name},
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
                            log.info(
                                "PROPERTY_DETAILS",
                                "Skipping section (recent complete data exists, low priority)",
                                {"section_name": section_name},
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
        if not payloads:
            log.warn("PROPERTY_DETAILS", "⚠️ [PROPERTY_ANALYSIS] No valid payloads generated")
            return

        rate_limiter = RateLimiter(RPM_LIMIT)

        # Process sections concurrently with rate limiting and yield as they complete
        log.info(
            "PROPERTY_DETAILS",
            "Processing property analysis sections (streaming)",
            {
                "section_count": len(payloads),
                "max_concurrent": MAX_CONCURRENT,
                "rpm_limit": RPM_LIMIT,
            },
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
                        log.info(
                            "PROPERTY_DETAILS",
                            "Section completed (streaming)",
                            {
                                "section_name": section_name,
                                "completed": completed,
                                "total": len(payloads),
                            },
                        )
                        yield {
                            "section_name": section_name,
                            "section_data": section_data,
                            "from_cache": False,
                        }
                    else:
                        log.warn(
                            "PROPERTY_DETAILS",
                            "Section failed (streaming)",
                            {
                                "section_name": section_name,
                                "error": result.get("error"),
                                "completed": completed,
                                "total": len(payloads),
                            },
                        )
                except Exception as e:
                    log.error(
                        "ERRORS",
                        "Exception processing section (streaming)",
                        {"section_name": section_name, "error": str(e)},
                    )
    except Exception as e:
        log.error(
            "ERRORS",
            "Error generating report sections (streaming)",
            {"error": str(e)},
        )
