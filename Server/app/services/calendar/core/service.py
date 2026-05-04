"""
Google Calendar Service
Handles Google Calendar API operations and OAuth token management
"""

from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.utils.security.app_logging import get_logger

from ..availability.freebusy import query_freebusy
from ..calendars.management import (
    create_calendar,
    get_or_create_silverkey_calendar,
)
from ..calendars.resolution import (
    list_calendars,
    resolve_calendar_id,
)
from ..calendars.sharing import (
    add_calendar_acl,
    setup_agent_client_calendar_sharing,
    share_calendar_with_users,
)
from ..events.operations import (
    create_event,
    delete_event,
    get_event,
    update_event,
)
from ..events.operations_list_events import list_events
from .oauth_facade import CalendarOAuthFacade
from .revoke import revoke_calendar_access

logger = get_logger()


class GoogleCalendarService:
    """Service for Google Calendar operations"""

    def __init__(self):
        """Initialize the Google Calendar service"""
        from app.config import Config

        self.client_id = Config.GOOGLE_CLIENT_ID
        self.client_secret = Config.GOOGLE_CALENDAR_SECRET or ""
        self.redirect_uri = Config.GOOGLE_REDIRECT_URI
        # Import permissions constants to ensure only allowed scopes are used
        from app.services.calendar.permissions.constants import permissions

        # Default to calendar.app.created (non-sensitive scope) - no OAuth verification required
        # This allows managing only calendars/events created by the app
        if Config.GOOGLE_SCOPES:
            # Validate that config scopes are in our permissions constants
            valid_scopes = {perm_data["scope_url"] for perm_data in permissions.values()}
            config_scopes = Config.GOOGLE_SCOPES.split()
            self.scopes = [scope for scope in config_scopes if scope in valid_scopes]
            if len(self.scopes) != len(config_scopes):
                invalid_scopes = set(config_scopes) - valid_scopes
                logger.warning(f"Filtered out invalid scopes from config: {invalid_scopes}")
        else:
            self.scopes = [permissions["calendar_app_created"]["scope_url"]]
        self.auth_endpoint = "https://accounts.google.com/o/oauth2/v2/auth"
        self.token_endpoint = "https://oauth2.googleapis.com/token"

        # Configuration validation
        self._validate_configuration()

        # Initialize request session with retry logic
        self._initialize_session()
        self._oauth_facade = CalendarOAuthFacade(
            self.client_id,
            self.client_secret,
            self.redirect_uri,
            self.auth_endpoint,
            self.token_endpoint,
            self.scopes,
            self.session,
        )

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
            logger.error(
                f"Google Calendar service missing required environment variables: {', '.join(missing_vars)}"
            )
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

    def _initialize_session(self):
        """Initialize requests session with retry logic"""
        self.session = requests.Session()

        # Configure retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            raise_on_status=False,
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)  # type: ignore[arg-type]; API accepts Retry
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

        # Default timeout for requests (Session does not have a timeout attribute)
        self._request_timeout = 15

    def is_healthy(self) -> bool:
        """Check if the service is properly configured and ready"""
        try:
            return all(
                [self.client_id, self.client_secret, self.redirect_uri, hasattr(self, "session")]
            )
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return False

    def generate_state(self, user_id: str) -> str:
        return self._oauth_facade.generate_state(user_id)

    def validate_state(self, state: str, session_state: str | None = None) -> bool:
        return self._oauth_facade.validate_state(state, session_state)

    def build_auth_url(
        self,
        user_id: str,
        request_full_scope: bool = False,
        use_scheduling_scopes: bool = False,
        request_additional_scopes: list[str] | None = None,
    ) -> tuple[str, str]:
        return self._oauth_facade.build_auth_url(
            user_id, request_full_scope, use_scheduling_scopes, request_additional_scopes
        )

    def exchange_code_for_tokens(self, code: str, user_id: str) -> dict[str, Any]:
        return self._oauth_facade.exchange_code_for_tokens(code, user_id)

    def load_credentials(self, user_id: str):
        return self._oauth_facade.load_credentials(user_id)

    def _resolve_calendar_id(self, user_id: str, calendar_id: str) -> str:
        """Resolve calendar ID (e.g. primary -> SilverKey when using restricted scope)."""
        return resolve_calendar_id(
            user_id,
            calendar_id,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
            self.get_or_create_silverkey_calendar,
        )

    def list_calendars(self, user_id: str) -> list[dict[str, Any]]:
        """List user's Google calendars (SilverKey only when using restricted scope)."""
        return list_calendars(
            user_id,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
            get_or_create_silverkey_calendar_func=lambda uid,
            buyer_name: self.get_or_create_silverkey_calendar(uid, buyer_name),
        )

    def list_events(
        self,
        user_id: str,
        calendar_id: str = "primary",
        time_min: str | None = None,
        time_max: str | None = None,
        max_results: int = 100,
    ) -> list[dict[str, Any]]:
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
            max_results,
        )

    def create_event(
        self,
        user_id: str,
        event_data: dict[str, Any],
        calendar_id: str = "primary",
        target_user_id: str | None = None,
        *,
        add_google_meet: bool = False,
    ) -> dict[str, Any]:
        """Create a new event in user's or target user's calendar."""
        return create_event(
            user_id,
            event_data,
            calendar_id,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
            self._resolve_calendar_id,
            target_user_id,
            add_google_meet=add_google_meet,
        )

    def get_event(
        self,
        user_id: str,
        event_id: str,
        calendar_id: str = "primary",
        target_user_id: str | None = None,
    ) -> dict[str, Any]:
        """Fetch a single calendar event by id."""
        return get_event(
            user_id,
            event_id,
            calendar_id,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
            self._resolve_calendar_id,
            target_user_id,
        )

    def update_event(
        self, user_id: str, event_id: str, event_data: dict[str, Any], calendar_id: str = "primary"
    ) -> dict[str, Any]:
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
            self._resolve_calendar_id,
        )

    def delete_event(self, user_id: str, event_id: str, calendar_id: str = "primary") -> bool:
        """Delete an event from user's Google calendar"""
        return delete_event(
            user_id,
            event_id,
            calendar_id,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
            self._resolve_calendar_id,
        )

    def create_calendar(self, user_id: str, calendar_name: str) -> dict[str, Any]:
        """Create a secondary calendar for the user (requires full calendar scope)"""
        return create_calendar(
            user_id,
            calendar_name,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
        )

    def add_calendar_acl(
        self, user_id: str, calendar_id: str, agent_email: str, role: str = "writer"
    ) -> dict[str, Any]:
        """Add an ACL rule to a calendar (grant agent access)"""
        return add_calendar_acl(
            user_id,
            calendar_id,
            agent_email,
            role,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
        )

    def query_freebusy(
        self,
        user_id: str,
        time_min: str,
        time_max: str,
        calendar_ids: list[str] | None = None,
        resolve_calendar_id: bool = True,
    ) -> dict[str, Any]:
        """Query free/busy information for specified calendars."""
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
            resolve_func,
        )

    def get_or_create_silverkey_calendar(
        self, user_id: str, buyer_name: str | None = None
    ) -> dict[str, Any]:
        """Get or create the SilverKey calendar for a user."""
        return get_or_create_silverkey_calendar(
            user_id,
            buyer_name,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
        )

    def setup_agent_client_calendar_sharing(
        self, agent_id: str, client_id: str, agent_email: str, client_email: str, db_session=None
    ) -> dict[str, Any]:
        """Set up bidirectional calendar sharing between agent and client."""
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
            db_session,
        )

    def share_calendar_with_users(
        self,
        calendar_owner_id: str,
        shared_with_user_ids: list[str],
        calendar_id: str,
        role: str = "writer",
        db_session=None,
    ) -> dict[str, Any]:
        """Share a calendar with multiple users."""
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
            db_session,
        )

    def revoke_access(self, user_id: str) -> bool:
        """Revoke Google OAuth access for a user."""
        return revoke_calendar_access(user_id, self.session)


# Singleton instance
google_calendar_service = GoogleCalendarService()
