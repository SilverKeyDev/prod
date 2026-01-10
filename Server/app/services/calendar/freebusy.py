"""
Free/busy query operations for Google Calendar
Handles querying calendar availability
"""

from typing import Dict, Any, List, Optional
from googleapiclient.discovery import build

from app.utils.security.app_logging import get_logger
from app.utils.security.security import (
    sanitize_error_message,
    log_oauth_event,
)
from .credentials import load_credentials

logger = get_logger()


def query_freebusy(
    user_id: str,
    time_min: str,
    time_max: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
    calendar_ids: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Query free/busy information for specified calendars
    
    Args:
        user_id: User ID
        time_min: Start time in ISO 8601 format
        time_max: End time in ISO 8601 format
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        calendar_ids: List of calendar IDs to check (defaults to ["primary"])
    
    Returns:
        Dictionary with calendar IDs as keys and busy time blocks as values
    """
    try:
        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        
        # Default to primary calendar if not specified
        if not calendar_ids:
            calendar_ids = ["primary"]
        
        freebusy_request = {
            "timeMin": time_min,
            "timeMax": time_max,
            "items": [{"id": cal_id} for cal_id in calendar_ids]
        }
        
        freebusy_response = service.freebusy().query(body=freebusy_request).execute()
        
        log_oauth_event("freebusy_queried", user_id,
                      time_min=time_min, time_max=time_max,
                      calendar_count=len(calendar_ids))
        return freebusy_response.get("calendars", {})
        
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("freebusy_query_error", user_id, error=error_msg)
        logger.error(f"Error querying freebusy for user {user_id}: {error_msg}", exc_info=True)
        raise
