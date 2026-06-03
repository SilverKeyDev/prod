"""Provision one rev_share_links row per active partner (SilverKey platform placement)."""

from __future__ import annotations

from sqlalchemy import select

from app import db
from app.models import Partner, RevShareLink


def ensure_link_for_partner(partner_id: str) -> int:
    """Create the platform link for one partner when missing."""
    partner = db.session.scalar(select(Partner).where(Partner.id == partner_id))
    if not partner:
        return 0

    existing = db.session.scalar(select(RevShareLink).where(RevShareLink.partner_id == partner_id))
    if existing:
        if not existing.is_active and partner.is_active:
            existing.is_active = True
            db.session.commit()
        return 0

    db.session.add(RevShareLink(partner_id=partner_id, is_active=True))
    db.session.commit()
    return 1


def ensure_links_for_partner(partner_id: str) -> int:
    """Backward-compatible alias for admin provision endpoint."""
    return ensure_link_for_partner(partner_id)


def ensure_links_for_all_active_partners() -> int:
    """Ensure every active partner has a platform link."""
    created = 0
    for partner in db.session.scalars(select(Partner).where(Partner.is_active.is_(True))).all():
        created += ensure_link_for_partner(partner.id)
    return created
