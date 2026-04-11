"""Demographics (rarely changes). Name stays on users; do not duplicate."""

from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class UserDemographics(db.Model):
    __tablename__ = "user_demographics"

    user_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"), primary_key=True)
    age: Mapped[int | None] = mapped_column(db.Integer)
    pets: Mapped[str | None] = mapped_column(db.String(100))
    occupation: Mapped[str | None] = mapped_column(db.String(100))
    gender: Mapped[str | None] = mapped_column(db.String(50))
    why_joining_silverkey: Mapped[str | None] = mapped_column(db.Text)  # JSON array of strings
    created_at: Mapped[datetime | None] = mapped_column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = db.relationship(
        "User", backref=db.backref("user_demographics", uselist=False, lazy="select")
    )
