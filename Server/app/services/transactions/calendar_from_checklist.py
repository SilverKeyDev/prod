"""Create calendar events when checklist items are checked off (relative-day schedule)."""

from datetime import datetime, timedelta, timezone

from app import db
from app.models import CalendarEvent

from .retrieval import get_checklist_definition


def create_calendar_events_for_checklist_item(
    user_id: str,
    checklist_type: str,
    item_id: int,
    checkoff_time: datetime,
) -> None:
    """
    Create calendar event(s) for a checklist item based on its calendar config.

    When item has calendar.hasDates=False and calendar.days/eventSchedule,
    creates event(s) at checkoff_time + N days (e.g. "Deposit earnest money in 3 days").
    Events are stored locally (CalendarEvent) with sync_source="checklist".
    """
    items = get_checklist_definition(checklist_type)
    item = next((i for i in items if i.get("id") == item_id), None)
    if not item:
        return

    cal = item.get("calendar")
    if not cal or cal.get("hasDates") is True:
        return

    days_list = cal.get("eventSchedule")
    if not days_list and cal.get("days") is not None:
        days_list = [cal["days"]]
    if not days_list:
        return

    label = item.get("label", f"Checklist item {item_id}")
    for days_offset in days_list:
        try:
            days_int = int(days_offset)
        except (TypeError, ValueError):
            continue

        event_start = checkoff_time + timedelta(days=days_int)
        # Default to 9:00 AM if checkoff_time has no time component
        if event_start.hour == 0 and event_start.minute == 0:
            event_start = event_start.replace(hour=9, minute=0, second=0, microsecond=0)
        event_end = event_start + timedelta(hours=1)

        event = CalendarEvent(
            user_id=user_id,
            calendar_id=None,
            google_event_id=None,
            summary=label,
            description=item.get("explanation"),
            location=None,
            event_type=f"checklist_{checklist_type}",
            creator_id=user_id,
            target_user_id=None,
            start_datetime=event_start,
            end_datetime=event_end,
            timezone="UTC",
            status="confirmed",
            is_synced=False,
            sync_source="checklist",
        )
        event.calculate_duration()
        db.session.add(event)

    db.session.commit()
