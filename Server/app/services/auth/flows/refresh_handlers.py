"""
Google and Cognito token refresh handlers (used by refresh flow).
"""

import time
from datetime import datetime, timedelta, timezone
from typing import cast

from flask import Response, make_response, request

from app import db
from app.models import GoogleOAuthToken, User

from ..core.cognito_service import AWS_COGNITO_service
from ..core.google_oauth_service import google_oauth_service
from ..user.lookup import find_or_create_user_by_cognito
from ..utils.cookies import clear_auth_cookies, set_auth_cookies
from ..utils.responses import create_auth_response
from ..utils.token_creation import create_minimal_tokens, decode_cognito_token


def handle_google_refresh(
    user: User, user_id: str, email: str | None, request_id: str, start_time: float
) -> tuple[Response, int]:
    """
    Handle Google OAuth token refresh.
    """
    from flask import current_app

    # Get Google refresh token from database
    google_token = GoogleOAuthToken.query.filter_by(user_id=user_id).first()

    if not google_token or not google_token.refresh_token:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.warning(
            "AUTH_REFRESH_GOOGLE_TOKEN_MISSING",
            extra={
                "request_id": request_id,
                "user_id": user_id,
                "has_token_record": bool(google_token),
                "has_refresh_token": bool(google_token.refresh_token if google_token else False),
                "duration_ms": duration_ms,
            },
        )

        resp = make_response(
            {
                "success": False,
                "error": "GOOGLE_REFRESH_TOKEN_MISSING",
                "message": "Google refresh token not found. Please log in again.",
            }
        )
        resp = clear_auth_cookies(resp)
        return resp, 401

    # Call Google refresh
    result = google_oauth_service.refresh_access_token(google_token.refresh_token)

    if not result["success"]:
        duration_ms = int((time.time() - start_time) * 1000)
        error_code = result.get("error", "GOOGLE_REFRESH_FAILED")

        # Transient network error: do not clear cookies or token so client can retry
        if error_code == "GOOGLE_REFRESH_NETWORK_ERROR":
            current_app.logger.warning(
                "AUTH_REFRESH_GOOGLE_NETWORK_ERROR",
                extra={
                    "request_id": request_id,
                    "user_id": user_id,
                    "duration_ms": duration_ms,
                },
            )
            resp = make_response(
                {
                    "success": False,
                    "error": error_code,
                    "message": result.get("message", "Unable to reach Google. Please try again."),
                    "retryable": True,
                }
            )
            return resp, 503

        current_app.logger.warning(
            "AUTH_REFRESH_GOOGLE_FAILED",
            extra={
                "request_id": request_id,
                "user_id": user_id,
                "error": error_code,
                "duration_ms": duration_ms,
            },
        )

        # Clear cookies on refresh failure
        resp = make_response(
            {
                "success": False,
                "error": error_code,
                "message": result.get(
                    "message", "Google token refresh failed. Please log in again."
                ),
            }
        )
        resp = clear_auth_cookies(resp)

        # If refresh token is expired/invalid, clear it from database
        if error_code in ["GOOGLE_REFRESH_TOKEN_EXPIRED", "GOOGLE_REFRESH_TOKEN_INVALID"]:
            try:
                google_token.refresh_token = None
                db.session.commit()
                current_app.logger.info(
                    "AUTH_REFRESH_GOOGLE_TOKEN_CLEARED",
                    extra={"request_id": request_id, "user_id": user_id},
                )
            except Exception as e:
                current_app.logger.error(
                    "AUTH_REFRESH_GOOGLE_TOKEN_CLEAR_ERROR",
                    extra={"request_id": request_id, "user_id": user_id, "error": str(e)},
                )

        return resp, 401

    # Update GoogleOAuthToken record with new access token
    try:
        google_token.access_token = result["access_token"]
        # Preserve refresh token (Google may not return new one)
        if result.get("refresh_token"):
            google_token.refresh_token = result["refresh_token"]
        # Update expiry if provided
        if result.get("expires_in"):
            google_token.expiry = datetime.now(timezone.utc) + timedelta(
                seconds=result["expires_in"]
            )
        db.session.commit()

        current_app.logger.info(
            "AUTH_REFRESH_GOOGLE_TOKEN_UPDATED",
            extra={
                "request_id": request_id,
                "user_id": user_id,
                "has_new_refresh_token": bool(result.get("refresh_token")),
            },
        )
    except Exception as e:
        current_app.logger.error(
            "AUTH_REFRESH_GOOGLE_TOKEN_UPDATE_ERROR",
            extra={"request_id": request_id, "user_id": user_id, "error": str(e)},
        )
        # Continue anyway - token refresh succeeded

    # Create new minimal tokens
    user_name = user.name if user else "Unknown User"
    minimal_access_token, minimal_id_token = create_minimal_tokens(
        user_id=user_id,
        user_email=email or user.email or "",
        user_name=user_name,
        expires_in_hours=8,
        fallback_access_token=result["access_token"],
        fallback_id_token=None,  # Google doesn't provide ID tokens in refresh response
    )

    # Create response
    resp = create_auth_response(
        user=user,
        user_sub=user_id,  # For Google users, user_id is the sub
        email=email or user.email or "",
        access_token=minimal_access_token,
        id_token=minimal_id_token,
        message="Token refreshed successfully",
    )

    # Set new cookies (preserve refresh token from database)
    refresh_token_for_cookie = google_token.refresh_token or request.cookies.get(
        "refresh_token", ""
    )
    resp = set_auth_cookies(
        cast(Response, resp),
        access_token=minimal_access_token,
        refresh_token=refresh_token_for_cookie,
        request_id=request_id,
    )

    duration_ms = int((time.time() - start_time) * 1000)
    current_app.logger.info(
        "AUTH_REFRESH_GOOGLE_SUCCESS",
        extra={"request_id": request_id, "user_id": user_id, "duration_ms": duration_ms},
    )

    return resp, 200


