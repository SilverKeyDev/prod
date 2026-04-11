"""
Calendar event database synchronization helpers.

Provides utilities for syncing Google Calendar event updates and deletions
to the CalendarEvent database table.
"""

from datetime import datetime, timezone

from app import db
from app.models import CalendarEvent
from app.utils.security.app_logging import get_logger

from .google_event_datetime import extract_event_datetimes

logger = get_logger()


def sync_event_to_db(event_id: str, google_event: dict, user_id: str) -> CalendarEvent | None:
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
        # Find the calendar event by google_event_id
        calendar_event = CalendarEvent.query.filter_by(
            google_event_id=event_id, user_id=user_id
        ).first()

        if not calendar_event:
            logger.warning(
                "CalendarEvent not found for google_event_id=%s, user_id=%s", event_id, user_id
            )
            return None

        # Extract datetime information
        start_datetime, end_datetime, timezone_str = extract_event_datetimes(google_event)

        # Update fields from Google event data
        calendar_event.summary = google_event.get("summary", calendar_event.summary)
        calendar_event.description = google_event.get("description")
        calendar_event.location = google_event.get("location")

        # Update datetime fields
        if start_datetime:
            calendar_event.start_datetime = start_datetime
        if end_datetime:
            calendar_event.end_datetime = end_datetime
        if timezone_str:
            calendar_event.timezone = timezone_str

        # Update attendees and reminders
        calendar_event.attendees = google_event.get("attendees")
        calendar_event.reminders = google_event.get("reminders")

        # Update status
        calendar_event.status = google_event.get("status", "confirmed")

        # Recalculate duration
        calendar_event.calculate_duration()

        # Update sync metadata
        calendar_event.is_synced = True
        calendar_event.last_synced_at = datetime.now(timezone.utc)
        calendar_event.updated_at = datetime.now(timezone.utc)

        db.session.commit()

        logger.info(
            "Successfully synced event to DB: google_event_id=%s, user_id=%s", event_id, user_id
        )
        return calendar_event

    except Exception as e:
        logger.error(
            "Error syncing event to DB: google_event_id=%s, user_id=%s, error=%s",
            event_id,
            user_id,
            e,
            exc_info=True,
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
        calendar_event = CalendarEvent.query.filter_by(
            google_event_id=event_id, user_id=user_id
        ).first()

        if not calendar_event:
            logger.warning(
                "CalendarEvent not found for deletion: google_event_id=%s, user_id=%s",
                event_id,
                user_id,
            )
            return False

        db.session.delete(calendar_event)
        db.session.commit()

        logger.info(
            "Successfully deleted event from DB: google_event_id=%s, user_id=%s", event_id, user_id
        )
        return True

    except Exception as e:
        logger.error(
            "Error deleting event from DB: google_event_id=%s, user_id=%s, error=%s",
            event_id,
            user_id,
            e,
            exc_info=True,
        )
        db.session.rollback()
        raise
