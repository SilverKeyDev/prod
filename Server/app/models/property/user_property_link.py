"""Per-user relationship to a shared property (favorites, scoring, search state)."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class UserPropertyLink(db.Model):
    """Junction table linking a user to a shared PropertyCache row.

    Replaces the per-user columns that lived on HomeUniversal (is_liked, current,
    score, ranking).  One row per (user, property).
    """

    __tablename__ = "user_property_link"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )
    property_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("property_cache.id"), nullable=False, index=True
    )

    is_liked: Mapped[bool] = mapped_column(
        db.Boolean, default=False, server_default=db.text("false")
    )
    current: Mapped[bool] = mapped_column(db.Boolean, default=True, server_default=db.text("true"))
    score: Mapped[float | None] = mapped_column(db.Float)
    ranking: Mapped[int | None] = mapped_column(db.Integer)

    created_at: Mapped[datetime | None] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime | None] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (db.UniqueConstraint("user_id", "property_id", name="uq_user_property_link"),)
