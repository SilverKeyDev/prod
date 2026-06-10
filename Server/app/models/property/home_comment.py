"""Comment on a feed reel item keyed by home_id. Requires migration to create home_comments table."""

# pyright: reportUndefinedVariable=false
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class HomeComment(db.Model):
    """Comment on a feed listing (reel) keyed by home_id."""

    __tablename__ = "home_comments"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    home_id: Mapped[str] = mapped_column(db.String(64), index=True)
    user_id: Mapped[str] = mapped_column(db.String(36))
    text: Mapped[str] = mapped_column(db.Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
