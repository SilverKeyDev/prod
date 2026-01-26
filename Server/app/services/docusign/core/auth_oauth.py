"""
DocuSign OAuth authentication

Implements OAuth 2.0 authentication for per-agent operations.
"""

import secrets
import json
import hmac
import hashlib
import base64
from typing import Optional, Tuple
from datetime import datetime, timedelta, timezone

from docusign_esign import ApiClient
from docusign_esign.client.api_exception import ApiException

from app import db
from app.config import Config
from app.models import DocusignOAuthToken
from logger import get_logger, LOG_CATEGORIES
from ..errors import DocusignAuthError

logger = get_logger()


class DocusignOAuthService:
    """
    OAuth-based authentication for DocuSign.
    
    Allows per-agent OAuth connections for user-specific operations.
    """
    
    @staticmethod
    def _validate_oauth_config():
        """Validate required OAuth configuration"""
        missing_vars = []
        
        if not Config.DOCUSIGN_CLIENT_ID:
            missing_vars.append("DOCUSIGN_CLIENT_ID")
        
        if not Config.DOCUSIGN_CLIENT_SECRET:
            missing_vars.append("DOCUSIGN_CLIENT_SECRET")
        
        if not Config.DOCUSIGN_OAUTH_REDIRECT_URI:
            missing_vars.append("DOCUSIGN_OAUTH_REDIRECT_URI")
        
        if not Config.DOCUSIGN_BASE_URL:
            missing_vars.append("DOCUSIGN_BASE_URL")
        
        if missing_vars:
            error_msg = f"DocuSign OAuth service missing required configuration: {', '.join(missing_vars)}"
            logger.error(LOG_CATEGORIES["ERRORS"], error_msg)
            raise DocusignAuthError(error_msg)
    
    @staticmethod
    def _encode_state(user_id: str, token: str) -> str:
        """
        Securely encode user_id and token into state parameter.
        Uses HMAC to prevent tampering.
        
        Args:
            user_id: User ID
            token: Random token
            
        Returns:
            Encoded state string
        """
        # Create payload
        payload = f"{user_id}:{token}"
        
        # Generate HMAC signature using secret key
        secret = Config.SECRET_KEY.encode() if isinstance(Config.SECRET_KEY, str) else Config.SECRET_KEY
        signature = hmac.new(secret, payload.encode(), hashlib.sha256).digest()
        signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')
        
        # Return payload with signature
        return f"{payload}:{signature_b64}"
    
    @staticmethod
    def _decode_state(state: str) -> str:
        """
        Decode and verify state parameter.
        
        Args:
            state: Encoded state string
            
        Returns:
            User ID
            
        Raises:
            DocusignAuthError: If state is invalid or tampered
        """
        try:
            parts = state.rsplit(':', 1)
            if len(parts) != 2:
                raise DocusignAuthError("Invalid state format")
            
            payload, signature_b64 = parts
            
            # Verify HMAC signature
            secret = Config.SECRET_KEY.encode() if isinstance(Config.SECRET_KEY, str) else Config.SECRET_KEY
            expected_signature = hmac.new(secret, payload.encode(), hashlib.sha256).digest()
            
            # Add padding back to base64 signature
            padding = (4 - len(signature_b64) % 4) % 4
            signature_b64_padded = signature_b64 + '=' * padding
            provided_signature = base64.urlsafe_b64decode(signature_b64_padded)
            
            if not hmac.compare_digest(expected_signature, provided_signature):
                raise DocusignAuthError("State signature verification failed")
            
            # Extract user_id from payload
            user_id, _ = payload.split(':', 1)
            return user_id
            
        except (ValueError, IndexError) as e:
            logger.error(LOG_CATEGORIES["ERRORS"], "Failed to decode state", {"error": str(e)})
            raise DocusignAuthError("Invalid state token")
    
    @staticmethod
    def build_auth_url(user_id: str) -> Tuple[str, str]:
        """
        Build OAuth authorization URL for user.
        
        Args:
            user_id: User ID
            
        Returns:
            Tuple of (auth_url, state)
        """
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Building DocuSign OAuth URL", {
            "user_id": user_id
        })
        
        # Validate configuration
        DocusignOAuthService._validate_oauth_config()
        
        # Generate state token
        token = secrets.token_urlsafe(32)
        state_data = DocusignOAuthService._encode_state(user_id, token)
        
        # Build OAuth URL
        scopes = "signature impersonation"
        oauth_host = Config.DOCUSIGN_BASE_URL.replace('https://', '').replace('http://', '').replace('/restapi', '')
        
        auth_url = (
            f"https://{oauth_host}/oauth/auth"
            f"?response_type=code"
            f"&scope={scopes}"
            f"&client_id={Config.DOCUSIGN_CLIENT_ID}"
            f"&redirect_uri={Config.DOCUSIGN_OAUTH_REDIRECT_URI}"
            f"&state={state_data}"
        )
        
        logger.info(LOG_CATEGORIES["DOCUSIGN"], "DocuSign OAuth URL built successfully", {
            "user_id": user_id,
            "oauth_host": oauth_host,
            "state_prefix": state_data[:8] + "..."
        })
        
        return auth_url, state_data
    
    @staticmethod
    def extract_user_id_from_state(state: str) -> str:
        """
        Extract user ID from state token.
        Verifies HMAC signature to prevent tampering.
        
        Args:
            state: State token from OAuth callback
            
        Returns:
            User ID
        """
        return DocusignOAuthService._decode_state(state)
    
    @staticmethod
    def exchange_code_for_tokens(user_id: str, code: str) -> DocusignOAuthToken:
        """
        Exchange authorization code for access and refresh tokens.
        
        Args:
            user_id: User ID
            code: Authorization code
            
        Returns:
            DocusignOAuthToken model
        """
        # Validate configuration
        DocusignOAuthService._validate_oauth_config()
        
        try:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Exchanging OAuth code for tokens", {
                "user_id": user_id,
                "code_length": len(code) if code else 0
            })
            
            # Create API client
            api_client = ApiClient()
            oauth_host = Config.DOCUSIGN_BASE_URL.replace('https://', '').replace('http://', '').replace('/restapi', '')
            api_client.set_oauth_host_name(oauth_host)
            
            # Exchange code for token
            oauth_response = api_client.generate_access_token(
                client_id=Config.DOCUSIGN_CLIENT_ID,
                client_secret=Config.DOCUSIGN_CLIENT_SECRET,
                code=code
            )
            
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "OAuth tokens received, fetching user info", {
                "user_id": user_id,
                "expires_in": oauth_response.expires_in
            })
            
            # Get user info to get account details
            user_info = api_client.get_user_info(oauth_response.access_token)
            
            if not user_info.accounts:
                logger.warn(LOG_CATEGORIES["DOCUSIGN"], "No DocuSign accounts found for user", {
                    "user_id": user_id
                })
                raise DocusignAuthError("No DocuSign accounts found")
            
            # Use first account
            account = user_info.accounts[0]
            
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Saving OAuth tokens", {
                "user_id": user_id,
                "account_id": account.account_id,
                "accounts_count": len(user_info.accounts)
            })
            
            # Save or update token
            token = DocusignOAuthToken.query.filter_by(user_id=user_id).first()
            
            is_new_token = not token
            if not token:
                token = DocusignOAuthToken(user_id=user_id)
            
            # NOTE: Tokens are stored in database. In production environments,
            # consider implementing field-level encryption for access_token and refresh_token
            # using SQLAlchemy hybrid properties or database-level encryption.
            token.access_token = oauth_response.access_token
            token.refresh_token = oauth_response.refresh_token
            token.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=oauth_response.expires_in)
            token.account_id = account.account_id
            token.base_uri = account.base_uri
            token.scopes = json.dumps(oauth_response.scope.split())
            
            db.session.add(token)
            db.session.commit()
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "OAuth tokens saved successfully", {
                "user_id": user_id,
                "account_id": account.account_id,
                "is_new_token": is_new_token,
                "expires_at": token.token_expires_at.isoformat()
            })
            
            return token
            
        except ApiException as e:
            logger.error(LOG_CATEGORIES["ERRORS"], "OAuth token exchange failed", {
                "error": str(e),
                "user_id": user_id,
                "status": getattr(e, 'status', None)
            })
            raise DocusignAuthError(f"OAuth token exchange failed: {str(e)}")
        
        except Exception as e:
            logger.error(LOG_CATEGORIES["ERRORS"], "Unexpected OAuth error", {
                "error": str(e),
                "user_id": user_id
            })
            db.session.rollback()
            raise DocusignAuthError(f"OAuth failed: {str(e)}")
    
    @staticmethod
    def refresh_token(token: DocusignOAuthToken) -> DocusignOAuthToken:
        """
        Refresh OAuth access token.
        
        Args:
            token: DocusignOAuthToken model
            
        Returns:
            Updated token
        """
        try:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Refreshing OAuth token", {
                "user_id": token.user_id,
                "current_expires_at": token.token_expires_at.isoformat() if token.token_expires_at else None
            })
            
            # Create API client
            api_client = ApiClient()
            oauth_host = Config.DOCUSIGN_BASE_URL.replace('https://', '').replace('http://', '').replace('/restapi', '')
            api_client.set_oauth_host_name(oauth_host)
            
            # Refresh token
            oauth_response = api_client.refresh_access_token(
                client_id=Config.DOCUSIGN_CLIENT_ID,
                client_secret=Config.DOCUSIGN_CLIENT_SECRET,
                refresh_token=token.refresh_token
            )
            
            # Update token (see note above about encryption)
            token.access_token = oauth_response.access_token
            new_refresh_token = bool(oauth_response.refresh_token)
            if oauth_response.refresh_token:  # New refresh token might be provided
                token.refresh_token = oauth_response.refresh_token
            token.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=oauth_response.expires_in)
            
            db.session.commit()
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "OAuth token refreshed successfully", {
                "user_id": token.user_id,
                "new_expires_at": token.token_expires_at.isoformat(),
                "new_refresh_token_provided": new_refresh_token
            })
            
            return token
            
        except Exception as e:
            logger.error(LOG_CATEGORIES["ERRORS"], "Token refresh failed", {
                "error": str(e),
                "user_id": token.user_id
            })
            raise DocusignAuthError(f"Token refresh failed: {str(e)}")
    
    @staticmethod
    def get_valid_token(user_id: str) -> Optional[DocusignOAuthToken]:
        """
        Get valid access token for user, refreshing if necessary.
        
        Args:
            user_id: User ID
            
        Returns:
            DocusignOAuthToken or None if not connected
        """
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Getting valid OAuth token", {
            "user_id": user_id
        })
        
        token = DocusignOAuthToken.query.filter_by(user_id=user_id).first()
        
        if not token:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "No OAuth token found for user", {
                "user_id": user_id
            })
            return None
        
        # Check if token is expired (with 5 minute buffer)
        buffer = timedelta(minutes=5)
        is_expired = datetime.now(timezone.utc) >= (token.token_expires_at - buffer)
        
        if is_expired:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "OAuth token expired, refreshing", {
                "user_id": user_id,
                "expired_at": token.token_expires_at.isoformat()
            })
            # Refresh token
            token = DocusignOAuthService.refresh_token(token)
        else:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "OAuth token is valid", {
                "user_id": user_id,
                "expires_at": token.token_expires_at.isoformat()
            })
        
        return token
    
    @staticmethod
    def disconnect(user_id: str):
        """
        Disconnect user's DocuSign OAuth.
        
        Args:
            user_id: User ID
        """
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Disconnecting DocuSign OAuth", {
            "user_id": user_id
        })
        
        token = DocusignOAuthToken.query.filter_by(user_id=user_id).first()
        
        if token:
            db.session.delete(token)
            db.session.commit()
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "DocuSign OAuth disconnected successfully", {
                "user_id": user_id,
                "account_id": token.account_id
            })
        else:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "No OAuth token found to disconnect", {
                "user_id": user_id
            })
    
    @staticmethod
    def get_api_client(user_id: str) -> Optional[ApiClient]:
        """
        Get configured API client for user with OAuth token.
        
        Args:
            user_id: User ID
            
        Returns:
            Configured ApiClient or None if not connected
        """
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Creating OAuth API client", {
            "user_id": user_id
        })
        
        token = DocusignOAuthService.get_valid_token(user_id)
        
        if not token:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Cannot create API client - no valid token", {
                "user_id": user_id
            })
            return None
        
        api_client = ApiClient()
        api_client.set_base_path(f"{token.base_uri}/restapi")
        api_client.set_default_header("Authorization", f"Bearer {token.access_token}")
        
        logger.info(LOG_CATEGORIES["DOCUSIGN"], "OAuth API client created successfully", {
            "user_id": user_id,
            "base_uri": token.base_uri
        })
        
        return api_client
