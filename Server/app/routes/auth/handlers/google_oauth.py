"""Google OAuth handlers."""

import traceback

from flask import current_app, jsonify, redirect, request, session

from app.schemas import OAuthCallbackQueryParams
from app.services.auth.core import google_oauth_service
from app.services.auth.flows import handle_google_oauth_callback
from app.services.auth.utils import generate_request_id
from app.utils.security import rate_limit
from app.utils.validation import validate_query


@rate_limit(max_requests=10, window_seconds=60)
def google_oauth_start():
    """Start Google OAuth flow for authentication"""
    request_id = generate_request_id("google_oauth")
    try:
        current_app.logger.info("GOOGLE_OAUTH_START", extra={"request_id": request_id})
        auth_url, state = google_oauth_service.build_auth_url()
        session["google_auth_oauth_state"] = state
        session.permanent = True
        current_app.logger.info(
            "GOOGLE_OAUTH_START_STATE_STORED",
            extra={
                "request_id": request_id,
                "has_state": bool(state),
                "storage_method": "DB (with session fallback)",
                "session_permanent": session.permanent,
            },
        )
        return redirect(auth_url)
    except Exception as e:
        current_app.logger.error(
            "GOOGLE_OAUTH_START_ERROR",
            extra={
                "request_id": request_id,
                "error": str(e),
                "traceback": traceback.format_exc()[:500],
            },
        )
        return jsonify(
            {
                "success": False,
                "error": "GOOGLE_OAUTH_FAILED",
                "message": "Failed to initiate Google OAuth",
            }
        ), 500


@rate_limit(max_requests=10, window_seconds=60)
@validate_query(OAuthCallbackQueryParams)
def google_oauth_callback(query: OAuthCallbackQueryParams | None = None):
    """Handle Google OAuth callback and sign in/sign up user"""
    request_id = generate_request_id("google_callback")
    try:
        request_args = (
            query.model_dump(exclude_none=True) if query is not None else dict(request.args.items())
        )
        current_app.logger.info(
            "GOOGLE_OAUTH_CALLBACK",
            extra={
                "request_id": request_id,
                "has_code": bool(request_args.get("code")),
                "has_error": bool(request_args.get("error")),
                "has_state": bool(request_args.get("state")),
                "session_keys": list(session.keys()) if session else [],
                "has_session_state": "google_auth_oauth_state" in session if session else False,
            },
        )
        resp = handle_google_oauth_callback(
            request_args=request_args, session_data=dict(session), request_id=request_id
        )
        return resp
    except Exception as e:
        full_traceback = traceback.format_exc()
        current_app.logger.error(
            "GOOGLE_OAUTH_CALLBACK_ERROR",
            extra={
                "request_id": request_id,
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": full_traceback[:1000],
                "has_code": bool(request.args.get("code")),
                "has_state": bool(request.args.get("state")),
                "has_error_param": bool(request.args.get("error")),
                "session_keys": list(session.keys()) if session else [],
            },
        )
        current_app.logger.error(f"Full traceback: {full_traceback}")
        from app.config import Config

        return redirect(f"{Config.FRONTEND_URL}/login?error=google_oauth_failed")
