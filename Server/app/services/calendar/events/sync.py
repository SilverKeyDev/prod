"""
Calendar event database synchronization helpers.

Provides utilities for syncing Google Calendar event updates and deletions
to the CalendarEvent database table.
"""

from datetime import datetime, timezone

from sqlalchemy import select

from app import db
from app.models import CalendarEvent
from logger import log

from .creation import meet_fields_from_google_response
from .google_event_datetime import extract_event_datetimes


def sync_event_to_db(
    event_id: str,
    google_event: dict,
    user_id: str,
    *,
    add_google_meet: bool | None = None,
) -> CalendarEvent | None:
    """
    Update CalendarEvent in database from Google Calendar event data.

    Args:
        event_id: Google Calendar event ID
        google_event: Google Calendar event data dict
        user_id: User ID who owns the event

    Returns:
        Updated CalendarEvent instance or None if not found
    """
    try:
        calendar_event = db.session.scalar(
            select(CalendarEvent).where(
                CalendarEvent.google_event_id == event_id, CalendarEvent.user_id == user_id
            )
        )
        if not calendar_event:
            log.warn(
                "CALENDAR",
                f"CalendarEvent not found for google_event_id={event_id}, user_id={user_id}",
            )
            return None
        start_datetime, end_datetime, timezone_str = extract_event_datetimes(google_event)
        calendar_event.summary = google_event.get("summary", calendar_event.summary)
        calendar_event.description = google_event.get("description")
        calendar_event.location = google_event.get("location")
        if start_datetime:
            calendar_event.start_datetime = start_datetime
        if end_datetime:
            calendar_event.end_datetime = end_datetime
        if timezone_str:
            calendar_event.timezone = timezone_str
        calendar_event.attendees = google_event.get("attendees")
        calendar_event.reminders = google_event.get("reminders")
        calendar_event.status = google_event.get("status", "confirmed")

        if add_google_meet is False:
            calendar_event.meet_url = None
            calendar_event.conference_status = None
        else:
            meet_requested = add_google_meet is True or calendar_event.conference_status is not None
            meet_url, conference_status = meet_fields_from_google_response(
                google_event, meet_requested
            )
            if add_google_meet is True or calendar_event.conference_status is not None:
                calendar_event.meet_url = meet_url
                calendar_event.conference_status = conference_status

        calendar_event.calculate_duration()
        calendar_event.is_synced = True
        calendar_event.last_synced_at = datetime.now(timezone.utc)
        calendar_event.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        log.info(
            "CALENDAR",
            f"Successfully synced event to DB: google_event_id={event_id}, user_id={user_id}",
        )
        return calendar_event
    except Exception as e:
        log.error(
            "ERRORS",
            f"Error syncing event to DB: google_event_id={event_id}, user_id={user_id}, error={e}",
            e,
        )
        db.session.rollback()
        raise


def delete_event_from_db(event_id: str, user_id: str) -> bool:
    """
    Delete CalendarEvent from database.

    Args:
        event_id: Google Calendar event ID
        user_id: User ID who owns the event

    Returns:
        True if event was deleted, False if not found
    """
    try:
        calendar_event = db.session.scalar(
            select(CalendarEvent).where(
                CalendarEvent.google_event_id == event_id, CalendarEvent.user_id == user_id
            )
        )
        if not calendar_event:
            log.warn(
                "CALENDAR",
                f"CalendarEvent not found for deletion: google_event_id={event_id}, user_id={user_id}",
            )
            return False
        db.session.delete(calendar_event)
        db.session.commit()
        log.info(
            "CALENDAR",
            f"Successfully deleted event from DB: google_event_id={event_id}, user_id={user_id}",
        )
        return True
    except Exception as e:
        log.error(
            "ERRORS",
            f"Error deleting event from DB: google_event_id={event_id}, user_id={user_id}, error={e}",
            e,
        )
        db.session.rollback()
        raise
