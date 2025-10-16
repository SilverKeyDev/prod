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
        self.jwks_uri = "https://www.googleapis.com/oauth2/v3/certs"
        
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
    
    def build_auth_url(self) -> tuple[str, str, str]:
        """Build Google OAuth authorization URL"""
        state = self.generate_state()
        nonce = str(uuid.uuid4())  # Generate nonce for id_token validation
        
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(self.scopes),
            "access_type": "online",
            "state": state,
            "nonce": nonce,
            "prompt": "select_account"  # Always show account selection
        }
        
        logger.info(f"GOOGLE_AUTH_URL_GENERATED", extra={
            'redirect_uri': self.redirect_uri,
            'scopes': self.scopes,
            'has_nonce': True
        })
        
        return f"{self.auth_endpoint}?{urlencode(params)}", state, nonce
    
    def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access tokens"""
        request_id = str(uuid.uuid4())[:8]
        
        logger.info(f"GOOGLE_TOKEN_EXCHANGE_START", extra={
            'request_id': request_id,
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
                'status_code': response.status_code,
                'response_size': len(response.text)
            })
            
            if response.status_code != 200:
                logger.error(f"GOOGLE_TOKEN_EXCHANGE_FAILED", extra={
                    'request_id': request_id,
                    'status_code': response.status_code,
                    'response_text': response.text[:200]
                })
                raise RuntimeError(f"Token exchange failed: {response.text}")
            
            tokens = response.json()
            
            # Validate that we received an id_token
            if 'id_token' not in tokens:
                logger.error(f"GOOGLE_MISSING_ID_TOKEN", extra={
                    'request_id': request_id,
                    'token_keys': list(tokens.keys())
                })
                raise RuntimeError("Google OAuth response missing id_token")
            
            logger.info(f"GOOGLE_TOKEN_EXCHANGE_SUCCESS", extra={
                'request_id': request_id,
                'has_access_token': bool(tokens.get("access_token")),
                'has_id_token': bool(tokens.get("id_token")),
                'expires_in': tokens.get("expires_in")
            })
            
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
        
        logger.info(f"GOOGLE_USERINFO_REQUEST_START", extra={
            'request_id': request_id,
            'has_access_token': bool(access_token)
        })
        
        try:
            headers = {
                "Authorization": f"Bearer {access_token}"
            }
            
            response = self.session.get(self.userinfo_endpoint, headers=headers)
            
            logger.info(f"GOOGLE_USERINFO_RESPONSE", extra={
                'request_id': request_id,
                'status_code': response.status_code
            })
            
            if response.status_code != 200:
                logger.error(f"GOOGLE_USERINFO_FAILED", extra={
                    'request_id': request_id,
                    'status_code': response.status_code,
                    'response_text': response.text[:200]
                })
                raise RuntimeError(f"Failed to get user info: {response.text}")
            
            user_info = response.json()
            
            logger.info(f"GOOGLE_USERINFO_SUCCESS", extra={
                'request_id': request_id,
                'has_email': bool(user_info.get('email')),
                'email_verified': user_info.get('verified_email'),
                'has_name': bool(user_info.get('name'))
            })
            
            return user_info
            
        except Exception as e:
            logger.error(f"GOOGLE_USERINFO_ERROR", extra={
                'request_id': request_id,
                'error': str(e)
            }, exc_info=True)
            raise
    
    def verify_id_token(self, id_token: str, expected_nonce: str) -> Dict[str, Any]:
        """
        Verify Google ID token (RS256 with JWKS)
        
        Args:
            id_token: The ID token from Google
            expected_nonce: The nonce that was sent in the auth request
            
        Returns:
            Decoded and verified token claims
            
        Raises:
            RuntimeError: If verification fails
        """
        import jwt
        from jwt import PyJWKClient
        
        request_id = str(uuid.uuid4())[:8]
        
        try:
            logger.info(f"🔍 GOOGLE_ID_TOKEN_VERIFICATION_START", extra={
                'request_id': request_id,
                'token_length': len(id_token),
                'has_nonce': bool(expected_nonce)
            })
            
            # Get unverified header to check algorithm
            unverified_header = jwt.get_unverified_header(id_token)
            
            logger.info(f"🔍 GOOGLE_ID_TOKEN_HEADER", extra={
                'request_id': request_id,
                'alg': unverified_header.get('alg'),
                'typ': unverified_header.get('typ'),
                'kid': unverified_header.get('kid', 'missing')[:20] + '...' if unverified_header.get('kid') else 'missing'
            })
            
            if unverified_header.get('alg') != 'RS256':
                logger.error(f"❌ GOOGLE_ID_TOKEN_INVALID_ALG", extra={
                    'request_id': request_id,
                    'alg': unverified_header.get('alg'),
                    'expected': 'RS256'
                })
                raise ValueError(f"Invalid algorithm: {unverified_header.get('alg')}, expected RS256")
            
            # Use PyJWKClient to get the public key
            logger.info(f"🔍 GOOGLE_FETCHING_JWKS", extra={
                'request_id': request_id,
                'jwks_uri': self.jwks_uri
            })
            
            jwks_client = PyJWKClient(self.jwks_uri)
            signing_key = jwks_client.get_signing_key_from_jwt(id_token)
            
            logger.info(f"✅ GOOGLE_SIGNING_KEY_RETRIEVED", extra={
                'request_id': request_id,
                'key_type': type(signing_key).__name__
            })
            
            # Decode and verify
            claims = jwt.decode(
                id_token,
                signing_key.key,
                algorithms=["RS256"],
                audience=self.client_id,
                issuer="https://accounts.google.com",
                options={"verify_exp": True, "verify_aud": True, "verify_iss": True}
            )
            
            logger.info(f"✅ GOOGLE_ID_TOKEN_DECODED", extra={
                'request_id': request_id,
                'iss': claims.get('iss'),
                'aud': claims.get('aud')[:20] + '...' if claims.get('aud') else 'missing',
                'sub': claims.get('sub')[:10] + '***' if claims.get('sub') else 'missing',
                'email_verified': claims.get('email_verified')
            })
            
            # Verify nonce
            if claims.get('nonce') != expected_nonce:
                logger.error(f"❌ GOOGLE_NONCE_MISMATCH", extra={
                    'request_id': request_id,
                    'expected_nonce': expected_nonce[:10] + '...' if expected_nonce else 'missing',
                    'actual_nonce': claims.get('nonce', '')[:10] + '...' if claims.get('nonce') else 'missing'
                })
                raise ValueError("Nonce mismatch")
            
            logger.info(f"GOOGLE_ID_TOKEN_VERIFIED", extra={
                'request_id': request_id,
                'sub': claims.get('sub')[:10] + '***' if claims.get('sub') else 'missing',
                'email': claims.get('email', '')[:3] + '***' if claims.get('email') else 'missing'
            })
            
            return claims
            
        except Exception as e:
            logger.error(f"GOOGLE_ID_TOKEN_VERIFICATION_FAILED", extra={
                'request_id': request_id,
                'error': str(e),
                'error_type': type(e).__name__
            })
            raise RuntimeError(f"ID token verification failed: {str(e)}")


# Singleton instance
google_oauth_service = GoogleOAuthService()

