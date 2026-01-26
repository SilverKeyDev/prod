"""
DocuSign JWT authentication

Implements JWT-based authentication for service account operations.
"""

import os
import time
from typing import Optional, Dict, Any
from datetime import datetime, timedelta, timezone

from docusign_esign import ApiClient
from docusign_esign.client.api_exception import ApiException

from app.config import Config
from logger import get_logger, LOG_CATEGORIES
from ..errors import DocusignAuthError

logger = get_logger()


class DocusignJWTAuth:
    """
    JWT-based authentication for DocuSign.
    
    Uses service account credentials (integration key + private key) to obtain
    access tokens for system-level operations.
    """
    
    def __init__(self):
        self.integration_key = Config.DOCUSIGN_INTEGRATION_KEY
        self.impersonated_user_id = Config.DOCUSIGN_IMPERSONATED_USER_ID
        self.private_key = Config.DOCUSIGN_PRIVATE_KEY
        self.private_key_path = Config.DOCUSIGN_PRIVATE_KEY_PATH
        self.base_url = Config.DOCUSIGN_BASE_URL
        self.account_id = Config.DOCUSIGN_ACCOUNT_ID
        
        # Token cache
        self._access_token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None
        
        # Validate configuration
        self._validate_config()
    
    def _validate_config(self):
        """Validate required JWT configuration"""
        missing_vars = []
        
        if not self.integration_key:
            missing_vars.append("DOCUSIGN_INTEGRATION_KEY")
        
        if not self.impersonated_user_id:
            missing_vars.append("DOCUSIGN_IMPERSONATED_USER_ID")
        
        # Check for either private key content or path
        if not self.private_key and not self.private_key_path:
            missing_vars.append("DOCUSIGN_PRIVATE_KEY or DOCUSIGN_PRIVATE_KEY_PATH")
        
        if not self.base_url:
            missing_vars.append("DOCUSIGN_BASE_URL")
        
        if missing_vars:
            error_msg = f"DocuSign JWT service missing required configuration: {', '.join(missing_vars)}"
            logger.error(LOG_CATEGORIES["ERRORS"], error_msg)
            raise DocusignAuthError(error_msg)
        
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "DocuSign JWT configuration validated", {
            "has_integration_key": bool(self.integration_key),
            "has_impersonated_user_id": bool(self.impersonated_user_id),
            "has_private_key": bool(self.private_key),
            "has_private_key_path": bool(self.private_key_path),
            "base_url": self.base_url
        })
        
        # If using file path, verify it exists
        if self.private_key_path and not self.private_key:
            if not os.path.exists(self.private_key_path):
                error_msg = f"DocuSign private key file not found: {self.private_key_path}"
                logger.error(LOG_CATEGORIES["ERRORS"], error_msg)
                raise DocusignAuthError(error_msg)
        
        if not self.account_id:
            logger.warn(LOG_CATEGORIES["DOCUSIGN"], "DOCUSIGN_ACCOUNT_ID not configured, will fetch from user info")
    
    def _read_private_key(self) -> bytes:
        """
        Read private key from environment variable or file.
        
        Prefers DOCUSIGN_PRIVATE_KEY (direct content) over DOCUSIGN_PRIVATE_KEY_PATH (file path).
        """
        try:
            # Prefer direct key content from environment variable
            if self.private_key:
                logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Using DocuSign private key from environment variable")
                # Handle both string and bytes
                if isinstance(self.private_key, bytes):
                    return self.private_key
                return self.private_key.encode('utf-8')
            
            # Fall back to reading from file
            if self.private_key_path:
                logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Reading DocuSign private key from file", {
                    "path": self.private_key_path
                })
                with open(self.private_key_path, 'rb') as f:
                    key_content = f.read()
                    logger.info(LOG_CATEGORIES["DOCUSIGN"], "Private key loaded from file successfully", {
                        "path": self.private_key_path,
                        "size_bytes": len(key_content)
                    })
                    return key_content
            
            # Should never reach here due to validation
            raise DocusignAuthError("No private key source configured")
            
        except Exception as e:
            logger.error(LOG_CATEGORIES["ERRORS"], "Failed to read DocuSign private key", {
                "error": str(e),
                "has_key_content": bool(self.private_key),
                "has_key_path": bool(self.private_key_path)
            })
            raise DocusignAuthError(f"Failed to read private key: {str(e)}")
    
    def _is_token_valid(self) -> bool:
        """Check if current token is valid"""
        if not self._access_token or not self._token_expires_at:
            return False
        
        # Check if token expires in the next 5 minutes
        buffer = timedelta(minutes=5)
        return datetime.now(timezone.utc) < (self._token_expires_at - buffer)
    
    def get_access_token(self, force_refresh: bool = False) -> str:
        """
        Get valid access token, refreshing if necessary.
        
        Args:
            force_refresh: Force token refresh even if current token is valid
            
        Returns:
            Access token
            
        Raises:
            DocusignAuthError: If authentication fails
        """
        if not force_refresh and self._is_token_valid():
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Using cached JWT token", {
                "expires_at": self._token_expires_at.isoformat() if self._token_expires_at else None
            })
            return self._access_token
        
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "JWT token refresh needed", {
            "force_refresh": force_refresh,
            "token_valid": self._is_token_valid()
        })
        
        # Request new token
        return self._request_jwt_token()
    
    def _request_jwt_token(self) -> str:
        """Request new JWT access token from DocuSign"""
        try:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Requesting DocuSign JWT token", {
                "impersonated_user_id": self.impersonated_user_id,
                "base_url": self.base_url
            })
            
            # Create API client
            api_client = ApiClient()
            api_client.set_base_path(self.base_url)
            
            # Read private key
            private_key = self._read_private_key()
            
            # Request JWT token
            # Scopes for JWT: signature, impersonation
            scopes = ["signature", "impersonation"]
            
            # Request token with 1 hour expiration
            oauth_response = api_client.request_jwt_user_token(
                client_id=self.integration_key,
                user_id=self.impersonated_user_id,
                oauth_host_name=self.base_url.replace('https://', '').replace('http://', ''),
                private_key_bytes=private_key,
                expires_in=3600,  # 1 hour
                scopes=scopes
            )
            
            # Cache token
            self._access_token = oauth_response.access_token
            self._token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=oauth_response.expires_in)
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "DocuSign JWT token obtained successfully", {
                "expires_in": oauth_response.expires_in,
                "expires_at": self._token_expires_at.isoformat()
            })
            
            return self._access_token
            
        except ApiException as e:
            logger.error(LOG_CATEGORIES["ERRORS"], "DocuSign JWT authentication failed", {
                "error": str(e),
                "status": getattr(e, 'status', None),
                "impersonated_user_id": self.impersonated_user_id
            })
            
            # Check for consent required error
            if hasattr(e, 'body') and 'consent_required' in str(e.body):
                consent_url = self._get_consent_url()
                logger.warn(LOG_CATEGORIES["DOCUSIGN"], "DocuSign consent required", {
                    "consent_url": consent_url
                })
                raise DocusignAuthError(
                    f"User consent required. Visit: {consent_url}"
                )
            
            raise DocusignAuthError(f"JWT authentication failed: {str(e)}")
        
        except Exception as e:
            logger.error(LOG_CATEGORIES["ERRORS"], "Unexpected JWT authentication error", {
                "error": str(e)
            })
            raise DocusignAuthError(f"JWT authentication failed: {str(e)}")
    
    def _get_consent_url(self) -> str:
        """Generate consent URL for JWT grant"""
        base = self.base_url.replace('/restapi', '')
        return f"{base}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id={self.integration_key}&redirect_uri=https://developers.docusign.com/platform/auth/consent"
    
    def get_api_client(self) -> ApiClient:
        """
        Get configured API client with valid access token.
        
        Returns:
            Configured ApiClient
        """
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Creating DocuSign API client", {
            "base_url": self.base_url
        })
        
        access_token = self.get_access_token()
        
        api_client = ApiClient()
        api_client.set_base_path(f"{self.base_url}/restapi")
        api_client.set_default_header("Authorization", f"Bearer {access_token}")
        
        logger.info(LOG_CATEGORIES["DOCUSIGN"], "DocuSign API client created successfully")
        
        return api_client
    
    def get_account_id(self) -> str:
        """
        Get DocuSign account ID.
        
        Returns:
            Account ID
        """
        if self.account_id:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Using cached account ID", {
                "account_id": self.account_id
            })
            return self.account_id
        
        # Fetch from user info
        try:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Fetching DocuSign account ID from user info")
            
            api_client = self.get_api_client()
            user_info = api_client.get_user_info(self.get_access_token())
            
            if not user_info.accounts:
                raise DocusignAuthError("No DocuSign accounts found for user")
            
            # Use first account
            account = user_info.accounts[0]
            self.account_id = account.account_id
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "DocuSign account ID fetched successfully", {
                "account_id": self.account_id,
                "account_name": account.account_name if hasattr(account, 'account_name') else None,
                "accounts_count": len(user_info.accounts)
            })
            
            return self.account_id
            
        except Exception as e:
            logger.error(LOG_CATEGORIES["ERRORS"], "Failed to fetch DocuSign account ID", {
                "error": str(e)
            })
            raise DocusignAuthError(f"Failed to fetch account ID: {str(e)}")


# Global JWT auth instance
_jwt_auth: Optional[DocusignJWTAuth] = None


def get_jwt_auth() -> DocusignJWTAuth:
    """Get or create JWT auth instance"""
    global _jwt_auth
    
    if _jwt_auth is None:
        _jwt_auth = DocusignJWTAuth()
    
    return _jwt_auth
