"""
Current user resolution and authentication decorator.
"""

import logging
import time

from flask import current_app, request
from jose.exceptions import ExpiredSignatureError, JWTClaimsError

from app.models import User
from app.utils.security import SecurityError
from app.utils.security.security import log_security_event

from ..tokens.verification import (
    classify_token,
)
from ..tokens.verification import (
    verify_minimal_token as verify_minimal_token_claims,
)
from .exceptions import SecurityException

logger = logging.getLogger(__name__)


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
def _verify_minimal_token(token: str, start_time: float | None = None) -> User:
    """
    Verify a minimal token and return the associated user
    """
    from sqlalchemy.exc import InvalidRequestError, SQLAlchemyError

    if start_time is None:
        start_time = time.time()

    # Verify minimal token
    claims = verify_minimal_token_claims(token)

    # Get user ID from token
    user_id = claims.get("sub")
    if not user_id:
        log_security_event("auth_minimal_token_missing_sub")
        raise SecurityException(SecurityError.INVALID_TOKEN)

    # Find user by ID (minimal tokens use database ID as sub)
    try:
        user = User.query.filter_by(id=user_id).first()
        if not user:
            # Fallback: try to find by email (e.g. token sub out of sync with DB)
            user_email = claims.get("email")
            if user_email:
                user = User.query.filter_by(email=user_email).first()
                # Do not mutate User.id; PK changes break referential integrity.
    except InvalidRequestError as e:
        # Mapper / configuration issue: this is a 500, not an auth error
        logger.error(f"SQLAlchemy mapper init failed during auth: {e}")
        raise  # Re-raise as 500 error, not auth error
    except SQLAlchemyError as e:
        # Other DB error during auth
        logger.error(f"Database error during minimal token auth: {e}")
        raise  # Re-raise as 500 error, not auth error

    if not user:
        log_security_event(
            "auth_minimal_token_user_not_found", {"user_id": f"{str(user_id)[:8]}..."}
        )
        raise SecurityException(SecurityError.UNAUTHORIZED)

    return user


