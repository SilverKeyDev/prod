"""Admin dev-account session mint/exchange routes."""

from __future__ import annotations

from app.dtos.user import UserDTO
from app.schemas import ExchangeDevAccountSessionRequest, SetCurrentUserDevWorkspaceRequest
from app.services.auth.dev_accounts_session import (
    exchange_dev_session_token,
    mint_dev_session_token,
)
from app.services.auth.user_role_helpers import user_is_agent
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_error_response,
    standardize_success_response,
)
from app.utils.security.admin_roles import user_has_admin_role
from app.utils.validation import validate_request
from logger import log


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(SetCurrentUserDevWorkspaceRequest)
def mint_dev_account_session(user, data: SetCurrentUserDevWorkspaceRequest | None = None):
    """Mint a short-lived one-time token for the caller's target role dev account."""
    if not user_has_admin_role(user):
        log.security(
            "SECURITY",
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
@validate_request(ExchangeDevAccountSessionRequest)
def exchange_dev_account_session(data: ExchangeDevAccountSessionRequest):
    """Exchange and consume a one-time dev session token for a tab-scoped bearer session."""
    try:
        target, access_token, id_token = exchange_dev_session_token(data.token.strip())
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
                "is_agent": user_is_agent(target),
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
