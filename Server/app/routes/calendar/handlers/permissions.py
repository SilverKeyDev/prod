"""
Permission management endpoints for Google Calendar
"""

from flask import jsonify, request
from sqlalchemy import select

from app import db
from app.models import GoogleOAuthToken
from app.schemas import EmptyRequest, GoogleCalendarPermissionsResponse
from app.services.calendar.core import get_authenticated_user_id
from app.services.calendar.permissions import (
    PERMISSION_DESCRIPTIONS,
    PERMISSIONS,
    check_permission,
    get_permission_scope_map,
    get_scopes_from_tokeninfo,
    update_token_permissions_from_scopes,
)
from app.utils.route import http_errors
from app.utils.security.security import rate_limit
from app.utils.validation import validate_request, validate_response
from logger import log


def _permissions_payload_from_token(token_record: GoogleOAuthToken) -> dict:
    permissions: dict = {}
    uid = token_record.user_id
    for perm_name, perm_field in PERMISSIONS.items():
        if perm_field is None:
            granted = check_permission(uid, perm_name)
        else:
            granted = getattr(token_record, perm_field, False)
        permissions[perm_name] = {
            "granted": granted,
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
        token_record = db.session.scalar(
            select(GoogleOAuthToken).where(GoogleOAuthToken.user_id == user_id)
        )

        if not token_record:
            return http_errors.not_found(
                "Google Calendar is not connected. Please connect your account first."
            )

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
        log.error("CALENDAR", "permissions_read_error", e)
        return http_errors.server_error(
            e, context={"operation": "get_calendar_permissions", "user_id": user_id}
        )


@rate_limit(max_requests=50, window_seconds=60)
@validate_request(EmptyRequest)
@validate_response(GoogleCalendarPermissionsResponse)
def put_calendar_permissions(data: EmptyRequest | None = None):
    """Update permissions from stored scopes (backfill / after OAuth)."""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response

    try:
        token_record = db.session.scalar(
            select(GoogleOAuthToken).where(GoogleOAuthToken.user_id == user_id)
        )

        if not token_record:
            return http_errors.not_found(
                "Google Calendar is not connected. Please connect your account first."
            )

        verify_from_token = request.args.get("verify", "false").lower() == "true"

        if verify_from_token:
            actual_scopes = get_scopes_from_tokeninfo(token_record.access_token)
            if actual_scopes:
                token_record.scopes = actual_scopes
                log.info(
                    "CALENDAR",
                    "permissions_scopes_from_tokeninfo",
                    {"user_id": str(user_id), "scope_count": len(actual_scopes)},
                )
            else:
                log.warn("CALENDAR", "permissions_tokeninfo_failed", {"user_id": str(user_id)})

        update_token_permissions_from_scopes(token_record, token_record.scopes)
        db.session.commit()

        permissions = _permissions_payload_from_token(token_record)

        log.info("CALENDAR", "permissions_updated_from_stored", {"user_id": str(user_id)})

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
        log.error("CALENDAR", "permissions_update_error", e)
        return http_errors.server_error(
            e, context={"operation": "put_calendar_permissions", "user_id": user_id}
        )
