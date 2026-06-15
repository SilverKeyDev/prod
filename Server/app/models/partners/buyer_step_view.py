"""Buyer step views for rev-share CTR denominator."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class BuyerStepView(db.Model):
    """One buyer saw a checklist step where partner placements render."""

    __tablename__ = "buyer_step_views"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    buyer_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )
    step_id: Mapped[str] = mapped_column(db.String(64), nullable=False, index=True)
    transaction_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("transactions.id"), nullable=False, index=True
    )
    viewed_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )
    partner_payout_snapshot: Mapped[list[dict[str, Any]] | None] = mapped_column(db.JSON)

    buyer: Mapped["User"] = relationship("User", foreign_keys=[buyer_id])
    transaction: Mapped["Transaction"] = relationship("Transaction")

    __table_args__ = (
        UniqueConstraint(
            "buyer_id",
            "step_id",
            "transaction_id",
            name="uq_buyer_step_views_buyer_step_tx",
        ),
        Index("idx_buyer_step_views_step_viewed", "step_id", "viewed_at"),
    )
