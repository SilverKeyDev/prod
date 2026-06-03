"""
Agent-client bidirectional calendar sharing.
"""

from googleapiclient.discovery import build
from sqlalchemy import select

from app.utils.security.security import log_oauth_event, sanitize_error_message
from logger import log

from ..core.credentials import load_credentials
from ..permissions import check_permission
from .sharing import add_calendar_acl


def setup_agent_client_calendar_sharing(
    agent_id: str,
    client_id: str,
    agent_email: str,
    client_email: str,
    client_id_oauth: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
    get_or_create_silverkey_calendar_func,
    db_session=None,
) -> dict:
    """Set up bidirectional calendar sharing between agent and client

    This function:
    1. Gets or creates SilverKey calendars for both agent and client
    2. Sets up ACL so agent's calendar is shared with client (writer access)
    3. Sets up ACL so client's calendar is shared with agent (writer access)
    4. Stores sharing relationships in database

    Args:
        agent_id: Agent user ID
        client_id: Client user ID
        agent_email: Agent's email address
        client_email: Client's email address
        client_id_oauth: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        get_or_create_silverkey_calendar_func: Function to get or create SilverKey calendar
        db_session: Database session (optional, will import if not provided)

    Returns:
        Dictionary with status and any errors encountered
    """
    if db_session is None:
        from app import db

        db_session = db.session
    from app.models.calendar.calendar_share import CalendarShare

    result = {
        "success": True,
        "agent_calendar_shared": False,
        "client_calendar_shared": False,
        "errors": [],
    }
    try:
        from app.services.auth.tokens import tokens_get

        agent_tokens = tokens_get(agent_id)
        client_tokens = tokens_get(client_id)
        if not agent_tokens:
            result["errors"].append(f"Agent {agent_id} does not have Google Calendar connected")
            result["success"] = False
            log.warn("CALENDAR", f"Cannot set up calendar sharing: agent {agent_id} not connected")
            return result
        if not client_tokens:
            result["errors"].append(f"Client {client_id} does not have Google Calendar connected")
            result["success"] = False
            log.warn(
                "CALENDAR", f"Cannot set up calendar sharing: client {client_id} not connected"
            )
            return result
        if not check_permission(agent_id, "calendar_app_created"):
            result["errors"].append(
                "Agent must connect Google Calendar with app calendar access to set up sharing (ACLs)"
            )
            result["success"] = False
            return result
        if not check_permission(client_id, "calendar_app_created"):
            result["errors"].append(
                "Client must connect Google Calendar with app calendar access to set up sharing (ACLs)"
            )
            result["success"] = False
            return result
        try:
            agent_calendar = get_or_create_silverkey_calendar_func(agent_id)
            agent_calendar_id = agent_calendar.get("id")
            log.info(
                "CALENDAR",
                f"Got/created SilverKey calendar {agent_calendar_id} for agent {agent_id}",
            )
        except Exception as e:
            error_msg = sanitize_error_message(e)
            result["errors"].append(f"Failed to get/create agent calendar: {error_msg}")
            log.error("ERRORS", f"Error getting/creating agent calendar: {error_msg}")
            result["success"] = False
            return result
        try:
            client_calendar = get_or_create_silverkey_calendar_func(client_id)
            client_calendar_id = client_calendar.get("id")
            log.info(
                "CALENDAR",
                f"Got/created SilverKey calendar {client_calendar_id} for client {client_id}",
            )
        except Exception as e:
            error_msg = sanitize_error_message(e)
            result["errors"].append(f"Failed to get/create client calendar: {error_msg}")
            log.error("ERRORS", f"Error getting/creating client calendar: {error_msg}")
            result["success"] = False
            return result
        try:
            existing_share = db_session.scalar(
                select(CalendarShare).where(
                    CalendarShare.calendar_owner_id == agent_id,
                    CalendarShare.shared_with_user_id == client_id,
                    CalendarShare.calendar_id == agent_calendar_id,
                )
            )
            if not existing_share:
                creds = load_credentials(
                    agent_id, client_id_oauth, client_secret, token_endpoint, scopes
                )
                service = build("calendar", "v3", credentials=creds, cache_discovery=False)
                existing_acls = service.acl().list(calendarId=agent_calendar_id).execute()
                acl_exists = any(
                    rule.get("scope", {}).get("value") == client_email
                    for rule in existing_acls.get("items", [])
                )
                if not acl_exists:
                    add_calendar_acl(
                        agent_id,
                        agent_calendar_id,
                        client_email,
                        "writer",
                        client_id_oauth,
                        client_secret,
                        token_endpoint,
                        scopes,
                    )
                try:
                    calendar_share = CalendarShare(
                        calendar_owner_id=agent_id,
                        shared_with_user_id=client_id,
                        calendar_id=agent_calendar_id,
                        role="writer",
                    )
                    db_session.add(calendar_share)
                    result["agent_calendar_shared"] = True
                    log_oauth_event(
                        "calendar_sharing_setup",
                        agent_id,
                        calendar_id=agent_calendar_id,
                        shared_with=client_email,
                    )
                    log.info(
                        "CALENDAR",
                        f"Shared agent calendar {agent_calendar_id} with client {client_email}",
                    )
                except Exception as db_error:
                    error_str = str(db_error).lower()
                    if (
                        "unique" in error_str
                        or "constraint" in error_str
                        or "duplicate" in error_str
                    ):
                        result["agent_calendar_shared"] = True
                        log.info(
                            "CALENDAR",
                            f"Agent calendar {agent_calendar_id} already shared with client {client_email} (race condition handled)",
                        )
                    else:
                        raise
            else:
                result["agent_calendar_shared"] = True
                log.info(
                    "CALENDAR",
                    f"Agent calendar {agent_calendar_id} already shared with client {client_email} (found in database)",
                )
        except Exception as e:
            error_msg = sanitize_error_message(e)
            result["errors"].append(f"Failed to share agent calendar with client: {error_msg}")
            log.error("ERRORS", f"Error sharing agent calendar: {error_msg}")
        try:
            existing_share = db_session.scalar(
                select(CalendarShare).where(
                    CalendarShare.calendar_owner_id == client_id,
                    CalendarShare.shared_with_user_id == agent_id,
                    CalendarShare.calendar_id == client_calendar_id,
                )
            )
            if not existing_share:
                creds = load_credentials(
                    client_id, client_id_oauth, client_secret, token_endpoint, scopes
                )
                service = build("calendar", "v3", credentials=creds, cache_discovery=False)
                existing_acls = service.acl().list(calendarId=client_calendar_id).execute()
                acl_exists = any(
                    rule.get("scope", {}).get("value") == agent_email
                    for rule in existing_acls.get("items", [])
                )
                if not acl_exists:
                    add_calendar_acl(
                        client_id,
                        client_calendar_id,
                        agent_email,
                        "writer",
                        client_id_oauth,
                        client_secret,
                        token_endpoint,
                        scopes,
                    )
                try:
                    calendar_share = CalendarShare(
                        calendar_owner_id=client_id,
                        shared_with_user_id=agent_id,
                        calendar_id=client_calendar_id,
                        role="writer",
                    )
                    db_session.add(calendar_share)
                    result["client_calendar_shared"] = True
                    log_oauth_event(
                        "calendar_sharing_setup",
                        client_id,
                        calendar_id=client_calendar_id,
                        shared_with=agent_email,
                    )
                    log.info(
                        "CALENDAR",
                        f"Shared client calendar {client_calendar_id} with agent {agent_email}",
                    )
                except Exception as db_error:
                    error_str = str(db_error).lower()
                    if (
                        "unique" in error_str
                        or "constraint" in error_str
                        or "duplicate" in error_str
                    ):
                        result["client_calendar_shared"] = True
                        log.info(
                            "CALENDAR",
                            f"Client calendar {client_calendar_id} already shared with agent {agent_email} (race condition handled)",
                        )
                    else:
                        raise
            else:
                result["client_calendar_shared"] = True
                log.info(
                    "CALENDAR",
                    f"Client calendar {client_calendar_id} already shared with agent {agent_email} (found in database)",
                )
        except Exception as e:
            error_msg = sanitize_error_message(e)
            result["errors"].append(f"Failed to share client calendar with agent: {error_msg}")
            log.error("ERRORS", f"Error sharing client calendar: {error_msg}")
        if result["agent_calendar_shared"] or result["client_calendar_shared"]:
            result["success"] = True
        else:
            result["success"] = False
        return result
    except Exception as e:
        error_msg = sanitize_error_message(e)
        result["errors"].append(f"Unexpected error setting up calendar sharing: {error_msg}")
        result["success"] = False
        log.error("ERRORS", f"Unexpected error setting up calendar sharing: {error_msg}")
        return result
