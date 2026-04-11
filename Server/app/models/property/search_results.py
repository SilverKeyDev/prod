import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

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

    # relationships
    user = db.relationship("User", backref=db.backref("search_sessions", lazy="dynamic"))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "query_params": self.query_params,
            "mls_home_id": self.mls_home_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
