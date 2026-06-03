"""
Current user resolution and authentication decorator.
"""

import time

from flask import current_app, request
from jose.exceptions import ExpiredSignatureError, JWTClaimsError
from sqlalchemy import select

from app import db
from app.models import User
from app.utils.security import SecurityError
from app.utils.security.security import log_security_event
from logger import log

from ..tokens.verification import classify_token
from ..tokens.verification import verify_minimal_token as verify_minimal_token_claims
from .exceptions import SecurityException


def _log_expired_once(ip: str, endpoint: str, interval: int = 60):
    """
    Avoid spamming logs when SPAs hit with expired tokens repeatedly.
    Logs at most once per (ip, endpoint) per `interval` seconds.
    """
    try:
        cache = current_app.extensions.setdefault("auth_expire_log_cache", {})
    except Exception:
        log_security_event("auth_token_expired", {"ip": ip, "endpoint": endpoint})
        return
    now = time.time()
    key = f"{ip}:{endpoint}"
    last = cache.get(key, 0)
    if now - last > interval:
        log_security_event("auth_token_expired", {"ip": ip, "endpoint": endpoint})
        cache[key] = now


def _verify_minimal_token(token: str, start_time: float | None = None) -> User:
    """
    Verify a minimal token and return the associated user
    """
    from sqlalchemy.exc import InvalidRequestError, SQLAlchemyError

    if start_time is None:
        start_time = time.time()
    claims = verify_minimal_token_claims(token)
    user_id = claims.get("sub")
    if not user_id:
        log_security_event("auth_minimal_token_missing_sub")
        raise SecurityException(SecurityError.INVALID_TOKEN)
    try:
        user = db.session.scalar(select(User).where(User.id == user_id))
        if not user:
            user_email = claims.get("email")
            if user_email:
                user = db.session.scalar(select(User).where(User.email == user_email))
    except InvalidRequestError as e:
        log.error("ERRORS", f"SQLAlchemy mapper init failed during auth: {e}")
        raise
    except SQLAlchemyError as e:
        log.error("ERRORS", f"Database error during minimal token auth: {e}")
        raise
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
    session_cookie = request.cookies.get("session")
    if session_cookie:
        token = session_cookie
    else:
        auth = request.headers.get("Authorization", "")
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
        else:
            if not auth:
                log.warn(
                    "AUTH",
                    "🔍 BACKEND_SESSION_MISSING_TOKEN",
                    {
                        "request_id": request_id,
                        "endpoint": endpoint,
                        "reason": "no_auth_header_or_cookie",
                    },
                )
                log_security_event("auth_missing_token")
                raise SecurityException(SecurityError.UNAUTHORIZED)
            log.warn(
                "AUTH",
                "🔍 BACKEND_SESSION_INVALID_HEADER",
                {"request_id": request_id, "endpoint": endpoint, "reason": "invalid_header_format"},
            )
            log_security_event("auth_invalid_header_format")
            raise SecurityException(SecurityError.INVALID_TOKEN)
    if not token:
        log.warn(
            "AUTH",
            "🔍 BACKEND_SESSION_MISSING_TOKEN",
            {"request_id": request_id, "endpoint": endpoint, "reason": "token_is_none"},
        )
        log_security_event("auth_missing_token")
        raise SecurityException(SecurityError.UNAUTHORIZED)
    if token.count(".") != 2:
        log_security_event("auth_invalid_jwt_format", {"parts_count": token.count(".") + 1})
        raise SecurityException(SecurityError.INVALID_TOKEN)
    try:
        token_kind = classify_token(token)
        if token_kind == "minimal":
            try:
                return _verify_minimal_token(token, start_time)
            except Exception as minimal_verify_error:
                error_type = type(minimal_verify_error).__name__
                log.error(
                    "ERRORS",
                    "🔍 MINIMAL_TOKEN_VERIFICATION_FAILED",
                    {
                        "error": str(minimal_verify_error),
                        "error_type": error_type,
                        "note": "Minimal token verification failed - NO fallback to Cognito",
                    },
                )
                if error_type == "ImmatureSignatureError":
                    log.error(
                        "ERRORS",
                        "🔍 IMMATURE_SIGNATURE_ERROR_DETAILED",
                        {
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
                raise SecurityException(SecurityError.INVALID_TOKEN) from minimal_verify_error
        elif token_kind == "reject_cognito_alg":
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
        else:
            log.warn("AUTH", "🔍 AUTH_UNKNOWN_TOKEN_KIND", {"token_kind": token_kind})
            log_security_event("auth_unknown_token_kind", {"token_kind": token_kind})
            raise SecurityException(SecurityError.INVALID_TOKEN)
    except SecurityException as e:
        raise e from e
    except Exception as e:
        log.error(
            "ERRORS",
            "🔍 AUTH_CLASSIFICATION_FAILED",
            {"error": str(e), "error_type": type(e).__name__},
        )
        raise SecurityException(SecurityError.INVALID_TOKEN) from None
    from jose.exceptions import JWTError

    from .cognito_verify import verify_cognito_token_and_get_user

    try:
        log.debug("AUTH", "Verifying as Cognito token...")
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
            log.error(
                "ERRORS",
                "❌ DATABASE_ERROR_IN_AUTH",
                {"error_type": type(e).__name__, "error": str(e)},
            )
            raise e from e
        log_security_event("auth_unexpected_error", {"error_type": type(e).__name__})
        raise SecurityException(SecurityError.UNAUTHORIZED) from None
