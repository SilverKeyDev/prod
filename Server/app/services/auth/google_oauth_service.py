"""
Google OAuth Service for Authentication
Handles Google OAuth sign-up and sign-in flow
"""

import os
import time
import uuid
import base64
import requests
from urllib.parse import urlencode
from typing import Optional, Dict, Any
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from ..utils.app_logging import get_logger

logger = get_logger()


class GoogleOAuthService:
    """Service for Google OAuth authentication"""
    
    def __init__(self):
        """Initialize the Google OAuth service"""
        from app.config import Config
        
        self.client_id = Config.GOOGLE_CLIENT_ID
        self.client_secret = Config.GOOGLE_CALENDAR_SECRET  # Same secret as calendar
        
        # Determine redirect URI based on environment
        flask_env = os.getenv('FLASK_ENV', 'development')
        if flask_env == 'production':
            self.redirect_uri = 'https://usesilverkey.com/api/v1/auth/google/callback'
        else:
            # Backend URL for OAuth callback (not frontend)
            # This must match what's configured in Google Cloud Console
            self.redirect_uri = 'http://localhost:5000/api/v1/auth/google/callback'
        
        # OAuth scopes for user profile and email
        self.scopes = [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "openid"
        ]
        
        self.auth_endpoint = "https://accounts.google.com/o/oauth2/v2/auth"
        self.token_endpoint = "https://oauth2.googleapis.com/token"
        self.userinfo_endpoint = "https://www.googleapis.com/oauth2/v2/userinfo"
        
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
        
        if missing_vars:
            logger.error(f"Google OAuth service missing required environment variables: {', '.join(missing_vars)}")
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
    
    def generate_state(self) -> str:
        """Generate CSRF state parameter"""
        timestamp = str(int(time.time()))
        random_data = str(uuid.uuid4())
        data = f"google_auth:{timestamp}:{random_data}"
        return base64.urlsafe_b64encode(data.encode()).decode()
    
    def validate_state(self, state: str, session_state: Optional[str]) -> bool:
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
            "prompt": "select_account"  # Always show account selection
        }
        
        
        return f"{self.auth_endpoint}?{urlencode(params)}", state
    
    def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
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
                logger.error(f"GOOGLE_TOKEN_EXCHANGE_FAILED", extra={
                    'request_id': request_id,
                    'status_code': response.status_code,
                    'response_text': response.text[:200]
                })
                raise RuntimeError(f"Token exchange failed: {response.text}")
            
            tokens = response.json()
            
            
            return tokens
            
        except Exception as e:
            logger.error(f"GOOGLE_TOKEN_EXCHANGE_ERROR", extra={
                'request_id': request_id,
                'error': str(e)
            }, exc_info=True)
            raise
    
    def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information from Google"""
        request_id = str(uuid.uuid4())[:8]
        
        
        try:
            headers = {
                "Authorization": f"Bearer {access_token}"
            }
            
            response = self.session.get(self.userinfo_endpoint, headers=headers)
            
            
            if response.status_code != 200:
                logger.error(f"GOOGLE_USERINFO_FAILED", extra={
                    'request_id': request_id,
                    'status_code': response.status_code,
                    'response_text': response.text[:200]
                })
                raise RuntimeError(f"Failed to get user info: {response.text}")
            
            user_info = response.json()
            
            
            return user_info
            
        except Exception as e:
            logger.error(f"GOOGLE_USERINFO_ERROR", extra={
                'request_id': request_id,
                'error': str(e)
            }, exc_info=True)
            raise


# Singleton instance
google_oauth_service = GoogleOAuthService()

