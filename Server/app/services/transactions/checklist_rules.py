"""Declarative checklist rules: condition evaluation and effective checked-id merge (GET/PUT)."""

from __future__ import annotations

from typing import Any


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


def _apply_persisted_checked_ids(
    checked: set[int],
    sorted_items: list[dict[str, Any]],
    old_checked: set[int],
) -> None:
    """
    Re-add checklist ids already stored for the user. Clients cannot remove completed
    steps via PUT; signature_based truth still comes from apply_signature_based_checked_ids.
    Prune steps may still discard checks that violate ordering/selectable rules.
    """
    id_to_item: dict[int, dict[str, Any]] = {}
    for item in sorted_items:
        try:
            iid = int(item["id"])
        except (KeyError, TypeError, ValueError):
            continue
        id_to_item[iid] = item
    for iid in old_checked:
        item = id_to_item.get(iid)
        if item is None:
            continue
        if _completion_type_raw(item) == "signature_based":
            continue
        checked.add(iid)


def _prune_sequential(checked: set[int], sorted_items: list[dict[str, Any]]) -> None:
    changed = True
    while changed:
        changed = False
        for i, item in enumerate(sorted_items):
            try:
                iid = int(item["id"])
            except (KeyError, TypeError, ValueError):
                continue
            if iid not in checked:
                continue
            if item.get("allow_unordered_check"):
                continue
            for j in range(i):
                try:
                    prev_id = int(sorted_items[j]["id"])
                except (KeyError, TypeError, ValueError):
                    continue
                if prev_id not in checked:
                    checked.discard(iid)
                    changed = True
                    break


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
        sel = item.get("selectable_when")
        if sel and not evaluate_checklist_condition(sel, checked - {iid}):
            checked.discard(iid)


def merge_task_checklist_checked_ids(
    items: list[dict[str, Any]],
    requested_ids: list[int] | list[float],
    old_checked_ids: set[int] | frozenset[int],
) -> list[int]:
    """
    Compute authoritative checked ids: auto_complete_when, lock_uncheck_when,
    sequential order, and selectable_when (manual-only gate).
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
        _apply_persisted_checked_ids(checked, sorted_items, old_checked)
        _apply_locks(checked, sorted_items, old_checked)
        _prune_sequential(checked, sorted_items)
        _prune_selectable(checked, sorted_items)
        if frozenset(checked) == before:
            break

    return sorted(checked)
