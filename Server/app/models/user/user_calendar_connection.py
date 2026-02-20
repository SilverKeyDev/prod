"""Calendar connections (1:N). Replaces disabled_calendars JSON."""

import uuid
from datetime import datetime

from app import db


class UserCalendarConnection(db.Model):
    __tablename__ = "user_calendar_connections"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    provider = db.Column(db.String(50), nullable=False)  # e.g. google
    calendar_id = db.Column(db.String(255), nullable=False)
    is_enabled = db.Column(db.Boolean, default=True, nullable=False)
    last_synced_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("user_calendar_connections", lazy="dynamic"))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
