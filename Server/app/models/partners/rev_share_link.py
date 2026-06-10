"""Platform-level outbound links for rev-share partners (one per partner)."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class RevShareLink(db.Model):
    """Unique SilverKey /r/{id} hop per partner — not per agent or buyer."""

    __tablename__ = "rev_share_links"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    partner_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("partners.id"), nullable=False, index=True, unique=True
    )
    generated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=True, index=True)

    partner: Mapped["Partner"] = relationship("Partner", back_populates="rev_share_links")
    clicks: Mapped[list["RevShareLinkClick"]] = relationship(
        "RevShareLinkClick", back_populates="link"
    )

    __table_args__ = (Index("idx_rev_share_links_partner_active", "partner_id", "is_active"),)
