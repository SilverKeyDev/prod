"""
Google Calendar Service
Handles Google Calendar API operations and OAuth token management
"""

import os
import time
import json
import uuid
import base64
import hashlib
import threading
import requests
from urllib.parse import urlencode
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.utils.security.app_logging import get_logger
from app.services.auth.tokens import tokens_get, tokens_upsert, tokens_delete
from app.models import OAuthState
from app import db
from app.utils.security.security import (
    redact_sensitive_data, 
    sanitize_error_message, 
    log_oauth_event,
    validate_event_data
)

logger = get_logger()

# Lock for preventing concurrent token refreshes per user
_refresh_locks: Dict[str, threading.Lock] = {}
_refresh_locks_lock = threading.Lock()  # Lock for managing refresh locks


class GoogleCalendarService:
    """Service for Google Calendar operations"""
    
    # Counter for periodic cleanup of expired OAuth states
    _validation_count = 0
    
    def __init__(self):
        """Initialize the Google Calendar service"""
        from app.config import Config
        
        self.client_id = Config.GOOGLE_CLIENT_ID
        self.client_secret = Config.GOOGLE_CALENDAR_SECRET
        self.redirect_uri = Config.GOOGLE_REDIRECT_URI
        # Default to calendar.app.created (non-sensitive scope) - no OAuth verification required
        # This allows managing only calendars/events created by the app
        self.scopes = Config.GOOGLE_SCOPES.split() if Config.GOOGLE_SCOPES else [
            "https://www.googleapis.com/auth/calendar.app.created"
        ]
        self.auth_endpoint = "https://accounts.google.com/o/oauth2/v2/auth"
        self.token_endpoint = "https://oauth2.googleapis.com/token"
        
        # Configuration validation
        self._validate_configuration()
        
        # Initialize request session with retry logic
        self._initialize_session()
    
    def _validate_configuration(self):
        """Validate required configuration"""
        missing_vars = []
        
        if not self.client_id:
            missing_vars.append("GOOGLE_CLIENT_ID")
        if not self.client_secret:
            missing_vars.append("GOOGLE_CALENDAR_SECRET")
        if not self.redirect_uri:
            missing_vars.append("GOOGLE_REDIRECT_URI")
        
        if missing_vars:
            logger.error(f"Google Calendar service missing required environment variables: {', '.join(missing_vars)}")
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
            
    def _initialize_session(self):
        """Initialize requests session with retry logic"""
        import requests
        from requests.adapters import HTTPAdapter
        from urllib3.util.retry import Retry
        
        self.session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            raise_on_status=False
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Set default timeout
        self.session.timeout = 15
    
    def is_healthy(self) -> bool:
        """Check if the service is properly configured and ready"""
        try:
            return all([
                self.client_id,
                self.client_secret,
                self.redirect_uri,
                hasattr(self, 'session')
            ])
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return False
    
    def generate_state(self, user_id: str) -> str:
        """Generate CSRF state parameter"""
        timestamp = str(int(time.time()))
        random_data = str(uuid.uuid4())
        data = f"{user_id}:{timestamp}:{random_data}"
        return base64.urlsafe_b64encode(data.encode()).decode()
    
    def validate_state(self, state: str, session_state: Optional[str] = None) -> bool:
        """
        Validate OAuth state parameter from database.
        Falls back to session_state for backward compatibility, but DB is preferred.
        """
        if not state:
            return False
        
        # Periodic cleanup of expired/used states (every 10th validation)
        GoogleCalendarService._validation_count += 1
        if GoogleCalendarService._validation_count % 10 == 0:
            try:
                deleted = OAuthState.cleanup_expired(older_than_hours=1)
                if deleted > 0:
                    logger.debug(f"Cleaned up {deleted} expired/used OAuth states")
            except Exception as e:
                logger.warning(f"Error during OAuth state cleanup: {str(e)}")
        
        # Try DB first (preferred method)
        try:
            state_record = OAuthState.query.filter_by(state=state, oauth_type='calendar', used=False).first()
            if state_record:
                # Check if expired
                if state_record.is_expired():
                    logger.warning(f"OAuth state expired: {state[:20]}...")
                    return False
                # Mark as used
                state_record.used = True
                db.session.commit()
                return True
        except Exception as e:
            logger.warning(f"Error validating state from DB, falling back to session: {str(e)}")
        
        # Fallback to session-based validation (backward compatibility)
        if session_state:
            return state == session_state
        
        return False
    
    def build_auth_url(self, user_id: str, request_full_scope: bool = False, use_scheduling_scopes: bool = False) -> tuple[str, str]:
        """Build Google OAuth authorization URL with incremental authorization
        
        Args:
            user_id: User ID
            request_full_scope: If True, request calendar.app.created scope for creating/updating events.
                              Non-sensitive, no OAuth verification required.
            use_scheduling_scopes: If True, request calendar.app.created and calendar.freebusy scopes.
                                 Note: calendar.freebusy is sensitive and requires verification.
        """
        state = self.generate_state(user_id)
        
        # Store state in database for reliable validation (works even if cookies fail)
        try:
            state_record = OAuthState(
                state=state,
                oauth_type='calendar',
                user_id=user_id,
                used=False
            )
            db.session.add(state_record)
            db.session.commit()
            logger.debug(f"Stored OAuth state in DB for calendar flow: {state[:20]}...")
        except Exception as e:
            logger.warning(f"Failed to store OAuth state in DB for calendar flow: {str(e)}")
            # Continue anyway - will fall back to session if DB fails
        
        # Default to calendar.app.created (non-sensitive, no verification required)
        # This allows managing only calendars/events created by the app
        if request_full_scope:
            # Use calendar.app.created for creating and updating events (non-sensitive, no verification required)
            requested_scopes = ["https://www.googleapis.com/auth/calendar.app.created"]
        elif use_scheduling_scopes:
            # Request calendar.app.created (non-sensitive) and calendar.freebusy (sensitive)
            # Note: calendar.freebusy requires OAuth verification
            requested_scopes = [
                "https://www.googleapis.com/auth/calendar.app.created",
                "https://www.googleapis.com/auth/calendar.freebusy"
            ]
        else:
            # Default: calendar.app.created (non-sensitive, no verification required)
            requested_scopes = ["https://www.googleapis.com/auth/calendar.app.created"]
        
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(requested_scopes),
            "access_type": "offline",
            "prompt": "consent",  # Force consent screen to ensure refresh_token is issued
            "include_granted_scopes": "true",  # Enable incremental authorization
            "state": state,
        }
        
        log_oauth_event("auth_url_generated", user_id, 
                       params=redact_sensitive_data(params),
                       requested_scopes=requested_scopes)
        return f"{self.auth_endpoint}?{urlencode(params)}", state
    
    def exchange_code_for_tokens(self, code: str, user_id: str) -> Dict[str, Any]:
        """Exchange authorization code for access tokens"""
        request_id = str(uuid.uuid4())[:8]
        
        logger.info(f"GOOGLE_TOKEN_EXCHANGE_START", extra={
            'request_id': request_id,
            'user_id': user_id,
            'has_code': bool(code),
            'code_length': len(code) if code else 0
        })
        
        try:
            token_data = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": self.redirect_uri,
            }
            
            response = self.session.post(self.token_endpoint, data=token_data)
            
            logger.info(f"GOOGLE_TOKEN_EXCHANGE_RESPONSE", extra={
                'request_id': request_id,
                'user_id': user_id,
                'status_code': response.status_code,
                'response_size': len(response.text)
            })
            
            if response.status_code != 200:
                log_oauth_event("token_exchange_failed", user_id, 
                              status_code=response.status_code, 
                              response_text=response.text[:200])
                raise RuntimeError(f"Token exchange failed: {response.text}")
            
            tokens = response.json()
            
            # Get granted scopes from token response (may include previously granted scopes)
            granted_scopes = tokens.get("scope", "").split() if tokens.get("scope") else []
            # If no scopes in response, use the requested scopes
            if not granted_scopes:
                granted_scopes = self.scopes
            
            # Get existing tokens to preserve refresh_token if Google doesn't return one
            existing_tokens = tokens_get(user_id)
            existing_refresh_token = existing_tokens.get("refresh_token") if existing_tokens else None
            
            # Google may not return refresh_token on subsequent consents
            # Preserve existing refresh_token if new one is not provided (handle None and empty string)
            new_refresh_token = tokens.get("refresh_token")
            # Treat empty string as missing (Google shouldn't return this, but be defensive)
            if not new_refresh_token or (isinstance(new_refresh_token, str) and not new_refresh_token.strip()):
                if existing_refresh_token:
                    logger.info(f"Google did not return refresh_token, preserving existing one for user {user_id}")
                    new_refresh_token = existing_refresh_token
                else:
                    logger.warning(f"Google did not return refresh_token and no existing refresh_token found for user {user_id}")
                    new_refresh_token = None
            else:
                logger.info(f"Google returned new refresh_token for user {user_id}")
            
            # Store tokens with actual granted scopes
            # Note: client_secret is not stored - always use config value
            token_data = {
                "access_token": tokens["access_token"],
                "refresh_token": new_refresh_token,  # Will be None if no existing token and Google didn't return one
                "token_uri": self.token_endpoint,
                "client_id": self.client_id,
                # client_secret removed - always use config value
                "scopes": " ".join(granted_scopes),
                "expiry": datetime.now(timezone.utc) + timedelta(seconds=tokens.get("expires_in", 3600))
            }
            
            tokens_upsert(user_id, token_data)
            
            logger.info(f"GOOGLE_TOKEN_EXCHANGE_SUCCESS", extra={
                'request_id': request_id,
                'user_id': user_id,
                'has_refresh_token': bool(new_refresh_token),
                'google_returned_refresh_token': bool(tokens.get("refresh_token")),
                'preserved_existing_refresh_token': bool(existing_refresh_token and not tokens.get("refresh_token")),
                'expires_in': tokens.get("expires_in"),
                'granted_scopes': granted_scopes
            })
            
            log_oauth_event("tokens_stored", user_id, granted_scopes=granted_scopes)
            return tokens
            
        except Exception as e:
            error_msg = sanitize_error_message(e)
            logger.error(f"GOOGLE_TOKEN_EXCHANGE_ERROR", extra={
                'request_id': request_id,
                'user_id': user_id,
                'error': error_msg
            }, exc_info=True)
            log_oauth_event("token_exchange_error", user_id, error=error_msg)
            raise
    
    def _get_refresh_lock(self, user_id: str) -> threading.Lock:
        """Get or create a lock for a specific user to prevent concurrent refreshes"""
        with _refresh_locks_lock:
            if user_id not in _refresh_locks:
                _refresh_locks[user_id] = threading.Lock()
            return _refresh_locks[user_id]
    
    def load_credentials(self, user_id: str) -> Credentials:
        """Load and refresh Google credentials for a user
        
        Uses per-user locking to prevent race conditions when multiple requests
        try to refresh the token simultaneously.
        
        Raises:
            RuntimeError: If tokens are missing or invalid, with message indicating reconnection needed
        """
        token_data = tokens_get(user_id)
        if not token_data:
            raise RuntimeError("Google Calendar not connected")
        
        # Ensure all required fields are present, using service defaults as fallback
        # client_secret always comes from config (not stored in DB)
        refresh_token = token_data.get("refresh_token")
        token_uri = token_data.get("token_uri") or self.token_endpoint
        client_id = token_data.get("client_id") or self.client_id
        client_secret = self.client_secret  # Always use config value
        scopes = token_data.get("scopes", "").split() if token_data.get("scopes") else self.scopes
        
        # Validate that we have the minimum required fields
        if not token_data.get("access_token"):
            raise RuntimeError("Google Calendar not connected: missing access token")
        
        # Early validation: Check if refresh_token is missing (critical for token refresh)
        # This prevents 500 errors when Google tries to refresh expired tokens
        if not refresh_token:
            logger.warning(f"Missing refresh_token for user {user_id} - reconnection required")
            raise RuntimeError("GOOGLE_RECONNECT_REQUIRED: Missing refresh token. Please reconnect your Google Calendar account.")
        
        # Validate that all required credential fields are present
        if not all([token_uri, client_id, client_secret]):
            logger.warning(f"Missing required credential fields for user {user_id} - reconnection required")
            raise RuntimeError("GOOGLE_RECONNECT_REQUIRED: Missing required credential fields. Please reconnect your Google Calendar account.")
        
        creds = Credentials(
            token=token_data["access_token"],
            refresh_token=refresh_token,
            token_uri=token_uri,
            client_id=client_id,
            client_secret=client_secret,
            scopes=scopes,
        )
        
        # Refresh if expired or about to expire (within 5 minutes)
        # This proactive refresh helps prevent expiration errors
        expiry = token_data.get("expiry")
        if expiry:
            try:
                from datetime import datetime, timezone
                expiry_dt = expiry if isinstance(expiry, datetime) else datetime.fromisoformat(str(expiry).replace('Z', '+00:00'))
                now = datetime.now(timezone.utc)
                # Refresh if expired or expiring within 5 minutes
                should_refresh = (expiry_dt - now).total_seconds() < 300
            except Exception:
                # If we can't parse expiry, check if creds.expired
                should_refresh = creds.expired
        else:
            should_refresh = creds.expired
        
        if should_refresh and creds.refresh_token:
            # Use per-user lock to prevent concurrent refreshes
            user_lock = self._get_refresh_lock(user_id)
            
            with user_lock:
                # Re-check token data after acquiring lock (another thread may have refreshed it)
                token_data = tokens_get(user_id)
                if not token_data:
                    raise RuntimeError("Google Calendar not connected")
                
                # Check if token was already refreshed by another thread
                expiry = token_data.get("expiry")
                if expiry:
                    try:
                        from datetime import datetime, timezone
                        expiry_dt = expiry if isinstance(expiry, datetime) else datetime.fromisoformat(str(expiry).replace('Z', '+00:00'))
                        now = datetime.now(timezone.utc)
                        should_refresh = (expiry_dt - now).total_seconds() < 300
                    except Exception:
                        should_refresh = creds.expired
                else:
                    should_refresh = creds.expired
                
                # Only refresh if still needed
                if should_refresh:
                    try:
                        # Ensure all required fields are present for refresh
                        refresh_token = token_data.get("refresh_token")
                        if not refresh_token:
                            raise RuntimeError("Google Calendar not connected: missing refresh token. Please reconnect.")
                        
                        token_uri = token_data.get("token_uri") or self.token_endpoint
                        client_id = token_data.get("client_id") or self.client_id
                        client_secret = self.client_secret  # Always use config value
                        scopes = token_data.get("scopes", "").split() if token_data.get("scopes") else self.scopes
                        
                        # Recreate creds with latest token data and validated fields
                        creds = Credentials(
                            token=token_data["access_token"],
                            refresh_token=refresh_token,
                            token_uri=token_uri,
                            client_id=client_id,
                            client_secret=client_secret,
                            scopes=scopes,
                        )
                        
                        # Validate that all required fields are present before refresh
                        if not all([creds.refresh_token, creds.token_uri, creds.client_id, creds.client_secret]):
                            raise RuntimeError("Google Calendar not connected: missing required credential fields. Please reconnect.")
                        
                        creds.refresh(GoogleRequest())
                        
                        # CRITICAL: Preserve the refresh_token from stored data, not from creds
                        # The Google Credentials object may not preserve refresh_token after refresh
                        # Always use the refresh_token from token_data (which we validated exists above)
                        stored_refresh_token = token_data.get("refresh_token")
                        if not stored_refresh_token:
                            # Fallback to creds.refresh_token, but this should not happen
                            stored_refresh_token = creds.refresh_token
                            logger.warning(f"Using refresh_token from Credentials object for user {user_id} (unexpected)")
                        
                        # Update stored tokens - explicitly preserve refresh_token
                        # client_secret not stored - always use config value
                        updated_tokens = {
                            "access_token": creds.token,
                            "refresh_token": stored_refresh_token,  # Preserve from stored data, not creds
                            "token_uri": token_data["token_uri"],
                            "client_id": token_data["client_id"],
                            # client_secret removed - always use config value
                            "scopes": token_data["scopes"],
                            "expiry": creds.expiry
                        }
                        tokens_upsert(user_id, updated_tokens)
                        logger.info(f"Tokens refreshed for user {user_id}, refresh_token preserved: {bool(stored_refresh_token)}")
                        log_oauth_event("tokens_refreshed", user_id)
                        
                    except Exception as e:
                        error_str = str(e).lower()
                        # Check if this is a refresh token error (invalid_grant, invalid_token, etc.)
                        is_refresh_error = any(
                            keyword in error_str 
                            for keyword in [
                                "invalid_grant", 
                                "invalid_token", 
                                "token has been revoked", 
                                "invalid_request",
                                "refresh error",
                                "necessary fields",
                                "refresh_token",
                                "token_uri",
                                "client_id",
                                "client_secret"
                            ]
                        )
                        
                        if is_refresh_error:
                            # Refresh token is invalid/revoked or missing required fields - clear tokens and indicate reconnection needed
                            logger.warning(f"Refresh token invalid or missing required fields for user {user_id}, clearing tokens: {str(e)}")
                            tokens_delete(user_id)
                            log_oauth_event("tokens_cleared_after_refresh_failure", user_id, error=str(e))
                            raise RuntimeError("Google Calendar not connected. Please reconnect your Google Calendar account.")
                        else:
                            # Other errors (network, etc.) - log and re-raise
                            logger.error(f"Failed to refresh credentials for user {user_id}: {str(e)}", exc_info=True)
                            raise RuntimeError(f"Failed to refresh Google credentials: {str(e)}")
                else:
                    # Token was refreshed by another thread, reload with fresh data
                    refresh_token = token_data.get("refresh_token")
                    token_uri = token_data.get("token_uri") or self.token_endpoint
                    client_id = token_data.get("client_id") or self.client_id
                    client_secret = self.client_secret  # Always use config value
                    scopes = token_data.get("scopes", "").split() if token_data.get("scopes") else self.scopes
                    
                    creds = Credentials(
                        token=token_data["access_token"],
                        refresh_token=refresh_token,
                        token_uri=token_uri,
                        client_id=client_id,
                        client_secret=client_secret,
                        scopes=scopes,
                    )
        
        return creds
    
    def _resolve_calendar_id(self, user_id: str, calendar_id: str) -> str:
        """Resolve calendar ID based on user's scopes
        
        If user has calendar.app.created scope (restricted) and requests "primary",
        automatically use SilverKey calendar instead since primary calendar is not accessible.
        
        Args:
            user_id: User ID
            calendar_id: Requested calendar ID (may be "primary")
        
        Returns:
            Resolved calendar ID (SilverKey calendar ID if restricted scope and primary requested)
        """
        if calendar_id == "primary":
            # Check if user has restricted scope (calendar.app.created)
            token_data = tokens_get(user_id)
            if token_data:
                scopes = token_data.get("scopes", "").split() if token_data.get("scopes") else []
                has_restricted_scope = (
                    "https://www.googleapis.com/auth/calendar.app.created" in scopes
                )
                
                if has_restricted_scope:
                    # User has restricted scope - can't access primary, use SilverKey calendar
                    try:
                        silverkey_cal = self.get_or_create_silverkey_calendar(user_id)
                        resolved_id = silverkey_cal.get("id")
                        logger.debug(f"Resolved 'primary' to SilverKey calendar {resolved_id} for user {user_id} (restricted scope)")
                        return resolved_id
                    except Exception as e:
                        logger.warning(f"Failed to get SilverKey calendar for user {user_id}, using requested calendar_id: {str(e)}")
        
        return calendar_id
    
    def list_calendars(self, user_id: str) -> List[Dict[str, Any]]:
        """List user's Google calendars"""
        try:
            creds = self.load_credentials(user_id)
            service = build("calendar", "v3", credentials=creds, cache_discovery=False)
            result = service.calendarList().list().execute()
            
            log_oauth_event("calendars_listed", user_id, count=len(result.get("items", [])))
            return result.get("items", [])
            
        except Exception as e:
            error_msg = sanitize_error_message(e)
            log_oauth_event("calendars_list_error", user_id, error=error_msg)
            logger.error(f"Error listing calendars for user {user_id}: {error_msg}", exc_info=True)
            raise
    
    def list_events(self, user_id: str, calendar_id: str = "primary", 
                   time_min: Optional[str] = None, time_max: Optional[str] = None,
                   max_results: int = 100) -> List[Dict[str, Any]]:
        """List events from user's Google calendar"""
        try:
            # Resolve calendar_id (convert "primary" to SilverKey if using restricted scope)
            calendar_id = self._resolve_calendar_id(user_id, calendar_id)
            
            creds = self.load_credentials(user_id)
            service = build("calendar", "v3", credentials=creds, cache_discovery=False)
            
            params = {
                "calendarId": calendar_id,
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
                logger.warning(f"Empty response from Google Calendar API for user {user_id}, calendar {calendar_id}")
                return []
            
            items = events_response.get("items", [])
            if not isinstance(items, list):
                logger.warning(f"Unexpected items format from Google Calendar API for user {user_id}: {type(items)}")
                return []
            
            log_oauth_event("events_listed", user_id, calendar_id=calendar_id, 
                          count=len(items))
            return items
            
        except Exception as e:
            error_msg = sanitize_error_message(e)
            log_oauth_event("events_list_error", user_id, calendar_id=calendar_id, error=error_msg)
            logger.error(f"Error listing events for user {user_id}, calendar {calendar_id}: {error_msg}", exc_info=True)
            raise
    
    def create_event(self, user_id: str, event_data: Dict[str, Any], 
                    calendar_id: str = "primary") -> Dict[str, Any]:
        """Create a new event in user's Google calendar"""
        try:
            # Validate event data
            if not validate_event_data(event_data):
                raise ValueError("Invalid event data")
            
            # Resolve calendar_id (convert "primary" to SilverKey if using restricted scope)
            calendar_id = self._resolve_calendar_id(user_id, calendar_id)
            
            creds = self.load_credentials(user_id)
            service = build("calendar", "v3", credentials=creds, cache_discovery=False)
            
            event = service.events().insert(
                calendarId=calendar_id,
                body=event_data
            ).execute()
            
            log_oauth_event("event_created", user_id, event_id=event.get("id"))
            return event
            
        except Exception as e:
            error_msg = sanitize_error_message(e)
            log_oauth_event("event_create_error", user_id, error=error_msg)
            logger.error(f"Error creating event for user {user_id}: {error_msg}", exc_info=True)
            raise
    
    def update_event(self, user_id: str, event_id: str, event_data: Dict[str, Any],
                    calendar_id: str = "primary") -> Dict[str, Any]:
        """Update an existing event in user's Google calendar"""
        try:
            # Validate event data
            if not validate_event_data(event_data):
                raise ValueError("Invalid event data")
            
            # Resolve calendar_id (convert "primary" to SilverKey if using restricted scope)
            calendar_id = self._resolve_calendar_id(user_id, calendar_id)
            
            creds = self.load_credentials(user_id)
            service = build("calendar", "v3", credentials=creds, cache_discovery=False)
            
            event = service.events().update(
                calendarId=calendar_id,
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
    
    def delete_event(self, user_id: str, event_id: str, 
                    calendar_id: str = "primary") -> bool:
        """Delete an event from user's Google calendar"""
        try:
            # Resolve calendar_id (convert "primary" to SilverKey if using restricted scope)
            calendar_id = self._resolve_calendar_id(user_id, calendar_id)
            
            creds = self.load_credentials(user_id)
            service = build("calendar", "v3", credentials=creds, cache_discovery=False)
            
            service.events().delete(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()
            
            log_oauth_event("event_deleted", user_id, event_id=event_id)
            return True
            
        except Exception as e:
            error_msg = sanitize_error_message(e)
            log_oauth_event("event_delete_error", user_id, event_id=event_id, error=error_msg)
            logger.error(f"Error deleting event {event_id} for user {user_id}: {error_msg}", exc_info=True)
            raise
    
    def create_calendar(self, user_id: str, calendar_name: str) -> Dict[str, Any]:
        """Create a secondary calendar for the user (requires full calendar scope)"""
        try:
            creds = self.load_credentials(user_id)
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
    
    def add_calendar_acl(self, user_id: str, calendar_id: str, agent_email: str, 
                         role: str = "writer") -> Dict[str, Any]:
        """Add an ACL rule to a calendar (grant agent access)"""
        try:
            creds = self.load_credentials(user_id)
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
    
    def query_freebusy(self, user_id: str, time_min: str, time_max: str, 
                      calendar_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """Query free/busy information for specified calendars
        
        Args:
            user_id: User ID
            time_min: Start time in ISO 8601 format
            time_max: End time in ISO 8601 format
            calendar_ids: List of calendar IDs to check (defaults to ["primary"])
        
        Returns:
            Dictionary with calendar IDs as keys and busy time blocks as values
        """
        try:
            creds = self.load_credentials(user_id)
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
    
    def get_or_create_silverkey_calendar(self, user_id: str, buyer_name: Optional[str] = None) -> Dict[str, Any]:
        """Get or create the SilverKey calendar for a user
        
        Args:
            user_id: User ID
            buyer_name: Ignored - calendar is always named "SilverKey"
        
        Returns:
            Calendar dictionary with id, summary, etc.
        """
        try:
            creds = self.load_credentials(user_id)
            service = build("calendar", "v3", credentials=creds, cache_discovery=False)
            
            # Try to find existing SilverKey calendar (exact name match)
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
            
            # Create new SilverKey calendar with exact name "SilverKey"
            calendar_name = "SilverKey"
            calendar_body = {
                "summary": calendar_name,
                "description": "Calendar created by SilverKey for managing home tours and real estate events",
                "timeZone": "America/Los_Angeles"  # Default, can be made configurable
            }
            
            created_calendar = service.calendars().insert(body=calendar_body).execute()
            
            log_oauth_event("silverkey_calendar_created", user_id, 
                          calendar_id=created_calendar.get("id"),
                          calendar_name=calendar_name)
            return created_calendar
            
        except Exception as e:
            error_msg = sanitize_error_message(e)
            log_oauth_event("silverkey_calendar_error", user_id, error=error_msg)
            logger.error(f"Error getting/creating SilverKey calendar for user {user_id}: {error_msg}", exc_info=True)
            raise
    
    def revoke_access(self, user_id: str) -> bool:
        """Revoke Google OAuth access for a user"""
        try:
            # Get stored tokens
            token_data = tokens_get(user_id)
            if not token_data:
                logger.warning(f"No tokens found for user {user_id} during revoke")
                return True
            
            # Revoke refresh token
            refresh_token = token_data.get("refresh_token")
            if refresh_token:
                revoke_res = self.session.post(
                    "https://oauth2.googleapis.com/revoke",
                    params={"token": refresh_token}
                )
                if revoke_res.status_code != 200:
                    log_oauth_event("revoke_failed", user_id, reason="google_revoke_failed")
                    logger.warning(f"Google revoke failed for user {user_id}: {revoke_res.status_code}")
            
            # Delete stored tokens
            tokens_delete(user_id)
            
            log_oauth_event("revoke_success", user_id)
            return True
            
        except Exception as e:
            error_msg = sanitize_error_message(e)
            log_oauth_event("revoke_failed", user_id, reason="exception", error=error_msg)
            logger.error(f"Error revoking access for user {user_id}: {error_msg}", exc_info=True)
            raise


# Singleton instance
google_calendar_service = GoogleCalendarService()
