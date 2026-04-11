"""Checklist forms API – endpoints for forms embedded in checklist steps."""

from flask import jsonify, request

from app.models import ChecklistForm, Transaction
from app.services.documents.forms_service import FormsService
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.security import rate_limit
from app.utils.security.app_logging import get_logger

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


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_checklist_item_forms(user, transaction_id: str, section: str, item_id: str):
    """
    GET /api/v1/transactions/<tid>/checklist-items/<section>/<item_id>/forms

    Returns forms associated with a checklist step. Visible to all authenticated
    users (agents and clients) so forms can be embedded directly in the step UI.
    """
    try:
        item_id_int = int(item_id)
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Invalid item_id"}), 400

    # Get transaction start date for deadline calculation (if transaction exists)
    transaction = Transaction.query.get(transaction_id)
    transaction_start_date = None
    if transaction and hasattr(transaction, "start_date"):
        transaction_start_date = transaction.start_date

    # Get forms for step
    forms = FormsService.get_forms_for_step(section, item_id_int, transaction_start_date)

    logger.info(
        "agent_forms",
        f"Agent {user.id} fetched forms for step {section}.{item_id}",
        {
            "transaction_id": transaction_id,
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

    Generate a presigned download URL for a specific form.
    Available to all authenticated users (agents and clients).
    """
    # Get form
    form = ChecklistForm.query.get(form_id)
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
def send_form(user, transaction_id: str, section: str, item_id: str, form_id: str):
    """
    POST /api/v1/transactions/<tid>/checklist-items/<section>/<item_id>/forms/<form_id>/send

    Send form to client via DocuSign and/or messaging.
    Agent-only endpoint.

    Request body:
    {
        "method": "docusign" | "messaging" | "both",
        "conversation_id": "uuid",  # Required if method includes "messaging"
        "participants": [{"email": "...", "name": "..."}],  # Optional for DocuSign
        "message": "Optional message text"
    }

    Returns 501 Not Implemented (stub for Phase 2).
    """
    # Agent authorization
    auth_error = _require_agent(user)
    if auth_error:
        return auth_error

    # Get form
    form = ChecklistForm.query.get(form_id)
    if not form:
        return jsonify({"success": False, "error": "Form not found"}), 404

    # Parse request
    data = request.get_json(silent=True) or {}
    method = data.get("method", "docusign")

    if method not in ["docusign", "messaging", "both"]:
        return (
            jsonify(
                {"success": False, "error": "Invalid method. Must be docusign, messaging, or both"}
            ),
            400,
        )

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

    # Stub response - Phase 2 implementation
    return (
        jsonify(
            {
                "success": False,
                "error": "Not Implemented",
                "message": "Form sending will be implemented in Phase 2. "
                "Use docusignApi.createAgreement() or send_message() directly for now.",
            }
        ),
        501,
    )
