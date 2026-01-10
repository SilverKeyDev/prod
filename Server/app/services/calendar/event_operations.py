"""
Event operations for Google Calendar
Handles event listing, creation, updating, and deletion
"""

from typing import Dict, Any, List, Optional
from googleapiclient.discovery import build

from app.utils.security.app_logging import get_logger
from app.utils.security.security import (
    sanitize_error_message,
    log_oauth_event,
    validate_event_data,
)
from .credentials import load_credentials

logger = get_logger()


def list_events(
    user_id: str,
    calendar_id: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
    resolve_calendar_id_func,
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
    max_results: int = 100
) -> List[Dict[str, Any]]:
    """List events from user's Google calendar
    
    Args:
        user_id: User ID
        calendar_id: Calendar ID (may be "primary")
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        resolve_calendar_id_func: Function to resolve calendar ID
        time_min: Optional start time in ISO 8601 format
        time_max: Optional end time in ISO 8601 format
        max_results: Maximum number of results to return
    
    Returns:
        List of event dictionaries
    """
    # Resolve calendar_id (convert "primary" to SilverKey if using restricted scope)
    resolved_calendar_id = None
    try:
        resolved_calendar_id = resolve_calendar_id_func(user_id, calendar_id)
    except RuntimeError as e:
        # RuntimeError from resolve_calendar_id means we can't access primary with restricted scope
        # and SilverKey calendar creation failed - re-raise with clear message
        error_msg = sanitize_error_message(e)
        log_oauth_event("events_list_error", user_id, calendar_id=calendar_id, error="calendar_resolution_failed")
        logger.error(f"Failed to resolve calendar ID for user {user_id}, requested: {calendar_id}: {error_msg}")
        raise
    
    try:
        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        
        params = {
            "calendarId": resolved_calendar_id,
            "maxResults": max_results,
            "singleEvents": True,
            "orderBy": "startTime"
        }
        
        if time_min:
            params["timeMin"] = time_min
        if time_max:
            params["timeMax"] = time_max
        
        events_response = service.events().list(**params).execute()
        
        # Safely extract items from response
        if not events_response:
            logger.warning(f"Empty response from Google Calendar API for user {user_id}, calendar {resolved_calendar_id}")
            return []
        
        items = events_response.get("items", [])
        if not isinstance(items, list):
            logger.warning(f"Unexpected items format from Google Calendar API for user {user_id}: {type(items)}")
            return []
        
        log_oauth_event("events_listed", user_id, calendar_id=resolved_calendar_id,
                      count=len(items))
        return items
        
    except RuntimeError:
        # Re-raise RuntimeError as-is (already has user-friendly message from resolve_calendar_id)
        raise
    except Exception as e:
        from googleapiclient.errors import HttpError
        
        # Handle 404 and 403 errors specifically - usually means calendar doesn't exist or isn't accessible
        if isinstance(e, HttpError) and hasattr(e, 'resp') and e.resp.status in [404, 403]:
            error_msg = sanitize_error_message(e)
            # Use resolved_calendar_id if available, otherwise fall back to calendar_id
            calendar_id_for_log = resolved_calendar_id if resolved_calendar_id else calendar_id
            
            # For 403, it might be a permissions issue rather than calendar not found
            if e.resp.status == 403:
                log_oauth_event("events_list_error", user_id, calendar_id=calendar_id_for_log, error="calendar_access_denied")
                logger.warning(f"Calendar access denied for user {user_id}, calendar {calendar_id_for_log} (requested: {calendar_id}): {error_msg}")
                raise RuntimeError(
                    f"Calendar '{calendar_id_for_log}' access denied. "
                    f"You may not have permission to access this calendar. "
                    f"Try using a different calendar or reconnect your Google Calendar account."
                )
            
            # For 404, calendar doesn't exist or isn't accessible
            log_oauth_event("events_list_error", user_id, calendar_id=calendar_id_for_log, error="calendar_not_found")
            logger.warning(f"Calendar not found for user {user_id}, calendar {calendar_id_for_log} (requested: {calendar_id}): {error_msg}")
            
            # If we tried to use "primary" and got 404, it means the user has restricted scope
            # and we should have resolved to SilverKey calendar but failed
            if calendar_id == "primary" and (not resolved_calendar_id or resolved_calendar_id == "primary"):
                logger.error(f"Failed to resolve 'primary' to SilverKey calendar for user {user_id} with restricted scope")
                raise RuntimeError(
                    "Cannot access primary calendar with restricted scope. "
                    "Please ensure your SilverKey calendar is set up. "
                    "Try reconnecting your Google Calendar account."
                )
            else:
                raise RuntimeError(f"Calendar '{calendar_id_for_log}' not found or not accessible")
        
        error_msg = sanitize_error_message(e)
        log_oauth_event("events_list_error", user_id, calendar_id=calendar_id, error=error_msg)
        logger.error(f"Error listing events for user {user_id}, calendar {calendar_id}: {error_msg}", exc_info=True)
        raise


