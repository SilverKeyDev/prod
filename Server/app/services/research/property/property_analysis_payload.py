"""
Normalize property_analysis for API clients: neighborhood key alias and census age charts.
"""

from __future__ import annotations

from typing import Any

from app.services.research.graphs.demographics import (
    get_age_distribution,
    get_education_distribution,
    get_income_distribution,
    get_race_distribution,
)


def _format_age_bucket_value(value: Any) -> str:
    if isinstance(value, int | float) and not isinstance(value, bool):
        return f"{int(value)}%"
    return str(value)


def finalize_property_analysis_payload(
    property_analysis: dict[str, Any] | None,
    property_address: str | None,
    *,
    for_compare_stream: bool = False,
) -> dict[str, Any]:
    """
    - Compare mode: strip neighborhood payloads (no pros/cons flow).
    - Otherwise: merge `neighborhood` into `neighborhood_overview` and attach `age_distribution`.
    """
    if not property_analysis or not isinstance(property_analysis, dict):
        return property_analysis or {}
    if "error" in property_analysis:
        return property_analysis

    pa = dict(property_analysis)

    if for_compare_stream:
        pa.pop("neighborhood", None)
        pa.pop("neighborhood_overview", None)
        return pa

    nb = pa.pop("neighborhood", None)
    nov = pa.get("neighborhood_overview")
    if isinstance(nb, dict):
        if isinstance(nov, dict):
            pa["neighborhood_overview"] = {**nb, **nov}
        else:
            pa["neighborhood_overview"] = nb

    nov_out = pa.get("neighborhood_overview")
    addr = (property_address or "").strip()
    if isinstance(nov_out, dict) and addr:
        # Fetch age distribution
        age_dist = get_age_distribution(addr)
        if isinstance(age_dist, dict) and "error" not in age_dist and age_dist:
            age_distribution = {k: _format_age_bucket_value(v) for k, v in age_dist.items()}
            nov_out = {**nov_out, "age_distribution": age_distribution}

        # Fetch race distribution
        race_dist = get_race_distribution(addr)
        if isinstance(race_dist, dict) and "error" not in race_dist and race_dist:
            race_distribution = {k: _format_age_bucket_value(v) for k, v in race_dist.items()}
            nov_out = {**nov_out, "race_distribution": race_distribution}

        # Fetch income distribution
        income_dist = get_income_distribution(addr)
        if isinstance(income_dist, dict) and "error" not in income_dist and income_dist:
            income_distribution = {k: _format_age_bucket_value(v) for k, v in income_dist.items()}
            nov_out = {**nov_out, "income_distribution": income_distribution}

        # Fetch education distribution
        education_dist = get_education_distribution(addr)
        if isinstance(education_dist, dict) and "error" not in education_dist and education_dist:
            education_distribution = {
                k: _format_age_bucket_value(v) for k, v in education_dist.items()
            }
            nov_out = {**nov_out, "education_distribution": education_distribution}

        pa["neighborhood_overview"] = nov_out

    return pa
