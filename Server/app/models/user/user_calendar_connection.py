"""Calendar connections (1:N). Replaces disabled_calendars JSON."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class UserCalendarConnection(db.Model):
    __tablename__ = "user_calendar_connections"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))
    provider: Mapped[str] = mapped_column(db.String(50))  # e.g. google
    calendar_id: Mapped[str] = mapped_column(db.String(255))
    is_enabled: Mapped[bool] = mapped_column(default=True)
    last_synced_at: Mapped[datetime | None] = mapped_column(db.DateTime)
    status: Mapped[str | None] = mapped_column(db.String(50))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates="user_calendar_connections")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
