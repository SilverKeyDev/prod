"""Declarative checklist rules: condition evaluation and effective checked-id merge (GET/PUT)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

SUBMIT_GATED_CHECKLIST_INTEGRATION_KEYS = frozenset(
    {
        "set_budget",
        "choose_areas",
        "define_criteria",
        "partner_agent",
        "finding_home",
    }
)


def _is_submit_gated_integration(item: dict[str, Any]) -> bool:
    key = item.get("component_key")
    if isinstance(key, str) and key in SUBMIT_GATED_CHECKLIST_INTEGRATION_KEYS:
        return True
    return bool(item.get("completion_requires_submit") or item.get("completionRequiresSubmit"))


def evaluate_checklist_condition(cond: dict[str, Any] | None, checked: set[int]) -> bool:
    """Evaluate a ChecklistCondition v1 against the current checked id set."""
    if not cond or not isinstance(cond, dict):
        return True
    kind = cond.get("kind")
    raw_ids = cond.get("item_ids") or []
    item_ids: list[int] = []
    for x in raw_ids:
        if isinstance(x, bool):
            continue
        if isinstance(x, int):
            item_ids.append(x)
        elif isinstance(x, float) and x == int(x):
            item_ids.append(int(x))
    if kind == "all_items_checked":
        return all(i in checked for i in item_ids)
    if kind == "any_item_checked":
        return any(i in checked for i in item_ids)
    return False


def sort_task_checklist_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Match Client sortTaskChecklistItems: order when present, else original index; tie-break by index."""
    index_by_id: dict[int, int] = {}
    for idx, it in enumerate(items):
        try:
            iid = int(it["id"])
        except (KeyError, TypeError, ValueError):
            continue
        index_by_id[iid] = idx

    def sort_key(it: dict[str, Any]) -> tuple[int, int]:
        try:
            iid = int(it["id"])
        except (KeyError, TypeError, ValueError):
            return (0, 0)
        order = it.get("order")
        idx = index_by_id.get(iid, 0)
        primary = int(order) if order is not None else idx
        return (primary, idx)

    return sorted(items, key=sort_key)


def _auto_would_complete(item: dict[str, Any], iid: int, checked: set[int]) -> bool:
    cond = item.get("auto_complete_when")
    if not cond:
        return False
    return evaluate_checklist_condition(cond, checked - {iid})


def _apply_auto_complete(checked: set[int], sorted_items: list[dict[str, Any]]) -> None:
    while True:
        before = set(checked)
        for item in sorted_items:
            try:
                iid = int(item["id"])
            except (KeyError, TypeError, ValueError):
                continue
            if iid in checked:
                continue
            cond = item.get("auto_complete_when")
            if cond and evaluate_checklist_condition(cond, checked):
                checked.add(iid)
        if checked == before:
            break


def _apply_locks(
    checked: set[int],
    sorted_items: list[dict[str, Any]],
    old_checked: set[int],
) -> None:
    for item in sorted_items:
        cond = item.get("lock_uncheck_when")
        if not cond:
            continue
        try:
            iid = int(item["id"])
        except (KeyError, TypeError, ValueError):
            continue
        if iid in old_checked and evaluate_checklist_condition(cond, checked):
            checked.add(iid)


def _completion_type_raw(item: dict[str, Any]) -> str:
    ct = item.get("completionType") or item.get("completion_type") or ""
    return str(ct)


def _prune_selectable(checked: set[int], sorted_items: list[dict[str, Any]]) -> None:
    for item in sorted_items:
        try:
            iid = int(item["id"])
        except (KeyError, TypeError, ValueError):
            continue
        if iid not in checked:
            continue
        if _auto_would_complete(item, iid, checked):
            continue
        if not _is_submit_gated_integration(item):
            continue
        sel = item.get("selectable_when")
        if sel and not evaluate_checklist_condition(sel, checked - {iid}):
            checked.discard(iid)


