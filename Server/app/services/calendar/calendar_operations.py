"""
Calendar operations for Google Calendar
Handles calendar listing, creation, ACL management, and SilverKey calendar management
"""

from typing import Dict, Any, List, Optional
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.utils.security.app_logging import get_logger
from app.services.auth.tokens import tokens_get
from app.utils.security.security import (
    sanitize_error_message,
    log_oauth_event,
)
from .credentials import load_credentials

logger = get_logger()


def resolve_calendar_id(
    user_id: str,
    calendar_id: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
    get_or_create_silverkey_calendar_func
) -> str:
    """Resolve calendar ID based on user's scopes
    
    If user has calendar.app.created scope (restricted) and requests "primary",
    automatically use SilverKey calendar instead since primary calendar is not accessible.
    
    Args:
        user_id: User ID
        calendar_id: Requested calendar ID (may be "primary")
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        get_or_create_silverkey_calendar_func: Function to get or create SilverKey calendar
    
    Returns:
        Resolved calendar ID (SilverKey calendar ID if restricted scope and primary requested)
    """
    if calendar_id == "primary":
        # Check if user has restricted scope (calendar.app.created)
        token_data = tokens_get(user_id)
        if token_data:
            stored_scopes = token_data.get("scopes", "").split() if token_data.get("scopes") else []
            has_restricted_scope = (
                "https://www.googleapis.com/auth/calendar.app.created" in stored_scopes
            )
            
            if has_restricted_scope:
                # User has restricted scope - can't access primary, use SilverKey calendar
                try:
                    silverkey_cal = get_or_create_silverkey_calendar_func(user_id)
                    resolved_id = silverkey_cal.get("id")
                    if not resolved_id:
                        logger.error(f"SilverKey calendar returned without ID for user {user_id}")
                        raise ValueError("SilverKey calendar missing ID")
                    logger.debug(f"Resolved 'primary' to SilverKey calendar {resolved_id} for user {user_id} (restricted scope)")
                    return resolved_id
                except Exception as e:
                    error_msg = sanitize_error_message(e)
                    logger.error(f"Failed to get/create SilverKey calendar for user {user_id}: {error_msg}", exc_info=True)
                    # Don't fall back to "primary" - it will fail with 404
                    # Instead, raise an error so the caller can handle it appropriately
                    raise RuntimeError(
                        f"Cannot access primary calendar with restricted scope. "
                        f"Failed to get/create SilverKey calendar: {error_msg}"
                    )
    
    return calendar_id


def list_calendars(
    user_id: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list
) -> List[Dict[str, Any]]:
    """List user's Google calendars
    
    Args:
        user_id: User ID
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
    
    Returns:
        List of calendar dictionaries
    """
    try:
        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        result = service.calendarList().list().execute()
        
        log_oauth_event("calendars_listed", user_id, count=len(result.get("items", [])))
        return result.get("items", [])
        
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("calendars_list_error", user_id, error=error_msg)
        logger.error(f"Error listing calendars for user {user_id}: {error_msg}", exc_info=True)
        raise


def create_calendar(
    user_id: str,
    calendar_name: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list
) -> Dict[str, Any]:
    """Create a secondary calendar for the user (requires full calendar scope)
    
    Args:
        user_id: User ID
        calendar_name: Name for the new calendar
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
    
    Returns:
        Created calendar dictionary
    """
    try:
        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        
        calendar_body = {
            "summary": calendar_name,
            "description": f"Calendar created by SilverKey for {calendar_name}",
            "timeZone": "America/Los_Angeles"  # Default, can be made configurable
        }
        
        created_calendar = service.calendars().insert(body=calendar_body).execute()
        
        log_oauth_event("calendar_created", user_id, calendar_id=created_calendar.get("id"))
        return created_calendar
        
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("calendar_create_error", user_id, error=error_msg)
        logger.error(f"Error creating calendar for user {user_id}: {error_msg}", exc_info=True)
        raise


