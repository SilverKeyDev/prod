"""
Google OAuth Service for Authentication
Handles Google OAuth sign-up and sign-in flow
"""

import base64
import os
import time
import uuid
from typing import Any
from urllib.parse import urlencode

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from logger import log

from ...config.constants._constants_public_urls import (
    API_PATH_GOOGLE_AUTH_CALLBACK,
    url_for_public_api,
)


class GoogleOAuthService:
    """Service for Google OAuth authentication"""

    def __init__(self):
        """Initialize the Google OAuth service"""
        from app.config import Config

        self.client_id = Config.GOOGLE_CLIENT_ID
        self.client_secret = Config.GOOGLE_CALENDAR_SECRET
        flask_env = os.getenv("FLASK_ENV", "development")
        self.redirect_uri = url_for_public_api(flask_env, API_PATH_GOOGLE_AUTH_CALLBACK)
        self.scopes = [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "openid",
        ]
        self.auth_endpoint = "https://accounts.google.com/o/oauth2/v2/auth"
        self.token_endpoint = "https://oauth2.googleapis.com/token"
        self.userinfo_endpoint = "https://www.googleapis.com/oauth2/v2/userinfo"
        self._validate_configuration()
        self._initialize_session()

    def _validate_configuration(self):
        """Validate required configuration"""
        missing_vars = []
        if not self.client_id:
            missing_vars.append("GOOGLE_CLIENT_ID")
        if not self.client_secret:
            missing_vars.append("GOOGLE_CALENDAR_SECRET")
        if missing_vars:
            missing = ", ".join(missing_vars)
            log.error(
                "ERRORS",
                f"Google OAuth service missing required environment variables: {missing}",
            )
            raise ValueError(f"Missing required environment variables: {missing}")

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

    def validate_state(self, state: str, session_state: str | None) -> bool:
        """Validate OAuth state parameter"""
        if not state or not session_state:
            return False
        return state == session_state

    def build_auth_url(self) -> tuple[str, str]:
        """Build Google OAuth authorization URL"""
        state = self.generate_state()
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(self.scopes),
            "access_type": "online",
            "state": state,
            "prompt": "select_account",
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
            response = self.session.post(self.token_endpoint, data=token_data)
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
            response = self.session.get(self.userinfo_endpoint, headers=headers)
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


google_oauth_service = GoogleOAuthService()
