"""PropertyAnalysisSection CRUD — shared factual analysis sections."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select

from app import db
from app.models import PropertyAnalysisSection
from logger import log

DEFAULT_MAX_AGE_DAYS = 14


def get_cached_sections(property_id: str) -> list[PropertyAnalysisSection]:
    """Return all analysis sections for a given property."""
    return db.session.scalars(
        select(PropertyAnalysisSection).where(PropertyAnalysisSection.property_id == property_id)
    ).all()


def get_cached_sections_dict(property_id: str) -> dict[str, dict[str, Any]]:
    """Return a {section_name: data} mapping for all cached sections."""
    sections = get_cached_sections(property_id)
    return {s.section_name: s.data for s in sections if s.data}


def should_regenerate_section(
    section: PropertyAnalysisSection | None,
    max_age_days: int = DEFAULT_MAX_AGE_DAYS,
) -> bool:
    """Return True if the section is missing or older than *max_age_days*."""
    if section is None:
        return True
    if not section.generated_at:
        return True
    cutoff = datetime.now(timezone.utc) - timedelta(days=max_age_days)
    return section.generated_at < cutoff


def save_section(
    property_id: str,
    section_name: str,
    data: dict[str, Any],
) -> PropertyAnalysisSection:
    """Upsert a single analysis section for a property."""
    existing = db.session.scalar(
        select(PropertyAnalysisSection).where(
            PropertyAnalysisSection.property_id == property_id,
            PropertyAnalysisSection.section_name == section_name,
        )
    )

    now = datetime.now(timezone.utc)
    if existing:
        existing.data = data
        existing.generated_at = now
        log.info(
            "PROPERTY_DETAILS",
            "Updated analysis section",
            {"section_name": section_name, "property_id": property_id},
        )
        return existing

    record = PropertyAnalysisSection(
        property_id=property_id,
        section_name=section_name,
        data=data,
        generated_at=now,
    )
    db.session.add(record)
    log.info(
        "PROPERTY_DETAILS",
        "Created analysis section",
        {"section_name": section_name, "property_id": property_id},
    )
    return record
