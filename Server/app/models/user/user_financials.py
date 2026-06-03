"""Financial profile (queried a lot). Indexes: (home_budget_min, home_budget_max), credit_score_range in migration."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class UserFinancials(db.Model):
    __tablename__ = "user_financials"

    user_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"), primary_key=True)
    gross_income: Mapped[float | None] = mapped_column(db.Float)
    home_budget_min: Mapped[float | None] = mapped_column(db.Float)
    home_budget_max: Mapped[float | None] = mapped_column(db.Float)
    credit_score_range: Mapped[str | None] = mapped_column(db.String(20))
    down_payment: Mapped[float | None] = mapped_column(db.Float)
    created_at: Mapped[datetime | None] = mapped_column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship("User", back_populates="user_financials")
