"""Checklist forms API – endpoints for forms embedded in checklist steps."""

from flask import jsonify

from app.models import ChecklistForm
from app.schemas import (
    ChecklistFormSendRequest,
    DownloadChecklistFormResponse,
    GetChecklistItemFormsResponse,
)
from app.services.auth.user_role_helpers import user_is_agent
from app.services.documents.forms_service import FormsService
from app.services.transactions.access import can_access_transaction
from app.services.transactions.lookup import get_transaction_by_id
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.db.orm_lookup import get_model
from app.utils.route.http_errors import external_unavailable, forbidden, invalid_request, not_found
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response
from logger import log

from ._errors import (
    forms_value_error_response,
    invalid_request_with_details,
    partial_step_failure,
)


def _require_agent(user):
    """Check if user is an agent, return error response if not."""
    if not user_is_agent(user):
        log.security(
            "SECURITY",
            "non_agent_checklist_forms_access",
            {"user_id": str(user.id), "has_agent_role": user_is_agent(user)},
        )
        return forbidden()
    return None


def _require_agent_manages_transaction(user, transaction_id: str):
    """Agent-only; transaction must exist and buyer must be a managed client."""
    auth_error = _require_agent(user)
    if auth_error:
        return auth_error, None
    tx = get_transaction_by_id(str(transaction_id))
    if tx is None or not can_access_transaction(user, tx):
        log.security(
            "SECURITY",
            "unauthorized_checklist_forms_transaction",
            {"user_id": str(user.id), "transaction_id": transaction_id},
        )
        return forbidden(), None
    return None, tx


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(GetChecklistItemFormsResponse)
def get_checklist_item_forms(user, transaction_id: str, section: str, item_id: str):
    """
    GET /api/v1/transactions/<tid>/checklist-items/<section>/<item_id>/forms

    Returns forms associated with a checklist step. Agent-only; clients receive
    forms via messaging attachments from the agent.
    """
    auth_error, tx = _require_agent_manages_transaction(user, transaction_id)
    if auth_error:
        return auth_error

    try:
        item_id_int = int(item_id)
    except (TypeError, ValueError):
        return invalid_request("Invalid item_id")

    transaction_start_date = None
    if tx and hasattr(tx, "start_date"):
        transaction_start_date = tx.start_date

    forms = FormsService.get_forms_for_step(section, item_id_int, transaction_start_date)

    log.info(
        "DOCUMENTS",
        "checklist_forms_fetched",
        {
            "agent_id": str(user.id),
            "transaction_id": str(tx.id) if tx else transaction_id,
            "section": section,
            "item_id": item_id_int,
            "forms_count": len(forms),
        },
    )

    return jsonify({"success": True, "forms": forms})


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(DownloadChecklistFormResponse)
def download_form(user, transaction_id: str, section: str, item_id: str, form_id: str):
    """
    GET /api/v1/transactions/<tid>/checklist-items/<section>/<item_id>/forms/<form_id>/download

    Generate a presigned download URL for a specific form. Agent-only.
    """
    auth_error, tx = _require_agent_manages_transaction(user, transaction_id)
    if auth_error:
        return auth_error

    form = get_model(ChecklistForm, form_id)
    if not form:
        return not_found()

    from app.services.documents.s3_service import s3_service

    download_url = s3_service.generate_presigned_url(
        form.s3_template_path, download_filename=f"{form.form_key}.pdf"
    )

    if not download_url:
        log.error(
            "ERRORS",
            "checklist_form_presign_failed",
            {"form_id": form_id, "s3_path": form.s3_template_path},
        )
        return external_unavailable(
            RuntimeError("presigned_url_unavailable"),
            api_name="s3",
            context={"form_id": form_id},
        )

    log.info(
        "DOCUMENTS",
        "checklist_form_downloaded",
        {
            "agent_id": str(user.id),
            "transaction_id": transaction_id,
            "section": section,
            "item_id": item_id,
            "form_id": form_id,
            "form_key": form.form_key,
        },
    )

    return jsonify({"success": True, "download_url": download_url})


@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(ChecklistFormSendRequest)
def send_form(
    user,
    transaction_id: str,
    section: str,
    item_id: str,
    form_id: str,
    data: ChecklistFormSendRequest | None = None,
):
    """
    POST /api/v1/transactions/<tid>/checklist-items/<section>/<item_id>/forms/<form_id>/send

    Send form to client via DocuSign and/or messaging.
    Agent-only endpoint.
    """
    auth_error, tx = _require_agent_manages_transaction(user, transaction_id)
    if auth_error:
        return auth_error

    form = get_model(ChecklistForm, form_id)
    if not form:
        return not_found()

    payload = data
    method = payload.method

    log.info(
        "DOCUMENTS",
        "checklist_form_send_attempt",
        {
            "agent_id": str(user.id),
            "transaction_id": transaction_id,
            "section": section,
            "item_id": item_id,
            "form_id": form_id,
            "form_key": form.form_key,
            "method": method,
        },
    )

    try:
        item_id_int = int(item_id)
    except (TypeError, ValueError):
        return invalid_request("Invalid item_id")

    if method == "messaging":
        try:
            result = FormsService.send_form_via_messaging(
                form=form,
                agent_user_id=str(user.id),
                conversation_id=payload.conversation_id,
                client_id_for_new=payload.client_id,
                optional_message=payload.message,
            )
            return jsonify({"success": True, "message_id": result["message_id"]})
        except ValueError as e:
            return forms_value_error_response(e)

    if method == "docusign":
        try:
            result = FormsService.send_form_via_docusign(
                form=form,
                agent_user_id=str(user.id),
                buyer_user_id=str(tx.buyer_id),
                section=str(section),
                item_id=item_id_int,
                optional_message=payload.message,
                transaction_id=str(tx.id),
            )
            return jsonify({"success": True, "agreement_id": result["agreement_id"]})
        except ValueError as e:
            return forms_value_error_response(e)

    partial_errors: list[dict] = []
    message_id_out = None
    agreement_id_out = None
    try:
        msg = FormsService.send_form_via_messaging(
            form=form,
            agent_user_id=str(user.id),
            conversation_id=payload.conversation_id,
            client_id_for_new=payload.client_id,
            optional_message=payload.message,
        )
        message_id_out = msg.get("message_id")
    except ValueError as e:
        partial_errors.append(partial_step_failure("messaging", e))
    try:
        ds = FormsService.send_form_via_docusign(
            form=form,
            agent_user_id=str(user.id),
            buyer_user_id=str(tx.buyer_id),
            section=str(section),
            item_id=item_id_int,
            optional_message=payload.message,
            transaction_id=str(tx.id),
        )
        agreement_id_out = ds.get("agreement_id")
    except ValueError as e:
        partial_errors.append(partial_step_failure("docusign", e))

    if message_id_out is None and agreement_id_out is None:
        return invalid_request_with_details(
            "Both messaging and DocuSign failed",
            partial_errors,
        )

    return jsonify(
        {
            "success": True,
            "message_id": message_id_out,
            "agreement_id": agreement_id_out,
            "partial_errors": partial_errors or None,
        }
    )
