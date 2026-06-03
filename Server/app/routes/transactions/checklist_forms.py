"""Checklist forms API – endpoints for forms embedded in checklist steps."""

from flask import jsonify, request
from pydantic import ValidationError

from app.models import ChecklistForm
from app.schemas import ChecklistFormSendRequest
from app.services.documents.forms_service import FormsService
from app.services.transactions.access import can_access_transaction
from app.services.transactions.lookup import get_transaction_by_id
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.db.orm_lookup import get_model
from app.utils.security import rate_limit
from app.utils.security.app_logging import get_logger
from app.utils.validation import validate_request

logger = get_logger()


def _require_agent(user):
    """Check if user is an agent, return error response if not."""
    if not user.is_agent:
        logger.security(
            "security",
            "Non-agent attempted to access agent-only forms endpoint",
            {"user_id": user.id, "is_agent": user.is_agent},
        )
        return jsonify({"success": False, "error": "Unauthorized - agent access required"}), 403
    return None


def _require_agent_manages_transaction(user, transaction_id: str):
    """Agent-only; transaction must exist and buyer must be a managed client."""
    auth_error = _require_agent(user)
    if auth_error:
        return auth_error, None
    tx = get_transaction_by_id(str(transaction_id))
    if tx is None or not can_access_transaction(user, tx):
        logger.security(
            "security",
            "Agent attempted checklist forms access for unauthorized transaction",
            {"user_id": user.id, "transaction_id": transaction_id},
        )
        return jsonify({"success": False, "error": "Access denied"}), 403, None
    return None, tx


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
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
        return jsonify({"success": False, "error": "Invalid item_id"}), 400

    transaction_start_date = None
    if tx and hasattr(tx, "start_date"):
        transaction_start_date = tx.start_date

    forms = FormsService.get_forms_for_step(section, item_id_int, transaction_start_date)

    logger.info(
        "agent_forms",
        f"Agent {user.id} fetched forms for step {section}.{item_id}",
        {
            "transaction_id": tx.id if tx else transaction_id,
            "section": section,
            "item_id": item_id_int,
            "forms_count": len(forms),
        },
    )

    return jsonify({"success": True, "forms": forms})


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
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
        return jsonify({"success": False, "error": "Form not found"}), 404

    # Generate presigned URL
    from app.services.documents.s3_service import s3_service

    download_url = s3_service.generate_presigned_url(
        form.s3_template_path, download_filename=f"{form.form_key}.pdf"
    )

    if not download_url:
        logger.error(
            "errors",
            f"Failed to generate presigned URL for form {form_id}",
            {"form_id": form_id, "s3_path": form.s3_template_path},
        )
        return (
            jsonify({"success": False, "error": "Failed to generate download URL"}),
            500,
        )

    logger.info(
        "agent_forms",
        f"Agent {user.id} downloaded form {form.form_key}",
        {
            "transaction_id": transaction_id,
            "section": section,
            "item_id": item_id,
            "form_id": form_id,
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

    Request body:
    {
        "method": "docusign" | "messaging" | "both",
        "conversation_id": "uuid" | "new",  # Required for messaging; use client_id if "new"
        "client_id": "uuid",  # Required when conversation_id is "new"
        "participants": [{"email": "...", "name": "..."}],  # Optional for DocuSign
        "message": "Optional message text"
    }

    `messaging` sends a chat message with a checklist_form attachment (presigned URL).
    `docusign` creates an agreement from the PDF and sends for signature (email).
    `both` runs messaging then DocuSign; returns partial success if one leg fails.
    """
    # Agent authorization
    auth_error, tx = _require_agent_manages_transaction(user, transaction_id)
    if auth_error:
        return auth_error

    # Get form
    form = get_model(ChecklistForm, form_id)
    if not form:
        return jsonify({"success": False, "error": "Form not found"}), 404

    if data is None:
        try:
            payload = ChecklistFormSendRequest.model_validate(request.get_json(silent=True) or {})
        except ValidationError as exc:
            return jsonify(
                {"success": False, "error": "Invalid request", "details": exc.errors()}
            ), 400
    else:
        payload = data

    method = payload.method

    logger.info(
        "agent_forms",
        f"Agent {user.id} attempted to send form {form.form_key} via {method}",
        {
            "transaction_id": transaction_id,
            "section": section,
            "item_id": item_id,
            "form_id": form_id,
            "method": method,
        },
    )

    try:
        item_id_int = int(item_id)
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Invalid item_id"}), 400

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
            return jsonify({"success": False, "error": str(e)}), 400

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
            return jsonify({"success": False, "error": str(e)}), 400

    # both
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
        partial_errors.append({"step": "messaging", "error": str(e)})
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
        partial_errors.append({"step": "docusign", "error": str(e)})

    if message_id_out is None and agreement_id_out is None:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Both messaging and DocuSign failed",
                    "details": partial_errors,
                }
            ),
            400,
        )

    return jsonify(
        {
            "success": True,
            "message_id": message_id_out,
            "agreement_id": agreement_id_out,
            "partial_errors": partial_errors or None,
        }
    )
