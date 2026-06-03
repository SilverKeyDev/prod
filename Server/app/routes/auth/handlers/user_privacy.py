"""Self-service account deletion and data export."""

from __future__ import annotations

from typing import TYPE_CHECKING

from flask import Response, jsonify

from app.schemas import DeleteMyAccountRequest, DeleteUserResponse, UserDataExportResponse
from app.services.auth import build_user_data_export, delete_user_and_all_related_data
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    server_error,
    standardize_success_response,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response
from logger import log

if TYPE_CHECKING:
    from app.models.user import User


@rate_limit(max_requests=3, window_seconds=3600)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(DeleteMyAccountRequest)
@validate_response(DeleteUserResponse)
def delete_my_account(
    user: User, data: DeleteMyAccountRequest | None = None
) -> Response | tuple[Response, int]:
    """Hard-delete the authenticated user (same data purge as the admin path)."""
    uid = str(user.id)
    ok = delete_user_and_all_related_data(uid)
    if not ok:
        return server_error(
            RuntimeError("account_delete_failed"),
            context={"function": "delete_my_account", "user_id": uid},
        )

    log.info(
        "API",
        "Self-service user account deleted",
        {"deleted_user_id": uid},
    )
    return standardize_success_response(
        {"deleted_user_id": uid},
        message="User and related data deleted",
    )


@rate_limit(max_requests=20, window_seconds=3600)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(UserDataExportResponse)
def export_user_data(user: User) -> Response | tuple[Response, int]:
    """Return a machine-readable copy of the user's account-related data."""
    payload = build_user_data_export(user)
    return jsonify({"success": True, "message": None, "error": None, "data": payload})
