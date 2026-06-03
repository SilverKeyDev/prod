"""Helpers for enriching Google Calendar API responses with SilverKey DB fields."""

from sqlalchemy import select

from app import db
from app.models.calendar.calendar_event import CalendarEvent


def enrich_events_with_db_itinerary(user_id: str, events: list) -> None:
    """Attach SilverKey DB itinerary to Google event dicts when present."""
    if not events or not isinstance(events, list):
        return
    ids = [e.get("id") for e in events if isinstance(e, dict) and e.get("id")]
    if not ids:
        return
    rows = db.session.scalars(
        select(CalendarEvent).where(
            CalendarEvent.user_id == user_id,
            CalendarEvent.google_event_id.in_(ids),
        )
    ).all()
    by_gid = {r.google_event_id: r for r in rows if r.google_event_id}
    for ev in events:
        if not isinstance(ev, dict):
            continue
        gid = ev.get("id")
        row = by_gid.get(gid) if gid else None
        if not row:
            continue
        if row.itinerary:
            ev["itinerary"] = row.itinerary
        if row.event_type:
            ev["silverKeyEventType"] = row.event_type
