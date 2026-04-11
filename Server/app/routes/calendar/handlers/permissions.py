"""
Permission management endpoints for Google Calendar
"""

from flask import jsonify, request

from app import db
from app.models import GoogleOAuthToken
from app.schemas import GoogleCalendarPermissionsResponse
from app.services.calendar.core import get_authenticated_user_id
from app.services.calendar.permissions import (
    PERMISSION_DESCRIPTIONS,
    PERMISSIONS,
    get_permission_scope_map,
    get_scopes_from_tokeninfo,
    update_token_permissions_from_scopes,
)
from app.utils.security.app_logging import get_logger
from app.utils.security.security import (
    rate_limit,
    sanitize_error_message,
)
from app.utils.validation import validate_response

logger = get_logger()


def _permissions_payload_from_token(token_record: GoogleOAuthToken) -> dict:
    permissions: dict = {}
    for perm_name, perm_field in PERMISSIONS.items():
        permissions[perm_name] = {
            "granted": getattr(token_record, perm_field, False),
            "description": PERMISSION_DESCRIPTIONS.get(perm_name, ""),
            "scope": get_permission_scope_map().get(perm_name, ""),
        }
    return permissions


@rate_limit(max_requests=50, window_seconds=60)
def get_calendar_permissions():
    """Return current Google Calendar permission status for the user."""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response

    try:
        token_record = GoogleOAuthToken.query.filter_by(user_id=user_id).first()

        if not token_record:
            return jsonify(
                {
                    "success": False,
                    "error": "not_connected",
                    "message": "Google Calendar is not connected. Please connect your account first.",
                    "reconnect_url": "/api/v1/google-calendar/oauth/start",
                }
            ), 404

        permissions = _permissions_payload_from_token(token_record)

        return jsonify(
            {
                "success": True,
                "data": {
                    "permissions": permissions,
                    "scopes": token_record.scopes,
                    "last_updated": token_record.updated_at.isoformat()
                    if token_record.updated_at
                    else None,
                },
            }
        )

    except Exception as e:
        error_msg = sanitize_error_message(e)
        logger.error(f"Error managing permissions for user {user_id}: {error_msg}", exc_info=True)
        return jsonify(
            {
                "success": False,
                "error": "permission_update_failed",
                "message": f"Failed to manage permissions: {error_msg}",
            }
        ), 500


@rate_limit(max_requests=50, window_seconds=60)
@validate_response(GoogleCalendarPermissionsResponse)
def put_calendar_permissions():
    """Update permissions from stored scopes (backfill / after OAuth)."""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response

    try:
        token_record = GoogleOAuthToken.query.filter_by(user_id=user_id).first()

        if not token_record:
            return jsonify(
                {
                    "success": False,
                    "error": "not_connected",
                    "message": "Google Calendar is not connected. Please connect your account first.",
                    "reconnect_url": "/api/v1/google-calendar/oauth/start",
                }
            ), 404

        verify_from_token = request.args.get("verify", "false").lower() == "true"

        if verify_from_token:
            actual_scopes = get_scopes_from_tokeninfo(token_record.access_token)
            if actual_scopes:
                token_record.scopes = actual_scopes
                logger.info(f"Updated scopes from tokeninfo for user {user_id}: {actual_scopes}")
            else:
                logger.warning(f"Tokeninfo failed for user {user_id}, using stored scopes")

        update_token_permissions_from_scopes(token_record, token_record.scopes)
        db.session.commit()

        permissions = _permissions_payload_from_token(token_record)

        logger.info(f"Updated permissions for user {user_id} from stored scopes")

        return jsonify(
            {
                "permissions": permissions,
                "scopes": token_record.scopes,
                "last_updated": token_record.updated_at.isoformat()
                if token_record.updated_at
                else None,
            }
        )

    except Exception as e:
        error_msg = sanitize_error_message(e)
        logger.error(f"Error managing permissions for user {user_id}: {error_msg}", exc_info=True)
        return jsonify(
            {
                "success": False,
                "error": "permission_update_failed",
                "message": f"Failed to manage permissions: {error_msg}",
            }
        ), 500
