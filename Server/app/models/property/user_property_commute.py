"""Per-user commute data for a property."""

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class UserPropertyCommute(db.Model):
    """User-specific commute data for a property.

    Commute travel-times and map URLs depend on the user's important_locations,
    so they must be stored per-user.  Regenerated when the user's locations change.
    """

    __tablename__ = "user_property_commute"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )
    property_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("property_cache.id"), nullable=False, index=True
    )

    commute_data: Mapped[dict[str, Any] | None] = mapped_column(db.JSON)

    generated_at: Mapped[datetime | None] = mapped_column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        db.UniqueConstraint("user_id", "property_id", name="uq_user_property_commute"),
    )
