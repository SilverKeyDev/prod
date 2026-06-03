# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db

# -------------------------
# Users already defined by you
# -------------------------
# class User(db.Model): ...


# =========================
# Search session: one row per search run
# =========================
class Search(db.Model):
    __tablename__ = "search_session"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(db.String(36), db.ForeignKey("users.id"))
    query_params: Mapped[dict[str, Any]] = mapped_column(JSONB().with_variant(db.JSON, "sqlite"))
    mls_home_id: Mapped[str | None] = mapped_column(db.String(64))
    created_at: Mapped[datetime | None] = mapped_column(default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="search_sessions")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
