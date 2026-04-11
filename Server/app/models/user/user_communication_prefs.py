"""Communication preferences (1:1)."""

from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class UserCommunicationPrefs(db.Model):
    __tablename__ = "user_communication_prefs"

    user_id: Mapped[str] = mapped_column(db.String(36), db.ForeignKey("users.id"), primary_key=True)
    communication_frequency: Mapped[str | None] = mapped_column(db.String(50))
    information_detail_level: Mapped[str | None] = mapped_column(db.String(50))
    has_buyers_agent: Mapped[str | None] = mapped_column(db.String(10))  # yes / no
    looking_for_buyers_agent: Mapped[bool | None] = mapped_column(db.Boolean)
    created_at: Mapped[datetime | None] = mapped_column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = db.relationship(
        "User", backref=db.backref("user_communication_prefs", uselist=False, lazy="select")
    )
