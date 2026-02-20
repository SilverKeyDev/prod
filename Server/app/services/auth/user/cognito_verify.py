"""
Cognito JWT verification and user resolution.
"""

import logging
import time

from flask import current_app, request
from jose import jwt as jose_jwt
from sqlalchemy.exc import InvalidRequestError, SQLAlchemyError

from app import db
from app.models import User
from app.utils.security.security import SecurityError, log_security_event

from ..tokens.verification import (
    AWS_COGNITO_CLIENT_ID,
    AWS_COGNITO_ISSUER,
    decode_with_leeway,
    get_signing_key_for_cognito_rs256,
)
from .exceptions import SecurityException

logger = logging.getLogger(__name__)


def verify_cognito_token_and_get_user(token: str, start_time: float | None = None):
    """
    Verify a Cognito RS256 token and return the associated User.
    Raises SecurityException for auth failures; lets ExpiredSignatureError,
    JWTClaimsError, JWTError propagate for the caller to map.
    """
    # GUARDRAIL: Check algorithm before attempting Cognito validation
    try:
        unverified_header = jose_jwt.get_unverified_header(token)
        alg = unverified_header.get("alg")
        if alg != "RS256":
            log_security_event(
                "auth_cognito_wrong_algorithm",
                {
                    "alg": alg,
                    "expected": "RS256",
                    "note": "HS256 token incorrectly routed to Cognito validation (should not happen with new classification)",
                },
            )
            raise SecurityException(SecurityError.INVALID_TOKEN)
    except SecurityException as e:
        raise e from e
    except Exception as header_error:
        logger.error(
            "Failed to read token header: %s",
            header_error,
            extra={"token_present": bool(token), "token_length": len(token) if token else 0},
        )
        raise SecurityException(SecurityError.INVALID_TOKEN) from None

    key = get_signing_key_for_cognito_rs256(token)

    claims = decode_with_leeway(
        token=token,
        key=key,
        issuer=AWS_COGNITO_ISSUER,
        leeway_seconds=60,
        verify_aud=False,
        audience=None,
    )

    token_use = claims.get("token_use")
    if token_use not in ("id", "access"):
        log_security_event("auth_invalid_token_use", {"token_use": token_use})
        raise SecurityException(SecurityError.INVALID_TOKEN)

    if token_use == "id":
        aud = claims.get("aud")
        if aud != AWS_COGNITO_CLIENT_ID:
            log_security_event("auth_invalid_audience", {"aud": aud})
            raise SecurityException(SecurityError.INVALID_TOKEN)

    elif token_use == "access":
        if claims.get("client_id") != AWS_COGNITO_CLIENT_ID:
            log_security_event("auth_invalid_client_id")
            raise SecurityException(SecurityError.INVALID_TOKEN)

    sub = claims.get("sub")
    if not sub:
        log_security_event("auth_missing_sub")
        raise SecurityException(SecurityError.INVALID_TOKEN)

    try:
        user = User.query.filter_by(cognito_id=sub).first()
        if not user:
            user_email = claims.get("email")
            if user_email:
                user = User.query.filter_by(email=user_email).first()
                if user:
                    user.cognito_id = sub
                    db.session.commit()
    except InvalidRequestError as e:
        logger.error("SQLAlchemy mapper init failed during Cognito auth: %s", e)
        raise
    except SQLAlchemyError as e:
        logger.error("Database error during Cognito auth: %s", e)
        raise

    if not user:
        log_security_event("auth_user_not_found", {"cognito_id": f"{sub[:8]}..."})
        raise SecurityException(SecurityError.UNAUTHORIZED)

    _start = start_time if start_time is not None else time.time()
    duration_ms = int((time.time() - _start) * 1000)
    request_id = getattr(request, "request_id", f"session_{int(time.time() * 1000)}")
    endpoint = request.endpoint or "unknown"
    log_level = (
        current_app.logger.debug if endpoint != "user.get_user_profile" else current_app.logger.info
    )
    log_level(
        "🔍 BACKEND_SESSION_VERIFICATION_SUCCESS",
        extra={
            "request_id": request_id,
            "user_id": str(getattr(user, "id", None)),
            "email": (user.email[:3] + "***" + user.email[-3:])
            if getattr(user, "email", None)
            else "missing",
            "token_type": "cognito",
            "token_use": token_use,
            "is_agent": getattr(user, "is_agent", False),
            "duration_ms": duration_ms,
        },
    )

    return user
