"""
OAuth flow endpoints for Google Calendar
"""

from flask import jsonify, make_response, redirect, request, session

from app.config import Config
from app.schemas import EmptyRequest, RevokeResponse
from app.services.calendar.core import (
    get_authenticated_user_id,
    google_calendar_service,
)
from app.services.calendar.permissions import get_permission_scope_map
from app.services.calendar.permissions.constants import (
    permissions as calendar_permissions_constants,
)
from app.utils.route import http_errors
from app.utils.security.security import log_oauth_event, rate_limit
from app.utils.validation import validate_request, validate_response
from logger import log

_PERMISSION_NAMES_EXCLUDED_FROM_OAUTH = frozenset(
    name
    for name, data in calendar_permissions_constants.items()
    if not data.get("include_in_oauth_request", True)
)


@rate_limit(max_requests=10, window_seconds=60)
def oauth_start():
    """Start Google OAuth flow with incremental authorization."""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        log_oauth_event("start_failed", None, reason="auth_error", error="authentication_failed")
        return error_response
    if user_id is None:
        return make_response(("Unauthorized", 401))

    # Generate auth URL and state
    auth_url, state = google_calendar_service.build_auth_url(user_id)
    # Use separate session key for calendar flow to avoid conflicts with auth OAuth
    session["google_calendar_oauth_state"] = state

    return redirect(auth_url)


@rate_limit(max_requests=10, window_seconds=60)
def oauth_enhance():
    """Request additional Google Calendar permissions (incremental authorization)

    Query params:
        permissions: Comma-separated list of permission names to request (e.g., "calendar_freebusy")

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
        return http_errors.validation(
            "permissions parameter is required (comma-separated list)",
            field_errors={"permissions": "Required"},
        )

    # Parse permission names
    permission_names = [p.strip() for p in permissions_param.split(",") if p.strip()]

    not_requestable = [p for p in permission_names if p in _PERMISSION_NAMES_EXCLUDED_FROM_OAUTH]
    if not_requestable:
        return http_errors.validation(
            "These permissions cannot be requested via OAuth (use a normal calendar reconnect)",
            field_errors={"permissions": ", ".join(not_requestable)},
        )

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
        return http_errors.validation(
            f"Invalid permission names: {', '.join(invalid_permissions)}",
            field_errors={"permissions": "Unknown permission name"},
        )

    if not requested_scopes:
        return http_errors.validation("No valid permissions to request")

    # Generate auth URL with only the additional scopes
    # include_granted_scopes will preserve existing permissions
    auth_url, state = google_calendar_service.build_auth_url(
        user_id,
        request_additional_scopes=requested_scopes,
    )

    # Use separate session key for calendar flow
    session["google_calendar_oauth_state"] = state

    return redirect(auth_url)


@rate_limit(max_requests=20, window_seconds=60)
def oauth_callback():
    """Handle Google OAuth callback"""
    state = request.args.get("state")
    code = request.args.get("code")
    error = request.args.get("error")

    if state is None:
        return http_errors.validation("Missing state", field_errors={"state": "Required"})
    if code is None:
        return http_errors.validation("Missing code", field_errors={"code": "Required"})

    # Handle OAuth errors
    if error:
        return http_errors.validation("OAuth authorization was denied or failed")

    user_id = google_calendar_service.validate_state_and_get_user_id(state)
    if user_id is None:
        log_oauth_event("callback_failed", None, reason="invalid_state")
        return http_errors.validation("Invalid OAuth state")

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
                log.warn(
                    "CALENDAR",
                    "oauth_silverkey_calendar_create_failed",
                    {"user_id": str(user_id), "error": str(e)},
                )

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
        log_oauth_event("callback_failed", user_id, reason="exception")
        log.error("CALENDAR", "oauth_callback_error", e)
        return http_errors.external_unavailable(
            e, api_name="Google OAuth", context={"operation": "oauth_callback"}
        )


@rate_limit(max_requests=10, window_seconds=60)
@validate_request(EmptyRequest)
@validate_response(RevokeResponse)
def revoke(data: EmptyRequest | None = None):
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
        log_oauth_event("revoke_failed", user_id, reason="exception")
        log.error("CALENDAR", "oauth_revoke_error", e)
        return http_errors.external_unavailable(
            e, api_name="Google OAuth", context={"operation": "oauth_revoke"}
        )
