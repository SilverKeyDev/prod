"""
OAuth facade for Google Calendar service.
Exposes state, auth URL, token exchange, and credential loading.
"""

from typing import Any

from ..oauth import build_auth_url, exchange_code_for_tokens, generate_state, validate_state
from .credentials import load_credentials


class CalendarOAuthFacade:
    """Holds OAuth config and delegates to flow/credentials."""

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        redirect_uri: str,
        auth_endpoint: str,
        token_endpoint: str,
        scopes: list,
        session,
    ):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.auth_endpoint = auth_endpoint
        self.token_endpoint = token_endpoint
        self.scopes = scopes
        self.session = session

    def generate_state(self, user_id: str) -> str:
        """Generate CSRF state parameter."""
        return generate_state(user_id)

    def validate_state(self, state: str, session_state: str | None = None) -> bool:
        """Validate OAuth state parameter."""
        return validate_state(state, session_state)

    def build_auth_url(
        self,
        user_id: str,
        request_additional_scopes: list[str] | None = None,
    ) -> tuple[str, str]:
        """Build Google OAuth authorization URL."""
        return build_auth_url(
            self.client_id,
            self.client_secret,
            self.redirect_uri,
            self.auth_endpoint,
            self.scopes,
            user_id,
            request_additional_scopes,
        )

    def exchange_code_for_tokens(self, code: str, user_id: str) -> dict[str, Any]:
        """Exchange authorization code for access tokens."""
        return exchange_code_for_tokens(
            code,
            user_id,
            self.client_id,
            self.client_secret,
            self.redirect_uri,
            self.token_endpoint,
            self.scopes,
            self.session,
        )

    def load_credentials(self, user_id: str):
        """Load and refresh Google credentials for a user."""
        return load_credentials(
            user_id,
            self.client_id,
            self.client_secret,
            self.token_endpoint,
            self.scopes,
        )
