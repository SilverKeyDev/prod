"""
Cognito JWT verification and user resolution.
"""

from jose import jwt as jose_jwt
from sqlalchemy import select
from sqlalchemy.exc import InvalidRequestError, SQLAlchemyError

from app import db
from app.models import User
from app.utils.security.security import SecurityError, log_security_event
from logger import log

from ..tokens.verification import (
    AWS_COGNITO_CLIENT_ID,
    AWS_COGNITO_ISSUER,
    decode_with_leeway,
    get_signing_key_for_cognito_rs256,
)
from .exceptions import SecurityException


def verify_cognito_token_and_get_user(token: str, start_time: float | None = None):
    """
    Verify a Cognito RS256 token and return the associated User.
    Raises SecurityException for auth failures; lets ExpiredSignatureError,
    JWTClaimsError, JWTError propagate for the caller to map.
    """
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
        log.error("ERRORS", f"Failed to read token header: {header_error}", header_error)
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
        user = db.session.scalar(select(User).where(User.cognito_id == sub))
        if not user:
            user_email = claims.get("email")
            if user_email:
                user = db.session.scalar(select(User).where(User.email == user_email))
                if user:
                    user.cognito_id = sub
                    db.session.commit()
    except InvalidRequestError as e:
        log.error("ERRORS", f"SQLAlchemy mapper init failed during Cognito auth: {e}", e)
        raise
    except SQLAlchemyError as e:
        log.error("ERRORS", f"Database error during Cognito auth: {e}", e)
        raise
    if not user:
        log_security_event("auth_user_not_found", {"cognito_id": f"{sub[:8]}..."})
        raise SecurityException(SecurityError.UNAUTHORIZED)
    return user
