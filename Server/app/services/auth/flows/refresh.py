"""
Token refresh flow handlers.
"""

import time

import jwt
from flask import Response, current_app, make_response, request

from app.models import User

from .refresh_handlers import handle_cognito_refresh, handle_google_refresh


def handle_refresh_token(request_id: str) -> tuple[Response, int]:
    """
    Handle refresh token flow for both Cognito and Google OAuth users.
    Detects user type and routes to appropriate refresh handler.
    Returns (response, status_code).
    """
    start_time = time.time()

    # Get access token from cookie to identify user
    access_token = request.cookies.get("session")
    if not access_token:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.warning(
            "AUTH_REFRESH_MISSING_ACCESS_TOKEN",
            extra={"request_id": request_id, "duration_ms": duration_ms},
        )
        return make_response(
            {
                "success": False,
                "error": "ACCESS_TOKEN_MISSING",
                "message": "Access token not found. Please log in again.",
            }
        ), 401

    # Decode access token to get user_id
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
            return make_response(
                {
                    "success": False,
                    "error": "INVALID_TOKEN",
                    "message": "Invalid access token. Please log in again.",
                }
            ), 401
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
        return make_response(
            {
                "success": False,
                "error": "TOKEN_DECODE_ERROR",
                "message": "Failed to decode access token. Please log in again.",
            }
        ), 401

    # Look up user in database
    user = User.query.filter_by(id=user_id).first()
    if not user:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.warning(
            "AUTH_REFRESH_USER_NOT_FOUND",
            extra={"request_id": request_id, "user_id": user_id, "duration_ms": duration_ms},
        )
        return make_response(
            {
                "success": False,
                "error": "USER_NOT_FOUND",
                "message": "User not found. Please log in again.",
            }
        ), 401

    # Detect user type and route to appropriate handler
    if user.google_id:
        # Google OAuth user - use Google refresh
        return handle_google_refresh(user, user_id, email, request_id, start_time)
    elif user.cognito_id:
        # Cognito user - use Cognito refresh
        return handle_cognito_refresh(user, user_id, email, request_id, start_time)
    else:
        # Unknown user type
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
        return make_response(
            {
                "success": False,
                "error": "UNKNOWN_USER_TYPE",
                "message": "Unable to determine authentication method. Please log in again.",
            }
        ), 401
