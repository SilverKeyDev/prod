from flask import request, current_app
import os
import time
import requests
import logging
from jose import jwk, jwt as jose_jwt
from jose.exceptions import JWTError, JWTClaimsError, ExpiredSignatureError
from ..models.user import User
from .. import db
from .security import SecurityError, log_security_event, safe_user_lookup_error, security_error_response
from ..services.minimal_token import minimal_token_service

logger = logging.getLogger(__name__)

class SecurityException(Exception):
    """Exception class for SecurityError tuples"""
    def __init__(self, security_error_tuple):
        self.error_tuple = security_error_tuple
        super().__init__(security_error_tuple[1])

# =========================
# Cognito Configuration (derive region from pool id)
# =========================
AWS_COGNITO_POOL_ID = os.getenv("AWS_COGNITO_USER_POOL_ID")
if not AWS_COGNITO_POOL_ID:
    raise RuntimeError("AWS_COGNITO_USER_POOL_ID must be set")

# Pool id format: 'us-east-2_abcdef...'
_pool_region = AWS_COGNITO_POOL_ID.split("_", 1)[0]
AWS_COGNITO_REGION = os.getenv("AWS_COGNITO_REGION", os.getenv("AWS_REGION", _pool_region))

AWS_COGNITO_CLIENT_ID = os.getenv("AWS_COGNITO_CLIENT_ID")
if not AWS_COGNITO_CLIENT_ID:
    raise RuntimeError("AWS_COGNITO_CLIENT_ID must be set")

AWS_COGNITO_ISSUER = f"https://cognito-idp.{AWS_COGNITO_REGION}.amazonaws.com/{AWS_COGNITO_POOL_ID}"
AWS_COGNITO_KEYS_URL = f"{AWS_COGNITO_ISSUER}/.well-known/jwks.json"

# =========================
# JWKS Cache (with TTL)
# =========================
_JWKS = None
_JWKS_TS = 0.0
_JWKS_TTL = 60 * 60  # 1 hour

def _load_jwks(force: bool = False):
    """Load JWKS with a simple TTL cache to handle key rotations gracefully."""
    global _JWKS, _JWKS_TS
    now = time.time()
    if force or _JWKS is None or (now - _JWKS_TS) > _JWKS_TTL:
        try:
            resp = requests.get(AWS_COGNITO_KEYS_URL, timeout=3)
            resp.raise_for_status()
            _JWKS = resp.json()
            _JWKS_TS = now
        except Exception as e:
            # Don't break startup; retry on demand
            logger.warning("JWKS fetch failed (will retry on demand): %s", e)
            if _JWKS is None:
                _JWKS = {"keys": []}
    return _JWKS

def _find_key(jwks: dict, kid: str):
    for k in (jwks or {}).get('keys', []):
        if k.get('kid') == kid:
            return k
    return None

def get_signing_key(token: str):
    """Resolve signing key for the token, refreshing JWKS once on miss."""
    try:
        headers = jose_jwt.get_unverified_header(token)

        # Pin algorithm to prevent header tampering
        alg = headers.get("alg")
        if alg != "RS256":
            log_security_event("auth_invalid_alg", {"alg": alg})
            raise JWTError("Invalid JWT alg")

        key_id = headers.get('kid')
        if not key_id:
            raise JWTError("Missing kid in token header")

        jwks = _load_jwks()
        key = _find_key(jwks, key_id)

        if not key:
            # Refresh once on miss (rotation)
            jwks = _load_jwks(force=True)
            key = _find_key(jwks, key_id)

        if not key:
            raise JWTError('Public key not found in JWKS')

        return jwk.construct(key)
    except Exception as e:
        logger.error("Error getting signing key: %s", e)
        raise JWTError('Invalid token header')

# =========================
# jose version compatibility: decode with leeway
# =========================
def _decode_with_leeway(token: str, key, audience: str, issuer: str, leeway_seconds: int):
    """
    Try python-jose decode with leeway as kwarg; if TypeError, retry with options['leeway'].
    This makes us compatible with older python-jose versions.
    """
    base_opts = {
        "verify_aud": True,
        "verify_iss": True,
        "verify_signature": True
    }
    try:
        # Newer versions accept leeway kwarg
        return jose_jwt.decode(
            token,
            key=key,
            algorithms=["RS256"],
            audience=audience,
            issuer=issuer,
            options=base_opts,
            leeway=leeway_seconds
        )
    except TypeError:
        # Fallback: older versions expect 'leeway' inside options
        opts = dict(base_opts)
        opts["leeway"] = leeway_seconds
        return jose_jwt.decode(
            token,
            key=key,
            algorithms=["RS256"],
            audience=audience,
            issuer=issuer,
            options=opts
        )

# =========================
# Utility: throttle noisy expired logs
# =========================
def _log_expired_once(ip: str, endpoint: str, interval: int = 60):
    """
    Avoid spamming logs when SPAs hit with expired tokens repeatedly.
    Logs at most once per (ip, endpoint) per `interval` seconds.
    """
    try:
        cache = current_app.extensions.setdefault("auth_expire_log_cache", {})
    except Exception:
        # If somehow called without app context, just log normally
        log_security_event("auth_token_expired", {"ip": ip, "endpoint": endpoint})
        return

    now = time.time()
    key = f"{ip}:{endpoint}"
    last = cache.get(key, 0)
    if now - last > interval:
        log_security_event("auth_token_expired", {"ip": ip, "endpoint": endpoint})
        cache[key] = now

