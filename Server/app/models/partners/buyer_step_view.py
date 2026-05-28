"""Buyer step views for rev-share CTR denominator."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

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

    buyer = relationship("User", foreign_keys=[buyer_id])
    transaction = relationship("Transaction")

    __table_args__ = (
        UniqueConstraint(
            "buyer_id",
            "step_id",
            "transaction_id",
            name="uq_buyer_step_views_buyer_step_tx",
        ),
        Index("idx_buyer_step_views_step_viewed", "step_id", "viewed_at"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "buyer_id": self.buyer_id,
            "step_id": self.step_id,
            "transaction_id": self.transaction_id,
            "viewed_at": self.viewed_at.isoformat() if self.viewed_at else None,
        }