def merge_task_checklist_checked_ids(
    items: list[dict[str, Any]],
    requested_ids: list[int] | list[float],
    old_checked_ids: set[int] | frozenset[int],
    *,
    bypass_progress_gates: bool = False,
) -> list[int]:
    """
    Compute authoritative checked ids: auto_complete_when, lock_uncheck_when,
    and selectable_when (manual-only gate).
    """
    valid: set[int] = set()
    for it in items:
        try:
            valid.add(int(it["id"]))
        except (KeyError, TypeError, ValueError):
            continue

    req: set[int] = set()
    for x in requested_ids:
        if isinstance(x, bool):
            continue
        if isinstance(x, int):
            req.add(x)
        elif isinstance(x, float) and x == int(x):
            req.add(int(x))
    req &= valid
    for it in items:
        if _completion_type_raw(it) == "signature_based":
            try:
                req.discard(int(it["id"]))
            except (KeyError, TypeError, ValueError):
                continue

    old_checked: set[int] = set()
    for x in old_checked_ids:
        if isinstance(x, int):
            old_checked.add(x)
        elif isinstance(x, float) and x == int(x):
            old_checked.add(int(x))
    old_checked &= valid

    sorted_items = sort_task_checklist_items(list(items))
    checked: set[int] = set(req)

    for _ in range(len(sorted_items) * 6 + 12):
        before = frozenset(checked)
        _apply_auto_complete(checked, sorted_items)
        if not bypass_progress_gates:
            _apply_locks(checked, sorted_items, old_checked)
            _prune_selectable(checked, sorted_items)
        if frozenset(checked) == before:
            break

    return sorted(checked)


# Stable codes for logs and optional API diagnostics (no PII).
MERGE_REASON_SIGNATURE_BASED = "signature_based"
MERGE_REASON_SELECTABLE_WHEN = "selectable_when"
MERGE_REASON_SEQUENTIAL_ORDER = "sequential_order"
MERGE_REASON_PRUNED = "pruned"


@dataclass(frozen=True)
class TaskChecklistMergeResult:
    """Outcome of merging a requested checked-id set with checklist rules."""

    effective_ids: list[int]
    """Ids present in the client request but absent after merge (subset of template ids)."""
    stripped_requested_ids: list[int] = field(default_factory=list)
    """Parallel to stripped_requested_ids: one reason code per stripped id (same order)."""
    stripped_reason_codes: list[str] = field(default_factory=list)


def _classify_stripped_id(
    iid: int,
    *,
    sorted_items: list[dict[str, Any]],
    id_to_item: dict[int, dict[str, Any]],
    effective: frozenset[int],
) -> str:
    item = id_to_item.get(iid)
    if item is None:
        return MERGE_REASON_PRUNED
    if _completion_type_raw(item) == "signature_based":
        return MERGE_REASON_SIGNATURE_BASED
    if _is_submit_gated_integration(item):
        sel = item.get("selectable_when")
        if sel and not evaluate_checklist_condition(sel, set(effective)):
            return MERGE_REASON_SELECTABLE_WHEN
    return MERGE_REASON_PRUNED


def apply_task_checklist_merge(
    items: list[dict[str, Any]],
    requested_ids: list[int] | list[float],
    old_checked_ids: set[int] | frozenset[int],
    *,
    bypass_progress_gates: bool = False,
) -> TaskChecklistMergeResult:
    """
    Run merge and return effective ids plus deterministic reasons for template ids
    present in the request but absent after merge (includes signature_based requests).
    """
    valid: set[int] = set()
    for it in items:
        try:
            valid.add(int(it["id"]))
        except (KeyError, TypeError, ValueError):
            continue

    requested_valid: set[int] = set()
    for x in requested_ids:
        if isinstance(x, bool):
            continue
        if isinstance(x, int):
            requested_valid.add(x)
        elif isinstance(x, float) and x == int(x):
            requested_valid.add(int(x))
    requested_valid &= valid

    effective_list = merge_task_checklist_checked_ids(
        items,
        sorted(requested_valid),
        old_checked_ids,
        bypass_progress_gates=bypass_progress_gates,
    )
    effective = frozenset(effective_list)
    stripped_sorted = sorted(x for x in requested_valid if x not in effective)
    sorted_items = sort_task_checklist_items(list(items))
    id_to_item: dict[int, dict[str, Any]] = {}
    for it in sorted_items:
        try:
            id_to_item[int(it["id"])] = it
        except (KeyError, TypeError, ValueError):
            continue
    reasons = [
        _classify_stripped_id(
            iid, sorted_items=sorted_items, id_to_item=id_to_item, effective=effective
        )
        for iid in stripped_sorted
    ]
    return TaskChecklistMergeResult(
        effective_ids=effective_list,
        stripped_requested_ids=stripped_sorted,
        stripped_reason_codes=reasons,
    )