def handle_cognito_refresh(
    user: User, user_id: str, email: str | None, request_id: str, start_time: float
) -> tuple[Response, int]:
    """
    Handle Cognito token refresh.
    """
    from flask import current_app

    # Get refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.warning(
            "AUTH_REFRESH_COGNITO_MISSING_TOKEN",
            extra={"request_id": request_id, "user_id": user_id, "duration_ms": duration_ms},
        )
        resp = make_response(
            {
                "success": False,
                "error": "REFRESH_TOKEN_MISSING",
                "message": "Refresh token not found. Please log in again.",
            }
        )
        resp = clear_auth_cookies(resp)
        return resp, 401

    # Get username for Cognito refresh
    username = email or user.email

    # Call Cognito refresh
    result = AWS_COGNITO_service.refresh_access_token(refresh_token, username)

    if not result["success"]:
        duration_ms = int((time.time() - start_time) * 1000)
        error_code = result.get("error", "REFRESH_FAILED")

        current_app.logger.warning(
            "AUTH_REFRESH_COGNITO_FAILED",
            extra={
                "request_id": request_id,
                "user_id": user_id,
                "error": error_code,
                "duration_ms": duration_ms,
            },
        )

        # Clear cookies on refresh failure
        resp = make_response(
            {
                "success": False,
                "error": error_code,
                "message": result.get("message", "Token refresh failed. Please log in again."),
            }
        )
        resp = clear_auth_cookies(resp)

        return resp, 401

    # Extract user info from new tokens
    try:
        id_token = result["tokens"]["IdToken"]
        decoded_id_token = decode_cognito_token(id_token)
        user_sub = decoded_id_token["sub"]
        email_from_token = decoded_id_token.get("email")
    except Exception as token_error:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.error(
            "AUTH_REFRESH_COGNITO_TOKEN_DECODE_ERROR",
            extra={"request_id": request_id, "error": str(token_error), "duration_ms": duration_ms},
        )
        return make_response(
            {
                "success": False,
                "error": "TOKEN_DECODE_ERROR",
                "message": "Failed to process refreshed token",
            }
        ), 500

    # Find or update user
    user = find_or_create_user_by_cognito(user_sub, email_from_token or email or "")
    user_id = str(user.id) if user else user_sub
    user_name = user.name if user else "Unknown User"

    # Create new minimal tokens
    minimal_access_token, minimal_id_token = create_minimal_tokens(
        user_id=user_id,
        user_email=email_from_token or email or "",
        user_name=user_name,
        expires_in_hours=8,
        fallback_access_token=result["tokens"]["AccessToken"],
        fallback_id_token=result["tokens"]["IdToken"],
    )

    # Create response
    resp = create_auth_response(
        user=user,
        user_sub=user_sub,
        email=email_from_token or email or "",
        access_token=minimal_access_token,
        id_token=minimal_id_token,
        message="Token refreshed successfully",
    )

    # Set new cookies (refresh token doesn't change, but we update access token)
    resp = set_auth_cookies(
        cast(Response, resp),
        access_token=minimal_access_token,
        refresh_token=refresh_token,  # Refresh token stays the same
        request_id=request_id,
    )

    duration_ms = int((time.time() - start_time) * 1000)
    current_app.logger.info(
        "AUTH_REFRESH_COGNITO_SUCCESS",
        extra={"request_id": request_id, "user_id": user_id, "duration_ms": duration_ms},
    )

    return resp, 200
