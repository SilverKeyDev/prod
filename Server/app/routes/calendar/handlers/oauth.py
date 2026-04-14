"""
OAuth flow endpoints for Google Calendar
"""

from flask import jsonify, make_response, redirect, request, session

from app.config import Config
from app.schemas import RevokeResponse
from app.services.calendar.core import (
    get_authenticated_user_id,
    google_calendar_service,
)
from app.services.calendar.permissions import PERMISSIONS, get_permission_scope_map
from app.services.calendar.permissions.constants import (
    permissions as calendar_permissions_constants,
)
from app.utils.security.app_logging import get_logger
from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.security.security import (
    log_oauth_event,
    rate_limit,
    sanitize_error_message,
)
from app.utils.validation import validate_response

logger = get_logger()

_PERMISSION_NAMES_EXCLUDED_FROM_OAUTH = frozenset(
    name
    for name, data in calendar_permissions_constants.items()
    if not data.get("include_in_oauth_request", True)
)


@rate_limit(max_requests=10, window_seconds=60)
def oauth_start():
    """Start Google OAuth flow with incremental authorization

    Requests scopes where include_in_oauth_request is true (full Calendar and
    calendar.events.freebusy are never requested). include_granted_scopes preserves
    existing grants.

    Query params (deprecated; same authorize URL regardless of values):
        full_scope: Deprecated
        scheduling: Deprecated
    """
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        log_oauth_event("start_failed", None, reason="auth_error", error="authentication_failed")
        return error_response
    if user_id is None:
        return make_response(("Unauthorized", 401))

    # Check if full scope is requested (for agent sharing)
    request_full_scope = request.args.get("full_scope", "false").lower() == "true"
    # Check if scheduling scopes are requested (for scheduling MVP)
    use_scheduling_scopes = request.args.get("scheduling", "false").lower() == "true"

    # Generate auth URL and state
    auth_url, state = google_calendar_service.build_auth_url(
        user_id, request_full_scope=request_full_scope, use_scheduling_scopes=use_scheduling_scopes
    )
    # Use separate session key for calendar flow to avoid conflicts with auth OAuth
    session["google_calendar_oauth_state"] = state

    return redirect(auth_url)


@rate_limit(max_requests=10, window_seconds=60)
def oauth_enhance():
    """Request additional Google Calendar permissions (incremental authorization)

    Query params:
        permissions: Comma-separated list of permission names to request (e.g., "calendar_freebusy,calendar_calendarlist_readonly")

    This endpoint allows users to request additional permissions without disconnecting and reconnecting.
    """
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    if user_id is None:
        return make_response(("Unauthorized", 401))

    # Get requested permissions from query parameter
    permissions_param = request.args.get("permissions", "")
    if not permissions_param:
        return jsonify(
            {
                "success": False,
                "error": "missing_parameter",
                "message": "permissions parameter is required (comma-separated list)",
            }
        ), 400

    # Parse permission names
    permission_names = [p.strip() for p in permissions_param.split(",") if p.strip()]

    not_requestable = [p for p in permission_names if p in _PERMISSION_NAMES_EXCLUDED_FROM_OAUTH]
    if not_requestable:
        return jsonify(
            {
                "success": False,
                "error": "permission_not_requestable",
                "message": (
                    "These permissions cannot be requested via OAuth (use a normal calendar "
                    f"reconnect): {', '.join(not_requestable)}"
                ),
                "not_requestable_permissions": not_requestable,
            }
        ), 400

    # Map permission names to scope URLs
    scope_map = get_permission_scope_map()

    # Validate permissions and build scope list
    requested_scopes = []
    invalid_permissions = []

    for perm_name in permission_names:
        if perm_name not in scope_map:
            invalid_permissions.append(perm_name)
        else:
            scope_url = scope_map[perm_name]
            if scope_url not in requested_scopes:
                requested_scopes.append(scope_url)

    if invalid_permissions:
        return jsonify(
            {
                "success": False,
                "error": "invalid_permissions",
                "message": f"Invalid permission names: {', '.join(invalid_permissions)}",
                "valid_permissions": list(PERMISSIONS.keys()),
            }
        ), 400

    if not requested_scopes:
        return jsonify(
            {
                "success": False,
                "error": "no_valid_permissions",
                "message": "No valid permissions to request",
            }
        ), 400

    # Generate auth URL with only the additional scopes
    # include_granted_scopes will preserve existing permissions
    auth_url, state = google_calendar_service.build_auth_url(
        user_id,
        request_full_scope=False,
        use_scheduling_scopes=False,
        request_additional_scopes=requested_scopes,
    )

    # Use separate session key for calendar flow
    session["google_calendar_oauth_state"] = state

    return redirect(auth_url)


