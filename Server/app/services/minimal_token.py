"""
Minimal Token Service
Generates lightweight custom JWT tokens with only essential claims to reduce storage size.
"""
import jwt
import os
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from flask import current_app

logger = logging.getLogger(__name__)

class MinimalTokenService:
    """Service for generating minimal JWT tokens with only essential claims"""
    
    def __init__(self):
        # Use the main application secret key for consistency
        # This avoids requiring a separate MINIMAL_TOKEN_SECRET environment variable
        from flask import current_app
        try:
            # Try to get the secret key from Flask app context
            self.secret_key = current_app.config.get('SECRET_KEY')
        except RuntimeError:
            # If not in app context, get from environment directly
            self.secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        
        if not self.secret_key:
            # Final fallback for development
            self.secret_key = 'silverkey-minimal-token-secret-key-2024-dev'
            logger.warning("Using development secret key for minimal tokens")
        
        self.algorithm = 'HS256'  # Simpler than RS256, smaller tokens
        
    def create_minimal_access_token(self, user_id: str, user_email: str, expires_in_hours: int = 8) -> str:
        """
        Create a minimal access token with only essential claims
        
        Args:
            user_id: User's database ID
            user_email: User's email address
            expires_in_hours: Token expiration time in hours
            
        Returns:
            Minimal JWT token string
        """
        try:
            now = datetime.utcnow()
            exp_time = now + timedelta(hours=expires_in_hours)
            
            # Minimal payload with only essential claims
            payload = {
                'sub': user_id,           # Subject (user ID)
                'email': user_email,      # User email
                'iat': int(now.timestamp()),  # Issued at
                'exp': int(exp_time.timestamp()),  # Expiration
                'type': 'access',        # Token type
                'iss': 'silverkey-api'   # Issuer
            }
            
            token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
            
            # Log token creation with size info
            token_size = len(token.encode('utf-8'))
            logger.info("MINIMAL_ACCESS_TOKEN_CREATED", extra={
                'user_id': user_id,
                'email': user_email[:3] + '***' + user_email[-3:] if user_email else 'missing',
                'token_size_bytes': token_size,
                'expires_in_hours': expires_in_hours,
                'expires_at': exp_time.isoformat(),
                'algorithm': self.algorithm
            })
            
            return token
            
        except Exception as e:
            logger.error("MINIMAL_ACCESS_TOKEN_CREATION_ERROR", extra={
                'user_id': user_id,
                'email': user_email[:3] + '***' + user_email[-3:] if user_email else 'missing',
                'error': str(e),
                'error_type': type(e).__name__
            })
            raise
    
    def create_minimal_id_token(self, user_id: str, user_email: str, user_name: str, expires_in_hours: int = 8) -> str:
        """
        Create a minimal ID token with only essential user info
        
        Args:
            user_id: User's database ID
            user_email: User's email address
            user_name: User's display name
            expires_in_hours: Token expiration time in hours
            
        Returns:
            Minimal JWT ID token string
        """
        try:
            now = datetime.utcnow()
            exp_time = now + timedelta(hours=expires_in_hours)
            
            # Minimal ID token payload
            payload = {
                'sub': user_id,           # Subject (user ID)
                'email': user_email,      # User email
                'name': user_name,        # User name
                'iat': int(now.timestamp()),  # Issued at
                'exp': int(exp_time.timestamp()),  # Expiration
                'type': 'id',            # Token type
                'iss': 'silverkey-api'   # Issuer
            }
            
            token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
            
            # Log token creation with size info
            token_size = len(token.encode('utf-8'))
            logger.info("MINIMAL_ID_TOKEN_CREATED", extra={
                'user_id': user_id,
                'email': user_email[:3] + '***' + user_email[-3:] if user_email else 'missing',
                'name': user_name[:10] + '***' if user_name else 'missing',
                'token_size_bytes': token_size,
                'expires_in_hours': expires_in_hours,
                'expires_at': exp_time.isoformat(),
                'algorithm': self.algorithm
            })
            
            return token
            
        except Exception as e:
            logger.error("MINIMAL_ID_TOKEN_CREATION_ERROR", extra={
                'user_id': user_id,
                'email': user_email[:3] + '***' + user_email[-3:] if user_email else 'missing',
                'name': user_name[:10] + '***' if user_name else 'missing',
                'error': str(e),
                'error_type': type(e).__name__
            })
            raise
    
    def verify_minimal_token(self, token: str) -> Dict[str, Any]:
        """
        Verify and decode a minimal token
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded token payload
            
        Raises:
            jwt.InvalidTokenError: If token is invalid
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Log token verification
            logger.debug("MINIMAL_TOKEN_VERIFIED", extra={
                'token_type': payload.get('type', 'unknown'),
                'user_id': payload.get('sub', 'missing'),
                'email': payload.get('email', 'missing')[:3] + '***' + payload.get('email', 'missing')[-3:] if payload.get('email') else 'missing',
                'expires_at': datetime.fromtimestamp(payload.get('exp', 0)).isoformat() if payload.get('exp') else 'missing',
                'issuer': payload.get('iss', 'unknown')
            })
            
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.warning("MINIMAL_TOKEN_EXPIRED", extra={
                'token_preview': token[:20] + '...' if len(token) > 20 else token
            })
            raise
        except jwt.InvalidTokenError as e:
            logger.warning("MINIMAL_TOKEN_INVALID", extra={
                'error': str(e),
                'token_preview': token[:20] + '...' if len(token) > 20 else token
            })
            raise
        except Exception as e:
            logger.error("MINIMAL_TOKEN_VERIFICATION_ERROR", extra={
                'error': str(e),
                'error_type': type(e).__name__,
                'token_preview': token[:20] + '...' if len(token) > 20 else token
            })
            raise
    
    def get_token_size_info(self, token: str) -> Dict[str, int]:
        """
        Get size information about a token
        
        Args:
            token: JWT token string
            
        Returns:
            Dictionary with size information
        """
        try:
            # Decode without verification to get payload size
            payload = jwt.decode(token, options={"verify_signature": False})
            
            # Calculate sizes
            token_bytes = len(token.encode('utf-8'))
            payload_size = len(str(payload).encode('utf-8'))
            
            return {
                'total_size_bytes': token_bytes,
                'payload_size_bytes': payload_size,
                'header_size_bytes': token_bytes - payload_size,
                'compression_ratio': round((payload_size / token_bytes) * 100, 2) if token_bytes > 0 else 0
            }
            
        except Exception as e:
            logger.error("TOKEN_SIZE_CALCULATION_ERROR", extra={
                'error': str(e),
                'token_preview': token[:20] + '...' if len(token) > 20 else token
            })
            return {
                'total_size_bytes': len(token.encode('utf-8')),
                'payload_size_bytes': 0,
                'header_size_bytes': 0,
                'compression_ratio': 0
            }

# Singleton instance
minimal_token_service = MinimalTokenService()
