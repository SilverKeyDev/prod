"""
Event creation orchestration: target resolution, primary + DB creation, agent calendar duplication.
"""

import json
from datetime import datetime, timezone

from app import db
from app.models import CalendarEvent, User
from app.services.agent.client_service import (
    get_user_agent_id,
    validate_agent_client_relationship,
)
from app.services.auth.tokens import tokens_get
from app.services.calendar.core import google_calendar_service
from app.utils.security.app_logging import get_logger

from .google_event_datetime import extract_event_datetimes

logger = get_logger()


def resolve_create_event_target(user_id, event_data, current_user):
    """
    Compute primary calendar target and whether to duplicate in agent calendar(s).
    Returns (primary_target, should_create_in_agent_calendar) on success.
    Returns (response, status_code) on validation failure for the handler to return.
    """
    if not current_user:
        return ("User not found", 404)

    is_agent = current_user.is_agent
    target_user_id = event_data.get("target_user_id")
    create_in_agent_calendar = event_data.get("create_in_agent_calendar", True)

    target_user_id_final = None
    should_create_in_agent_calendar = False

    if target_user_id:
        if is_agent:
            if not validate_agent_client_relationship(user_id, target_user_id):
                return ("Client is not assigned to this agent", 403)
            target_user_id_final = target_user_id
        else:
            agent_id = get_user_agent_id(user_id)
            if not agent_id or agent_id != target_user_id:
                return ("Target user is not your agent", 403)
            target_user_id_final = target_user_id
    else:
        if is_agent:
            target_user_id_final = None
        else:
            agent_id = get_user_agent_id(user_id)
            if agent_id:
                target_user_id_final = None
                should_create_in_agent_calendar = create_in_agent_calendar
            else:
                target_user_id_final = None

    primary_target = target_user_id_final if target_user_id_final else user_id
    return (primary_target, should_create_in_agent_calendar)


def create_primary_event_and_db(
    user_id, event_data, calendar_id, event_type, primary_target, itinerary=None
):
    """Create event in Google and CalendarEvent in DB. Returns (google_event, calendar_event)."""
    google_event = google_calendar_service.create_event(
        user_id,
        event_data.copy(),
        calendar_id,
        target_user_id=primary_target if primary_target != user_id else None,
    )

    start_datetime, end_datetime, timezone_str = extract_event_datetimes(google_event)

    actual_calendar_id = google_event.get("organizer", {}).get("email")
    if primary_target != user_id:
        try:
            target_calendar = google_calendar_service.get_or_create_silverkey_calendar(
                primary_target
            )
            actual_calendar_id = target_calendar.get("id")
        except Exception:
            actual_calendar_id = calendar_id
    else:
        try:
            user_calendar = google_calendar_service.get_or_create_silverkey_calendar(user_id)
            actual_calendar_id = user_calendar.get("id")
        except Exception:
            actual_calendar_id = calendar_id

    calendar_event = CalendarEvent(
        user_id=primary_target,
        calendar_id=actual_calendar_id,
        google_event_id=google_event.get("id"),
        summary=google_event.get("summary", event_data.get("summary", "")),
        description=google_event.get("description") or event_data.get("description"),
        location=google_event.get("location") or event_data.get("location"),
        event_type=event_type,
        creator_id=user_id,
        target_user_id=primary_target if primary_target != user_id else None,
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        timezone=timezone_str,
        attendees=google_event.get("attendees"),
        reminders=google_event.get("reminders"),
        status=google_event.get("status", "confirmed"),
        is_synced=True,
        last_synced_at=datetime.now(timezone.utc),
        sync_source="google",
        itinerary=itinerary,
    )
    calendar_event.calculate_duration()
    db.session.add(calendar_event)
    return (google_event, calendar_event)


