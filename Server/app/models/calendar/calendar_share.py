# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class CalendarShare(db.Model):
    """Represents a calendar sharing relationship between users"""

    __tablename__ = "calendar_shares"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    calendar_owner_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))
    shared_with_user_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))
    calendar_id: Mapped[str] = mapped_column(db.String(255))  # Google Calendar ID
    role: Mapped[str] = mapped_column(
        db.String(20), default="writer"
    )  # "reader", "writer", "owner"
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    calendar_owner: Mapped["User"] = relationship(
        "User",
        foreign_keys=[calendar_owner_id],
        back_populates="shared_calendars",
    )
    shared_with_user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[shared_with_user_id],
        back_populates="calendars_shared_with_me",
    )

    # Unique constraint: one calendar can only be shared with a user once
    __table_args__ = (
        db.UniqueConstraint(
            "calendar_owner_id", "shared_with_user_id", "calendar_id", name="unique_calendar_share"
        ),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def __repr__(self):
        return (
            f"<CalendarShare {self.calendar_owner_id} -> {self.shared_with_user_id} ({self.role})>"
        )
