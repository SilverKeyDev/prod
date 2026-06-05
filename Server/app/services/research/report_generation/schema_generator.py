"""Per-section JSON schema generation for property research reports."""

from copy import deepcopy
from typing import Any

from app.services.research.models import (
    Affordability,
    ClimateEnvironmentalSafety,
    CommuteSection,
    ConvenienceWalkability,
    Entertainment,
    FamilyFriendlySection,
    Investment,
    Neighborhood,
)
from logger import log

from .schema_processing import (
    filter_schema_by_recent_data,
    process_schema_common_steps,
    reduce_schema_for_low_priority,
)
from .schema_synthesis import sanitize_schema_for_llm, synthesize_property_analysis_sections

SECTION_MODEL_MAP = {
    "affordability": Affordability,
    "neighborhood": Neighborhood,
    "commute": CommuteSection,
    "family_friendly": FamilyFriendlySection,
    "entertainment": Entertainment,
    "investment": Investment,
    "climate_environmental_safety": ClimateEnvironmentalSafety,
    "convenience_walkability": ConvenienceWalkability,
}

__all__ = [
    "SECTION_MODEL_MAP",
    "get_individual_section_schema",
    "sanitize_schema_for_llm",
    "synthesize_property_analysis_sections",
]


def get_individual_section_schema(
    section_name: str,
    user_preferences: dict[str, Any] | None = None,
    mode: str = "report",
    recent_sections: dict[str, dict[str, Any]] | None = None,
    section_priorities: list | None = None,
) -> dict[str, Any]:
    """
    Generate a flattened, Perplexity-compatible JSON schema for a given report section.
    """
    model_class = SECTION_MODEL_MAP.get(section_name)

    if not model_class:
        log.error("ERRORS", "No model class found for section: {section_name} in mode: {mode}")
        return {"error": f"No model class found for section: {section_name}"}

    schema = deepcopy(model_class.schema())

    if mode == "report":
        schema = filter_schema_by_recent_data(
            schema, section_name, recent_sections or {}, section_priorities
        )
        schema = reduce_schema_for_low_priority(
            schema, section_name, section_priorities or [], recent_sections
        )
        return process_schema_common_steps(
            schema,
            model_class,
            section_name,
            user_preferences,
            default_type_for_missing="string",
            mode="report",
        )

    if mode == "comparison":
        return process_schema_common_steps(
            schema,
            model_class,
            section_name,
            user_preferences,
            default_type_for_missing="string",
            mode="comparison",
        )

    log.error("ERRORS", "Unknown mode: {mode}")
    return {"error": f"Unknown mode: {mode}"}
