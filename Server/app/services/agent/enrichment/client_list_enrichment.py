"""Batch enrichment for agent client list rows (step labels, avatars, signature actions)."""

from __future__ import annotations

from collections import defaultdict
from typing import Any

from sqlalchemy import func, select

from app import db
from app.dtos.user.user import _try_presigned_profile_picture_url
from app.models import Agreement, TransactionTask, User, UserRole
from app.services.transactions.checklist_support.checklist_constants import (
    PIPELINE_ORDER,
    PIPELINE_RANK,
    TASK_CATEGORIES,
)
from app.services.transactions.checklist_support.checklist_rules import (
    merge_task_checklist_checked_ids,
    sort_task_checklist_items,
)
from app.services.transactions.ensure import ensure_transaction
from app.services.transactions.retrieval import get_checklist_definition

_SECTION_UNLOCK_REQUIRES: dict[str, tuple[str, ...]] = {
    "search": (),
    "offer": ("search",),
    "escrow": ("search", "offer"),
    "financing": ("search", "offer", "escrow"),
    "closing": ("search", "offer", "escrow", "financing"),
    "insurance": ("search", "offer", "escrow", "financing", "closing"),
}

_AGREEMENT_ACTIVE_STATUSES = frozenset({"sent", "delivered", "signed", "completed"})
_SIGNED_RECIPIENT_STATUSES = frozenset({"signed", "completed"})


def _client_kind_from_roles(role_names: set[str]) -> str:
    """Map user_roles (excluding agent) to AgentClient.client_kind; prefer seller over buyer."""
    roles = {r.lower() for r in role_names if r and str(r).lower() != "agent"}
    if "seller" in roles:
        return "seller"
    if "buyer" in roles:
        return "buyer"
    if "investor" in roles:
        return "investor"
    return "unknown"


def batch_client_kinds(user_ids: list[str]) -> dict[str, str]:
    if not user_ids:
        return {}
    rows = db.session.scalars(select(UserRole).where(UserRole.user_id.in_(user_ids))).all()
    by_user: dict[str, set[str]] = defaultdict(set)
    for row in rows:
        by_user[row.user_id].add(row.role)
    return {uid: _client_kind_from_roles(by_user.get(uid, set())) for uid in user_ids}


def batch_pipeline_stages(user_ids: list[str]) -> dict[str, str]:
    """
    For each user, pick the checklist category with the most recent completed-task activity.
    Defaults to search when there are no completed tasks in TASK_CATEGORIES.
    """
    if not user_ids:
        return {}
    grouped = db.session.execute(
        select(
            TransactionTask.user_id,
            TransactionTask.category,
            func.max(TransactionTask.updated_at).label("latest_at"),
        )
        .where(
            TransactionTask.user_id.in_(user_ids),
            TransactionTask.category.in_(TASK_CATEGORIES),
            TransactionTask.status == "done",
        )
        .group_by(TransactionTask.user_id, TransactionTask.category)
    ).all()
    best: dict[str, tuple] = {}
    for user_id, category, latest_at in grouped:
        if category not in PIPELINE_RANK:
            continue
        rank = PIPELINE_RANK[category]
        prev = best.get(user_id)
        if prev is None:
            best[user_id] = (latest_at, rank, category)
            continue
        prev_at, prev_rank, _ = prev
        if latest_at is None:
            continue
        if prev_at is None or latest_at > prev_at or (latest_at == prev_at and rank > prev_rank):
            best[user_id] = (latest_at, rank, category)

    return {uid: best[uid][2] if uid in best else "search" for uid in user_ids}


def _item_id(item: dict[str, Any]) -> int | None:
    try:
        return int(item["id"])
    except (KeyError, TypeError, ValueError):
        return None


