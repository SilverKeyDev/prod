"""Normalized SkySlope transaction mirror for brokerage analytics."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app import db


class SkySlopeTransaction(db.Model):
    __tablename__ = "skyslope_transactions"
    __table_args__ = (
        UniqueConstraint(
            "brokerage_id",
            "skyslope_transaction_id",
            name="uq_skyslope_tx_brokerage_external_id",
        ),
        Index("ix_skyslope_tx_brokerage_closed_at", "brokerage_id", "closed_at"),
        Index("ix_skyslope_tx_brokerage_status", "brokerage_id", "status"),
    )

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    brokerage_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("brokerage_orgs.id"), nullable=False, index=True
    )
    skyslope_transaction_id: Mapped[str] = mapped_column(db.String(128), nullable=False)
    agent_id: Mapped[str | None] = mapped_column(
        db.String(36), db.ForeignKey("users.id"), nullable=True, index=True
    )

    status: Mapped[str | None] = mapped_column(db.String(64))
    created_at: Mapped[datetime | None] = mapped_column(db.DateTime)
    closed_at: Mapped[datetime | None] = mapped_column(db.DateTime)
    cancelled_at: Mapped[datetime | None] = mapped_column(db.DateTime)
    is_cancelled: Mapped[bool] = mapped_column(default=False, nullable=False)

    sale_price: Mapped[Decimal | None] = mapped_column(db.Numeric(14, 2))
    list_price: Mapped[Decimal | None] = mapped_column(db.Numeric(14, 2))

    address: Mapped[str | None] = mapped_column(db.String(500))
    city: Mapped[str | None] = mapped_column(db.String(128))
    state: Mapped[str | None] = mapped_column(db.String(32))
    zip: Mapped[str | None] = mapped_column(db.String(20))
    latitude: Mapped[float | None] = mapped_column(db.Float)
    longitude: Mapped[float | None] = mapped_column(db.Float)

    side: Mapped[str | None] = mapped_column(db.String(32))
    property_type: Mapped[str | None] = mapped_column(db.String(64))

    title_vendor: Mapped[str | None] = mapped_column(db.String(255))
    lender: Mapped[str | None] = mapped_column(db.String(255))
    escrow_company: Mapped[str | None] = mapped_column(db.String(255))
    has_home_warranty: Mapped[bool | None] = mapped_column(db.Boolean)

    raw_payload: Mapped[dict | None] = mapped_column(
        JSONB().with_variant(db.JSON, "sqlite"), nullable=True
    )

    synced_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
