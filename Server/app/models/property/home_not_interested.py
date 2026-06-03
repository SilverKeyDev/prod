# pyright: reportUndefinedVariable=false
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class HomeNotInterested(db.Model):
    """Represents a residential property with not interested/undo history tracking."""

    __tablename__ = "home_not_interested"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(db.String(36))
    is_not_interested: Mapped[bool] = mapped_column(
        db.Boolean, default=False, server_default=db.text("false")
    )

    # Not interested/undo history - array of timestamps when marked/undone
    not_interested_history: Mapped[list[Any] | None] = mapped_column(
        db.JSON, default=list
    )  # Array of {"timestamp": "...", "action": "not_interested"|"undo", "why": "..."}

    # Reason why not interested (optional)
    why: Mapped[str | None] = mapped_column(db.String(500))  # Reason selected or custom text

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
        if self.not_interested_history is None:
            self.not_interested_history = []