def create_event(
    user_id: str,
    event_data: Dict[str, Any],
    calendar_id: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
    resolve_calendar_id_func,
    target_user_id: Optional[str] = None
) -> Dict[str, Any]:
    """Create a new event in user's Google calendar or target user's calendar
    
    Args:
        user_id: User ID (creator of the event)
        event_data: Event data dictionary
        calendar_id: Calendar ID (may be "primary")
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        resolve_calendar_id_func: Function to resolve calendar ID
        target_user_id: Optional target user ID to create event in their calendar instead
    
    Returns:
        Created event dictionary
    """
    try:
        # Validate event data
        if not validate_event_data(event_data):
            raise ValueError("Invalid event data")
        
        # If target_user_id is specified, create event in target user's calendar
        if target_user_id:
            # Use target user's credentials and calendar
            resolved_calendar_id = resolve_calendar_id_func(target_user_id, calendar_id)
            creds = load_credentials(target_user_id, client_id, client_secret, token_endpoint, scopes)
            log_oauth_event("event_created_for_target", user_id, target_user_id=target_user_id, event_id=None)
        else:
            # Use creator's credentials and calendar
            resolved_calendar_id = resolve_calendar_id_func(user_id, calendar_id)
            creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        
        event = service.events().insert(
            calendarId=resolved_calendar_id,
            body=event_data
        ).execute()
        
        if target_user_id:
            log_oauth_event("event_created", target_user_id, event_id=event.get("id"), created_by=user_id)
        else:
            log_oauth_event("event_created", user_id, event_id=event.get("id"))
        return event
        
    except Exception as e:
        error_msg = sanitize_error_message(e)
        if target_user_id:
            log_oauth_event("event_create_error", user_id, target_user_id=target_user_id, error=error_msg)
            logger.error(f"Error creating event for user {user_id} in target {target_user_id}'s calendar: {error_msg}", exc_info=True)
        else:
            log_oauth_event("event_create_error", user_id, error=error_msg)
            logger.error(f"Error creating event for user {user_id}: {error_msg}", exc_info=True)
        raise


def update_event(
    user_id: str,
    event_id: str,
    event_data: Dict[str, Any],
    calendar_id: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
    resolve_calendar_id_func
) -> Dict[str, Any]:
    """Update an existing event in user's Google calendar
    
    Args:
        user_id: User ID
        event_id: Event ID to update
        event_data: Updated event data dictionary
        calendar_id: Calendar ID (may be "primary")
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        resolve_calendar_id_func: Function to resolve calendar ID
    
    Returns:
        Updated event dictionary
    """
    try:
        # Validate event data
        if not validate_event_data(event_data):
            raise ValueError("Invalid event data")
        
        # Resolve calendar_id (convert "primary" to SilverKey if using restricted scope)
        resolved_calendar_id = resolve_calendar_id_func(user_id, calendar_id)
        
        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        
        event = service.events().update(
            calendarId=resolved_calendar_id,
            eventId=event_id,
            body=event_data
        ).execute()
        
        log_oauth_event("event_updated", user_id, event_id=event.get("id"))
        return event
        
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("event_update_error", user_id, event_id=event_id, error=error_msg)
        logger.error(f"Error updating event {event_id} for user {user_id}: {error_msg}", exc_info=True)
        raise


def delete_event(
    user_id: str,
    event_id: str,
    calendar_id: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
    resolve_calendar_id_func
) -> bool:
    """Delete an event from user's Google calendar
    
    Args:
        user_id: User ID
        event_id: Event ID to delete
        calendar_id: Calendar ID (may be "primary")
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        resolve_calendar_id_func: Function to resolve calendar ID
    
    Returns:
        True if successful
    """
    try:
        # Resolve calendar_id (convert "primary" to SilverKey if using restricted scope)
        resolved_calendar_id = resolve_calendar_id_func(user_id, calendar_id)
        
        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        
        service.events().delete(
            calendarId=resolved_calendar_id,
            eventId=event_id
        ).execute()
        
        log_oauth_event("event_deleted", user_id, event_id=event_id)
        return True
        
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("event_delete_error", user_id, event_id=event_id, error=error_msg)
        logger.error(f"Error deleting event {event_id} for user {user_id}: {error_msg}", exc_info=True)
        raise
