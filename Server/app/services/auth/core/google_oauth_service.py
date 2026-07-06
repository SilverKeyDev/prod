"""
Google OAuth Service for Authentication.

Purpose:
    Handles Google OAuth 2.0 sign-up and sign-in flow for users who prefer Google authentication
    over Cognito. Creates or retrieves SilverKey user accounts based on Google profile.

Public API:
    - get_authorization_url(redirect_uri): Generate OAuth URL for client redirect
    - handle_callback(code, state, redirect_uri): Exchange auth code for tokens, create/get user
    - validate_state(state): Validate CSRF state token

Token Lifecycle:
    1. Client requests auth URL with state token
    2. User authorizes at Google
    3. Google redirects with code and state
    4. Service exchanges code for access_token
    5. Service fetches user profile from Google
    6. Service creates or retrieves SilverKey User
    7. Returns user and session token to client

Dependencies (Environment Variables):
    - GOOGLE_OAUTH_CLIENT_ID: OAuth app client ID
    - GOOGLE_OAUTH_CLIENT_SECRET: OAuth app secret
    - FRONTEND_URL or FRONTEND_BASE_URL: Redirect target (default: http://localhost:5173)

Side Effects:
    - Creates OAuthState records in database (CSRF protection)
    - Creates or updates User records based on Google profile
    - Creates UserSession for authenticated user

Error Handling:
    - Raises ValueError for invalid state or missing credentials
    - Raises requests.HTTPError for Google API failures
    - Logs all OAuth attempts (success and failure) via app logger

See Also:
    - .cursor/rules/backend/backend-architecture.mdc (auth patterns)
    - Server/ARCHITECTURE.md (auth pipeline)
"""

import base64
import os
import time
import uuid
from typing import Any
from urllib.parse import urlencode

import requests
from requests.adapters import HTTPAdapter
from sqlalchemy import select
from urllib3.util.retry import Retry

from app import db
from app.models import OAuthState
from logger import log

from ....config.constants._constants_public_urls import (
    API_PATH_GOOGLE_AUTH_CALLBACK,
    url_for_public_api,
)


