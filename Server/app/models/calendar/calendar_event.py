# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Mapped, mapped_column, relationship

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

    # Multi-stop viewing itinerary (app-only; not synced from Google)
    itinerary: Mapped[dict[str, Any] | None] = mapped_column(db.JSON)

    # Google Meet (optional; from Calendar API hangoutLink / provisioning)
    meet_url: Mapped[str | None] = mapped_column(db.Text)
    conference_status: Mapped[str | None] = mapped_column(
        db.String(32)
    )  # pending | success | failure

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

    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="calendar_events",
    )
    creator: Mapped["User"] = relationship(
        "User",
        foreign_keys=[creator_id],
        back_populates="created_events",
    )
    target_user: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[target_user_id],
        back_populates="target_calendar_events",
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

    def __repr__(self):
        return f"<CalendarEvent {self.summary} - {self.start_datetime}>"
