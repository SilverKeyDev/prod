"""Google OAuth handlers."""

import traceback

from flask import redirect, request, session

from app.schemas import OAuthCallbackQueryParams
from app.services.auth.core import google_oauth_service
from app.services.auth.flows import handle_google_oauth_callback
from app.services.auth.utils import generate_request_id
from app.utils.common_patterns import handle_exceptions_with_logging
from app.utils.route import http_errors
from app.utils.security import rate_limit
from app.utils.validation import validate_query
from logger import log


@rate_limit(max_requests=10, window_seconds=60)
@handle_exceptions_with_logging
def google_oauth_start():
    """Start Google OAuth flow for authentication"""
    request_id = generate_request_id("google_oauth")
    try:
        log.info("AUTH", "google_oauth_start", {"request_id": request_id})
        auth_url, state = google_oauth_service.build_auth_url()
        session["google_auth_oauth_state"] = state
        session.permanent = True
        log.info(
            "AUTH",
            "google_oauth_start_state_stored",
            {
                "request_id": request_id,
                "has_state": bool(state),
                "storage_method": "DB (with session fallback)",
                "session_permanent": session.permanent,
            },
        )
        return redirect(auth_url)
    except Exception as e:
        log.error(
            "AUTH",
            "google_oauth_start_error",
            {
                "request_id": request_id,
                "error_type": type(e).__name__,
                "traceback": traceback.format_exc()[:500],
            },
        )
        err_msg = str(e).lower()
        if any(token in err_msg for token in ("config", "client_id", "redirect", "not set")):
            return http_errors.configuration_unavailable(
                e,
                context={"request_id": request_id, "feature": "google_oauth"},
            )
        return http_errors.server_error(e, context={"request_id": request_id})


@rate_limit(max_requests=10, window_seconds=60)
@handle_exceptions_with_logging
@validate_query(OAuthCallbackQueryParams)
def google_oauth_callback(query: OAuthCallbackQueryParams | None = None):
    """Handle Google OAuth callback and sign in/sign up user"""
    request_id = generate_request_id("google_callback")
    try:
        request_args = (
            query.model_dump(exclude_none=True) if query is not None else dict(request.args.items())
        )
        log.info(
            "AUTH",
            "google_oauth_callback",
            {
                "request_id": request_id,
                "has_code": bool(request_args.get("code")),
                "has_error": bool(request_args.get("error")),
                "has_state": bool(request_args.get("state")),
                "session_key_count": len(session.keys()) if session else 0,
                "has_session_state": "google_auth_oauth_state" in session if session else False,
            },
        )
        resp = handle_google_oauth_callback(
            request_args=request_args, session_data=dict(session), request_id=request_id
        )
        return resp
    except Exception as e:
        full_traceback = traceback.format_exc()
        log.error(
            "AUTH",
            "google_oauth_callback_error",
            {
                "request_id": request_id,
                "error_type": type(e).__name__,
                "traceback": full_traceback[:1000],
                "has_code": bool(request.args.get("code")),
                "has_state": bool(request.args.get("state")),
                "has_error_param": bool(request.args.get("error")),
                "session_key_count": len(session.keys()) if session else 0,
            },
        )
        from app.config import Config

        return redirect(f"{Config.FRONTEND_URL}/login?error=google_oauth_failed")
