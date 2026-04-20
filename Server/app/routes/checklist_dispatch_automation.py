"""GET/PUT checklist dispatch automation settings (agent-only)."""

from flask import jsonify

from app import db
from app.models import ChecklistItemDispatchSetting
from app.schemas import (
    ChecklistDispatchAutomationApiResponse,
    ChecklistDispatchAutomationSetting,
    ChecklistDispatchChannel,
    ChecklistDispatchNoteMode,
    ChecklistDispatchRecipientScope,
    UpdateChecklistDispatchAutomationRequest,
)
from app.services.agent.client_service import get_agent_client_ids
from app.services.transactions.checklist_dispatch_automation import (
    item_supports_dispatch_automation,
)
from app.services.transactions.retrieval import VALID_CATEGORIES
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response

from .checklist_forms import _require_agent


def _agent_manages_client(agent_user_id: str, client_id: str) -> bool:
    return str(client_id) in set(get_agent_client_ids(str(agent_user_id)))


def _row_to_setting_model(row: ChecklistItemDispatchSetting) -> ChecklistDispatchAutomationSetting:
    return ChecklistDispatchAutomationSetting(
        enabled=row.enabled,
        channel=ChecklistDispatchChannel(row.channel),
        recipientScope=ChecklistDispatchRecipientScope(row.recipient_scope),
        selectedClientIds=row.selected_client_ids,
        noteMode=ChecklistDispatchNoteMode(row.note_mode),
        noteBroadcast=row.note_broadcast,
        notesPerClient=row.notes_per_client if isinstance(row.notes_per_client, dict) else None,
        updatedAt=row.updated_at,
    )


def _defaults_setting() -> ChecklistDispatchAutomationSetting:
    return ChecklistDispatchAutomationSetting(
        enabled=False,
        channel=ChecklistDispatchChannel.messaging,
        recipientScope=ChecklistDispatchRecipientScope.context_client,
        selectedClientIds=None,
        noteMode=ChecklistDispatchNoteMode.none,
        noteBroadcast=None,
        notesPerClient=None,
        updatedAt=None,
    )


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_checklist_dispatch_automation(user, transaction_id: str, section: str, item_id: str):
    auth_error = _require_agent(user)
    if auth_error:
        return auth_error

    if section not in VALID_CATEGORIES:
        return jsonify({"success": False, "error": "Invalid checklist section"}), 400

    try:
        item_id_int = int(item_id)
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Invalid item_id"}), 400

    if not item_supports_dispatch_automation(section, item_id_int):
        return jsonify(
            {"success": False, "error": "Dispatch automation is not available for this step"}
        ), 400

    if not _agent_manages_client(str(user.id), str(transaction_id)):
        return jsonify({"success": False, "error": "Access denied"}), 403

    row = ChecklistItemDispatchSetting.query.filter_by(
        agent_user_id=str(user.id),
        client_user_id=str(transaction_id),
        category=str(section),
        item_id=item_id_int,
    ).first()

    setting = _row_to_setting_model(row) if row else _defaults_setting()
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
    data: UpdateChecklistDispatchAutomationRequest | None = None,
):
    auth_error = _require_agent(user)
    if auth_error:
        return auth_error

    if section not in VALID_CATEGORIES:
        return jsonify({"success": False, "error": "Invalid checklist section"}), 400

    try:
        item_id_int = int(item_id)
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Invalid item_id"}), 400

    if not item_supports_dispatch_automation(section, item_id_int):
        return jsonify(
            {"success": False, "error": "Dispatch automation is not available for this step"}
        ), 400

    if not _agent_manages_client(str(user.id), str(transaction_id)):
        return jsonify({"success": False, "error": "Access denied"}), 403

    if data is None:
        return jsonify({"success": False, "error": "Request body required"}), 400

    if data.recipientScope == ChecklistDispatchRecipientScope.selected_clients and (
        not data.selectedClientIds or len(data.selectedClientIds) == 0
    ):
        return (
            jsonify(
                {
                    "success": False,
                    "error": "selectedClientIds is required when recipientScope is selected_clients",
                }
            ),
            400,
        )

    allowed = set(get_agent_client_ids(str(user.id)))
    if data.recipientScope == ChecklistDispatchRecipientScope.selected_clients:
        for cid in data.selectedClientIds or []:
            if str(cid) not in allowed:
                return jsonify({"success": False, "error": f"Invalid client id: {cid}"}), 400

    if data.noteMode == ChecklistDispatchNoteMode.per_client and data.notesPerClient:
        for cid in data.notesPerClient:
            if str(cid) not in allowed:
                return jsonify(
                    {"success": False, "error": f"Invalid client id in notes: {cid}"}
                ), 400

    row = ChecklistItemDispatchSetting.query.filter_by(
        agent_user_id=str(user.id),
        client_user_id=str(transaction_id),
        category=str(section),
        item_id=item_id_int,
    ).first()

    if row is None:
        row = ChecklistItemDispatchSetting(
            agent_user_id=str(user.id),
            client_user_id=str(transaction_id),
            category=str(section),
            item_id=item_id_int,
        )
        db.session.add(row)

    row.enabled = data.enabled
    row.channel = data.channel.value
    row.recipient_scope = data.recipientScope.value
    row.selected_client_ids = list(data.selectedClientIds) if data.selectedClientIds else None
    row.note_mode = data.noteMode.value
    row.note_broadcast = str(data.noteBroadcast) if data.noteBroadcast else None
    row.notes_per_client = dict(data.notesPerClient) if data.notesPerClient else None

    db.session.commit()

    out_setting = _row_to_setting_model(row)
    return jsonify(
        ChecklistDispatchAutomationApiResponse(
            success=True, error=None, setting=out_setting
        ).model_dump(mode="json")
    )
