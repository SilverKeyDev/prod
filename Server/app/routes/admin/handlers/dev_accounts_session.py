"""Admin dev-account session mint/exchange routes."""

from __future__ import annotations

from flask import request

from app.dtos.user import UserDTO
from app.schemas import SetCurrentUserDevWorkspaceRequest
from app.services.auth.dev_accounts_session import (
    exchange_dev_session_token,
    mint_dev_session_token,
)
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_error_response,
    standardize_success_response,
)
from app.utils.security.admin_roles import user_has_admin_role
from app.utils.validation import validate_request
from logger import LOG_CATEGORIES, log


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(SetCurrentUserDevWorkspaceRequest)
def mint_dev_account_session(user, data: SetCurrentUserDevWorkspaceRequest | None = None):
    """Mint a short-lived one-time token for the caller's target role dev account."""
    if not user_has_admin_role(user):
        log.security(
            LOG_CATEGORIES["SECURITY"],
            "Unauthorized dev-account session mint attempt",
            {"user_id": getattr(user, "id", None)},
        )
        return standardize_error_response(
            "Admin access required", status_code=403, error_code="admin_forbidden"
        )

    if data is None:
        return standardize_error_response(
            "workspace is required", status_code=400, error_code="validation_error"
        )

    try:
        token, target = mint_dev_session_token(user, data.workspace)
    except PermissionError as exc:
        return standardize_error_response(str(exc), status_code=403, error_code=str(exc))

    return standardize_success_response(
        {
            "token": token,
            "role": data.workspace.value,
            "user": UserDTO.to_response(target, include_roles=True),
        }
    )


@handle_exceptions_with_logging
def exchange_dev_account_session():
    """Exchange and consume a one-time dev session token for a tab-scoped bearer session."""
    data = request.get_json(silent=True) or {}
    token = data.get("token")
    if not isinstance(token, str) or not token.strip():
        return standardize_error_response(
            "token is required", status_code=400, error_code="validation_error"
        )

    try:
        target, access_token, id_token = exchange_dev_session_token(token.strip())
    except PermissionError as exc:
        return standardize_error_response(str(exc), status_code=403, error_code=str(exc))

    user_payload = UserDTO.to_response(target, include_roles=True)
    return standardize_success_response(
        {
            "user": {
                "auth_user_kind": "session",
                "email": target.email,
                "user_sub": target.cognito_id or str(target.id),
                "name": target.name,
                "id": str(target.id),
                "phone": target.phone,
                "is_agent": bool(target.is_agent),
                "auth_method": "dev_session",
                "roles": user_payload.get("roles"),
                "brokerage_org_ids": user_payload.get("brokerage_org_ids"),
            },
            "user_sub": target.cognito_id or str(target.id),
            "access_token": access_token,
            "id_token": id_token,
            "verification_complete": True,
        }
    )
