"""Resolve active partners attached to a checklist step (step_ids JSON)."""

from __future__ import annotations

from sqlalchemy import select

from app import db
from app.models import Partner


def list_active_partners_for_step(step_id: str) -> list[Partner]:
    """
    Return active partners whose ``step_ids`` (or legacy ``step_id``) include ``step_id``.

    Admin partner rows store one or more checklist steps as ``section:item_id`` strings
    (e.g. ``closing:13``). The denormalized ``step_id`` column mirrors ``step_ids[0]`` only.
    """
    normalized = (step_id or "").strip()
    if not normalized:
        return []

    partners = db.session.scalars(
        select(Partner).where(Partner.is_active.is_(True)).order_by(Partner.name)
    ).all()
    return [p for p in partners if normalized in p.resolved_step_ids()]