def add_calendar_acl(
    user_id: str,
    calendar_id: str,
    agent_email: str,
    role: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list
) -> Dict[str, Any]:
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
        
        acl_rule = {
            "scope": {
                "type": "user",
                "value": agent_email
            },
            "role": role  # "reader", "writer", "owner"
        }
        
        created_rule = service.acl().insert(calendarId=calendar_id, body=acl_rule).execute()
        
        log_oauth_event("calendar_acl_added", user_id, calendar_id=calendar_id, agent_email=agent_email)
        return created_rule
        
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("calendar_acl_error", user_id, calendar_id=calendar_id, error=error_msg)
        logger.error(f"Error adding ACL to calendar {calendar_id} for user {user_id}: {error_msg}", exc_info=True)
        raise


def get_or_create_silverkey_calendar(
    user_id: str,
    buyer_name: Optional[str],
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list
) -> Dict[str, Any]:
    """Get or create the SilverKey calendar for a user
    
    Args:
        user_id: User ID
        buyer_name: Ignored - calendar is always named "SilverKey"
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
    
    Returns:
        Calendar dictionary with id, summary, etc.
    """
    try:
        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        
        # Try to find existing SilverKey calendar (exact name match)
        # This will fail with 403 if user only has calendar.app.created scope
        try:
            calendar_list = service.calendarList().list().execute()
            silverkey_calendars = [
                cal for cal in calendar_list.get("items", [])
                if cal.get("summary", "") == "SilverKey"
            ]
            
            if silverkey_calendars:
                # Return the first SilverKey calendar found
                log_oauth_event("silverkey_calendar_found", user_id,
                              calendar_id=silverkey_calendars[0].get("id"))
                return silverkey_calendars[0]
        except HttpError as e:
            # If we get 403 (insufficient scopes), we can't list calendars
            # This is expected with calendar.app.created scope - skip listing and create directly
            if e.resp.status == 403:
                logger.debug(f"User {user_id} has restricted scope (cannot list calendars), creating calendar directly")
                log_oauth_event("silverkey_calendar_list_skipped", user_id, reason="insufficient_scopes")
            else:
                # Re-raise if it's a different error
                raise
        
        # Create new SilverKey calendar with exact name "SilverKey"
        calendar_name = "SilverKey"
        calendar_body = {
            "summary": calendar_name,
            "description": "Calendar created by SilverKey for managing home tours and real estate events",
            "timeZone": "America/Los_Angeles"  # Default, can be made configurable
        }
        
        try:
            created_calendar = service.calendars().insert(body=calendar_body).execute()
            
            log_oauth_event("silverkey_calendar_created", user_id,
                          calendar_id=created_calendar.get("id"),
                          calendar_name=calendar_name)
            return created_calendar
        except HttpError as e:
            # Handle specific HTTP errors during calendar creation
            error_msg = sanitize_error_message(e)
            if e.resp.status == 403:
                log_oauth_event("silverkey_calendar_create_forbidden", user_id, error=error_msg)
                logger.error(
                    f"Cannot create SilverKey calendar for user {user_id}: insufficient permissions. "
                    f"User may need to reconnect with appropriate scopes. Error: {error_msg}"
                )
                raise RuntimeError(
                    "Cannot create SilverKey calendar: insufficient permissions. "
                    "Please reconnect your Google Calendar account with appropriate permissions."
                ) from e
            else:
                log_oauth_event("silverkey_calendar_create_error", user_id, error=error_msg)
                logger.error(f"Error creating SilverKey calendar for user {user_id}: {error_msg}", exc_info=True)
                raise
        
    except RuntimeError:
        # Re-raise RuntimeError as-is (already has user-friendly message)
        raise
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("silverkey_calendar_error", user_id, error=error_msg)
        logger.error(f"Error getting/creating SilverKey calendar for user {user_id}: {error_msg}", exc_info=True)
        raise


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
    db_session=None
) -> Dict[str, Any]:
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
    # Import here to avoid circular imports
    if db_session is None:
        from app import db
        db_session = db.session
    
    from app.models.calendar.calendar_share import CalendarShare
    
    result = {
        "success": True,
        "agent_calendar_shared": False,
        "client_calendar_shared": False,
        "errors": []
    }
    
    try:
        # Check if both users have Google Calendar connected
        from app.services.auth.tokens import tokens_get
        
        agent_tokens = tokens_get(agent_id)
        client_tokens = tokens_get(client_id)
        
        if not agent_tokens:
            result["errors"].append(f"Agent {agent_id} does not have Google Calendar connected")
            result["success"] = False
            logger.warning(f"Cannot set up calendar sharing: agent {agent_id} not connected")
            return result
        
        if not client_tokens:
            result["errors"].append(f"Client {client_id} does not have Google Calendar connected")
            result["success"] = False
            logger.warning(f"Cannot set up calendar sharing: client {client_id} not connected")
            return result
        
        # Get or create SilverKey calendars for both users
        try:
            agent_calendar = get_or_create_silverkey_calendar_func(agent_id)
            agent_calendar_id = agent_calendar.get("id")
            logger.info(f"Got/created SilverKey calendar {agent_calendar_id} for agent {agent_id}")
        except Exception as e:
            error_msg = sanitize_error_message(e)
            result["errors"].append(f"Failed to get/create agent calendar: {error_msg}")
            logger.error(f"Error getting/creating agent calendar: {error_msg}", exc_info=True)
            result["success"] = False
            return result
        
        try:
            client_calendar = get_or_create_silverkey_calendar_func(client_id)
            client_calendar_id = client_calendar.get("id")
            logger.info(f"Got/created SilverKey calendar {client_calendar_id} for client {client_id}")
        except Exception as e:
            error_msg = sanitize_error_message(e)
            result["errors"].append(f"Failed to get/create client calendar: {error_msg}")
            logger.error(f"Error getting/creating client calendar: {error_msg}", exc_info=True)
            result["success"] = False
            return result
        
        # Set up ACL: Agent's calendar → Client email (writer access)
        try:
            # Check database first to see if share already exists
            existing_share = CalendarShare.query.filter_by(
                calendar_owner_id=agent_id,
                shared_with_user_id=client_id,
                calendar_id=agent_calendar_id
            ).first()
            
            if not existing_share:
                # Check if ACL already exists in Google Calendar to avoid duplicate errors
                creds = load_credentials(agent_id, client_id_oauth, client_secret, token_endpoint, scopes)
                from googleapiclient.discovery import build
                service = build("calendar", "v3", credentials=creds, cache_discovery=False)
                
                # List existing ACL rules
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
                        scopes
                    )
                
                # Store in database (don't commit yet - let caller handle transaction)
                try:
                    calendar_share = CalendarShare(
                        calendar_owner_id=agent_id,
                        shared_with_user_id=client_id,
                        calendar_id=agent_calendar_id,
                        role="writer"
                    )
                    db_session.add(calendar_share)
                    # Note: Don't commit here - let the caller manage the transaction
                    # This allows the caller to rollback both shares if needed
                    
                    result["agent_calendar_shared"] = True
                    log_oauth_event("calendar_sharing_setup", agent_id, 
                                  calendar_id=agent_calendar_id, 
                                  shared_with=client_email)
                    logger.info(f"Shared agent calendar {agent_calendar_id} with client {client_email}")
                except Exception as db_error:
                    # Handle unique constraint violation (race condition)
                    error_str = str(db_error).lower()
                    if "unique" in error_str or "constraint" in error_str or "duplicate" in error_str:
                        # Share already exists (race condition), treat as success
                        result["agent_calendar_shared"] = True
                        logger.info(f"Agent calendar {agent_calendar_id} already shared with client {client_email} (race condition handled)")
                    else:
                        raise  # Re-raise if it's a different error
            else:
                result["agent_calendar_shared"] = True
                logger.info(f"Agent calendar {agent_calendar_id} already shared with client {client_email} (found in database)")
        except Exception as e:
            error_msg = sanitize_error_message(e)
            result["errors"].append(f"Failed to share agent calendar with client: {error_msg}")
            logger.error(f"Error sharing agent calendar: {error_msg}", exc_info=True)
            # Don't rollback here - let caller handle transaction management
            # Continue to try sharing client calendar
        
        # Set up ACL: Client's calendar → Agent email (writer access)
        try:
            # Check database first to see if share already exists
            existing_share = CalendarShare.query.filter_by(
                calendar_owner_id=client_id,
                shared_with_user_id=agent_id,
                calendar_id=client_calendar_id
            ).first()
            
            if not existing_share:
                # Check if ACL already exists in Google Calendar
                creds = load_credentials(client_id, client_id_oauth, client_secret, token_endpoint, scopes)
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
                        scopes
                    )
                
                # Store in database (don't commit yet - let caller handle transaction)
                try:
                    calendar_share = CalendarShare(
                        calendar_owner_id=client_id,
                        shared_with_user_id=agent_id,
                        calendar_id=client_calendar_id,
                        role="writer"
                    )
                    db_session.add(calendar_share)
                    # Note: Don't commit here - let the caller manage the transaction
                    
                    result["client_calendar_shared"] = True
                    log_oauth_event("calendar_sharing_setup", client_id,
                                  calendar_id=client_calendar_id,
                                  shared_with=agent_email)
                    logger.info(f"Shared client calendar {client_calendar_id} with agent {agent_email}")
                except Exception as db_error:
                    # Handle unique constraint violation (race condition)
                    error_str = str(db_error).lower()
                    if "unique" in error_str or "constraint" in error_str or "duplicate" in error_str:
                        # Share already exists (race condition), treat as success
                        result["client_calendar_shared"] = True
                        logger.info(f"Client calendar {client_calendar_id} already shared with agent {agent_email} (race condition handled)")
                    else:
                        raise  # Re-raise if it's a different error
            else:
                result["client_calendar_shared"] = True
                logger.info(f"Client calendar {client_calendar_id} already shared with agent {agent_email} (found in database)")
        except Exception as e:
            error_msg = sanitize_error_message(e)
            result["errors"].append(f"Failed to share client calendar with agent: {error_msg}")
            logger.error(f"Error sharing client calendar: {error_msg}", exc_info=True)
            # Don't rollback here - let caller handle transaction management
            # Don't fail completely if one direction fails
        
        # Success if at least one direction worked
        if result["agent_calendar_shared"] or result["client_calendar_shared"]:
            result["success"] = True
        else:
            result["success"] = False
        
        return result
        
    except Exception as e:
        error_msg = sanitize_error_message(e)
        result["errors"].append(f"Unexpected error setting up calendar sharing: {error_msg}")
        result["success"] = False
        logger.error(f"Unexpected error setting up calendar sharing: {error_msg}", exc_info=True)
        return result


