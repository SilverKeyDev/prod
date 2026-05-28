"""
Google OAuth callback flow handler.
"""

import time
import traceback
import uuid as uuid_lib
from datetime import datetime, timezone
from typing import Any, cast

from flask import Response, current_app, redirect, session

from app import db
from app.models import User

from ..core.google_oauth_service import google_oauth_service
from ..core.minimal_token_service import minimal_token_service
from ..utils.cookies import set_auth_cookies
from ..utils.helpers import mask_email


def handle_google_oauth_callback(
    request_args: dict[str, Any], session_data: dict[str, Any], request_id: str
) -> Response:
    """
    Handle Google OAuth callback flow.
    Returns redirect response.
    """
    from app.config import Config

    # Check for OAuth errors
    error = request_args.get("error")
    if error:
        current_app.logger.warning(
            "GOOGLE_OAUTH_ERROR", extra={"request_id": request_id, "error": error}
        )
        return cast(Response, redirect(f"{Config.FRONTEND_URL}/login?error=google_oauth_failed"))

    # Validate state - use DB-based validation (works even if cookies/sessions fail)
    state = request_args.get("state")
    # Try DB first, fall back to session for backward compatibility
    session_state = session_data.get("google_auth_oauth_state") if session_data else None
    if not session_state:
        # Access Flask session directly as fallback
        session_state = session.get("google_auth_oauth_state")

    if not google_oauth_service.validate_state(state or "", session_state):
        current_app.logger.warning(
            "GOOGLE_OAUTH_INVALID_STATE",
            extra={
                "request_id": request_id,
                "has_state": bool(state),
                "has_session_state": bool(session_state),
                "state_match": state == session_state if state and session_state else False,
                "note": "State validation failed - could be expired, already used, or mismatch",
            },
        )
        return cast(Response, redirect(f"{Config.FRONTEND_URL}/login?error=invalid_state"))

    # Exchange code for tokens
    code = request_args.get("code")
    if not code:
        current_app.logger.error(
            "GOOGLE_OAUTH_MISSING_CODE",
            extra={"request_id": request_id, "request_args_keys": list(request_args.keys())},
        )
        return cast(Response, redirect(f"{Config.FRONTEND_URL}/login?error=missing_code"))

    try:
        tokens = google_oauth_service.exchange_code_for_tokens(code)
    except Exception as token_exchange_error:
        current_app.logger.error(
            "GOOGLE_TOKEN_EXCHANGE_ERROR_IN_FLOW",
            extra={
                "request_id": request_id,
                "error": str(token_exchange_error),
                "error_type": type(token_exchange_error).__name__,
                "traceback": traceback.format_exc()[:500],
            },
        )
        return cast(Response, redirect(f"{Config.FRONTEND_URL}/login?error=token_exchange_failed"))

    # Validate tokens response
    if not tokens or "access_token" not in tokens:
        current_app.logger.error(
            "GOOGLE_TOKEN_MISSING_ACCESS_TOKEN",
            extra={
                "request_id": request_id,
                "tokens_keys": list(tokens.keys()) if tokens else None,
            },
        )
        return cast(Response, redirect(f"{Config.FRONTEND_URL}/login?error=invalid_tokens"))

    # Log refresh_token presence for debugging
    has_refresh_token = bool(tokens.get("refresh_token"))
    current_app.logger.info(
        "GOOGLE_TOKENS_RECEIVED",
        extra={
            "request_id": request_id,
            "has_refresh_token": has_refresh_token,
            "has_access_token": bool(tokens.get("access_token")),
            "expires_in": tokens.get("expires_in"),
        },
    )

    # Get user info from Google
    try:
        user_info = google_oauth_service.get_user_info(tokens["access_token"])
    except Exception as userinfo_error:
        current_app.logger.error(
            "GOOGLE_USERINFO_ERROR_IN_FLOW",
            extra={
                "request_id": request_id,
                "error": str(userinfo_error),
                "error_type": type(userinfo_error).__name__,
                "traceback": traceback.format_exc()[:500],
            },
        )
        return cast(Response, redirect(f"{Config.FRONTEND_URL}/login?error=userinfo_failed"))

    current_app.logger.info(
        "GOOGLE_USERINFO_RECEIVED",
        extra={
            "request_id": request_id,
            "email": mask_email(user_info.get("email", "")),
            "verified": user_info.get("verified_email"),
            "has_name": bool(user_info.get("name")),
        },
    )

    # Check if email is verified
    if not user_info.get("verified_email"):
        current_app.logger.warning(
            "GOOGLE_EMAIL_NOT_VERIFIED",
            extra={"request_id": request_id, "email": mask_email(user_info.get("email", ""))},
        )
        return cast(Response, redirect(f"{Config.FRONTEND_URL}/login?error=email_not_verified"))

    # Extract user info - validate required fields
    if "id" not in user_info or "email" not in user_info:
        current_app.logger.error(
            "GOOGLE_USERINFO_MISSING_FIELDS",
            extra={
                "request_id": request_id,
                "user_info_keys": list(user_info.keys()) if user_info else None,
            },
        )
        return cast(Response, redirect(f"{Config.FRONTEND_URL}/login?error=invalid_userinfo"))

    google_id = user_info["id"]
    email = user_info["email"]
    name = user_info.get("name", "").strip() if user_info.get("name") else email.split("@")[0]
    if not name or not name.strip():
        name = email.split("@")[0] if email and "@" in email else "User"

    # Find or create user
    is_new_signup = False
    user = User.query.filter_by(google_id=google_id).first()

    if not user:
        user = User.query.filter_by(email=email).first()

        if user:
            # Link Google account to existing user
            user.google_id = google_id
            user.updated_at = datetime.now(timezone.utc)
            user.last_logged_in = datetime.now(timezone.utc)
            db.session.commit()

            current_app.logger.info(
                "GOOGLE_ACCOUNT_LINKED",
                extra={"request_id": request_id, "user_id": user.id, "email": mask_email(email)},
            )
        else:
            # Create new user
            now = datetime.now(timezone.utc)
            user = User(
                id=str(uuid_lib.uuid4()),
                google_id=google_id,
                email=email,
                name=name,
                created_at=now,
                updated_at=now,
                last_logged_in=now,
                is_active=True,
            )
            db.session.add(user)
            db.session.commit()

            is_new_signup = True

            current_app.logger.info(
                "GOOGLE_USER_CREATED",
                extra={"request_id": request_id, "user_id": user.id, "email": mask_email(email)},
            )
    else:
        # User exists, update last_logged_in
        user.last_logged_in = datetime.now(timezone.utc)
        db.session.commit()

    # Create tokens - match old approach: create access token directly, ID token is optional
    try:
        # Generate minimal access token (required)
        minimal_access_token = minimal_token_service.create_minimal_access_token(
            user_id=str(user.id), user_email=email, expires_in_hours=8
        )

        # Generate minimal ID token (optional - don't block if it fails)
        # Use email prefix as fallback if name is missing, with additional fallbacks
        user_name = user.name if user.name and user.name.strip() else email.split("@")[0]

        # Additional fallback: if email prefix is empty, use a default
        if not user_name or not user_name.strip():
            user_name = "User"

        # Ensure user_name is not None and not empty
        user_name = user_name.strip() if user_name else "User"

        # ID token creation - optional (don't block cookie issuance)
        minimal_id_token = None
        try:
            minimal_id_token = minimal_token_service.create_minimal_id_token(
                user_id=str(user.id), user_email=email, user_name=user_name, expires_in_hours=8
            )
        except Exception as id_token_error:
            # Log info (not warning/error) - ID token is optional, access token is sufficient
            current_app.logger.error(
                "🔧 GOOGLE_ID_TOKEN_OPTIONAL_MISSING",
                extra={
                    "request_id": request_id,
                    "user_id": str(user.id),
                    "user_email": mask_email(email),
                    "user_name": user_name[:10] + "***" if user_name else "missing",
                    "user_name_length": len(user_name) if user_name else 0,
                    "error": str(id_token_error),
                    "error_type": type(id_token_error).__name__,
                    "note": "ID token creation skipped - access token is sufficient for authentication",
                },
            )
            # Continue without ID token - access token is sufficient

        current_app.logger.info(
            "GOOGLE_TOKENS_CREATED_SUCCESSFULLY",
            extra={
                "request_id": request_id,
                "user_id": str(user.id),
                "has_id_token": bool(minimal_id_token),
            },
        )

    except Exception as token_error:
        current_app.logger.error(
            "🔧 GOOGLE_TOKEN_CREATION_ERROR",
            extra={
                "request_id": request_id,
                "user_id": str(user.id) if user else "unknown",
                "error": str(token_error),
                "error_type": type(token_error).__name__,
                "traceback": traceback.format_exc()[:500],
            },
        )
        return cast(Response, redirect(f"{Config.FRONTEND_URL}/login?error=token_creation_failed"))

    # Determine redirect destination
    # New signups go to onboarding, existing agents go to dashboard, non-agents go to search
    if is_new_signup:
        redirect_path = "/onboarding"
    elif user.is_agent:
        redirect_path = "/dashboard"
    else:
        redirect_path = "/search"

    current_app.logger.info(
        "GOOGLE_AUTH_REDIRECT",
        extra={
            "request_id": request_id,
            "user_id": str(user.id),
            "is_new_signup": is_new_signup,
            "is_agent": user.is_agent,
            "redirect_to": redirect_path,
        },
    )

    # Create redirect response with cookies (cast for Flask/werkzeug Response compatibility)
    resp: Response = cast(
        Response, redirect(f"{Config.FRONTEND_URL}{redirect_path}?google=success")
    )

    # Small delay to ensure token has time to "age" before immediate verification
    time.sleep(0.1)  # 100ms delay

    refresh_token_value = tokens.get("refresh_token", minimal_access_token)
    resp = cast(
        Response,
        set_auth_cookies(
            resp,
            access_token=minimal_access_token,
            refresh_token=refresh_token_value,
            request_id=request_id,
        ),
    )

    from app.services.analytics.posthog_events import capture_product_event, set_person_properties

    set_person_properties(
        str(user.id),
        properties={
            "is_agent": bool(user.is_agent),
            "has_brokerage": bool(user.brokerage),
        },
    )
    if is_new_signup:
        capture_product_event(
            str(user.id),
            "user_signed_up",
            properties={
                "signup_method": "google",
                "has_brokerage": bool(user.brokerage),
            },
        )
    else:
        capture_product_event(
            str(user.id),
            "user_logged_in",
            properties={"login_method": "google"},
        )

    return resp
