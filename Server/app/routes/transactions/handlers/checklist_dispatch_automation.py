"""GET/PUT checklist dispatch automation settings (agent-only)."""

from flask import jsonify

from app.schemas import (
    ChecklistDispatchAutomationApiResponse,
    ChecklistDispatchNoteMode,
    ChecklistDispatchRecipientScope,
    UpdateChecklistDispatchAutomationRequest,
)
from app.services.agent.client_service import get_agent_client_ids
from app.services.transactions.checklist_dispatch_automation import (
    item_supports_dispatch_automation,
)
from app.services.transactions.dispatch_settings import (
    defaults_setting,
    get_dispatch_setting_row,
    row_to_setting_model,
    upsert_dispatch_setting,
)
from app.services.transactions.lookup import get_transaction_by_id
from app.services.transactions.retrieval import VALID_CATEGORIES
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.route.http_errors import forbidden, invalid_request
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response

from .checklist_forms import _require_agent


def _require_agent_transaction(user, transaction_id: str):
    auth_error = _require_agent(user)
    if auth_error:
        return auth_error, None
    tx = get_transaction_by_id(str(transaction_id))
    if tx is None:
        return forbidden(), None
    if str(tx.buyer_id) not in set(get_agent_client_ids(str(user.id))):
        return forbidden(), None
    return None, tx


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_checklist_dispatch_automation(user, transaction_id: str, section: str, item_id: str):
    auth_error, tx = _require_agent_transaction(user, transaction_id)
    if auth_error:
        return auth_error
    assert tx is not None

    if section not in VALID_CATEGORIES:
        return invalid_request("Invalid checklist section")

    try:
        item_id_int = int(item_id)
    except (TypeError, ValueError):
        return invalid_request("Invalid item_id")

    if not item_supports_dispatch_automation(section, item_id_int):
        return invalid_request("Dispatch automation is not available for this step")

    row = get_dispatch_setting_row(
        agent_user_id=str(user.id),
        transaction_id=str(tx.id),
        category=str(section),
        item_id=item_id_int,
    )

    setting = row_to_setting_model(row) if row else defaults_setting()
    body = ChecklistDispatchAutomationApiResponse(
        success=True, error=None, setting=setting
    ).model_dump(mode="json")
    return jsonify(body)


@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(UpdateChecklistDispatchAutomationRequest)
@validate_response(ChecklistDispatchAutomationApiResponse)
def put_checklist_dispatch_automation(
    user,
    transaction_id: str,
    section: str,
    item_id: str,
    data: UpdateChecklistDispatchAutomationRequest,
):
    auth_error, tx = _require_agent_transaction(user, transaction_id)
    if auth_error:
        return auth_error
    assert tx is not None

    if section not in VALID_CATEGORIES:
        return invalid_request("Invalid checklist section")

    try:
        item_id_int = int(item_id)
    except (TypeError, ValueError):
        return invalid_request("Invalid item_id")

    if not item_supports_dispatch_automation(section, item_id_int):
        return invalid_request("Dispatch automation is not available for this step")

    if data.recipientScope == ChecklistDispatchRecipientScope.selected_clients and (
        not data.selectedClientIds or len(data.selectedClientIds) == 0
    ):
        return invalid_request(
            "selectedClientIds is required when recipientScope is selected_clients"
        )

    allowed = set(get_agent_client_ids(str(user.id)))
    if data.recipientScope == ChecklistDispatchRecipientScope.selected_clients:
        for cid in data.selectedClientIds or []:
            if str(cid) not in allowed:
                return invalid_request("Invalid client id")

    if data.noteMode == ChecklistDispatchNoteMode.per_client and data.notesPerClient:
        for cid in data.notesPerClient:
            if str(cid) not in allowed:
                return invalid_request("Invalid client id in notes")

    out_setting = upsert_dispatch_setting(
        agent_user_id=str(user.id),
        transaction=tx,
        category=str(section),
        item_id=item_id_int,
        data=data,
    )

    return jsonify(
        ChecklistDispatchAutomationApiResponse(
            success=True, error=None, setting=out_setting
        ).model_dump(mode="json")
    )
