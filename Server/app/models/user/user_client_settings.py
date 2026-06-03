"""Per-user client UI settings (JSON document for layout, calendar view, drafts)."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class UserClientSettings(db.Model):
    __tablename__ = "user_client_settings"

    user_id: Mapped[str] = mapped_column(db.String(36), db.ForeignKey("users.id"), primary_key=True)
    settings: Mapped[dict[str, Any]] = mapped_column(
        JSONB().with_variant(db.JSON, "sqlite"), nullable=False, default=dict
    )
    schema_version: Mapped[int] = mapped_column(db.Integer, nullable=False, default=1)
    created_at: Mapped[datetime | None] = mapped_column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship("User", back_populates="user_client_settings")