class GoogleOAuthService:
    """Service for Google OAuth authentication"""

    _validation_count = 0

    def __init__(self):
        """Initialize the Google OAuth service"""
        from app.config import Config

        self.client_id = Config.GOOGLE_CLIENT_ID
        self.client_secret = Config.GOOGLE_CALENDAR_SECRET
        flask_env = os.getenv("FLASK_ENV", "development")
        self.redirect_uri = url_for_public_api(flask_env, API_PATH_GOOGLE_AUTH_CALLBACK)
        self._scopes = None
        self.auth_endpoint = "https://accounts.google.com/o/oauth2/v2/auth"
        self.token_endpoint = "https://oauth2.googleapis.com/token"
        self.userinfo_endpoint = "https://www.googleapis.com/oauth2/v2/userinfo"
        self._validate_configuration()
        self._initialize_session()

    @property
    def scopes(self):
        """Lazy-load OAuth scopes to avoid circular import with calendar.permissions"""
        if self._scopes is None:
            from app.services.calendar.permissions.constants import permissions

            self._scopes = [
                permissions["userinfo_email"]["scope_url"],
                permissions["userinfo_profile"]["scope_url"],
                permissions["openid"]["scope_url"],
            ]
        return self._scopes

    def _validate_configuration(self):
        """Validate required configuration"""
        missing_vars = []
        if not self.client_id:
            missing_vars.append("GOOGLE_CLIENT_ID")
        if not self.client_secret:
            missing_vars.append("GOOGLE_CALENDAR_SECRET")
        if missing_vars:
            log.error(
                "ERRORS",
                f"Google OAuth service missing required environment variables: {', '.join(missing_vars)}",
            )
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

    def _initialize_session(self):
        """Initialize requests session with retry logic"""
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            raise_on_status=False,
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        self._request_timeout = 15

    def generate_state(self) -> str:
        """Generate CSRF state parameter"""
        timestamp = str(int(time.time()))
        random_data = str(uuid.uuid4())
        data = f"google_auth:{timestamp}:{random_data}"
        return base64.urlsafe_b64encode(data.encode()).decode()

    def validate_state(self, state: str, session_state: str | None = None) -> bool:
        """
        Validate OAuth state parameter from database.
        Falls back to session_state for backward compatibility, but DB is preferred.
        """
        if not state:
            return False
        GoogleOAuthService._validation_count += 1
        if GoogleOAuthService._validation_count % 10 == 0:
            try:
                deleted = OAuthState.cleanup_expired(older_than_hours=1)
                if deleted > 0:
                    log.debug("AUTH", f"Cleaned up {deleted} expired/used OAuth states")
            except Exception as e:
                log.warn("AUTH", f"Error during OAuth state cleanup: {str(e)}")
        try:
            state_record = db.session.scalar(
                select(OAuthState).where(
                    OAuthState.state == state,
                    OAuthState.oauth_type == "auth",
                    OAuthState.used.is_(False),
                )
            )
            if state_record:
                if state_record.is_expired():
                    log.warn("AUTH", f"OAuth state expired: {state[:20]}...")
                    return False
                state_record.used = True
                db.session.commit()
                return True
        except Exception as e:
            log.warn("AUTH", f"Error validating state from DB, falling back to session: {str(e)}")
        if session_state:
            return state == session_state
        return False

    def build_auth_url(self) -> tuple[str, str]:
        """
        Build Google OAuth authorization URL with offline access and consent prompt.
        Stores state in database for reliable validation.
        """
        state = self.generate_state()
        try:
            state_record = OAuthState(state=state, oauth_type="auth", user_id=None, used=False)
            db.session.add(state_record)
            db.session.commit()
            log.info("AUTH", f"Stored OAuth state in DB: {state[:20]}...")
        except Exception as e:
            log.error("ERRORS", f"Failed to store OAuth state in DB: {str(e)}")
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(self.scopes),
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }
        return (f"{self.auth_endpoint}?{urlencode(params)}", state)

    def exchange_code_for_tokens(self, code: str) -> dict[str, Any]:
        """Exchange authorization code for access tokens"""
        request_id = str(uuid.uuid4())[:8]
        try:
            token_data = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": self.redirect_uri,
            }
            response = self.session.post(
                self.token_endpoint, data=token_data, timeout=self._request_timeout
            )
            if response.status_code != 200:
                log.error(
                    "ERRORS",
                    "GOOGLE_TOKEN_EXCHANGE_FAILED",
                    {
                        "request_id": request_id,
                        "status_code": response.status_code,
                        "response_text": response.text[:200],
                    },
                )
                raise RuntimeError(f"Token exchange failed: {response.text}")
            tokens = response.json()
            has_refresh_token = bool(tokens.get("refresh_token"))
            log.info(
                "AUTH",
                "GOOGLE_TOKEN_EXCHANGE_SUCCESS",
                {
                    "request_id": request_id,
                    "has_refresh_token": has_refresh_token,
                    "has_access_token": bool(tokens.get("access_token")),
                    "expires_in": tokens.get("expires_in"),
                    "token_type": tokens.get("token_type"),
                },
            )
            if not has_refresh_token:
                log.warn(
                    "AUTH",
                    "GOOGLE_TOKEN_EXCHANGE_NO_REFRESH_TOKEN",
                    {
                        "request_id": request_id,
                        "note": "Google did not return refresh_token. This may happen if user already granted consent. Ensure access_type=offline and prompt=consent are set.",
                    },
                )
            return tokens
        except Exception as e:
            log.error(
                "ERRORS", "GOOGLE_TOKEN_EXCHANGE_ERROR", {"request_id": request_id, "error": str(e)}
            )
            raise

    def get_user_info(self, access_token: str) -> dict[str, Any]:
        """Get user information from Google"""
        request_id = str(uuid.uuid4())[:8]
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            response = self.session.get(
                self.userinfo_endpoint, headers=headers, timeout=self._request_timeout
            )
            if response.status_code != 200:
                log.error(
                    "ERRORS",
                    "GOOGLE_USERINFO_FAILED",
                    {
                        "request_id": request_id,
                        "status_code": response.status_code,
                        "response_text": response.text[:200],
                    },
                )
                raise RuntimeError(f"Failed to get user info: {response.text}")
            user_info = response.json()
            return user_info
        except Exception as e:
            log.error(
                "ERRORS", "GOOGLE_USERINFO_ERROR", {"request_id": request_id, "error": str(e)}
            )
            raise

    def refresh_access_token(self, refresh_token: str) -> dict[str, Any]:
        """Refresh Google OAuth access token using refresh token"""
        from .oauth_refresh import refresh_google_access_token

        return refresh_google_access_token(
            self.session,
            self.token_endpoint,
            self.client_id,
            self.client_secret or "",
            refresh_token,
        )


google_oauth_service = GoogleOAuthService()
