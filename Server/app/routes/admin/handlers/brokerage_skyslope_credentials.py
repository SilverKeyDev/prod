"""Admin CRUD for per-brokerage SkySlope credentials (SIL-270)."""

from __future__ import annotations

from app.schemas import (
    BrokerageSkySlopeCredentialCreateRequest,
    BrokerageSkySlopeCredentialResponse,
    BrokerageSkySlopeCredentialTestResponse,
    BrokerageSkySlopeCredentialUpdateRequest,
    EmptyRequest,
)
from app.services.skyslope.credentials import (
    create_skyslope_credential,
    delete_skyslope_credential,
    get_credential_metadata,
    test_skyslope_credential,
    update_skyslope_credential,
)
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_error_response,
    standardize_success_response,
)
from app.utils.route import not_found
from app.utils.security.admin_roles import user_has_admin_role
from app.utils.validation import validate_request, validate_response
from logger import log

from ._errors import admin_access_denied


def _require_admin(user):
    if not user_has_admin_role(user):
        log.security(
            "SECURITY",
            "Unauthorized SkySlope credential admin access",
            {"user_id": getattr(user, "id", None)},
        )
        return admin_access_denied()
    return None


def _audit(actor_id: str | None, brokerage_id: str, action: str) -> None:
    log.info(
        "SECURITY",
        f"SkySlope credential {action}",
        {
            "actor_id": actor_id,
            "brokerage_id": brokerage_id,
            "provider": "skyslope",
        },
    )


def _enqueue_skyslope_full_sync(brokerage_id: str) -> None:
    """Fire-and-forget bulk import after credentials are stored."""
    from app.celery.tasks.skyslope import sync_brokerage_transactions_task

    sync_brokerage_transactions_task.delay(brokerage_id, full=True)


@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(BrokerageSkySlopeCredentialResponse)
def get_brokerage_skyslope_credential(user, brokerage_id: str):
    denied = _require_admin(user)
    if denied:
        return denied
    row = get_credential_metadata(brokerage_id)
    if not row:
        return not_found()
    return standardize_success_response({"data": row})


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(BrokerageSkySlopeCredentialCreateRequest)
@validate_response(BrokerageSkySlopeCredentialResponse)
def create_brokerage_skyslope_credential(
    user, brokerage_id: str, data: BrokerageSkySlopeCredentialCreateRequest
):
    denied = _require_admin(user)
    if denied:
        return denied
    payload = data.model_dump(mode="json", warnings=False)
    row, err = create_skyslope_credential(
        brokerage_id,
        api_key=payload["api_key"],
        skyslope_org_id=payload.get("skyslope_org_id"),
    )
    if err == "not_found":
        return not_found()
    if err == "already_exists":
        return standardize_error_response(
            "SkySlope credentials already exist for this brokerage",
            status_code=409,
            error_code="conflict",
        )
    if err == "api_key_required":
        return standardize_error_response(
            "api_key is required",
            status_code=400,
            error_code="validation_error",
        )
    if err == "encryption_unavailable":
        return standardize_error_response(
            "Credential encryption is not configured",
            status_code=503,
            error_code="configuration_unavailable",
        )
    _audit(getattr(user, "id", None), brokerage_id, "created")
    _enqueue_skyslope_full_sync(brokerage_id)
    return standardize_success_response({"data": row}, status_code=201)


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(BrokerageSkySlopeCredentialUpdateRequest)
@validate_response(BrokerageSkySlopeCredentialResponse)
def update_brokerage_skyslope_credential(
    user, brokerage_id: str, data: BrokerageSkySlopeCredentialUpdateRequest
):
    denied = _require_admin(user)
    if denied:
        return denied
    payload = data.model_dump(mode="json", exclude_none=True, warnings=False)
    row, err = update_skyslope_credential(
        brokerage_id,
        api_key=payload.get("api_key"),
        skyslope_org_id=payload.get("skyslope_org_id"),
        status=payload.get("status"),
    )
    if err == "not_found":
        return not_found()
    if err == "api_key_required":
        return standardize_error_response(
            "api_key cannot be empty",
            status_code=400,
            error_code="validation_error",
        )
    if err == "invalid_status":
        return standardize_error_response(
            "Invalid credential status",
            status_code=400,
            error_code="validation_error",
        )
    if err == "encryption_unavailable":
        return standardize_error_response(
            "Credential encryption is not configured",
            status_code=503,
            error_code="configuration_unavailable",
        )
    _audit(getattr(user, "id", None), brokerage_id, "updated")
    return standardize_success_response({"data": row})


@handle_exceptions_with_logging
@require_authenticated_user
def delete_brokerage_skyslope_credential(user, brokerage_id: str):
    denied = _require_admin(user)
    if denied:
        return denied
    if not delete_skyslope_credential(brokerage_id):
        return not_found()
    _audit(getattr(user, "id", None), brokerage_id, "deleted")
    return standardize_success_response(message="SkySlope credentials deleted")


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(EmptyRequest)
@validate_response(BrokerageSkySlopeCredentialTestResponse)
def test_brokerage_skyslope_connection(user, brokerage_id: str, data: EmptyRequest | None = None):
    denied = _require_admin(user)
    if denied:
        return denied
    success, message = test_skyslope_credential(brokerage_id)
    if not success and message.startswith("SkySlope credentials are not configured"):
        return not_found()
    if success:
        _audit(getattr(user, "id", None), brokerage_id, "test_connection_succeeded")
    return standardize_success_response({"success": success, "message": message})


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(EmptyRequest)
def trigger_brokerage_skyslope_sync(user, brokerage_id: str, data: EmptyRequest | None = None):
    denied = _require_admin(user)
    if denied:
        return denied
    if not get_credential_metadata(brokerage_id):
        return not_found()

    _enqueue_skyslope_full_sync(brokerage_id)
    _audit(getattr(user, "id", None), brokerage_id, "sync_enqueued")
    return standardize_success_response(
        {"message": "SkySlope sync enqueued", "brokerage_id": brokerage_id},
        status_code=202,
    )
