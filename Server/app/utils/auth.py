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

def get_signing_key_for_cognito_rs256(token: str):
    """
    Resolve signing key for a Cognito token.
    IMPORTANT: Only call this for tokens you already determined are Cognito (i.e., NOT your minimal HS256 tokens).
    """
    try:
        headers = jose_jwt.get_unverified_header(token)

        # Pin algorithm to prevent header tampering for Cognito path
        alg = headers.get("alg")
        if alg != "RS256":
            log_security_event("auth_invalid_alg", {"alg": alg})
            raise JWTError("Invalid JWT alg for Cognito (expected RS256)")

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
def _decode_with_leeway(token: str, key, issuer: str, leeway_seconds: int, verify_aud: bool = False, audience: str | None = None):
    """
    Try python-jose decode with leeway as kwarg; if TypeError, retry with options['leeway'].
    We default verify_aud to False so we can read token_use first, then enforce audience/client checks manually.
    """
    base_opts = {
        "verify_aud": verify_aud,
        "verify_iss": True,
        "verify_signature": True
    }
    try:
        # Newer versions accept leeway kwarg
        return jose_jwt.decode(
            token,
            key=key,
            algorithms=["RS256"],
            issuer=issuer,
            options=base_opts,
            audience=audience,
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
            issuer=issuer,
            options=opts,
            audience=audience
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
# Token classification (centralized routing logic)
# =========================
def _classify_token(token: str) -> str:
    """
    Classify token type to prevent HS256 → Cognito routing.
    Returns: 'minimal', 'cognito', 'reject_cognito_alg', or 'unknown'
    """
    try:
        # Use jose_jwt for consistent header/claims reading
        header = jose_jwt.get_unverified_header(token)
        alg = header.get("alg")
        
        try:
            claims = jose_jwt.get_unverified_claims(token)
            iss = claims.get("iss")
            typ = claims.get("type")
        except Exception:
            iss, typ = None, None
        
        # Check for Cognito tokens first
        if iss and "cognito-idp." in iss:
            return "cognito" if alg == "RS256" else "reject_cognito_alg"
        
        # Check for minimal tokens
        if (typ == "access" and iss == "silverkey:minimal") or alg == "HS256":
            return "minimal"
        
        return "unknown"
        
    except Exception:
        return "unknown"

# =========================
# Helpers: safe unverified peek
# =========================
def _peek_claims_unverified(token: str) -> dict:
    """
    Safely read claims without verifying signature to decide routing (minimal vs Cognito).
    Uses jose_jwt.get_unverified_claims which does not require a key.
    """
    try:
        return jose_jwt.get_unverified_claims(token)
    except Exception as e:
        # Return empty dict so caller falls back to Cognito path
        logger.debug("Unverified claims peek failed: %s", e)
        return {}

# =========================
# Core: current user resolver
# =========================
def _verify_minimal_token(token: str) -> User:
    """
    Verify a minimal token and return the associated user
    """
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
                # Update user ID to match token (only if your schema supports this)
                user.id = user_id
                db.session.commit()

    if not user:
        log_security_event('auth_minimal_token_user_not_found', {'user_id': f"{str(user_id)[:8]}..."})
        raise SecurityException(SecurityError.UNAUTHORIZED)

    # Log successful minimal token verification
    logger.debug("MINIMAL_TOKEN_VERIFIED_SUCCESSFULLY", extra={
        'user_id': getattr(user, "id", None),
        'email': (user.email[:3] + '***' + user.email[-3:]) if getattr(user, "email", None) else 'missing',
        'token_type': claims.get('type', 'unknown'),
        'expires_at': claims.get('exp', 'unknown')
    })

    return user

def get_current_user():
    """
    Get current user from Cognito JWT token with comprehensive validation and fallback.
    Supports both HttpOnly cookies (preferred) and Authorization header (fallback).
    """
    token = None
    
    
    # Try to get token from HttpOnly cookie first (preferred method)
    session_cookie = request.cookies.get('session')
    if session_cookie:
        token = session_cookie
    else:
        # Fallback to Authorization header for backward compatibility
        auth = request.headers.get("Authorization", "")
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
        else:
            if not auth:
                log_security_event('auth_missing_token')
                raise SecurityException(SecurityError.UNAUTHORIZED)
            log_security_event('auth_invalid_header_format')
            raise SecurityException(SecurityError.INVALID_TOKEN)
    
    if not token:
        log_security_event('auth_missing_token')
        raise SecurityException(SecurityError.UNAUTHORIZED)

    # Basic shape check (three parts)
    if token.count(".") != 2:
        log_security_event('auth_invalid_jwt_format', {'parts_count': token.count(".") + 1})
        raise SecurityException(SecurityError.INVALID_TOKEN)

    # -------- Centralized token classification (prevents HS256 → Cognito routing) --------
    try:
        token_kind = _classify_token(token)
        

        if token_kind == "minimal":
            try:
                return _verify_minimal_token(token)
            except Exception as minimal_verify_error:
                error_type = type(minimal_verify_error).__name__
                current_app.logger.error("🔍 MINIMAL_TOKEN_VERIFICATION_FAILED", extra={
                    'error': str(minimal_verify_error),
                    'error_type': error_type,
                    'note': 'Minimal token verification failed - NO fallback to Cognito'
                })
                
                # Log specific error types for debugging
                if error_type == 'ImmatureSignatureError':
                    # Enhanced logging for ImmatureSignatureError
                    current_app.logger.error("🔍 IMMATURE_SIGNATURE_ERROR_DETAILED", extra={
                        'error': str(minimal_verify_error),
                        'error_type': error_type,
                        'verification_timestamp': int(time.time()),
                        'endpoint': request.endpoint,
                        'path': request.path,
                        'referer': request.headers.get('Referer'),
                        'user_agent': request.headers.get('User-Agent', '')[:50] + '...' if request.headers.get('User-Agent') else 'missing',
                        'timing_context': 'auth_verification',
                        'note': 'Token nbf/iat is in the future - possible clock skew or immediate usage'
                    })
                    log_security_event('auth_minimal_token_immature', {
                        'error_type': error_type,
                        'note': 'Token nbf/iat is in the future - possible clock skew',
                        'verification_timestamp': int(time.time()),
                        'endpoint': request.endpoint
                    })
                else:
                    log_security_event('auth_minimal_token_verification_failed', {
                        'error_type': error_type
                    })
                
                # CRITICAL: Never fall back to Cognito for minimal tokens
                raise SecurityException(SecurityError.INVALID_TOKEN)

        elif token_kind == "reject_cognito_alg":
            # HS256 token claiming to be Cognito - reject immediately

            log_security_event('auth_cognito_wrong_algorithm', {
                'alg': 'HS256',
                'expected': 'RS256',
                'note': 'HS256 token incorrectly routed to Cognito validation'
            })
            raise SecurityException(SecurityError.INVALID_TOKEN)

        elif token_kind == "cognito":
            current_app.logger.info("🔍 AUTH_DECISION", extra={
                'kind': token_kind,
                'action': 'cognito_verify'
            })
            # Continue to Cognito verification below
        else:
            # Unknown token kind
            current_app.logger.warning("🔍 AUTH_UNKNOWN_TOKEN_KIND", extra={
                'token_kind': token_kind
            })
            log_security_event('auth_unknown_token_kind', {
                'token_kind': token_kind
            })
            raise SecurityException(SecurityError.INVALID_TOKEN)

    except SecurityException:
        # Re-raise security exceptions
        raise
    except Exception as e:
        current_app.logger.error("🔍 AUTH_CLASSIFICATION_FAILED", extra={
            'error': str(e),
            'error_type': type(e).__name__
        })
        raise SecurityException(SecurityError.INVALID_TOKEN)

    # -------- Cognito verification path (RS256) --------
    try:
        current_app.logger.debug("Verifying as Cognito token...")

        # GUARDRAIL: Check algorithm before attempting Cognito validation
        # This should never be reached now due to centralized classification, but keep as safety net
        try:
            unverified_header = jose_jwt.get_unverified_header(token)
            alg = unverified_header.get('alg')
            if alg != 'RS256':
                log_security_event('auth_cognito_wrong_algorithm', {
                    'alg': alg,
                    'expected': 'RS256',
                    'note': 'HS256 token incorrectly routed to Cognito validation (should not happen with new classification)'
                })
                raise SecurityException(SecurityError.INVALID_TOKEN)
        except Exception as header_error:
            current_app.logger.error("Failed to read token header: %s", header_error, extra={
                'token_present': bool(token),
                'token_length': len(token) if token else 0
            })
            raise SecurityException(SecurityError.INVALID_TOKEN)

        # Resolve signing key (also enforces alg == RS256)
        key = get_signing_key_for_cognito_rs256(token)

        # Decode WITHOUT audience verification; then validate based on token_use
        claims = _decode_with_leeway(
            token=token,
            key=key,
            issuer=AWS_COGNITO_ISSUER,
            leeway_seconds=60,
            verify_aud=False,
            audience=None
        )

        token_use = claims.get("token_use")
        if token_use not in ("id", "access"):
            log_security_event("auth_invalid_token_use", {"token_use": token_use})
            raise SecurityException(SecurityError.INVALID_TOKEN)

        if token_use == "id":
            # For ID tokens: require aud == client_id (Cognito puts client_id in 'aud')
            aud = claims.get("aud")
            if aud != AWS_COGNITO_CLIENT_ID:
                log_security_event("auth_invalid_audience", {"aud": aud})
                raise SecurityException(SecurityError.INVALID_TOKEN)

        elif token_use == "access":
            # For access tokens: require client_id claim equals client
            if claims.get("client_id") != AWS_COGNITO_CLIENT_ID:
                log_security_event("auth_invalid_client_id")
                raise SecurityException(SecurityError.INVALID_TOKEN)

        # Resolve user: prefer Cognito sub, fallback to email
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
            current_app.logger.error("❌ DATABASE_ERROR_IN_AUTH", extra={
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
