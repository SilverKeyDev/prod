"""Admin-only endpoint to hard-delete a user and related application data."""

from flask import request

from app.schemas import DeleteUserRequest, DeleteUserResponse
from app.services.auth import delete_user_and_all_related_data
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_error_response,
    standardize_success_response,
)
from app.utils.security.admin_roles import user_has_super_admin_role
from app.utils.validation import validate_request, validate_response
from logger import LOG_CATEGORIES, log


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(DeleteUserRequest)
@validate_response(DeleteUserResponse)
def delete_user_account(user, data: DeleteUserRequest | None = None):
    """
    Permanently delete a user by primary key (users.id).

    JSON body: ``user_id`` (string), ``confirm`` (must be ``true``).
    """
    if not user_has_super_admin_role(user):
        log.security(
            LOG_CATEGORIES["SECURITY"],
            "Unauthorized admin delete user attempt",
            {"actor_id": getattr(user, "id", None)},
        )
        return standardize_error_response("Super admin access required", status_code=403)

    if data is None:
        request_data = request.get_json(silent=True) or {}
        if request_data.get("confirm") is not True:
            return standardize_error_response(
                'confirm must be true (JSON boolean). Send {"confirm": true}',
                status_code=400,
            )
        target_id = request_data.get("user_id")
    else:
        if data.confirm is not True:
            return standardize_error_response(
                'confirm must be true (JSON boolean). Send {"confirm": true}',
                status_code=400,
            )
        target_id = data.user_id

    if not isinstance(target_id, str) or not target_id.strip():
        return standardize_error_response("user_id must be a non-empty string", status_code=400)

    target_id = target_id.strip()
    actor_id = str(getattr(user, "id", "") or "")

    if target_id == actor_id:
        return standardize_error_response(
            "You cannot delete your own account from this endpoint", status_code=403
        )

    deleted = delete_user_and_all_related_data(target_id)

    if not deleted:
        return standardize_error_response("User not found", status_code=404)

    log.security(
        LOG_CATEGORIES["SECURITY"],
        "Admin deleted user account",
        {"deleted_user_id": target_id, "actor_id": actor_id},
    )

    return standardize_success_response(
        {"deleted_user_id": target_id},
        message="User and related data deleted",
    )
