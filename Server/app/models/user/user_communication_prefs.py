"""Communication preferences (1:1)."""

from datetime import datetime

from app import db


class UserCommunicationPrefs(db.Model):
    __tablename__ = "user_communication_prefs"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), primary_key=True)
    communication_frequency = db.Column(db.String(50), nullable=True)
    information_detail_level = db.Column(db.String(50), nullable=True)
    has_buyers_agent = db.Column(db.String(10), nullable=True)  # yes / no
    looking_for_buyers_agent = db.Column(db.Boolean, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=True)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True
    )

    user = db.relationship(
        "User", backref=db.backref("user_communication_prefs", uselist=False, lazy="select")
    )
