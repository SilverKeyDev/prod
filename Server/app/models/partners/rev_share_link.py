"""Platform-level outbound links for rev-share partners (one per partner)."""

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

    partner = relationship("Partner", back_populates="rev_share_links")
    clicks = relationship("RevShareLinkClick", back_populates="link")

    __table_args__ = (Index("idx_rev_share_links_partner_active", "partner_id", "is_active"),)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "partner_id": self.partner_id,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
            "is_active": self.is_active,
        }
