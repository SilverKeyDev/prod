"""
Minimal Token Service
Generates lightweight first-party JWT tokens with RS256 for JWKS compatibility.
"""
import jwt
import os
import time
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from flask import current_app
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
import base64

logger = logging.getLogger(__name__)

# Reserved LogRecord attributes that cannot be used in extra dict
_RESERVED_LOG_KEYS = {
    "name", "msg", "args", "levelname", "levelno", "pathname", "filename", "module",
    "exc_info", "exc_text", "stack_info", "lineno", "funcName", "created", "msecs",
    "relativeCreated", "thread", "threadName", "processName", "process"
}

def _safe_extra(extra: dict) -> dict:
    """Sanitize extra dict to avoid overwriting reserved LogRecord attributes"""
    if not extra:
        return {}
    return {(f"user_{k}" if k in _RESERVED_LOG_KEYS else k): v for k, v in extra.items()}

class MinimalTokenService:
    """Service for generating first-party JWT tokens with RS256 and JWKS support"""
    
    def __init__(self):
        self._private_key = None
        self._public_key = None
        self._jwks = None
        self.algorithm = 'RS256'  # RS256 for JWKS compatibility
        self.issuer = os.getenv('FLASK_ENV', 'development') == 'production' \
            and 'https://usesilverkey.com' or 'http://localhost:5000'
        self.kid = 'sk-2025-10-16'  # Key ID for rotation
    
    @property
    def private_key(self):
        """Lazy-load or generate RSA private key"""
        if self._private_key is None:
            key_path = os.getenv('APP_RSA_PRIVATE_KEY_PATH', '/tmp/silverkey_rsa_private.pem')
            
            try:
                # Try to load existing key
                if os.path.exists(key_path):
                    with open(key_path, 'rb') as f:
                        self._private_key = serialization.load_pem_private_key(
                            f.read(),
                            password=None,
                            backend=default_backend()
                        )
                    logger.info(f"✅ Loaded RSA private key from {key_path}")
                else:
                    # Generate new key pair
                    logger.warning(f"Generating new RSA key pair (not found at {key_path})")
                    private_key = rsa.generate_private_key(
                        public_exponent=65537,
                        key_size=2048,
                        backend=default_backend()
                    )
                    
                    # Save for future use
                    os.makedirs(os.path.dirname(key_path), exist_ok=True)
                    with open(key_path, 'wb') as f:
                        f.write(private_key.private_bytes(
                            encoding=serialization.Encoding.PEM,
                            format=serialization.PrivateFormat.PKCS8,
                            encryption_algorithm=serialization.NoEncryption()
                        ))
                    logger.info(f"✅ Generated and saved new RSA private key to {key_path}")
                    self._private_key = private_key
                    
            except Exception as e:
                logger.error(f"Error loading/generating RSA key: {e}", exc_info=True)
                # Generate in-memory key as fallback
                logger.warning("Using in-memory RSA key (will not persist)")
                self._private_key = rsa.generate_private_key(
                    public_exponent=65537,
                    key_size=2048,
                    backend=default_backend()
                )
        
        return self._private_key
    
    @property
    def public_key(self):
        """Get public key from private key"""
        if self._public_key is None:
            self._public_key = self.private_key.public_key()
        return self._public_key
    
    def get_jwks(self) -> Dict[str, Any]:
        """Generate JWKS (JSON Web Key Set) for public key verification"""
        if self._jwks is None:
            # Get public key numbers
            public_numbers = self.public_key.public_numbers()
            
            # Convert to base64url
            def int_to_base64url(n: int) -> str:
                byte_length = (n.bit_length() + 7) // 8
                n_bytes = n.to_bytes(byte_length, byteorder='big')
                return base64.urlsafe_b64encode(n_bytes).rstrip(b'=').decode('utf-8')
            
            self._jwks = {
                "keys": [{
                    "kty": "RSA",
                    "kid": self.kid,
                    "use": "sig",
                    "alg": "RS256",
                    "n": int_to_base64url(public_numbers.n),
                    "e": int_to_base64url(public_numbers.e)
                }]
            }
            
            logger.info("✅ Generated JWKS", extra={
                'kid': self.kid,
                'alg': 'RS256'
            })
        
        return self._jwks
        
    def create_minimal_access_token(self, user_id: str, user_email: str, expires_in_hours: int = 8) -> str:
        """
        Create a minimal access token with only essential claims (RS256)
        
        Args:
            user_id: User's database ID
            user_email: User's email address
            expires_in_hours: Token expiration time in hours
            
        Returns:
            Minimal JWT token string (RS256 signed)
        """
        try:
            logger.info(f"🔍 MINIMAL_ACCESS_TOKEN_CREATION_START", extra={
                'user_id': user_id,
                'email': user_email[:3] + '***' if user_email else 'missing',
                'algorithm': self.algorithm,
                'expires_in_hours': expires_in_hours,
                'issuer': self.issuer
            })
            
            now = datetime.utcnow()
            exp_time = now + timedelta(hours=expires_in_hours)
            
            # Minimal payload with standard OIDC claims
            payload = {
                'iss': self.issuer,       # Issuer (https://usesilverkey.com)
                'sub': user_id,           # Subject (user ID)
                'aud': 'usesilverkey.com',  # Audience
                'email': user_email,      # User email
                'iat': int(now.timestamp()),  # Issued at
                'exp': int(exp_time.timestamp()),  # Expiration
                't': 'min',               # Type marker for routing
                'scope': 'user'           # Scope
            }
            
            logger.info(f"🔍 MINIMAL_ACCESS_TOKEN_PAYLOAD", extra={
                'payload_keys': list(payload.keys()),
                'iss': payload.get('iss'),
                't': payload.get('t'),
                'algorithm_to_use': self.algorithm
            })
            
            # Convert private key to PEM for PyJWT
            private_key_pem = self.private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            
            logger.info(f"🔍 MINIMAL_ACCESS_TOKEN_ENCODING_START", extra={
                'algorithm': self.algorithm,
                'kid': self.kid,
                'has_private_key': bool(self.private_key)
            })
            
            # Encode with RS256 and include kid in header
            headers = {"kid": self.kid, "alg": self.algorithm, "typ": "JWT"}
            token = jwt.encode(payload, private_key_pem, algorithm=self.algorithm, headers=headers)
            
            logger.info(f"✅ MINIMAL_ACCESS_TOKEN_ENCODING_SUCCESS", extra={
                'token_length': len(token)
            })
            
            # Log token creation with size info (wrap in try to never break flow)
            try:
                token_size = len(token.encode('utf-8'))
                logger.info("MINIMAL_ACCESS_TOKEN_CREATED", extra=_safe_extra({
                    'user_id': user_id,
                    'email': user_email[:3] + '***' + user_email[-3:] if user_email else 'missing',
                    'token_size_bytes': token_size,
                    'expires_in_hours': expires_in_hours,
                    'expires_at': exp_time.isoformat(),
                    'algorithm': self.algorithm
                }))
            except Exception:
                logger.error("MINIMAL_ACCESS_TOKEN_LOGGING_ERROR", exc_info=True)
            
            return token
            
        except Exception as e:
            import traceback
            logger.error("❌ MINIMAL_ACCESS_TOKEN_CREATION_ERROR", extra=_safe_extra({
                'user_id': user_id,
                'email': user_email[:3] + '***' + user_email[-3:] if user_email else 'missing',
                'error': str(e),
                'error_type': type(e).__name__,
                'traceback': traceback.format_exc()
            }), exc_info=True)
            logger.error(f"MINIMAL_ACCESS_TOKEN_FULL_TRACEBACK:\n{traceback.format_exc()}")
            raise
    
    def create_minimal_id_token(self, user_id: str, user_email: str, user_name: str, expires_in_hours: int = 8) -> str:
        """
        Create a minimal ID token with only essential user info (RS256)
        
        Args:
            user_id: User's database ID
            user_email: User's email address
            user_name: User's display name
            expires_in_hours: Token expiration time in hours
            
        Returns:
            Minimal JWT ID token string (RS256 signed)
        """
        try:
            logger.info(f"🔍 MINIMAL_ID_TOKEN_CREATION_START", extra={
                'user_id': user_id,
                'email': user_email[:3] + '***' if user_email else 'missing',
                'algorithm': self.algorithm,
                'expires_in_hours': expires_in_hours,
                'issuer': self.issuer
            })
            
            now = datetime.utcnow()
            exp_time = now + timedelta(hours=expires_in_hours)
            
            # Ensure user_name is not None
            safe_name = user_name or 'Unknown User'
            
            # Minimal ID token payload with standard OIDC claims
            payload = {
                'iss': self.issuer,       # Issuer (https://usesilverkey.com)
                'sub': user_id,           # Subject (user ID)
                'aud': 'usesilverkey.com',  # Audience
                'email': user_email,      # User email
                'given_name': safe_name,  # Using given_name to avoid 'name' reserved key
                'iat': int(now.timestamp()),  # Issued at
                'exp': int(exp_time.timestamp()),  # Expiration
                't': 'min',               # Type marker for routing
            }
            
            logger.info(f"🔍 MINIMAL_ID_TOKEN_PAYLOAD", extra={
                'payload_keys': list(payload.keys()),
                'iss': payload.get('iss'),
                't': payload.get('t'),
                'algorithm_to_use': self.algorithm
            })
            
            # Convert private key to PEM for PyJWT
            private_key_pem = self.private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            
            logger.info(f"🔍 MINIMAL_ID_TOKEN_ENCODING_START", extra={
                'algorithm': self.algorithm,
                'kid': self.kid,
                'has_private_key': bool(self.private_key)
            })
            
            # Encode with RS256 and include kid in header
            headers = {"kid": self.kid, "alg": self.algorithm, "typ": "JWT"}
            token = jwt.encode(payload, private_key_pem, algorithm=self.algorithm, headers=headers)
            
            logger.info(f"✅ MINIMAL_ID_TOKEN_ENCODING_SUCCESS", extra={
                'token_length': len(token)
            })
            
            # Log token creation with size info (wrap in try to never break flow)
            try:
                token_size = len(token.encode('utf-8'))
                logger.info("MINIMAL_ID_TOKEN_CREATED", extra=_safe_extra({
                    'user_id': user_id,
                    'email': user_email[:3] + '***' + user_email[-3:] if user_email else 'missing',
                    'name': safe_name[:10] + '***' if safe_name and len(safe_name) > 10 else safe_name,  # Will be renamed to user_name
                    'token_size_bytes': token_size,
                    'expires_in_hours': expires_in_hours,
                    'expires_at': exp_time.isoformat(),
                    'algorithm': self.algorithm
                }))
            except Exception:
                logger.error("MINIMAL_ID_TOKEN_LOGGING_ERROR", exc_info=True)
            
            return token
            
        except Exception as e:
            import traceback
            logger.error("❌ MINIMAL_ID_TOKEN_CREATION_ERROR", extra=_safe_extra({
                'user_id': user_id,
                'email': user_email[:3] + '***' + user_email[-3:] if user_email else 'missing',
                'name': str(user_name)[:10] + '***' if user_name and len(str(user_name)) > 10 else str(user_name),  # Will be renamed to user_name
                'error': str(e),
                'error_type': type(e).__name__,
                'traceback': traceback.format_exc()
            }), exc_info=True)
            logger.error(f"MINIMAL_ID_TOKEN_FULL_TRACEBACK:\n{traceback.format_exc()}")
            raise
    
    def verify_minimal_token(self, token: str) -> Dict[str, Any]:
        """
        Verify and decode a minimal token using RS256 public key
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded token payload
            
        Raises:
            jwt.InvalidTokenError: If token is invalid
        """
        try:
            logger.info(f"🔍 MINIMAL_TOKEN_VERIFICATION_START", extra={
                'algorithm': self.algorithm,
                'token_preview': token[:30] + '...' if len(token) > 30 else token
            })
            
            # First decode header to verify
            header = jwt.get_unverified_header(token)
            logger.info(f"🔍 MINIMAL_TOKEN_HEADER", extra={
                'alg': header.get('alg'),
                'typ': header.get('typ'),
                'kid': header.get('kid'),
                'expected_alg': self.algorithm,
                'expected_kid': self.kid
            })
            
            # Convert public key to PEM for PyJWT
            public_key_pem = self.public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            
            # Verify with RS256
            payload = jwt.decode(
                token, 
                public_key_pem, 
                algorithms=[self.algorithm],
                audience='usesilverkey.com',
                issuer=self.issuer,
                options={'verify_aud': True, 'verify_iss': True}
            )
            
            # Log token verification (wrap in try to never break flow)
            try:
                logger.info("✅ MINIMAL_TOKEN_VERIFIED_SUCCESS", extra=_safe_extra({
                    't_marker': payload.get('t', 'unknown'),
                    'user_id': payload.get('sub', 'missing'),
                    'email': payload.get('email', 'missing')[:3] + '***' + payload.get('email', 'missing')[-3:] if payload.get('email') else 'missing',
                    'expires_at': datetime.fromtimestamp(payload.get('exp', 0)).isoformat() if payload.get('exp') else 'missing',
                    'issuer': payload.get('iss', 'unknown')
                }))
            except Exception:
                logger.error("MINIMAL_TOKEN_VERIFICATION_LOGGING_ERROR", exc_info=True)
            
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