@rate_limit(max_requests=20, window_seconds=60)
def oauth_callback():
    """Handle Google OAuth callback"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        log_oauth_event("callback_failed", None, reason="auth_error", error="authentication_failed")
        return error_response
    if user_id is None:
        return make_response(("Unauthorized", 401))

    state = request.args.get("state")
    code = request.args.get("code")
    error = request.args.get("error")

    if state is None:
        return make_response(("Missing state", 400))
    if code is None:
        return make_response(("Missing code", 400))

    # Handle OAuth errors
    if error:
        return make_response((f"OAuth error: {error}", 400))

    # Validate state - use separate session key for calendar flow
    if not google_calendar_service.validate_state(
        state, session.get("google_calendar_oauth_state")
    ):
        log_oauth_event("callback_failed", user_id, reason="invalid_state")
        return make_response(("Invalid state", 400))

    # Exchange code for tokens using service
    try:
        tokens = google_calendar_service.exchange_code_for_tokens(code, user_id)

        # Check if scheduling scopes were granted and create SilverKey calendar if needed
        # Import permissions constants to ensure only allowed scopes are used
        from app.services.calendar.permissions.constants import permissions

        # Note: tokens_upsert (called by exchange_code_for_tokens) already updated permissions
        # from the granted scopes, so no need to update again here
        granted_scopes = tokens.get("scope", "").split() if tokens.get("scope") else []
        calendar_app_created_scope = permissions["calendar_app_created"]["scope_url"]
        has_scheduling_scopes = calendar_app_created_scope in granted_scopes

        if has_scheduling_scopes:
            try:
                # Create SilverKey calendar if it doesn't exist (buyer_name is ignored, always creates "SilverKey")
                google_calendar_service.get_or_create_silverkey_calendar(user_id, None)
            except Exception as e:
                # Log but don't fail OAuth if calendar creation fails
                logger.warning(f"Failed to create SilverKey calendar during OAuth: {str(e)}")

        # Log successful OAuth completion
        log_oauth_event("callback_success", user_id)

        # Redirect back to SPA with success indicator (dashboard hosts calendar UX; /calendar route removed)
        resp = redirect(f"{Config.FRONTEND_URL}/dashboard?google=connected")
        resp.set_cookie(
            "google_calendar_connected",
            "true",
            max_age=86400 * 7,
            secure=True,
            httponly=False,
            samesite="Lax",
        )
        return resp

    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("callback_failed", user_id, reason="exception", error=error_msg)
        logger.error(f"OAuth callback error: {error_msg}", exc_info=True)
        return SecureErrorHandler.handle_error(e, "OAuth callback failed")


@rate_limit(max_requests=10, window_seconds=60)
@validate_response(RevokeResponse)
def revoke():
    """Revoke Google OAuth access"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    if user_id is None:
        return make_response(("Unauthorized", 401))

    try:
        success = google_calendar_service.revoke_access(user_id)
        return jsonify({"success": True, "revoked": bool(success)})

    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("revoke_failed", user_id, reason="exception", error=error_msg)
        logger.error(f"Error revoking access: {error_msg}", exc_info=True)
        return SecureErrorHandler.handle_error(e, "Failed to revoke access")
