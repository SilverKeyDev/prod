"""Per-user property highlights (pros/cons and match context)."""

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class UserPropertyHighlights(db.Model):
    """User-specific highlights for a property.

    Generated WITH user preferences — each user gets their own pros/cons and
    match score.  Invalidated when *analysis_cache_signature* no longer matches
    the user's current preference fingerprint.
    """

    __tablename__ = "user_property_highlights"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )
    property_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("property_cache.id"), nullable=False, index=True
    )

    pros: Mapped[dict[str, Any] | None] = mapped_column(db.JSON)
    cons: Mapped[dict[str, Any] | None] = mapped_column(db.JSON)
    highlights_context: Mapped[dict[str, Any] | None] = mapped_column(db.JSON)
    analysis_cache_signature: Mapped[str | None] = mapped_column(db.String(255))

    generated_at: Mapped[datetime | None] = mapped_column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        db.UniqueConstraint("user_id", "property_id", name="uq_user_property_highlights"),
    )
