"""UserIntegration - Per-user OAuth tokens and integration state."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class UserIntegration(db.Model):
    """User's integration with external providers (OAuth tokens per user)."""

    __tablename__ = "user_integrations"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(db.String(36), db.ForeignKey("users.id"), index=True)
    provider: Mapped[str] = mapped_column(db.String(50), index=True)
    access_token: Mapped[str] = mapped_column(db.Text)
    refresh_token: Mapped[str | None] = mapped_column(db.Text)
    expires_at: Mapped[datetime | None] = mapped_column(db.DateTime)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (db.UniqueConstraint("user_id", "provider", name="uq_user_provider"),)
