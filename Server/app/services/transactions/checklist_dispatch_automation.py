"""Run agent-configured checklist form dispatch when a client newly checks off a step."""

from __future__ import annotations

from typing import Any

from app.models import ChecklistForm, ChecklistItemDispatchSetting, Transaction, User
from app.services.agent.client_service import get_agent_client_ids
from app.services.agent.todo_service import resolve_primary_agent_id_for_client
from app.services.documents.forms_service import FormsService
from app.services.transactions.retrieval import get_checklist_definition
from app.utils.db.orm_lookup import get_model
from logger import LOG_CATEGORIES, get_logger

logger = get_logger()

_MAX_NOTE = 5000


def resolve_agent_id_for_buyer(buyer_id: str) -> str | None:
    """Primary agent for checklist automation via agent_conversations, else transaction.primary_agent_id."""
    client = get_model(User, buyer_id)
    if client:
        agent_id = resolve_primary_agent_id_for_client(client)
        if agent_id:
            return str(agent_id)
    txn = Transaction.query.filter_by(buyer_id=str(buyer_id)).first()
    if txn and txn.primary_agent_id:
        return str(txn.primary_agent_id)
    return None


def _note_for_recipient(setting: ChecklistItemDispatchSetting, recipient_id: str) -> str | None:
    mode = setting.note_mode
    if mode == "none":
        return None
    if mode == "broadcast":
        raw = (setting.note_broadcast or "").strip()
        return raw[:_MAX_NOTE] if raw else None
    if mode == "per_client":
        m = setting.notes_per_client or {}
        raw = (m.get(recipient_id) or "").strip() if isinstance(m, dict) else ""
        return raw[:_MAX_NOTE] if raw else None
    return None


def _recipient_ids_for_setting(
    *,
    agent_id: str,
    checker_client_id: str,
    setting: ChecklistItemDispatchSetting,
) -> list[str]:
    scope = setting.recipient_scope
    if scope == "context_client":
        return [str(checker_client_id)]
    if scope == "all_agent_clients":
        return list(dict.fromkeys(get_agent_client_ids(str(agent_id))))
    if scope == "selected_clients":
        raw = setting.selected_client_ids or []
        allowed = set(get_agent_client_ids(str(agent_id)))
        out: list[str] = []
        for x in raw:
            sid = str(x).strip()
            if sid and sid in allowed:
                out.append(sid)
        return list(dict.fromkeys(out))
    return [str(checker_client_id)]


def _dispatch_forms_for_item(
    *,
    agent_id: str,
    checklist_category: str,
    item_id: int,
    item_def: dict[str, Any],
    recipient_ids: list[str],
    setting: ChecklistItemDispatchSetting,
) -> None:
    suggested = item_def.get("suggested_form_ids") or []
    if not suggested:
        return
    forms = ChecklistForm.query.filter(ChecklistForm.form_key.in_(list(suggested))).all()
    if not forms:
        return

    channel = setting.channel
    do_msg = channel in ("messaging", "both")
    do_ds = channel in ("docusign", "both")

    for form in forms:
        for recipient_id in recipient_ids:
            note = _note_for_recipient(setting, recipient_id)
            if do_msg:
                try:
                    FormsService.send_form_via_messaging(
                        form=form,
                        agent_user_id=str(agent_id),
                        conversation_id="new",
                        client_id_for_new=str(recipient_id),
                        optional_message=note,
                    )
                except Exception as e:
                    logger.error(
                        LOG_CATEGORIES["ERRORS"],
                        "checklist_dispatch_messaging_failed",
                        e,
                    )
            if do_ds:
                try:
                    FormsService.send_form_via_docusign(
                        form=form,
                        agent_user_id=str(agent_id),
                        buyer_user_id=str(recipient_id),
                        section=checklist_category,
                        item_id=item_id,
                        optional_message=note,
                    )
                except Exception as e:
                    logger.error(
                        LOG_CATEGORIES["ERRORS"],
                        "checklist_dispatch_docusign_failed",
                        e,
                    )


def run_checklist_dispatch_for_newly_checked(
    *,
    buyer_user_id: str,
    checklist_category: str,
    newly_checked: set[int],
    items_raw: list[dict[str, Any]],
) -> None:
    if not newly_checked:
        return
    agent_id = resolve_agent_id_for_buyer(str(buyer_user_id))
    if not agent_id:
        logger.debug(
            LOG_CATEGORIES["API"],
            "checklist_dispatch_skipped_no_agent",
            {"buyer_user_id": buyer_user_id, "category": checklist_category},
        )
        return

    for item_id in newly_checked:
        item_def = next((i for i in items_raw if int(i.get("id", -1)) == int(item_id)), None)
        if not item_def or not item_def.get("dispatch_automation_available"):
            continue
        setting = ChecklistItemDispatchSetting.query.filter_by(
            agent_user_id=str(agent_id),
            client_user_id=str(buyer_user_id),
            category=str(checklist_category),
            item_id=int(item_id),
        ).first()
        if not setting or not setting.enabled:
            continue
        try:
            recipients = _recipient_ids_for_setting(
                agent_id=str(agent_id),
                checker_client_id=str(buyer_user_id),
                setting=setting,
            )
            if not recipients:
                continue
            _dispatch_forms_for_item(
                agent_id=str(agent_id),
                checklist_category=str(checklist_category),
                item_id=int(item_id),
                item_def=item_def,
                recipient_ids=recipients,
                setting=setting,
            )
        except Exception as e:
            logger.error(
                LOG_CATEGORIES["ERRORS"],
                "checklist_dispatch_failed",
                e,
            )


def item_supports_dispatch_automation(category: str, item_id: int) -> bool:
    items = get_checklist_definition(category)
    step = next((i for i in items if int(i.get("id", -1)) == int(item_id)), None)
    return bool(step and step.get("dispatch_automation_available"))


def format_checklist_dispatch_note(
    setting: ChecklistItemDispatchSetting, recipient_id: str
) -> str | None:
    """Public wrapper for optional per-recipient notes (signature auto-send, dispatch UI)."""
    return _note_for_recipient(setting, recipient_id)