# =========================
# Core: current user resolver
# =========================
def _verify_minimal_token(token: str) -> User:
    """
    Verify a minimal token and return the associated user
    
    Args:
        token: Minimal JWT token string
        
    Returns:
        User object
        
    Raises:
        SecurityException: If token is invalid or user not found
    """
    try:
        # Verify minimal token
        claims = minimal_token_service.verify_minimal_token(token)
        
        # Get user ID from token
        user_id = claims.get('sub')
        if not user_id:
            log_security_event('auth_minimal_token_missing_sub')
            raise SecurityException(SecurityError.INVALID_TOKEN)
        
        # Find user by ID (minimal tokens use database ID as sub)
        user = User.query.filter_by(id=user_id).first()
        if not user:
            # Fallback: try to find by email
            user_email = claims.get('email')
            if user_email:
                user = User.query.filter_by(email=user_email).first()
                if user:
                    # Update user ID to match token
                    user.id = user_id
                    db.session.commit()
        
        if not user:
            log_security_event('auth_minimal_token_user_not_found', {'user_id': f"{user_id[:8]}..."})
            raise SecurityException(SecurityError.UNAUTHORIZED)
        
        # Log successful minimal token verification
        logger.debug("MINIMAL_TOKEN_VERIFIED_SUCCESSFULLY", extra={
            'user_id': user.id,
            'email': user.email[:3] + '***' + user.email[-3:] if user.email else 'missing',
            'token_type': claims.get('type', 'unknown'),
            'expires_at': claims.get('exp', 'unknown')
        })
        
        return user
        
    except Exception as e:
        # Don't catch database errors - let them propagate to proper error handlers
        from sqlalchemy.exc import SQLAlchemyError
        if isinstance(e, SQLAlchemyError):
            logger.error("DATABASE_ERROR_IN_MINIMAL_TOKEN_VERIFICATION", extra={
                'error': str(e),
                'error_type': type(e).__name__
            })
            raise  # Re-raise DB errors so they get proper 500 handling
            
        logger.error("MINIMAL_TOKEN_VERIFICATION_ERROR", extra={
            'error': str(e),
            'error_type': type(e).__name__,
            'token_preview': token[:20] + '...' if len(token) > 20 else token
        })
        raise SecurityException(SecurityError.INVALID_TOKEN)

