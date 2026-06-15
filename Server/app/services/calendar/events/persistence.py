"""Persist calendar event mutations after Google API orchestration."""

from app import db
from logger import log


def commit_created_calendar_events(
    calendar_event,
    *,
    user_id: str,
    primary_target: str,
) -> None:
    """Commit pending CalendarEvent rows after create + agent duplication."""
    try:
        db.session.commit()
        log.info(
            "CALENDAR",
            "event_created",
            {
                "event_id": str(calendar_event.id),
                "user_id": str(user_id),
                "primary_target": primary_target,
            },
        )
    except Exception:
        db.session.rollback()
        raise
