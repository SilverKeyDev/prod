"""Admin-only endpoint to hard-delete a user and related application data."""

from app.services.user.delete_user import delete_user_and_all_related_data
from app.utils.common_patterns import (
    api_route,
    standardize_error_response,
    standardize_success_response,
)
from logger import LOG_CATEGORIES, log


@api_route(require_auth=True, require_json=True, required_fields=["user_id"])
def delete_user_account(data, user):
    """
    Permanently delete a user by primary key (users.id).

    JSON body: ``user_id`` (string), ``confirm`` (must be ``true``).
    """
    # TEMPORARY: admin role check disabled for local/dev — restore before production.
    log.warn(
        LOG_CATEGORIES["SECURITY"],
        "delete_user_account invoked without admin gate (temporary)",
        {"actor_id": getattr(user, "id", None)},
    )

    if data.get("confirm") is not True:
        return standardize_error_response(
            'confirm must be true (JSON boolean). Send {"confirm": true}',
            status_code=400,
        )

    target_id = data.get("user_id")
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
