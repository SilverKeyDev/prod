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

logger = logging.getLogger(__name__)

class SecurityException(Exception):
    """Exception class for SecurityError tuples"""
    def __init__(self, security_error_tuple):
        self.error_tuple = security_error_tuple
        super().__init__(security_error_tuple[1])

# =========================
# Cognito Configuration (derive region from pool id)
# =========================
COGNITO_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
if not COGNITO_POOL_ID:
    raise RuntimeError("COGNITO_USER_POOL_ID must be set")

# Pool id format: 'us-east-2_abcdef...'
_pool_region = COGNITO_POOL_ID.split("_", 1)[0]
COGNITO_REGION = os.getenv("COGNITO_REGION", os.getenv("AWS_REGION", _pool_region))

COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")
if not COGNITO_CLIENT_ID:
    raise RuntimeError("COGNITO_CLIENT_ID must be set")

COGNITO_ISSUER = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_POOL_ID}"
COGNITO_KEYS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"

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
            resp = requests.get(COGNITO_KEYS_URL, timeout=3)
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
def get_current_user():
    """Get current user from Cognito JWT token with comprehensive validation and fallback."""
    # Normalize and validate Authorization header
    auth = request.headers.get("Authorization", "")
    parts = auth.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        if not auth:
            log_security_event('auth_missing_header')
            raise SecurityException(SecurityError.UNAUTHORIZED)
        log_security_event('auth_invalid_header_format')
        raise SecurityException(SecurityError.INVALID_TOKEN)

    token = parts[1]

    # Basic shape check (three parts)
    if token.count(".") != 2:
        log_security_event('auth_invalid_jwt_format', {'parts_count': token.count(".") + 1})
        raise SecurityException(SecurityError.INVALID_TOKEN)

    try:
        # Resolve signing key
        key = get_signing_key(token)

        # Decode + validate with leeway to tolerate small skew (version-compatible)
        claims = _decode_with_leeway(
            token=token,
            key=key,
            audience=COGNITO_CLIENT_ID,   # Valid for ID tokens
            issuer=COGNITO_ISSUER,
            leeway_seconds=60
        )

        # Guard against mixing token types
        token_use = claims.get("token_use")
        if token_use not in ("id", "access"):
            log_security_event("auth_invalid_token_use", {"token_use": token_use})
            raise SecurityException(SecurityError.INVALID_TOKEN)

        if token_use == "access":
            # Access tokens validate client_id, not aud
            if claims.get("client_id") != COGNITO_CLIENT_ID:
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
        # Includes TypeError from unexpected jose versions in other places
        log_security_event('auth_unexpected_error', {'error_type': type(e).__name__})
        raise SecurityException(SecurityError.UNAUTHORIZED)

# =========================
# Decorator
# =========================
def require_auth(f):
    """
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
            log_security_event('auth_decorator_error', {'error': str(e)})
            return security_error_response(SecurityError.UNAUTHORIZED)

    return decorated_function
