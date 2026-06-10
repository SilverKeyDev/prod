"""Transaction checklist progress. One row per transaction/category or per completed item."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class TransactionTask(db.Model):
    __tablename__ = "user_tasks"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    transaction_id: Mapped[str] = mapped_column(
        db.ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"), index=True)
    category: Mapped[str] = mapped_column(db.String(50))
    title: Mapped[str] = mapped_column(db.String(500))
    status: Mapped[str] = mapped_column(db.String(20), default="todo")
    due_date: Mapped[datetime | None] = mapped_column(db.DateTime)
    order_index: Mapped[int | None] = mapped_column(db.Integer)
    task_metadata: Mapped[dict[str, Any] | None] = mapped_column("metadata", db.JSON)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    transaction: Mapped["Transaction"] = relationship("Transaction", back_populates="user_tasks")
    user: Mapped["User"] = relationship("User", back_populates="user_tasks")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
