"""Merge checklist progress with signature-based steps (AgreementLink + Agreement status)."""

from __future__ import annotations

from typing import Any

from app.models import Agreement, AgreementLink, ChecklistForm, ChecklistItemDispatchSetting
from app.services.documents.forms_service import FormsService
from app.services.transactions.checklist_dispatch_automation import (
    format_checklist_dispatch_note,
    resolve_agent_id_for_buyer,
)
from app.services.transactions.checklist_rules import sort_task_checklist_items
from logger import LOG_CATEGORIES, get_logger

logger = get_logger()

_SIGNATURE_BASED = "signature_based"


def _linked_item_key(category: str, item_id: int) -> str:
    return f"{category}.{int(item_id)}"


def is_signature_step_satisfied(agreement: Agreement | None) -> bool:
    if agreement is None:
        return False
    return str(agreement.status) == "completed"


def links_for_step(*, buyer_user_id: str, category: str, item_id: int) -> list[AgreementLink]:
    """AgreementLinks for a checklist step, scoped to agreements owned by this buyer."""
    lid = _linked_item_key(category, item_id)
    rows = AgreementLink.query.filter_by(
        linked_item_type="checklist_item",
        linked_item_id=lid,
    ).all()
    out: list[AgreementLink] = []
    buyer = str(buyer_user_id)
    for link in rows:
        ag = link.agreement
        if ag is not None and str(ag.buyer_id) == buyer:
            out.append(link)
    return out


def step_has_non_void_agreement(*, buyer_user_id: str, category: str, item_id: int) -> bool:
    for link in links_for_step(buyer_user_id=buyer_user_id, category=category, item_id=item_id):
        ag = link.agreement
        if ag is None:
            continue
        if str(ag.status) == "voided":
            continue
        return True
    return False


def is_signature_step_complete(*, buyer_user_id: str, category: str, item_id: int) -> bool:
    for link in links_for_step(buyer_user_id=buyer_user_id, category=category, item_id=item_id):
        if is_signature_step_satisfied(link.agreement):
            return True
    return False


def _item_id(item: dict[str, Any]) -> int | None:
    try:
        return int(item["id"])
    except (KeyError, TypeError, ValueError):
        return None


def _is_signature_based_item(item: dict[str, Any]) -> bool:
    return str(item.get("completion_type") or "") == _SIGNATURE_BASED


def _prior_items_all_checked(
    sorted_items: list[dict[str, Any]],
    checked: set[int],
    item_id: int,
) -> bool:
    """Match checklist sequential gate: all prior steps in sort order must be checked."""
    idx = next((i for i, it in enumerate(sorted_items) if _item_id(it) == item_id), -1)
    if idx < 0:
        return False
    target = sorted_items[idx]
    if target.get("allow_unordered_check"):
        return True
    for j in range(idx):
        prev_id = _item_id(sorted_items[j])
        if prev_id is None:
            continue
        if prev_id not in checked:
            return False
    return True


def apply_signature_based_checked_ids(
    items: list[dict[str, Any]],
    buyer_user_id: str,
    category: str,
    checked: set[int],
) -> None:
    """
    Mutate checked: signature_based ids are only present when a linked agreement is completed;
    manual checks for those ids are stripped otherwise.
    """
    sorted_items = sort_task_checklist_items(list(items))
    for item in sorted_items:
        if not _is_signature_based_item(item):
            continue
        iid = _item_id(item)
        if iid is None:
            continue
        if is_signature_step_complete(buyer_user_id=buyer_user_id, category=category, item_id=iid):
            checked.add(iid)
        else:
            checked.discard(iid)


def _first_resolved_checklist_form(item: dict[str, Any]) -> ChecklistForm | None:
    suggested = item.get("suggested_form_ids") or []
    for key in suggested:
        form = ChecklistForm.query.filter_by(form_key=key).first()
        if form is not None:
            return form
    return None


def run_signature_step_auto_send(
    *,
    buyer_user_id: str,
    checklist_category: str,
    effective_checked_ids: set[int],
    items_raw: list[dict[str, Any]],
) -> None:
    """When a signature_based step is unlocked, send one DocuSign envelope (idempotent)."""
    agent_id = resolve_agent_id_for_buyer(str(buyer_user_id))
    if not agent_id:
        logger.debug(
            LOG_CATEGORIES["API"],
            "signature_auto_send_skipped_no_agent",
            {"buyer_user_id": buyer_user_id, "category": checklist_category},
        )
        return

    sorted_items = sort_task_checklist_items(list(items_raw))

    for item in sorted_items:
        if not _is_signature_based_item(item):
            continue
        iid = _item_id(item)
        if iid is None:
            continue
        if is_signature_step_complete(
            buyer_user_id=buyer_user_id,
            category=checklist_category,
            item_id=iid,
        ):
            continue
        if step_has_non_void_agreement(
            buyer_user_id=buyer_user_id,
            category=checklist_category,
            item_id=iid,
        ):
            continue
        if not _prior_items_all_checked(sorted_items, effective_checked_ids, iid):
            continue

        form = _first_resolved_checklist_form(item)
        if form is None:
            continue

        setting = ChecklistItemDispatchSetting.query.filter_by(
            agent_user_id=str(agent_id),
            client_user_id=str(buyer_user_id),
            category=str(checklist_category),
            item_id=int(iid),
        ).first()

        note = None
        if setting and setting.enabled:
            note = format_checklist_dispatch_note(setting, str(buyer_user_id))

        try:
            if setting and setting.enabled and setting.channel in ("messaging", "both"):
                try:
                    FormsService.send_form_via_messaging(
                        form=form,
                        agent_user_id=str(agent_id),
                        conversation_id="new",
                        client_id_for_new=str(buyer_user_id),
                        optional_message=note,
                    )
                except Exception as e:
                    logger.error(
                        LOG_CATEGORIES["ERRORS"],
                        "signature_auto_send_messaging_failed",
                        e,
                    )
            FormsService.send_form_via_docusign(
                form=form,
                agent_user_id=str(agent_id),
                buyer_user_id=str(buyer_user_id),
                section=str(checklist_category),
                item_id=int(iid),
                optional_message=note,
            )
        except Exception as e:
            logger.error(
                LOG_CATEGORIES["ERRORS"],
                "signature_auto_send_docusign_failed",
                e,
            )


def sync_checklist_for_completed_agreement(agreement: Agreement) -> None:
    """When an agreement is fully executed, refresh buyer checklist rows for linked steps."""
    if not is_signature_step_satisfied(agreement):
        return
    from app.services.transactions.unified_task_checklist_read import (
        recompute_and_persist_buyer_checklist,
    )

    links = AgreementLink.query.filter_by(agreement_id=agreement.id).all()
    categories: set[str] = set()
    for link in links:
        if str(link.linked_item_type) != "checklist_item":
            continue
        raw = str(link.linked_item_id or "")
        dot = raw.find(".")
        if dot <= 0:
            continue
        category = raw[:dot].strip()
        if category:
            categories.add(category)
    buyer_id = str(agreement.buyer_id)
    for category in categories:
        try:
            recompute_and_persist_buyer_checklist(buyer_id, category)
        except Exception as e:
            logger.error(
                LOG_CATEGORIES["ERRORS"],
                f"checklist_sync_after_agreement_failed buyer={buyer_id} category={category}",
                e,
            )
