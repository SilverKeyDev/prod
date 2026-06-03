"""
Google OAuth callback flow handler.
"""

import time
import traceback
import uuid as uuid_lib
from datetime import datetime, timezone
from typing import Any, cast

from flask import Response, redirect, session
from sqlalchemy import select

from app import db
from app.models import User
from app.services.auth.user_role_helpers import user_is_agent
from logger import log

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

    error = request_args.get("error")
    if error:
        log.warn("AUTH", "GOOGLE_OAUTH_ERROR", {"request_id": request_id, "error": error})
        return cast(Response, redirect(f"{Config.FRONTEND_URL}/login?error=google_oauth_failed"))
    state = request_args.get("state")
    session_state = session_data.get("google_auth_oauth_state") if session_data else None
    if not session_state:
        session_state = session.get("google_auth_oauth_state")
    if not google_oauth_service.validate_state(state or "", session_state):
        log.warn(
            "AUTH",
            "GOOGLE_OAUTH_INVALID_STATE",
            {
                "request_id": request_id,
                "has_state": bool(state),
                "has_session_state": bool(session_state),
                "state_match": state == session_state if state and session_state else False,
                "note": "State validation failed - could be expired, already used, or mismatch",
            },
        )
        return cast(Response, redirect(f"{Config.FRONTEND_URL}/login?error=invalid_state"))
    code = request_args.get("code")
    if not code:
        log.error(
            "ERRORS",
            "GOOGLE_OAUTH_MISSING_CODE",
            {"request_id": request_id, "request_args_keys": list(request_args.keys())},
        )
        return cast(Response, redirect(f"{Config.FRONTEND_URL}/login?error=missing_code"))
    try:
        tokens = google_oauth_service.exchange_code_for_tokens(code)
    except Exception as token_exchange_error:
        log.error(
            "ERRORS",
            "GOOGLE_TOKEN_EXCHANGE_ERROR_IN_FLOW",
            {
                "request_id": request_id,
                "error": str(token_exchange_error),
                "error_type": type(token_exchange_error).__name__,
                "traceback": traceback.format_exc()[:500],
            },
        )
        return cast(Response, redirect(f"{Config.FRONTEND_URL}/login?error=token_exchange_failed"))
    if not tokens or "access_token" not in tokens:
        log.error(
            "ERRORS",
            "GOOGLE_TOKEN_MISSING_ACCESS_TOKEN",
            {"request_id": request_id, "tokens_keys": list(tokens.keys()) if tokens else None},
        )
        return cast(Response, redirect(f"{Config.FRONTEND_URL}/login?error=invalid_tokens"))
    has_refresh_token = bool(tokens.get("refresh_token"))
    log.info(
        "AUTH",
        "GOOGLE_TOKENS_RECEIVED",
        {
            "request_id": request_id,
            "has_refresh_token": has_refresh_token,
            "has_access_token": bool(tokens.get("access_token")),
            "expires_in": tokens.get("expires_in"),
        },
    )
    try:
        user_info = google_oauth_service.get_user_info(tokens["access_token"])
    except Exception as userinfo_error:
        log.error(
            "ERRORS",
            "GOOGLE_USERINFO_ERROR_IN_FLOW",
            {
                "request_id": request_id,
                "error": str(userinfo_error),
                "error_type": type(userinfo_error).__name__,
                "traceback": traceback.format_exc()[:500],
            },
        )
        return cast(Response, redirect(f"{Config.FRONTEND_URL}/login?error=userinfo_failed"))
    log.info(
        "AUTH",
        "GOOGLE_USERINFO_RECEIVED",
        {
            "request_id": request_id,
            "email": mask_email(user_info.get("email", "")),
            "verified": user_info.get("verified_email"),
            "has_name": bool(user_info.get("name")),
        },
    )
    if not user_info.get("verified_email"):
        log.warn(
            "AUTH",
            "GOOGLE_EMAIL_NOT_VERIFIED",
            {"request_id": request_id, "email": mask_email(user_info.get("email", ""))},
        )
        return cast(Response, redirect(f"{Config.FRONTEND_URL}/login?error=email_not_verified"))
    if "id" not in user_info or "email" not in user_info:
        log.error(
            "ERRORS",
            "GOOGLE_USERINFO_MISSING_FIELDS",
            {
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
    is_new_signup = False
    user = db.session.scalar(select(User).where(User.google_id == google_id))
    if not user:
        user = db.session.scalar(select(User).where(User.email == email))
        if user:
            user.google_id = google_id
            user.updated_at = datetime.now(timezone.utc)
            user.last_logged_in = datetime.now(timezone.utc)
            db.session.commit()
            log.info(
                "AUTH",
                "GOOGLE_ACCOUNT_LINKED",
                {"request_id": request_id, "user_id": user.id, "email": mask_email(email)},
            )
        else:
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
            log.info(
                "AUTH",
                "GOOGLE_USER_CREATED",
                {"request_id": request_id, "user_id": user.id, "email": mask_email(email)},
            )
    else:
        user.last_logged_in = datetime.now(timezone.utc)
        db.session.commit()
    try:
        minimal_access_token = minimal_token_service.create_minimal_access_token(
            user_id=str(user.id), user_email=email, expires_in_hours=8
        )
        user_name = user.name if user.name and user.name.strip() else email.split("@")[0]
        if not user_name or not user_name.strip():
            user_name = "User"
        user_name = user_name.strip() if user_name else "User"
        minimal_id_token = None
        try:
            minimal_id_token = minimal_token_service.create_minimal_id_token(
                user_id=str(user.id), user_email=email, user_name=user_name, expires_in_hours=8
            )
        except Exception as id_token_error:
            log.error(
                "ERRORS",
                "🔧 GOOGLE_ID_TOKEN_OPTIONAL_MISSING",
                {
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
        log.info(
            "AUTH",
            "GOOGLE_TOKENS_CREATED_SUCCESSFULLY",
            {
                "request_id": request_id,
                "user_id": str(user.id),
                "has_id_token": bool(minimal_id_token),
            },
        )
    except Exception as token_error:
        log.error(
            "ERRORS",
            "🔧 GOOGLE_TOKEN_CREATION_ERROR",
            {
                "request_id": request_id,
                "user_id": str(user.id) if user else "unknown",
                "error": str(token_error),
                "error_type": type(token_error).__name__,
                "traceback": traceback.format_exc()[:500],
            },
        )
        return cast(Response, redirect(f"{Config.FRONTEND_URL}/login?error=token_creation_failed"))
    if is_new_signup:
        redirect_path = "/onboarding"
    elif user_is_agent(user):
        redirect_path = "/dashboard"
    else:
        redirect_path = "/search"
    log.info(
        "AUTH",
        "GOOGLE_AUTH_REDIRECT",
        {
            "request_id": request_id,
            "user_id": str(user.id),
            "is_new_signup": is_new_signup,
            "has_agent_role": user_is_agent(user),
            "redirect_to": redirect_path,
        },
    )
    resp: Response = cast(
        Response, redirect(f"{Config.FRONTEND_URL}{redirect_path}?google=success")
    )
    time.sleep(0.1)
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
    from app.services.brokerage.membership import brokerage_org_ids_for_user

    org_ids = brokerage_org_ids_for_user(str(user.id))
    has_brokerage = bool(org_ids)
    set_person_properties(
        str(user.id),
        properties={"has_agent_role": user_is_agent(user), "has_brokerage": has_brokerage},
    )
    if is_new_signup:
        capture_product_event(
            str(user.id),
            "user_signed_up",
            properties={"signup_method": "google", "has_brokerage": has_brokerage},
        )
    else:
        capture_product_event(str(user.id), "user_logged_in", properties={"login_method": "google"})
    return resp
