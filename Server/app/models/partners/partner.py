"""Marketplace partner configuration (brokerage-level placement)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Index, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db

CHECKLIST_WORKSPACES = frozenset({"buyer", "seller"})
VALID_TARGET_ROLES = frozenset({"buyer", "seller", "agent", "brokerage", "integration_partner"})
VALID_PAYOUT_TYPES = frozenset({"on_click", "on_close"})
VALID_INTEGRATION_DISPLAY_MODES = frozenset({"iframe_and_link", "link_only"})
DEFAULT_INTEGRATION_DISPLAY_MODE = "iframe_and_link"


class Partner(db.Model):
    """Ancillary partner rev-share placement (admin-managed, not per-agent referral)."""

    __tablename__ = "partners"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    slug: Mapped[str] = mapped_column(db.String(128), nullable=False, unique=True, index=True)
    destination_url_template: Mapped[str] = mapped_column(db.Text, nullable=False)
    logo_url: Mapped[str | None] = mapped_column(db.String(500))
    description: Mapped[str | None] = mapped_column(db.Text)
    step_id: Mapped[str] = mapped_column(db.String(64), nullable=False, index=True)
    step_ids: Mapped[list] = mapped_column(db.JSON, nullable=False, default=list)
    target_roles: Mapped[list] = mapped_column(db.JSON, nullable=False, default=list)
    payout_type: Mapped[str] = mapped_column(db.String(32), nullable=False, default="on_click")
    payout_per_conversion: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0")
    )
    integration_display_mode: Mapped[str] = mapped_column(
        db.String(32), nullable=False, default=DEFAULT_INTEGRATION_DISPLAY_MODE
    )
    embed_url_template: Mapped[str | None] = mapped_column(db.Text)
    is_active: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    rev_share_links = relationship("RevShareLink", back_populates="partner")
    clicks = relationship("RevShareLinkClick", back_populates="partner")

    __table_args__ = (Index("idx_partners_step_active", "step_id", "is_active"),)

    def resolved_step_ids(self) -> list[str]:
        if self.step_ids:
            return list(self.step_ids)
        if self.step_id:
            return [self.step_id]
        return []

    def to_dict(self) -> dict:
        step_ids = self.resolved_step_ids()
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "destination_url_template": self.destination_url_template,
            "logo_url": self.logo_url,
            "description": self.description,
            "step_id": step_ids[0] if step_ids else self.step_id,
            "step_ids": step_ids,
            "target_roles": list(self.target_roles or []),
            "payout_type": self.payout_type,
            "payout_per_conversion": float(self.payout_per_conversion),
            "integration_display_mode": self.integration_display_mode
            or DEFAULT_INTEGRATION_DISPLAY_MODE,
            "embed_url_template": self.embed_url_template,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
