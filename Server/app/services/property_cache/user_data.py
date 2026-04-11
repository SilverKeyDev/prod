"""Per-user property data CRUD — highlights and commute."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from app import db
from app.models import UserPropertyCommute, UserPropertyHighlights

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Highlights
# ---------------------------------------------------------------------------


def get_user_highlights(user_id: str, property_id: str) -> UserPropertyHighlights | None:
    return UserPropertyHighlights.query.filter_by(user_id=user_id, property_id=property_id).first()


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
        logger.info(
            "[USER_DATA] Updated highlights user=%s property=%s",
            user_id,
            property_id,
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
    logger.info(
        "[USER_DATA] Created highlights user=%s property=%s",
        user_id,
        property_id,
    )
    return record


# ---------------------------------------------------------------------------
# Commute
# ---------------------------------------------------------------------------


def get_user_commute(user_id: str, property_id: str) -> UserPropertyCommute | None:
    return UserPropertyCommute.query.filter_by(user_id=user_id, property_id=property_id).first()


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
        logger.info(
            "[USER_DATA] Updated commute user=%s property=%s",
            user_id,
            property_id,
        )
        return existing

    record = UserPropertyCommute(
        user_id=user_id,
        property_id=property_id,
        commute_data=commute_data,
        generated_at=now,
    )
    db.session.add(record)
    logger.info(
        "[USER_DATA] Created commute user=%s property=%s",
        user_id,
        property_id,
    )
    return record