def get_current_user():
    """
    Get current user from Cognito JWT token with comprehensive validation and fallback.
    Supports both HttpOnly cookies (preferred) and Authorization header (fallback).
    """
    import time

    start_time = time.time()
    request_id = getattr(request, "request_id", f"session_{int(time.time() * 1000)}")
    endpoint = request.endpoint or "unknown"

    token = None

    # Try to get token from HttpOnly cookie first (preferred method)
    session_cookie = request.cookies.get("session")
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
                current_app.logger.warning(
                    "🔍 BACKEND_SESSION_MISSING_TOKEN",
                    extra={
                        "request_id": request_id,
                        "endpoint": endpoint,
                        "reason": "no_auth_header_or_cookie",
                    },
                )
                log_security_event("auth_missing_token")
                raise SecurityException(SecurityError.UNAUTHORIZED)
            current_app.logger.warning(
                "🔍 BACKEND_SESSION_INVALID_HEADER",
                extra={
                    "request_id": request_id,
                    "endpoint": endpoint,
                    "reason": "invalid_header_format",
                },
            )
            log_security_event("auth_invalid_header_format")
            raise SecurityException(SecurityError.INVALID_TOKEN)

    if not token:
        current_app.logger.warning(
            "🔍 BACKEND_SESSION_MISSING_TOKEN",
            extra={
                "request_id": request_id,
                "endpoint": endpoint,
                "reason": "token_is_none",
            },
        )
        log_security_event("auth_missing_token")
        raise SecurityException(SecurityError.UNAUTHORIZED)

    # Basic shape check (three parts)
    if token.count(".") != 2:
        log_security_event("auth_invalid_jwt_format", {"parts_count": token.count(".") + 1})
        raise SecurityException(SecurityError.INVALID_TOKEN)

    # -------- Centralized token classification (prevents HS256 → Cognito routing) --------
    try:
        token_kind = classify_token(token)

        if token_kind == "minimal":
            try:
                return _verify_minimal_token(token, start_time)
            except Exception as minimal_verify_error:
                error_type = type(minimal_verify_error).__name__
                current_app.logger.error(
                    "🔍 MINIMAL_TOKEN_VERIFICATION_FAILED",
                    extra={
                        "error": str(minimal_verify_error),
                        "error_type": error_type,
                        "note": "Minimal token verification failed - NO fallback to Cognito",
                    },
                )

                # Log specific error types for debugging
                if error_type == "ImmatureSignatureError":
                    # Enhanced logging for ImmatureSignatureError
                    current_app.logger.error(
                        "🔍 IMMATURE_SIGNATURE_ERROR_DETAILED",
                        extra={
                            "error": str(minimal_verify_error),
                            "error_type": error_type,
                            "verification_timestamp": int(time.time()),
                            "endpoint": request.endpoint,
                            "path": request.path,
                            "referer": request.headers.get("Referer"),
                            "user_agent": request.headers.get("User-Agent", "")[:50] + "..."
                            if request.headers.get("User-Agent")
                            else "missing",
                            "timing_context": "auth_verification",
                            "note": "Token nbf/iat is in the future - possible clock skew or immediate usage",
                        },
                    )
                    log_security_event(
                        "auth_minimal_token_immature",
                        {
                            "error_type": error_type,
                            "note": "Token nbf/iat is in the future - possible clock skew",
                            "verification_timestamp": int(time.time()),
                            "endpoint": request.endpoint,
                        },
                    )
                else:
                    log_security_event(
                        "auth_minimal_token_verification_failed", {"error_type": error_type}
                    )

                # CRITICAL: Never fall back to Cognito for minimal tokens
                raise SecurityException(SecurityError.INVALID_TOKEN) from minimal_verify_error

        elif token_kind == "reject_cognito_alg":
            # HS256 token claiming to be Cognito - reject immediately
            log_security_event(
                "auth_cognito_wrong_algorithm",
                {
                    "alg": "HS256",
                    "expected": "RS256",
                    "note": "HS256 token incorrectly routed to Cognito validation",
                },
            )
            raise SecurityException(SecurityError.INVALID_TOKEN)

        elif token_kind == "cognito":
            pass
            # Continue to Cognito verification below
        else:
            # Unknown token kind
            current_app.logger.warning(
                "🔍 AUTH_UNKNOWN_TOKEN_KIND", extra={"token_kind": token_kind}
            )
            log_security_event("auth_unknown_token_kind", {"token_kind": token_kind})
            raise SecurityException(SecurityError.INVALID_TOKEN)

    except SecurityException as e:
        # Re-raise security exceptions
        raise e from e
    except Exception as e:
        current_app.logger.error(
            "🔍 AUTH_CLASSIFICATION_FAILED", extra={"error": str(e), "error_type": type(e).__name__}
        )
        raise SecurityException(SecurityError.INVALID_TOKEN) from None

    # -------- Cognito verification path (RS256) --------
    from jose.exceptions import JWTError

    from .cognito_verify import verify_cognito_token_and_get_user

    try:
        current_app.logger.debug("Verifying as Cognito token...")
        return verify_cognito_token_and_get_user(token, start_time)
    except ExpiredSignatureError as e:
        _log_expired_once(request.remote_addr or "unknown", request.endpoint or "unknown")
        raise SecurityException(SecurityError.TOKEN_EXPIRED) from e
    except JWTClaimsError as e:
        log_security_event("auth_invalid_claims", {"error_type": type(e).__name__})
        raise SecurityException(SecurityError.INVALID_TOKEN) from None
    except JWTError as e:
        log_security_event("auth_jwt_validation_failed", {"error_type": type(e).__name__})
        raise SecurityException(SecurityError.INVALID_TOKEN) from None
    except Exception as e:
        from sqlalchemy.exc import SQLAlchemyError

        if isinstance(e, SQLAlchemyError):
            current_app.logger.error(
                "❌ DATABASE_ERROR_IN_AUTH", extra={"error_type": type(e).__name__, "error": str(e)}
            )
            raise e from e
        log_security_event("auth_unexpected_error", {"error_type": type(e).__name__})
        raise SecurityException(SecurityError.UNAUTHORIZED) from None
