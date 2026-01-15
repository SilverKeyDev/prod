"""
Google Calendar Service
Handles Google Calendar API operations and OAuth token management
"""

import requests
from typing import Optional, Dict, Any, List
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.utils.security.app_logging import get_logger
from app.services.auth.tokens import tokens_get, tokens_delete
from app.utils.security.security import log_oauth_event, sanitize_error_message

from ..oauth.flow import build_auth_url, exchange_code_for_tokens, generate_state, validate_state
from .credentials import load_credentials
from ..calendars.resolution import (
    list_calendars,
    resolve_calendar_id,
)
from ..calendars.management import (
    create_calendar,
    get_or_create_silverkey_calendar,
)
from ..calendars.sharing import (
    add_calendar_acl,
    setup_agent_client_calendar_sharing,
    share_calendar_with_users,
)
from ..events.operations import (
    list_events,
    create_event,
    update_event,
    delete_event,
)
from ..availability.freebusy import query_freebusy

logger = get_logger()


class GoogleCalendarService:
    """Service for Google Calendar operations"""
    
    def __init__(self):
        """Initialize the Google Calendar service"""
        from app.config import Config
        
        self.client_id = Config.GOOGLE_CLIENT_ID
        self.client_secret = Config.GOOGLE_CALENDAR_SECRET
        self.redirect_uri = Config.GOOGLE_REDIRECT_URI
        # Import permissions constants to ensure only allowed scopes are used
        from app.services.calendar.permissions.constants import permissions
        
        # Default to calendar.app.created (non-sensitive scope) - no OAuth verification required
        # This allows managing only calendars/events created by the app
        if Config.GOOGLE_SCOPES:
            # Validate that config scopes are in our permissions constants
            valid_scopes = {perm_data['scope_url'] for perm_data in permissions.values()}
            config_scopes = Config.GOOGLE_SCOPES.split()
            self.scopes = [scope for scope in config_scopes if scope in valid_scopes]
            if len(self.scopes) != len(config_scopes):
                invalid_scopes = set(config_scopes) - valid_scopes
                logger.warning(f"Filtered out invalid scopes from config: {invalid_scopes}")
        else:
            self.scopes = [permissions['calendar_app_created']['scope_url']]
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
        return generate_state(user_id)
    
    def validate_state(self, state: str, session_state: Optional[str] = None) -> bool:
        """
        Validate OAuth state parameter from database.
        Falls back to session_state for backward compatibility, but DB is preferred.
        """
        return validate_state(state, session_state)
    
    def build_auth_url(self, user_id: str, request_full_scope: bool = False, use_scheduling_scopes: bool = False, request_additional_scopes: Optional[List[str]] = None) -> tuple[str, str]:
        """Build Google OAuth authorization URL with incremental authorization
        
        Always requests all scopes defined in app.services.calendar.permissions.constants.
        
        Args:
            user_id: User ID
            request_full_scope: Deprecated - all scopes are always requested
            use_scheduling_scopes: Deprecated - all scopes are always requested
            request_additional_scopes: Optional list of additional scope URLs to ensure are included.
                                      All scopes from permissions constants are already requested.
        """
        return build_auth_url(
            self.client_id,
            self.client_secret,
            self.redirect_uri,
            self.auth_endpoint,
            self.scopes,
            user_id,
            request_full_scope,
            use_scheduling_scopes,
            request_additional_scopes
        )
    
    def exchange_code_for_tokens(self, code: str, user_id: str) -> Dict[str, Any]:
        """Exchange authorization code for access tokens"""
        return exchange_code_for_tokens(
            code,
            user_id,
            self.client_id,
            self.client_secret,
            self.redirect_uri,
            self.token_endpoint,
            self.scopes,
            self.session
        )
    
    def load_credentials(self, user_id: str):
        """Load and refresh Google credentials for a user
        
        Uses per-user locking to prevent race conditions when multiple requests
        try to refresh the token simultaneously.
        
        Raises:
            RuntimeError: If tokens are missing or invalid, with message indicating reconnection needed
        """
        from google.oauth2.credentials import Credentials
        return load_credentials(
            user_id,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes
        )
    
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
        return resolve_calendar_id(
            user_id,
            calendar_id,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
            self.get_or_create_silverkey_calendar
        )
    
    def list_calendars(self, user_id: str) -> List[Dict[str, Any]]:
        """List user's Google calendars
        
        With restricted scope (calendar.app.created), returns only the SilverKey calendar
        since listing all calendars is not permitted.
        """
        return list_calendars(
            user_id,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
            get_or_create_silverkey_calendar_func=lambda uid, buyer_name: self.get_or_create_silverkey_calendar(uid, buyer_name)
        )
    
    def list_events(self, user_id: str, calendar_id: str = "primary",
                   time_min: Optional[str] = None, time_max: Optional[str] = None,
                   max_results: int = 100) -> List[Dict[str, Any]]:
        """List events from user's Google calendar"""
        return list_events(
            user_id,
            calendar_id,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
            self._resolve_calendar_id,
            time_min,
            time_max,
            max_results
        )
    
    def create_event(self, user_id: str, event_data: Dict[str, Any],
                    calendar_id: str = "primary", target_user_id: Optional[str] = None) -> Dict[str, Any]:
        """Create a new event in user's Google calendar or target user's calendar
        
        Args:
            user_id: User ID (creator of the event)
            event_data: Event data dictionary
            calendar_id: Calendar ID (may be "primary")
            target_user_id: Optional target user ID to create event in their calendar instead
        """
        return create_event(
            user_id,
            event_data,
            calendar_id,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
            self._resolve_calendar_id,
            target_user_id
        )
    
    def update_event(self, user_id: str, event_id: str, event_data: Dict[str, Any],
                    calendar_id: str = "primary") -> Dict[str, Any]:
        """Update an existing event in user's Google calendar"""
        return update_event(
            user_id,
            event_id,
            event_data,
            calendar_id,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
            self._resolve_calendar_id
        )
    
    def delete_event(self, user_id: str, event_id: str,
                    calendar_id: str = "primary") -> bool:
        """Delete an event from user's Google calendar"""
        return delete_event(
            user_id,
            event_id,
            calendar_id,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
            self._resolve_calendar_id
        )
    
    def create_calendar(self, user_id: str, calendar_name: str) -> Dict[str, Any]:
        """Create a secondary calendar for the user (requires full calendar scope)"""
        return create_calendar(
            user_id,
            calendar_name,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes
        )
    
    def add_calendar_acl(self, user_id: str, calendar_id: str, agent_email: str,
                         role: str = "writer") -> Dict[str, Any]:
        """Add an ACL rule to a calendar (grant agent access)"""
        return add_calendar_acl(
            user_id,
            calendar_id,
            agent_email,
            role,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes
        )
    
    def query_freebusy(self, user_id: str, time_min: str, time_max: str,
                      calendar_ids: Optional[List[str]] = None,
                      resolve_calendar_id: bool = True) -> Dict[str, Any]:
        """Query free/busy information for specified calendars
        
        Args:
            user_id: User ID
            time_min: Start time in ISO 8601 format
            time_max: End time in ISO 8601 format
            calendar_ids: List of calendar IDs to check (defaults to ["primary"])
            resolve_calendar_id: Whether to resolve calendar IDs (e.g., for restricted scope)
        
        Returns:
            Dictionary with calendar IDs as keys and busy time blocks as values
        """
        resolve_func = self._resolve_calendar_id if resolve_calendar_id else None
        return query_freebusy(
            user_id,
            time_min,
            time_max,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
            calendar_ids,
            resolve_func
        )
    
    def get_or_create_silverkey_calendar(self, user_id: str, buyer_name: Optional[str] = None) -> Dict[str, Any]:
        """Get or create the SilverKey calendar for a user
        
        Args:
            user_id: User ID
            buyer_name: Ignored - calendar is always named "SilverKey"
        
        Returns:
            Calendar dictionary with id, summary, etc.
        """
        return get_or_create_silverkey_calendar(
            user_id,
            buyer_name,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes
        )
    
    def setup_agent_client_calendar_sharing(
        self, 
        agent_id: str, 
        client_id: str, 
        agent_email: str, 
        client_email: str,
        db_session=None
    ) -> Dict[str, Any]:
        """Set up bidirectional calendar sharing between agent and client
        
        Args:
            agent_id: Agent user ID
            client_id: Client user ID
            agent_email: Agent's email address
            client_email: Client's email address
            db_session: Database session (optional)
        
        Returns:
            Dictionary with status and any errors encountered
        """
        return setup_agent_client_calendar_sharing(
            agent_id,
            client_id,
            agent_email,
            client_email,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
            self.get_or_create_silverkey_calendar,
            db_session
        )
    
    def share_calendar_with_users(
        self,
        calendar_owner_id: str,
        shared_with_user_ids: List[str],
        calendar_id: str,
        role: str = "writer",
        db_session=None
    ) -> Dict[str, Any]:
        """Share a calendar with multiple users
        
        Args:
            calendar_owner_id: User ID who owns the calendar
            shared_with_user_ids: List of user IDs to share the calendar with
            calendar_id: Calendar ID to share
            role: ACL role ("reader", "writer", "owner")
            db_session: Database session (optional)
        
        Returns:
            Dictionary with status and results
        """
        return share_calendar_with_users(
            calendar_owner_id,
            shared_with_user_ids,
            calendar_id,
            role,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
            self.get_or_create_silverkey_calendar,
            db_session
        )
    
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