def get_current_user():
    """
    Get current user from Cognito JWT token with comprehensive validation and fallback.
    Supports both HttpOnly cookies (preferred) and Authorization header (fallback).
    """
    token = None
    
    # Log ALL cookies and headers for debugging
    current_app.logger.info(f"🔍 AUTH_MIDDLEWARE_CHECK", extra={
        'request_path': request.path,
        'request_method': request.method,
        'request_origin': request.headers.get('Origin'),
        'request_host': request.headers.get('Host'),
        'request_referer': request.headers.get('Referer'),
        'all_cookies': list(request.cookies.keys()),
        'has_session_cookie': 'session' in request.cookies,
        'has_refresh_cookie': 'refresh_token' in request.cookies,
        'has_auth_header': bool(request.headers.get('Authorization')),
        'cookie_count': len(request.cookies)
    })
    
    # Try to get token from HttpOnly cookie first (preferred method)
    session_cookie = request.cookies.get('session')
    if session_cookie:
        token = session_cookie
        current_app.logger.info(f"✅ AUTH_TOKEN_FROM_COOKIE", extra={
            'token_length': len(token),
            'token_prefix': token[:20] + '...' if len(token) > 20 else token,
            'cookie_source': 'session'
        })
    else:
        current_app.logger.warning(f"⚠️ AUTH_NO_SESSION_COOKIE", extra={
            'available_cookies': list(request.cookies.keys()),
            'trying_auth_header': True
        })
        # Fallback to Authorization header for backward compatibility
        auth = request.headers.get("Authorization", "")
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
            current_app.logger.info(f"✅ AUTH_TOKEN_FROM_HEADER", extra={
                'token_length': len(token),
                'token_prefix': token[:20] + '...' if len(token) > 20 else token
            })
        else:
            if not auth:
                current_app.logger.error(f"❌ AUTH_MISSING_TOKEN", extra={
                    'cookies_present': list(request.cookies.keys()),
                    'headers_checked': ['Cookie', 'Authorization']
                })
                log_security_event('auth_missing_token')
                raise SecurityException(SecurityError.UNAUTHORIZED)
            current_app.logger.error(f"❌ AUTH_INVALID_HEADER_FORMAT", extra={
                'auth_header': auth[:50] + '...' if len(auth) > 50 else auth
            })
            log_security_event('auth_invalid_header_format')
            raise SecurityException(SecurityError.INVALID_TOKEN)
    
    if not token:
        current_app.logger.error(f"❌ AUTH_NO_TOKEN_FOUND", extra={
            'session_cookie_present': bool(session_cookie),
            'auth_header_present': bool(request.headers.get('Authorization'))
        })
        log_security_event('auth_missing_token')
        raise SecurityException(SecurityError.UNAUTHORIZED)

    # Basic shape check (three parts)
    if token.count(".") != 2:
        log_security_event('auth_invalid_jwt_format', {'parts_count': token.count(".") + 1})
        raise SecurityException(SecurityError.INVALID_TOKEN)

    # Try minimal token first (preferred)
    try:
        # Check if this looks like a minimal token by trying to decode without verification
        minimal_payload = jose_jwt.decode(token, options={"verify_signature": False})
        token_type = minimal_payload.get('type')
        issuer = minimal_payload.get('iss')
        
        # If it's a minimal token, verify it
        if token_type in ('access', 'id') and issuer == 'silverkey-api':
            current_app.logger.debug("Detected minimal token, verifying...")
            return _verify_minimal_token(token)
            
    except Exception as e:
        current_app.logger.debug(f"Token is not a minimal token: {str(e)}")
        # Continue to Cognito token verification

    # Fallback to Cognito token verification
    try:
        current_app.logger.debug("Verifying as Cognito token...")
        
        # Resolve signing key
        key = get_signing_key(token)

        # Decode + validate with leeway to tolerate small skew (version-compatible)
        claims = _decode_with_leeway(
            token=token,
            key=key,
            audience=AWS_COGNITO_CLIENT_ID,   # Valid for ID tokens
            issuer=AWS_COGNITO_ISSUER,
            leeway_seconds=60
        )

        # Guard against mixing token types
        token_use = claims.get("token_use")
        if token_use not in ("id", "access"):
            log_security_event("auth_invalid_token_use", {"token_use": token_use})
            raise SecurityException(SecurityError.INVALID_TOKEN)

        if token_use == "access":
            # Access tokens validate client_id, not aud
            if claims.get("client_id") != AWS_COGNITO_CLIENT_ID:
                log_security_event("auth_invalid_client_id")
                raise SecurityException(SecurityError.INVALID_TOKEN)

        # Resolve user: prefer sub, fallback to email
        sub = claims.get('sub')
        if not sub:
            log_security_event('auth_missing_sub')
            raise SecurityException(SecurityError.INVALID_TOKEN)

        user = User.query.filter_by(cognito_id=sub).first()
        if not user:
            user_email = claims.get('email')
            if user_email:
                # Try to find by email, then link cognito_id
                user = User.query.filter_by(email=user_email).first()
                if user:
                    user.cognito_id = sub
                    db.session.commit()

        if not user:
            log_security_event('auth_user_not_found', {'cognito_id': f"{sub[:8]}..."})
            raise SecurityException(SecurityError.UNAUTHORIZED)

        return user

    except ExpiredSignatureError:
        _log_expired_once(request.remote_addr or "unknown", request.endpoint or "unknown")
        raise SecurityException(SecurityError.TOKEN_EXPIRED)

    except JWTClaimsError as e:
        log_security_event('auth_invalid_claims', {'error_type': type(e).__name__})
        raise SecurityException(SecurityError.INVALID_TOKEN)

    except JWTError as e:
        log_security_event('auth_jwt_validation_failed', {'error_type': type(e).__name__})
        raise SecurityException(SecurityError.INVALID_TOKEN)

    except Exception as e:
        # Don't catch database errors - let them propagate to proper error handlers
        from sqlalchemy.exc import SQLAlchemyError
        if isinstance(e, SQLAlchemyError):
            current_app.logger.error(f"❌ DATABASE_ERROR_IN_AUTH", extra={
                'error_type': type(e).__name__,
                'error': str(e)
            })
            raise  # Re-raise DB errors so they get proper 500 handling
        
        # Includes TypeError from unexpected jose versions in other places
        log_security_event('auth_unexpected_error', {'error_type': type(e).__name__})
        raise SecurityException(SecurityError.UNAUTHORIZED)

# =========================
# Decorator
# =========================
def require_auth(f):
    """
    @deprecated Use @require_authenticated_user from utils.common_patterns instead.
    This decorator is kept for backward compatibility but should not be used in new code.
    
    Decorator to require authentication and handle errors consistently.
    Returns machine-readable error bodies for the frontend to react (e.g., refresh on TOKEN_EXPIRED).
    """
    from functools import wraps

    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            user = get_current_user()
            return f(user, *args, **kwargs)

        except SecurityException as se:
            return security_error_response(se.error_tuple)

        except Exception as e:
            # Don't catch database errors - let them propagate to proper error handlers
            from sqlalchemy.exc import SQLAlchemyError
            if isinstance(e, SQLAlchemyError):
                logger.error("DATABASE_ERROR_IN_AUTH_DECORATOR", extra={
                    'error_type': type(e).__name__,
                    'error': str(e)
                })
                raise  # Re-raise DB errors so they get proper 500 handling
            
            log_security_event('auth_decorator_error', {'error': str(e)})
            return security_error_response(SecurityError.UNAUTHORIZED)

    return decorated_function
