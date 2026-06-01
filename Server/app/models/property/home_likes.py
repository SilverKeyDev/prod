import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class HomeLikes(db.Model):
    """Represents a residential property with like/unlike history tracking."""

    __tablename__ = "home_likes"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(db.String(36))
    is_liked: Mapped[bool] = mapped_column(
        db.Boolean, default=False, server_default=db.text("false")
    )

    # Like/unlike history - array of timestamps when liked/unliked
    like_history: Mapped[list[Any] | None] = mapped_column(
        db.JSON, default=list
    )  # Array of {"timestamp": "...", "action": "liked"|"unliked"}

    # Basic address and summary fields
    address: Mapped[str | None] = mapped_column(db.String(500))

    # Identifiers and metadata
    zpid: Mapped[str | None] = mapped_column(db.String(64))
    mls_home_id: Mapped[str | None] = mapped_column(db.String(64))

    # Ranking/Scoring
    score: Mapped[float | None] = mapped_column(db.Float)

    # Geo
    latitude: Mapped[float | None] = mapped_column(db.Float)
    longitude: Mapped[float | None] = mapped_column(db.Float)

    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.like_history is None:
            self.like_history = []

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "address": self.address,
            "isLiked": self.is_liked,
            "like_history": self.like_history,
            "score": self.score,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "zpid": self.zpid,
            "mls_home_id": self.mls_home_id,
            "latitude": self.latitude,
            "longitude": self.longitude,
        }