def create_in_agent_calendars(
    user_id,
    event_data,
    calendar_id,
    event_type,
    calendar_event,
    should_create,
    is_agent,
    itinerary=None,
):
    """Create event in each agent's calendar and update calendar_event.shared_with_user_ids."""
    if not should_create or is_agent:
        return

    client_user = User.query.filter_by(id=user_id).first()
    agent_ids = []
    if client_user and client_user.agent_id:
        try:
            if isinstance(client_user.agent_id, str):
                try:
                    agent_ids = json.loads(client_user.agent_id)
                except json.JSONDecodeError:
                    agent_ids = [
                        aid.strip() for aid in client_user.agent_id.split(",") if aid.strip()
                    ]
            else:
                agent_ids = client_user.agent_id if isinstance(client_user.agent_id, list) else []
        except Exception as e:
            logger.error("Error parsing agent_id for client %s: %s", user_id, e)

    for agent_id in agent_ids:
        try:
            if not tokens_get(agent_id):
                logger.warning(
                    "Agent %s does not have Google Calendar connected, skipping agent calendar creation",
                    agent_id,
                )
                continue

            agent_event_data = event_data.copy()
            agent_google_event = google_calendar_service.create_event(
                user_id, agent_event_data, calendar_id, target_user_id=agent_id
            )
            agent_start, agent_end, agent_tz = extract_event_datetimes(agent_google_event)

            try:
                agent_calendar = google_calendar_service.get_or_create_silverkey_calendar(agent_id)
                agent_calendar_id = agent_calendar.get("id")
            except Exception:
                agent_calendar_id = calendar_id

            agent_calendar_event = CalendarEvent(
                user_id=agent_id,
                calendar_id=agent_calendar_id,
                google_event_id=agent_google_event.get("id"),
                summary=agent_google_event.get("summary", event_data.get("summary", "")),
                description=agent_google_event.get("description") or event_data.get("description"),
                location=agent_google_event.get("location") or event_data.get("location"),
                event_type=event_type,
                creator_id=user_id,
                target_user_id=agent_id,
                shared_with_user_ids=[user_id],
                start_datetime=agent_start,
                end_datetime=agent_end,
                timezone=agent_tz,
                attendees=agent_google_event.get("attendees"),
                reminders=agent_google_event.get("reminders"),
                status=agent_google_event.get("status", "confirmed"),
                is_synced=True,
                last_synced_at=datetime.now(timezone.utc),
                sync_source="google",
                itinerary=itinerary,
            )
            agent_calendar_event.calculate_duration()
            db.session.add(agent_calendar_event)

            if calendar_event:
                if calendar_event.shared_with_user_ids is None:
                    calendar_event.shared_with_user_ids = []
                elif not isinstance(calendar_event.shared_with_user_ids, list):
                    calendar_event.shared_with_user_ids = [calendar_event.shared_with_user_ids]
                if agent_id not in calendar_event.shared_with_user_ids:
                    calendar_event.shared_with_user_ids.append(agent_id)

            logger.info("Event also created in agent %s's calendar", agent_id)
        except Exception as e:
            logger.error(
                "Error creating event in agent %s's calendar: %s", agent_id, e, exc_info=True
            )


def get_client_events_permission_error(client_id):
    """Build the 403 body for list_client_events when client lacks calendar_app_created."""
    from app.services.auth.tokens import tokens_get
    from app.services.calendar.permissions import check_permission
    from app.services.calendar.permissions.constants import permissions

    has_permission = check_permission(client_id, "calendar_app_created")
    if has_permission:
        return None

    perm_data = permissions.get("calendar_app_created", {})
    description = perm_data.get("description", "Access calendar events")
    client_token_data = tokens_get(client_id)
    client_has_connection = client_token_data is not None

    if client_has_connection:
        error_message = (
            f"This client has connected their Google Calendar, but hasn't granted "
            f"the necessary permission ({description}). "
            f"The client needs to reconnect their Google Calendar account and grant "
            f"all requested permissions to enable event queries."
        )
    else:
        error_message = (
            f"This client hasn't connected their Google Calendar account yet. "
            f"Please ask them to connect their Google Calendar and grant the "
            f"necessary permissions ({description}) to enable event queries."
        )

    return {
        "success": False,
        "error": "client_permission_required",
        "message": error_message,
        "required_permission": "calendar_app_created",
        "client_id": client_id,
        "client_has_connection": client_has_connection,
    }