def share_calendar_with_users(
    calendar_owner_id: str,
    shared_with_user_ids: List[str],
    calendar_id: str,
    role: str = "writer",
    client_id_oauth: str = None,
    client_secret: str = None,
    token_endpoint: str = None,
    scopes: list = None,
    get_or_create_silverkey_calendar_func=None,
    db_session=None
) -> Dict[str, Any]:
    """Share a calendar with multiple users
    
    Args:
        calendar_owner_id: User ID who owns the calendar
        shared_with_user_ids: List of user IDs to share the calendar with
        calendar_id: Calendar ID to share
        role: ACL role ("reader", "writer", "owner")
        client_id_oauth: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        get_or_create_silverkey_calendar_func: Function to get or create SilverKey calendar
        db_session: Database session
    
    Returns:
        Dictionary with status and results
    """
    if db_session is None:
        from app import db
        db_session = db.session
    
    from app.models.calendar.calendar_share import CalendarShare
    from app.models import User
    
    result = {
        "success": True,
        "shared_with": [],
        "errors": []
    }
    
    try:
        # Get owner's email
        owner = User.query.filter_by(id=calendar_owner_id).first()
        if not owner:
            result["errors"].append(f"Calendar owner {calendar_owner_id} not found")
            result["success"] = False
            return result
        
        owner_email = owner.email
        
        # Get emails for all users to share with
        shared_users = User.query.filter(User.id.in_(shared_with_user_ids)).all()
        user_email_map = {user.id: user.email for user in shared_users}
        
        # Share with each user
        for shared_user_id in shared_with_user_ids:
            if shared_user_id not in user_email_map:
                result["errors"].append(f"User {shared_user_id} not found")
                continue
            
            shared_user_email = user_email_map[shared_user_id]
            
            try:
                # Check if share already exists in database
                existing_share = CalendarShare.query.filter_by(
                    calendar_owner_id=calendar_owner_id,
                    shared_with_user_id=shared_user_id,
                    calendar_id=calendar_id
                ).first()
                
                if existing_share:
                    result["shared_with"].append(shared_user_id)
                    logger.info(f"Calendar {calendar_id} already shared with user {shared_user_id}")
                    continue
                
                # Set up ACL in Google Calendar if credentials provided
                if client_id_oauth and client_secret and token_endpoint and scopes:
                    try:
                        # Check if ACL already exists
                        creds = load_credentials(calendar_owner_id, client_id_oauth, client_secret, token_endpoint, scopes)
                        from googleapiclient.discovery import build
                        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
                        
                        existing_acls = service.acl().list(calendarId=calendar_id).execute()
                        acl_exists = any(
                            rule.get("scope", {}).get("value") == shared_user_email
                            for rule in existing_acls.get("items", [])
                        )
                        
                        if not acl_exists:
                            add_calendar_acl(
                                calendar_owner_id,
                                calendar_id,
                                shared_user_email,
                                role,
                                client_id_oauth,
                                client_secret,
                                token_endpoint,
                                scopes
                            )
                    except Exception as e:
                        error_msg = sanitize_error_message(e)
                        result["errors"].append(f"Failed to set up ACL for user {shared_user_id}: {error_msg}")
                        logger.error(f"Error setting up ACL: {error_msg}", exc_info=True)
                        # Continue to store in database even if ACL fails
                
                # Store in database
                try:
                    calendar_share = CalendarShare(
                        calendar_owner_id=calendar_owner_id,
                        shared_with_user_id=shared_user_id,
                        calendar_id=calendar_id,
                        role=role
                    )
                    db_session.add(calendar_share)
                    result["shared_with"].append(shared_user_id)
                    logger.info(f"Shared calendar {calendar_id} with user {shared_user_id}")
                except Exception as db_error:
                    # Handle unique constraint violation (race condition)
                    error_str = str(db_error).lower()
                    if "unique" in error_str or "constraint" in error_str or "duplicate" in error_str:
                        # Share already exists (race condition), treat as success
                        result["shared_with"].append(shared_user_id)
                        logger.info(f"Calendar {calendar_id} already shared with user {shared_user_id} (race condition handled)")
                    else:
                        raise  # Re-raise if it's a different error
                
            except Exception as e:
                error_msg = sanitize_error_message(e)
                result["errors"].append(f"Failed to share with user {shared_user_id}: {error_msg}")
                logger.error(f"Error sharing calendar with user {shared_user_id}: {error_msg}", exc_info=True)
        
        # Commit all shares at once (or let caller handle if db_session is from caller)
        try:
            db_session.commit()
        except Exception as e:
            db_session.rollback()
            error_msg = sanitize_error_message(e)
            result["errors"].append(f"Failed to commit calendar shares: {error_msg}")
            logger.error(f"Error committing calendar shares: {error_msg}", exc_info=True)
            result["success"] = False
            return result
        
        if result["errors"] and not result["shared_with"]:
            result["success"] = False
        elif result["shared_with"]:
            result["success"] = True
        
        return result
        
    except Exception as e:
        db_session.rollback()
        error_msg = sanitize_error_message(e)
        result["errors"].append(f"Unexpected error: {error_msg}")
        result["success"] = False
        logger.error(f"Unexpected error sharing calendar with multiple users: {error_msg}", exc_info=True)
        return result
