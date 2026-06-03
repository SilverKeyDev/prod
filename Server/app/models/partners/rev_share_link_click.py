"""Logged outbound clicks on rev-share attribution links."""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Date, Index, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class RevShareLinkClick(db.Model):
    """One click-through event (denominator uses buyer_step_views separately)."""

    __tablename__ = "rev_share_link_clicks"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    partner_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("partners.id"), nullable=False, index=True
    )
    link_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("rev_share_links.id"), nullable=False, index=True
    )
    agent_id: Mapped[str | None] = mapped_column(
        db.String(36), db.ForeignKey("users.id"), nullable=True, index=True
    )
    buyer_id: Mapped[str | None] = mapped_column(
        db.String(36), db.ForeignKey("users.id"), nullable=True, index=True
    )
    transaction_id: Mapped[str | None] = mapped_column(
        db.String(36), db.ForeignKey("transactions.id"), nullable=True, index=True
    )
    step_id: Mapped[str] = mapped_column(db.String(64), nullable=False, index=True)
    clicked_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )
    payout_per_conversion: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0")
    )
    payout_type: Mapped[str] = mapped_column(db.String(32), nullable=False, default="on_click")
    session_id: Mapped[str | None] = mapped_column(db.String(64), nullable=True)
    click_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    ip_address_hash: Mapped[str | None] = mapped_column(db.String(64))
    user_agent: Mapped[str | None] = mapped_column(db.Text)
    referrer: Mapped[str | None] = mapped_column(db.Text)
    utm_source: Mapped[str | None] = mapped_column(db.String(128))
    utm_medium: Mapped[str | None] = mapped_column(db.String(128))
    utm_campaign: Mapped[str | None] = mapped_column(db.String(128))
    geo_city: Mapped[str | None] = mapped_column(db.String(128))
    geo_zip: Mapped[str | None] = mapped_column(db.String(32))
    geo_region: Mapped[str | None] = mapped_column(db.String(64))
    device_class: Mapped[str | None] = mapped_column(db.String(32))

    partner = relationship("Partner", back_populates="clicks")
    link = relationship("RevShareLink", back_populates="clicks")
    agent = relationship("User", foreign_keys=[agent_id])
    buyer = relationship("User", foreign_keys=[buyer_id])
    transaction = relationship("Transaction")

    __table_args__ = (
        Index("idx_rev_share_clicks_partner_clicked", "partner_id", "clicked_at"),
        Index("idx_rev_share_clicks_step_clicked", "step_id", "clicked_at"),
        UniqueConstraint(
            "link_id",
            "session_id",
            "click_date",
            name="uq_rev_share_clicks_link_session_day",
        ),
    )

    def to_dict(self, *, include_pii: bool = False) -> dict:
        out = {
            "id": self.id,
            "partner_id": self.partner_id,
            "link_id": self.link_id,
            "agent_id": self.agent_id,
            "buyer_id": self.buyer_id,
            "transaction_id": self.transaction_id,
            "step_id": self.step_id,
            "clicked_at": self.clicked_at.isoformat() if self.clicked_at else None,
            "payout_per_conversion": float(self.payout_per_conversion),
            "payout_type": self.payout_type,
            "utm_source": self.utm_source,
            "utm_medium": self.utm_medium,
            "utm_campaign": self.utm_campaign,
            "geo_city": self.geo_city,
            "geo_zip": self.geo_zip,
            "geo_region": self.geo_region,
            "device_class": self.device_class,
            "referrer": self.referrer,
        }
        if include_pii:
            out["ip_address_hash"] = self.ip_address_hash
        return out
