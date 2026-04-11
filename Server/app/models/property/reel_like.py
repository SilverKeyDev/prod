"""Reel/feed like by (user_id, home_id). Requires migration to create reel_likes table."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class ReelLike(db.Model):
    """Like on a feed reel item keyed by home_id (listing id)."""

    __tablename__ = "reel_likes"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(db.String(36))
    home_id: Mapped[str] = mapped_column(db.String(64), index=True)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "home_id": self.home_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
