"""
Google and Cognito token refresh handlers (used by refresh flow).
"""

import time
from datetime import datetime, timedelta, timezone
from typing import cast

from flask import Response, make_response, request
from sqlalchemy import select

from app import db
from app.models import GoogleOAuthToken, User
from logger import log

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
    google_token = db.session.scalar(
        select(GoogleOAuthToken).where(GoogleOAuthToken.user_id == user_id)
    )
    if not google_token or not google_token.refresh_token:
        duration_ms = int((time.time() - start_time) * 1000)
        log.warn(
            "AUTH",
            "AUTH_REFRESH_GOOGLE_TOKEN_MISSING",
            {
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
        return (resp, 401)
    result = google_oauth_service.refresh_access_token(google_token.refresh_token)
    if not result["success"]:
        duration_ms = int((time.time() - start_time) * 1000)
        error_code = result.get("error", "GOOGLE_REFRESH_FAILED")
        if error_code == "GOOGLE_REFRESH_NETWORK_ERROR":
            log.warn(
                "AUTH",
                "AUTH_REFRESH_GOOGLE_NETWORK_ERROR",
                {"request_id": request_id, "user_id": user_id, "duration_ms": duration_ms},
            )
            resp = make_response(
                {
                    "success": False,
                    "error": error_code,
                    "message": result.get("message", "Unable to reach Google. Please try again."),
                    "retryable": True,
                }
            )
            return (resp, 503)
        log.warn(
            "AUTH",
            "AUTH_REFRESH_GOOGLE_FAILED",
            {
                "request_id": request_id,
                "user_id": user_id,
                "error": error_code,
                "duration_ms": duration_ms,
            },
        )
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
        if error_code in ["GOOGLE_REFRESH_TOKEN_EXPIRED", "GOOGLE_REFRESH_TOKEN_INVALID"]:
            try:
                google_token.refresh_token = None
                db.session.commit()
                log.info(
                    "AUTH",
                    "AUTH_REFRESH_GOOGLE_TOKEN_CLEARED",
                    {"request_id": request_id, "user_id": user_id},
                )
            except Exception as e:
                log.error(
                    "ERRORS",
                    "AUTH_REFRESH_GOOGLE_TOKEN_CLEAR_ERROR",
                    {"request_id": request_id, "user_id": user_id, "error": str(e)},
                )
        return (resp, 401)
    try:
        google_token.access_token = result["access_token"]
        if result.get("refresh_token"):
            google_token.refresh_token = result["refresh_token"]
        if result.get("expires_in"):
            google_token.expiry = datetime.now(timezone.utc) + timedelta(
                seconds=result["expires_in"]
            )
        db.session.commit()
        log.debug(
            "AUTH",
            "AUTH_REFRESH_GOOGLE_TOKEN_UPDATED",
            {
                "request_id": request_id,
                "user_id": user_id,
                "has_new_refresh_token": bool(result.get("refresh_token")),
            },
        )
    except Exception as e:
        log.error(
            "ERRORS",
            "AUTH_REFRESH_GOOGLE_TOKEN_UPDATE_ERROR",
            {"request_id": request_id, "user_id": user_id, "error": str(e)},
        )
    user_name = user.name if user else "Unknown User"
    minimal_access_token, minimal_id_token = create_minimal_tokens(
        user_id=user_id,
        user_email=email or user.email or "",
        user_name=user_name,
        expires_in_hours=8,
        fallback_access_token=result["access_token"],
        fallback_id_token=None,
    )
    resp = create_auth_response(
        user=user,
        user_sub=user_id,
        email=email or user.email or "",
        access_token=minimal_access_token,
        id_token=minimal_id_token,
        message="Token refreshed successfully",
    )
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
    log.debug(
        "AUTH",
        "AUTH_REFRESH_GOOGLE_SUCCESS",
        {"request_id": request_id, "user_id": user_id, "duration_ms": duration_ms},
    )
    return (resp, 200)


def handle_cognito_refresh(
    user: User, user_id: str, email: str | None, request_id: str, start_time: float
) -> tuple[Response, int]:
    """
    Handle Cognito token refresh.
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        duration_ms = int((time.time() - start_time) * 1000)
        log.warn(
            "AUTH",
            "AUTH_REFRESH_COGNITO_MISSING_TOKEN",
            {"request_id": request_id, "user_id": user_id, "duration_ms": duration_ms},
        )
        resp = make_response(
            {
                "success": False,
                "error": "REFRESH_TOKEN_MISSING",
                "message": "Refresh token not found. Please log in again.",
            }
        )
        resp = clear_auth_cookies(resp)
        return (resp, 401)
    username = email or user.email
    result = AWS_COGNITO_service.refresh_access_token(refresh_token, username)
    if not result["success"]:
        duration_ms = int((time.time() - start_time) * 1000)
        error_code = result.get("error", "REFRESH_FAILED")
        log.warn(
            "AUTH",
            "AUTH_REFRESH_COGNITO_FAILED",
            {
                "request_id": request_id,
                "user_id": user_id,
                "error": error_code,
                "duration_ms": duration_ms,
            },
        )
        resp = make_response(
            {
                "success": False,
                "error": error_code,
                "message": result.get("message", "Token refresh failed. Please log in again."),
            }
        )
        resp = clear_auth_cookies(resp)
        return (resp, 401)
    try:
        id_token = result["tokens"]["IdToken"]
        decoded_id_token = decode_cognito_token(id_token)
        user_sub = decoded_id_token["sub"]
        email_from_token = decoded_id_token.get("email")
    except Exception as token_error:
        duration_ms = int((time.time() - start_time) * 1000)
        log.error(
            "ERRORS",
            "AUTH_REFRESH_COGNITO_TOKEN_DECODE_ERROR",
            {"request_id": request_id, "error": str(token_error), "duration_ms": duration_ms},
        )
        return (
            make_response(
                {
                    "success": False,
                    "error": "TOKEN_DECODE_ERROR",
                    "message": "Failed to process refreshed token",
                }
            ),
            500,
        )
    user = find_or_create_user_by_cognito(user_sub, email_from_token or email or "")
    user_id = str(user.id) if user else user_sub
    user_name = user.name if user else "Unknown User"
    minimal_access_token, minimal_id_token = create_minimal_tokens(
        user_id=user_id,
        user_email=email_from_token or email or "",
        user_name=user_name,
        expires_in_hours=8,
        fallback_access_token=result["tokens"]["AccessToken"],
        fallback_id_token=result["tokens"]["IdToken"],
    )
    resp = create_auth_response(
        user=user,
        user_sub=user_sub,
        email=email_from_token or email or "",
        access_token=minimal_access_token,
        id_token=minimal_id_token,
        message="Token refreshed successfully",
    )
    resp = set_auth_cookies(
        cast(Response, resp),
        access_token=minimal_access_token,
        refresh_token=refresh_token,
        request_id=request_id,
    )
    duration_ms = int((time.time() - start_time) * 1000)
    log.info(
        "AUTH",
        "AUTH_REFRESH_COGNITO_SUCCESS",
        {"request_id": request_id, "user_id": user_id, "duration_ms": duration_ms},
    )
    return (resp, 200)


def handle_cognito_refresh_without_session(
    refresh_token: str, request_id: str, start_time: float
) -> tuple[Response, int]:
    """
    Refresh when the session cookie is missing but refresh_token is present (e.g. expired session).
    Uses Cognito refresh first to recover user identity, then issues new session cookies.
    """
    result = AWS_COGNITO_service.refresh_access_token(refresh_token, None)
    if not result["success"]:
        duration_ms = int((time.time() - start_time) * 1000)
        error_code = result.get("error", "REFRESH_FAILED")
        log.warn(
            "AUTH",
            "AUTH_REFRESH_WITHOUT_SESSION_FAILED",
            {"request_id": request_id, "error": error_code, "duration_ms": duration_ms},
        )
        resp = make_response(
            {
                "success": False,
                "error": error_code,
                "message": result.get("message", "Token refresh failed. Please log in again."),
            }
        )
        resp = clear_auth_cookies(resp)
        return (resp, 401)
    try:
        id_token = result["tokens"]["IdToken"]
        decoded_id_token = decode_cognito_token(id_token)
        user_sub = decoded_id_token["sub"]
        email_from_token = decoded_id_token.get("email")
    except Exception as token_error:
        duration_ms = int((time.time() - start_time) * 1000)
        log.error(
            "ERRORS",
            "AUTH_REFRESH_WITHOUT_SESSION_TOKEN_DECODE_ERROR",
            {"request_id": request_id, "error": str(token_error), "duration_ms": duration_ms},
        )
        return (
            make_response(
                {
                    "success": False,
                    "error": "TOKEN_DECODE_ERROR",
                    "message": "Failed to process refreshed token",
                }
            ),
            500,
        )
    user = find_or_create_user_by_cognito(user_sub, email_from_token or "")
    if not user or not user.cognito_id:
        duration_ms = int((time.time() - start_time) * 1000)
        log.warn(
            "AUTH",
            "AUTH_REFRESH_WITHOUT_SESSION_USER_NOT_FOUND",
            {"request_id": request_id, "user_sub": user_sub, "duration_ms": duration_ms},
        )
        resp = make_response(
            {
                "success": False,
                "error": "USER_NOT_FOUND",
                "message": "User not found. Please log in again.",
            }
        )
        resp = clear_auth_cookies(resp)
        return (resp, 401)
    user_id = str(user.id)
    return handle_cognito_refresh(
        user, user_id, email_from_token or user.email, request_id, start_time
    )


def extract_refresh_token_from_cookie() -> str | None:
    """Return refresh token from the current request cookies (used by routes + unit tests)."""
    return request.cookies.get("refresh_token")


def validate_refresh_token(token: str | None) -> bool:
    """Basic non-empty length check for refresh tokens (unit-test contract)."""
    if not token or not isinstance(token, str):
        return False
    return len(token) >= 10
