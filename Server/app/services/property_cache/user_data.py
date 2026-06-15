"""Per-user property data CRUD — highlights and commute."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select

from app import db
from app.models import UserPropertyCommute, UserPropertyHighlights
from logger import log

# ---------------------------------------------------------------------------
# Highlights
# ---------------------------------------------------------------------------


def get_user_highlights(user_id: str, property_id: str) -> UserPropertyHighlights | None:
    return db.session.scalar(
        select(UserPropertyHighlights).where(
            UserPropertyHighlights.user_id == user_id,
            UserPropertyHighlights.property_id == property_id,
        )
    )


def save_user_highlights(
    user_id: str,
    property_id: str,
    pros: Any | None = None,
    cons: Any | None = None,
    highlights_context: dict[str, Any] | None = None,
    analysis_cache_signature: str | None = None,
) -> UserPropertyHighlights:
    """Upsert user-specific highlights for a property."""
    existing = get_user_highlights(user_id, property_id)
    now = datetime.now(timezone.utc)

    if existing:
        existing.pros = pros
        existing.cons = cons
        existing.highlights_context = highlights_context
        existing.analysis_cache_signature = analysis_cache_signature
        existing.generated_at = now
        log.info(
            "PROPERTY_DETAILS",
            "Updated user highlights",
            {"user_id": user_id, "property_id": property_id},
        )
        return existing

    record = UserPropertyHighlights(
        user_id=user_id,
        property_id=property_id,
        pros=pros,
        cons=cons,
        highlights_context=highlights_context,
        analysis_cache_signature=analysis_cache_signature,
        generated_at=now,
    )
    db.session.add(record)
    log.info(
        "PROPERTY_DETAILS",
        "Created user highlights",
        {"user_id": user_id, "property_id": property_id},
    )
    return record


# ---------------------------------------------------------------------------
# Commute
# ---------------------------------------------------------------------------


def get_user_commute(user_id: str, property_id: str) -> UserPropertyCommute | None:
    return db.session.scalar(
        select(UserPropertyCommute).where(
            UserPropertyCommute.user_id == user_id, UserPropertyCommute.property_id == property_id
        )
    )


def save_user_commute(
    user_id: str,
    property_id: str,
    commute_data: dict[str, Any],
) -> UserPropertyCommute:
    """Upsert user-specific commute data for a property."""
    existing = get_user_commute(user_id, property_id)
    now = datetime.now(timezone.utc)

    if existing:
        existing.commute_data = commute_data
        existing.generated_at = now
        log.info(
            "PROPERTY_DETAILS",
            "Updated user commute",
            {"user_id": user_id, "property_id": property_id},
        )
        return existing

    record = UserPropertyCommute(
        user_id=user_id,
        property_id=property_id,
        commute_data=commute_data,
        generated_at=now,
    )
    db.session.add(record)
    log.info(
        "PROPERTY_DETAILS",
        "Created user commute",
        {"user_id": user_id, "property_id": property_id},
    )
    return record