def _effective_checked_ids(user_id: str, category: str) -> set[int]:
    # Lazy: unified_task_checklist_read → checklist_signature_completion → agent cycle.
    from app.services.transactions.checklist_signature_completion import (
        apply_signature_based_checked_ids,
    )
    from app.services.transactions.unified_task_checklist_read import (
        get_checked_ids_for_transaction,
    )

    items = get_checklist_definition(category)
    if not items:
        return set()
    tx = ensure_transaction(buyer_id=str(user_id))
    raw_checked = get_checked_ids_for_transaction(str(tx.id), category)
    old_set = {int(x) for x in raw_checked}
    pre_signature = merge_task_checklist_checked_ids(items, raw_checked, old_set)
    checked_set = set(pre_signature)
    apply_signature_based_checked_ids(
        items, str(user_id), category, checked_set, transaction_id=str(tx.id)
    )
    return checked_set


def _section_is_complete(user_id: str, category: str) -> bool:
    items = get_checklist_definition(category)
    if not items:
        return True
    checked = _effective_checked_ids(user_id, category)
    sorted_items = sort_task_checklist_items(list(items))
    for item in sorted_items:
        iid = _item_id(item)
        if iid is None:
            continue
        if iid not in checked:
            return False
    return True


def _first_incomplete_step_label(items: list[dict[str, Any]], checked: set[int]) -> str | None:
    """Port of Client getActiveChecklistItemIds — returns label for the first active step only."""
    sorted_items = sort_task_checklist_items(list(items))
    first_incomplete = None
    for item in sorted_items:
        iid = _item_id(item)
        if iid is None or iid in checked:
            continue
        first_incomplete = item
        break
    if first_incomplete is None:
        return None

    label = str(first_incomplete.get("label") or "").strip()
    if not label:
        return None

    group = str(first_incomplete.get("parallel_step_group") or "").strip()
    if not group:
        return label

    return label


def _current_step_for_user(user_id: str) -> tuple[str, str | None]:
    completion_cache: dict[str, bool] = {
        cat: _section_is_complete(user_id, cat) for cat in PIPELINE_ORDER
    }

    for category in PIPELINE_ORDER:
        reqs = _SECTION_UNLOCK_REQUIRES.get(category, ())
        if not all(completion_cache.get(req, False) for req in reqs):
            continue

        items = get_checklist_definition(category)
        if not items:
            continue

        checked = _effective_checked_ids(user_id, category)
        label = _first_incomplete_step_label(items, checked)
        if label:
            return category, label

        if not completion_cache.get(category, True):
            return category, None

    return "closing", None


def batch_current_step(user_ids: list[str]) -> dict[str, tuple[str, str | None]]:
    if not user_ids:
        return {}
    return {uid: _current_step_for_user(uid) for uid in user_ids}


def batch_profile_picture_urls(users: list[User]) -> dict[str, str | None]:
    return {str(u.id): _try_presigned_profile_picture_url(u) for u in users}


def batch_requires_signature(agent_id: str, client_ids: list[str]) -> dict[str, bool]:
    if not client_ids:
        return {}

    out = dict.fromkeys(client_ids, False)
    agreements = db.session.scalars(
        select(Agreement).where(
            Agreement.agent_id == agent_id,
            Agreement.buyer_id.in_(client_ids),
            Agreement.status.in_(tuple(_AGREEMENT_ACTIVE_STATUSES)),
        )
    ).all()

    for agreement in agreements:
        buyer_id = str(agreement.buyer_id)
        if buyer_id not in out:
            continue

        participants = list(agreement.participants or [])
        if not participants:
            continue

        agent_participant = next((p for p in participants if p.user_id == agent_id), None)
        buyer_participant = next((p for p in participants if p.user_id == agreement.buyer_id), None)
        if agent_participant is None or buyer_participant is None:
            continue

        agent_signed = (
            agent_participant.recipient_status or ""
        ).lower() in _SIGNED_RECIPIENT_STATUSES
        buyer_signed = (
            buyer_participant.recipient_status or ""
        ).lower() in _SIGNED_RECIPIENT_STATUSES

        if buyer_signed and not agent_signed:
            out[buyer_id] = True

    return out
