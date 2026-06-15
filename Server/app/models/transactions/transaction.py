"""Transaction model - represents a real estate transaction."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Index
from sqlalchemy.orm import DynamicMapped, Mapped, mapped_column, relationship

from app import db


class Transaction(db.Model):
    """Transaction - tracks buyer, agent, brokerage attribution, and external file linkage."""

    __tablename__ = "transactions"
    __table_args__ = (Index("ix_transactions_buyer_id_updated_at", "buyer_id", "updated_at"),)

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    buyer_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"), nullable=False, index=True)
    primary_agent_id: Mapped[str | None] = mapped_column(db.ForeignKey("users.id"), index=True)
    brokerage_org_id: Mapped[str] = mapped_column(
        db.ForeignKey("brokerage_orgs.id"), nullable=False, index=True
    )
    skyslope_file_id: Mapped[str | None] = mapped_column(db.String(100))
    status: Mapped[str | None] = mapped_column(db.String(32))
    display_label: Mapped[str | None] = mapped_column(db.String(500))
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user_tasks: DynamicMapped["TransactionTask"] = relationship(
        "TransactionTask",
        back_populates="transaction",
        lazy="dynamic",
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
