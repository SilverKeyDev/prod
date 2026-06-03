"""
Token refresh flow handlers.
"""

import time

import jwt
from flask import Response, current_app, make_response, request

from app.models import GoogleOAuthToken, User

from .refresh_handlers import (
    extract_refresh_token_from_cookie,
    handle_cognito_refresh,
    handle_cognito_refresh_without_session,
    handle_google_refresh,
)


def _decode_session_cookie(
    access_token: str, request_id: str, start_time: float
) -> tuple[str | None, str | None]:
    """Decode session JWT for user_id and email; returns (user_id, email) or (None, None)."""
    try:
        decoded = jwt.decode(access_token, options={"verify_signature": False})
        user_id = decoded.get("sub")
        email = decoded.get("email")
        if not user_id:
            duration_ms = int((time.time() - start_time) * 1000)
            current_app.logger.warning(
                "AUTH_REFRESH_MISSING_USER_ID",
                extra={"request_id": request_id, "duration_ms": duration_ms},
            )
            return None, None
        return str(user_id), email
    except Exception as decode_error:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.error(
            "AUTH_REFRESH_TOKEN_DECODE_ERROR",
            extra={
                "request_id": request_id,
                "error": str(decode_error),
                "duration_ms": duration_ms,
            },
        )
        return None, None


def _resolve_user_from_refresh_token_only(refresh_token: str) -> User | None:
    """Resolve user when session cookie is absent but refresh_token cookie is present."""
    google_token = GoogleOAuthToken.query.filter_by(refresh_token=refresh_token).first()
    if google_token:
        return User.query.filter_by(id=google_token.user_id).first()
    return None


def _missing_access_token_response(request_id: str, start_time: float) -> tuple[Response, int]:
    duration_ms = int((time.time() - start_time) * 1000)
    current_app.logger.warning(
        "AUTH_REFRESH_MISSING_ACCESS_TOKEN",
        extra={"request_id": request_id, "duration_ms": duration_ms},
    )
    return (
        make_response(
            {
                "success": False,
                "error": "ACCESS_TOKEN_MISSING",
                "message": "Access token not found. Please log in again.",
            }
        ),
        401,
    )


def _user_not_found_response(
    request_id: str, user_id: str, start_time: float
) -> tuple[Response, int]:
    duration_ms = int((time.time() - start_time) * 1000)
    current_app.logger.warning(
        "AUTH_REFRESH_USER_NOT_FOUND",
        extra={"request_id": request_id, "user_id": user_id, "duration_ms": duration_ms},
    )
    return (
        make_response(
            {
                "success": False,
                "error": "USER_NOT_FOUND",
                "message": "User not found. Please log in again.",
            }
        ),
        401,
    )


def _unknown_user_type_response(
    request_id: str, user_id: str, user: User, start_time: float
) -> tuple[Response, int]:
    duration_ms = int((time.time() - start_time) * 1000)
    current_app.logger.warning(
        "AUTH_REFRESH_UNKNOWN_USER_TYPE",
        extra={
            "request_id": request_id,
            "user_id": user_id,
            "has_google_id": bool(user.google_id),
            "has_cognito_id": bool(user.cognito_id),
            "duration_ms": duration_ms,
        },
    )
    return (
        make_response(
            {
                "success": False,
                "error": "UNKNOWN_USER_TYPE",
                "message": "Unable to determine authentication method. Please log in again.",
            }
        ),
        401,
    )


def handle_refresh_token(request_id: str) -> tuple[Response, int]:
    """
    Handle refresh token flow for both Cognito and Google OAuth users.
    Detects user type and routes to appropriate refresh handler.
    Returns (response, status_code).
    """
    start_time = time.time()

    access_token = request.cookies.get("session")
    refresh_token = extract_refresh_token_from_cookie()

    if not access_token:
        if not refresh_token:
            return _missing_access_token_response(request_id, start_time)

        user = _resolve_user_from_refresh_token_only(refresh_token)
        if user:
            user_id = str(user.id)
            email = user.email
            if user.google_id:
                return handle_google_refresh(user, user_id, email, request_id, start_time)
            if user.cognito_id:
                return handle_cognito_refresh(user, user_id, email, request_id, start_time)
            return _unknown_user_type_response(request_id, user_id, user, start_time)

        return handle_cognito_refresh_without_session(refresh_token, request_id, start_time)

    user_id, email = _decode_session_cookie(access_token, request_id, start_time)
    if not user_id:
        return (
            make_response(
                {
                    "success": False,
                    "error": "INVALID_TOKEN",
                    "message": "Invalid access token. Please log in again.",
                }
            ),
            401,
        )

    user = User.query.filter_by(id=user_id).first()
    if not user:
        return _user_not_found_response(request_id, user_id, start_time)

    if user.google_id:
        return handle_google_refresh(user, user_id, email, request_id, start_time)
    if user.cognito_id:
        return handle_cognito_refresh(user, user_id, email, request_id, start_time)

    return _unknown_user_type_response(request_id, user_id, user, start_time)
