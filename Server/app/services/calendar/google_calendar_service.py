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
from app.utils.security.security import (
    redact_sensitive_data, 
    validate_oauth_state, 
    sanitize_error_message, 
    log_oauth_event,
    validate_event_data
)

logger = get_logger()


class GoogleCalendarService:
    """Service for Google Calendar operations"""
    
    def __init__(self):
        """Initialize the Google Calendar service"""
        from app.config import Config
        
        self.client_id = Config.GOOGLE_CLIENT_ID
        self.client_secret = Config.GOOGLE_CALENDAR_SECRET
        self.redirect_uri = Config.GOOGLE_REDIRECT_URI
        self.scopes = Config.GOOGLE_SCOPES.split() if Config.GOOGLE_SCOPES else [
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/calendar.readonly"
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
    
    def validate_state(self, state: str, session_state: Optional[str]) -> bool:
        """Validate OAuth state parameter"""
        return validate_oauth_state(state, session_state)
    
    def build_auth_url(self, user_id: str, request_full_scope: bool = False, use_scheduling_scopes: bool = False) -> str:
        """Build Google OAuth authorization URL with incremental authorization
        
        Args:
            user_id: User ID
            request_full_scope: If True, request full calendar scope (for agent sharing).
                              If False, request only calendar.events scope (default).
            use_scheduling_scopes: If True, request calendar.app.created and calendar.freebusy scopes (for scheduling MVP).
        """
        state = self.generate_state(user_id)
        
        # Use incremental authorization: start with calendar.events, only request full calendar scope when needed
        if request_full_scope:
            requested_scopes = ["https://www.googleapis.com/auth/calendar"]
        elif use_scheduling_scopes:
            # Request minimal scopes for scheduling MVP: calendar.app.created and calendar.freebusy
            requested_scopes = [
                "https://www.googleapis.com/auth/calendar.app.created",
                "https://www.googleapis.com/auth/calendar.freebusy"
            ]
        else:
            requested_scopes = ["https://www.googleapis.com/auth/calendar.events"]
        
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(requested_scopes),
            "access_type": "offline",
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
            
            # Store tokens with actual granted scopes
            token_data = {
                "access_token": tokens["access_token"],
                "refresh_token": tokens.get("refresh_token"),
                "token_uri": self.token_endpoint,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "scopes": " ".join(granted_scopes),
                "expiry": datetime.now(timezone.utc) + timedelta(seconds=tokens.get("expires_in", 3600))
            }
            
            tokens_upsert(user_id, token_data)
            
            logger.info(f"GOOGLE_TOKEN_EXCHANGE_SUCCESS", extra={
                'request_id': request_id,
                'user_id': user_id,
                'has_refresh_token': bool(tokens.get("refresh_token")),
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
    
    def load_credentials(self, user_id: str) -> Credentials:
        """Load and refresh Google credentials for a user"""
        token_data = tokens_get(user_id)
        if not token_data:
            raise RuntimeError("Google Calendar not connected")
        
        creds = Credentials(
            token=token_data["access_token"],
            refresh_token=token_data.get("refresh_token"),
            token_uri=token_data["token_uri"],
            client_id=token_data["client_id"],
            client_secret=token_data["client_secret"],
            scopes=token_data["scopes"].split(),
        )
        
        # Refresh if expired
        if creds.expired and creds.refresh_token:
            try:
                creds.refresh(GoogleRequest())
                
                # Update stored tokens
                updated_tokens = {
                    "access_token": creds.token,
                    "refresh_token": creds.refresh_token,
                    "token_uri": token_data["token_uri"],
                    "client_id": token_data["client_id"],
                    "client_secret": token_data["client_secret"],
                    "scopes": token_data["scopes"],
                    "expiry": creds.expiry
                }
                tokens_upsert(user_id, updated_tokens)
                log_oauth_event("tokens_refreshed", user_id)
                
            except Exception as e:
                logger.error(f"Failed to refresh credentials for user {user_id}: {str(e)}")
                raise RuntimeError(f"Failed to refresh Google credentials: {str(e)}")
        
        return creds
    
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
            
            events = service.events().list(**params).execute()
            
            log_oauth_event("events_listed", user_id, calendar_id=calendar_id, 
                          count=len(events.get("items", [])))
            return events.get("items", [])
            
        except Exception as e:
            error_msg = sanitize_error_message(e)
            log_oauth_event("events_list_error", user_id, calendar_id=calendar_id, error=error_msg)
            logger.error(f"Error listing events for user {user_id}: {error_msg}", exc_info=True)
            raise
    
    def create_event(self, user_id: str, event_data: Dict[str, Any], 
                    calendar_id: str = "primary") -> Dict[str, Any]:
        """Create a new event in user's Google calendar"""
        try:
            # Validate event data
            if not validate_event_data(event_data):
                raise ValueError("Invalid event data")
            
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
            buyer_name: Optional buyer name to include in calendar name
        
        Returns:
            Calendar dictionary with id, summary, etc.
        """
        try:
            creds = self.load_credentials(user_id)
            service = build("calendar", "v3", credentials=creds, cache_discovery=False)
            
            # Try to find existing SilverKey calendar
            calendar_list = service.calendarList().list().execute()
            silverkey_calendars = [
                cal for cal in calendar_list.get("items", [])
                if cal.get("summary", "").startswith("SilverKey")
            ]
            
            if silverkey_calendars:
                # Return the first SilverKey calendar found
                log_oauth_event("silverkey_calendar_found", user_id, 
                              calendar_id=silverkey_calendars[0].get("id"))
                return silverkey_calendars[0]
            
            # Create new SilverKey calendar
            calendar_name = f"SilverKey – {buyer_name}" if buyer_name else "SilverKey Home Tours"
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
