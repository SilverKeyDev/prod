"""Important locations (structured, geo-ready). Replaces important_locations JSON. lat/lng nullable for later geocoding."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class UserImportantLocation(db.Model):
    __tablename__ = "user_important_locations"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))
    label: Mapped[str | None] = mapped_column(db.String(100))  # work, gym, partner, etc.
    address: Mapped[str | None] = mapped_column(db.String(500))
    lat: Mapped[float | None] = mapped_column(db.Float)
    lng: Mapped[float | None] = mapped_column(db.Float)
    max_commute_minutes: Mapped[int | None] = mapped_column(db.Integer)
    commute_mode: Mapped[str | None] = mapped_column(db.String(20))  # drive, transit, bike
    created_at: Mapped[datetime | None] = mapped_column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship("User", back_populates="user_important_locations")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
