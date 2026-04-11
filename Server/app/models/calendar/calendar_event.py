import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class CalendarEvent(db.Model):
    """Represents a calendar event stored in the database"""

    __tablename__ = "calendar_events"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))
    calendar_id: Mapped[str | None] = mapped_column(
        db.String(255)
    )  # Google Calendar ID (e.g., "primary" or calendar ID)

    # Event identification
    google_event_id: Mapped[str | None] = mapped_column(
        db.String(255), unique=True
    )  # Google Calendar event ID
    summary: Mapped[str] = mapped_column(db.String(500))  # Event title
    description: Mapped[str | None] = mapped_column(db.Text)
    location: Mapped[str | None] = mapped_column(db.String(500))

    # Event type/category
    event_type: Mapped[str | None] = mapped_column(
        db.String(100)
    )  # e.g., "property_viewing", "inspection", "closing", "meeting", etc.

    # Creator information
    creator_id: Mapped[str] = mapped_column(
        db.ForeignKey("users.id")
    )  # ID of user who created the event

    # Calendar sharing information
    target_user_id: Mapped[str | None] = mapped_column(
        db.ForeignKey("users.id")
    )  # ID of user whose calendar the event was created in (if different from creator)
    shared_with_user_ids: Mapped[list[Any] | None] = mapped_column(
        db.JSON
    )  # Array of user IDs the event is shared with (for tracking bidirectional sharing with multiple users)

    # Date and time (all-day Google events: naive UTC, start=midnight first day, end=last inclusive day 23:59:59.999999)
    start_datetime: Mapped[datetime] = mapped_column(db.DateTime)
    end_datetime: Mapped[datetime] = mapped_column(db.DateTime)
    timezone: Mapped[str] = mapped_column(db.String(100), default="UTC")

    # Duration (calculated field, stored for convenience)
    duration_minutes: Mapped[int | None] = mapped_column(db.Integer)  # Duration in minutes

    # Attendees (stored as JSON)
    attendees: Mapped[list[Any] | None] = mapped_column(
        db.JSON
    )  # List of attendee objects with email, displayName, etc.

    # Reminders
    reminders: Mapped[dict[str, Any] | None] = mapped_column(db.JSON)  # Reminder settings

    # Event status
    status: Mapped[str] = mapped_column(
        db.String(50), default="confirmed"
    )  # confirmed, tentative, cancelled

    # Sync information
    is_synced: Mapped[bool] = mapped_column(default=False)
    last_synced_at: Mapped[datetime | None] = mapped_column(db.DateTime)
    sync_source: Mapped[str] = mapped_column(db.String(50), default="google")  # google, local, etc.

    # Metadata
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = db.relationship(
        "User", foreign_keys=[user_id], backref=db.backref("calendar_events", lazy=True)
    )
    creator = db.relationship(
        "User", foreign_keys=[creator_id], backref=db.backref("created_events", lazy=True)
    )
    target_user = db.relationship(
        "User",
        foreign_keys=[target_user_id],
        backref=db.backref("target_calendar_events", lazy=True),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

        # Calculate duration if start and end are provided
        if self.start_datetime and self.end_datetime and not self.duration_minutes:
            delta = self.end_datetime - self.start_datetime
            self.duration_minutes = int(delta.total_seconds() / 60)

    def calculate_duration(self):
        """Calculate and update duration based on start and end datetime"""
        if self.start_datetime and self.end_datetime:
            delta = self.end_datetime - self.start_datetime
            self.duration_minutes = int(delta.total_seconds() / 60)
            return self.duration_minutes
        return None

    def to_dict(self):
        """Convert event to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "calendar_id": self.calendar_id,
            "google_event_id": self.google_event_id,
            "summary": self.summary,
            "description": self.description,
            "location": self.location,
            "event_type": self.event_type,
            "creator_id": self.creator_id,
            "target_user_id": self.target_user_id,
            "shared_with_user_ids": self.shared_with_user_ids,
            "start_datetime": self.start_datetime.isoformat() if self.start_datetime else None,
            "end_datetime": self.end_datetime.isoformat() if self.end_datetime else None,
            "timezone": self.timezone,
            "duration_minutes": self.duration_minutes,
            "attendees": self.attendees,
            "reminders": self.reminders,
            "status": self.status,
            "is_synced": self.is_synced,
            "last_synced_at": self.last_synced_at.isoformat() if self.last_synced_at else None,
            "sync_source": self.sync_source,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<CalendarEvent {self.summary} - {self.start_datetime}>"
