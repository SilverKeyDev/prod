"""Admin-only endpoint to hard-delete a user and related application data."""

from app.schemas import DeleteUserRequest, DeleteUserResponse
from app.services.auth import delete_user_and_all_related_data
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_success_response,
)
from app.utils.security.admin_roles import user_has_super_admin_role
from app.utils.validation import validate_request, validate_response
from logger import log

from ._errors import authorization_denied, not_found, super_admin_access_denied, validation


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(DeleteUserRequest)
@validate_response(DeleteUserResponse)
def delete_user_account(user, data: DeleteUserRequest):
    """
    Permanently delete a user by primary key (users.id).

    JSON body: ``user_id`` (string), ``confirm`` (must be ``true``).
    """
    if not user_has_super_admin_role(user):
        log.security(
            "SECURITY",
            "Unauthorized admin delete user attempt",
            {"actor_id": getattr(user, "id", None)},
        )
        return super_admin_access_denied()

    if data.confirm is not True:
        return validation('confirm must be true (JSON boolean). Send {"confirm": true}')
    target_id = data.user_id

    if not isinstance(target_id, str) or not target_id.strip():
        return validation("user_id must be a non-empty string")

    target_id = target_id.strip()
    actor_id = str(getattr(user, "id", "") or "")

    if target_id == actor_id:
        return authorization_denied(
            "You cannot delete your own account from this endpoint",
        )

    deleted = delete_user_and_all_related_data(target_id)

    if not deleted:
        return not_found("User not found")

    log.security(
        "SECURITY",
        "Admin deleted user account",
        {"deleted_user_id": target_id, "actor_id": actor_id},
    )

    return standardize_success_response(
        {"deleted_user_id": target_id},
        message="User and related data deleted",
    )
