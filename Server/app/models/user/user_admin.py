"""One-to-one admin flag per user (separate from user_roles)."""

from app import db


class UserAdmin(db.Model):
    __tablename__ = "user_admin"

    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    is_admin = db.Column(
        db.Boolean,
        nullable=False,
        default=False,
        server_default=db.text("false"),
    )

    user = db.relationship("User", backref=db.backref("user_admin", uselist=False))
