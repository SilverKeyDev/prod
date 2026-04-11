"""One-to-one admin flag per user (separate from user_roles)."""

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class UserAdmin(db.Model):
    __tablename__ = "user_admin"

    user_id: Mapped[str] = mapped_column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    is_admin: Mapped[bool] = mapped_column(
        db.Boolean,
        default=False,
        server_default=db.text("false"),
    )

    user = db.relationship("User", backref=db.backref("user_admin", uselist=False))
