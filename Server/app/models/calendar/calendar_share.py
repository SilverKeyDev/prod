import uuid
from datetime import datetime

from app import db


class CalendarShare(db.Model):
    """Represents a calendar sharing relationship between users"""

    __tablename__ = "calendar_shares"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    calendar_owner_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    shared_with_user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    calendar_id = db.Column(db.String(255), nullable=False)  # Google Calendar ID
    role = db.Column(db.String(20), default="writer")  # "reader", "writer", "owner"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    calendar_owner = db.relationship(
        "User", foreign_keys=[calendar_owner_id], backref=db.backref("shared_calendars", lazy=True)
    )
    shared_with_user = db.relationship(
        "User",
        foreign_keys=[shared_with_user_id],
        backref=db.backref("calendars_shared_with_me", lazy=True),
    )

    # Unique constraint: one calendar can only be shared with a user once
    __table_args__ = (
        db.UniqueConstraint(
            "calendar_owner_id", "shared_with_user_id", "calendar_id", name="unique_calendar_share"
        ),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def to_dict(self):
        """Convert share to dictionary"""
        return {
            "id": self.id,
            "calendar_owner_id": self.calendar_owner_id,
            "shared_with_user_id": self.shared_with_user_id,
            "calendar_id": self.calendar_id,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return (
            f"<CalendarShare {self.calendar_owner_id} -> {self.shared_with_user_id} ({self.role})>"
        )
