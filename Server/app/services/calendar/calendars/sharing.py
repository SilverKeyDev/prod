"""
Calendar sharing operations for Google Calendar
Handles ACL management and calendar sharing between users
"""

from typing import Any

from googleapiclient.discovery import build

from app.utils.security.security import log_oauth_event, sanitize_error_message
from logger import log

from ..core.credentials import load_credentials

__all__ = ["add_calendar_acl"]


def add_calendar_acl(
    user_id: str,
    calendar_id: str,
    agent_email: str,
    role: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
) -> dict[str, Any]:
    """Add an ACL rule to a calendar (grant agent access)

    Args:
        user_id: User ID
        calendar_id: Calendar ID
        agent_email: Email address of the agent to grant access to
        role: ACL role ("reader", "writer", "owner")
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list

    Returns:
        Created ACL rule dictionary
    """
    try:
        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        acl_rule = {"scope": {"type": "user", "value": agent_email}, "role": role}
        created_rule = service.acl().insert(calendarId=calendar_id, body=acl_rule).execute()
        log_oauth_event(
            "calendar_acl_added", user_id, calendar_id=calendar_id, agent_email=agent_email
        )
        return created_rule
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("calendar_acl_error", user_id, calendar_id=calendar_id, error=error_msg)
        log.error(
            "ERRORS", f"Error adding ACL to calendar {calendar_id} for user {user_id}: {error_msg}"
        )
        raise
