"""Merge checklist progress with signature-based steps (AgreementLink + Agreement status)."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select

from app import db
from app.models import Agreement, AgreementLink, ChecklistForm, ChecklistItemDispatchSetting
from app.services.documents.forms_service import FormsService
from app.services.transactions.checklist_dispatch_automation import (
    format_checklist_dispatch_note,
    resolve_agent_id_for_buyer,
)
from app.services.transactions.checklist_support.checklist_rules import (
    evaluate_checklist_condition,
    sort_task_checklist_items,
)
from logger import log

_SIGNATURE_BASED = "signature_based"
_SIGNATURE_PLUS_REVIEW = "signature_plus_review"
_BBA_FORM_KEYS = {
    "buyer_broker_exclusive",
    "buyer_broker_non_exclusive",
    "buyer_broker_single_property",
}


def _linked_item_key(category: str, item_id: int) -> str:
    return f"{category}.{int(item_id)}"


def is_signature_step_satisfied(agreement: Agreement | None) -> bool:
    if agreement is None:
        return False
    return str(agreement.status) == "completed"


def links_for_step(
    *,
    transaction_id: str,
    category: str,
    item_id: int,
) -> list[AgreementLink]:
    """AgreementLinks for a checklist step on this transaction."""
    lid = _linked_item_key(category, item_id)
    return db.session.scalars(
        select(AgreementLink).where(
            AgreementLink.transaction_id == str(transaction_id),
            AgreementLink.linked_item_type == "checklist_item",
            AgreementLink.linked_item_id == lid,
        )
    ).all()


def step_has_non_void_agreement(
    *,
    transaction_id: str,
    category: str,
    item_id: int,
) -> bool:
    for link in links_for_step(transaction_id=transaction_id, category=category, item_id=item_id):
        ag = link.agreement
        if ag is None:
            continue
        if str(ag.status) == "voided":
            continue
        return True
    return False


def is_signature_step_complete(
    *,
    transaction_id: str,
    category: str,
    item_id: int,
) -> bool:
    for link in links_for_step(transaction_id=transaction_id, category=category, item_id=item_id):
        if is_signature_step_satisfied(link.agreement):
            return True
    return False


def _item_id(item: dict[str, Any]) -> int | None:
    try:
        return int(item["id"])
    except (KeyError, TypeError, ValueError):
        return None


def _is_signature_based_item(item: dict[str, Any]) -> bool:
    ct = str(item.get("completion_type") or "")
    return ct in (_SIGNATURE_BASED, _SIGNATURE_PLUS_REVIEW)


def _is_bba_item(item: dict[str, Any]) -> bool:
    """True when this checklist item is the buyer-broker agreement step."""
    suggested = set(item.get("suggested_form_ids") or [])
    return bool(suggested & _BBA_FORM_KEYS)


def _assert_bba_send_allowed(
    transaction_id: str,
    buyer_user_id: str,
) -> bool:
    """
    RESPA compliance gate — blocks BBA DocuSign send until agent has explicitly
    approved on a call. Returns True if send is allowed, False if blocked.

    LogPath: TRANSACTIONS.BBA_REVIEW
    Only applies to signature_plus_review items (checklist item 6).
    Non-BBA signature steps are unaffected.
    TODO SIL-183 Phase 2: also check approved_preferences_fingerprint matches
    current preferences to catch material-change invalidation.
    """
    from app.models.transactions.buyer_broker_review import BuyerBrokerReview

    review = db.session.scalar(
        select(BuyerBrokerReview).where(
            BuyerBrokerReview.transaction_id == str(transaction_id)
        )
    )
    if review is None:
        log.info(
            "TRANSACTIONS.BBA_REVIEW",
            "bba_send_blocked_no_review",
            {"transaction_id": transaction_id, "buyer_user_id": buyer_user_id},
        )
        return False

    allowed = review.status == "approved"
    if not allowed:
        log.info(
            "TRANSACTIONS.BBA_REVIEW",
            "bba_send_blocked",
            {
                "transaction_id": transaction_id,
                "buyer_user_id": buyer_user_id,
                "review_status": review.status,
            },
        )
    return allowed


def _signature_step_selectable(
    item: dict[str, Any],
    checked: set[int],
) -> bool:
    """True when the step has no selectable_when gate or the gate is satisfied."""
    sel = item.get("selectable_when")
    if not sel:
        return True
    return evaluate_checklist_condition(sel, checked)


def apply_signature_based_checked_ids(
    items: list[dict[str, Any]],
    buyer_user_id: str,
    category: str,
    checked: set[int],
    *,
    transaction_id: str | None = None,
) -> None:
    """
    Mutate checked: signature_based ids are only present when a linked agreement is completed;
    manual checks for those ids are stripped otherwise.
    """
    from app.services.transactions.ensure import ensure_transaction

    tx_id = transaction_id
    if not tx_id:
        tx_id = ensure_transaction(buyer_id=str(buyer_user_id)).id
    sorted_items = sort_task_checklist_items(list(items))
    for item in sorted_items:
        if not _is_signature_based_item(item):
            continue
        iid = _item_id(item)
        if iid is None:
            continue
        if is_signature_step_complete(transaction_id=str(tx_id), category=category, item_id=iid):
            checked.add(iid)
        else:
            checked.discard(iid)


def _first_resolved_checklist_form(item: dict[str, Any]) -> ChecklistForm | None:
    suggested = item.get("suggested_form_ids") or []
    for key in suggested:
        form = db.session.scalar(select(ChecklistForm).where(ChecklistForm.form_key == key))
        if form is not None:
            return form
    return None


def run_signature_step_auto_send(
    *,
    buyer_user_id: str,
    checklist_category: str,
    effective_checked_ids: set[int],
    items_raw: list[dict[str, Any]],
    transaction_id: str | None = None,
) -> None:
    """When a signature_based step is unlocked, send one DocuSign envelope (idempotent)."""
    from app.services.transactions.ensure import ensure_transaction

    tx_id = transaction_id or ensure_transaction(buyer_id=str(buyer_user_id)).id
    agent_id = resolve_agent_id_for_buyer(str(buyer_user_id))
    if not agent_id:
        log.debug(
            "API",
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
            transaction_id=str(tx_id),
            category=checklist_category,
            item_id=iid,
        ):
            continue
        if step_has_non_void_agreement(
            transaction_id=str(tx_id),
            category=checklist_category,
            item_id=iid,
        ):
            continue
        if not _signature_step_selectable(item, effective_checked_ids):
            continue

        # Gate: BBA items require explicit agent approval before DocuSign send.
        # Non-BBA signature steps are unaffected.
        if _is_bba_item(item) and not _assert_bba_send_allowed(
            transaction_id=str(tx_id),
            buyer_user_id=str(buyer_user_id),
        ):
            continue

        form = _first_resolved_checklist_form(item)
        if form is None:
            continue

        setting = db.session.scalar(
            select(ChecklistItemDispatchSetting).where(
                ChecklistItemDispatchSetting.agent_user_id == str(agent_id),
                ChecklistItemDispatchSetting.client_user_id == str(buyer_user_id),
                ChecklistItemDispatchSetting.category == str(checklist_category),
                ChecklistItemDispatchSetting.item_id == int(iid),
            )
        )

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
                    log.error(
                        "ERRORS",
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
                transaction_id=str(tx_id),
            )
        except Exception as e:
            log.error(
                "ERRORS",
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

    links = db.session.scalars(
        select(AgreementLink).where(AgreementLink.agreement_id == agreement.id)
    ).all()
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
    tx_id = str(agreement.transaction_id)
    for category in categories:
        try:
            recompute_and_persist_buyer_checklist(tx_id, category)
        except Exception as e:
            log.error(
                "ERRORS",
                f"checklist_sync_after_agreement_failed buyer={buyer_id} category={category}",
                e,
            )