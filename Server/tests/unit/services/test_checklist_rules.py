"""Unit tests for checklist rule merge (parity with client)."""

from app.services.transactions.checklist_support.checklist_rules import (
    MERGE_REASON_SELECTABLE_WHEN,
    MERGE_REASON_SEQUENTIAL_ORDER,
    MERGE_REASON_SIGNATURE_BASED,
    apply_task_checklist_merge,
    evaluate_checklist_condition,
    merge_task_checklist_checked_ids,
    sort_task_checklist_items,
)


def test_evaluate_all_items_checked_empty_ids():
    assert evaluate_checklist_condition({"kind": "all_items_checked", "item_ids": []}, {1}) is True


def test_evaluate_any_item_checked_empty_ids():
    assert evaluate_checklist_condition({"kind": "any_item_checked", "item_ids": []}, {1}) is False


def test_evaluate_all_items_checked_requires_every_id():
    cond = {"kind": "all_items_checked", "item_ids": [1, 2]}
    assert evaluate_checklist_condition(cond, {1}) is False
    assert evaluate_checklist_condition(cond, {1, 2}) is True


def test_evaluate_any_item_checked_requires_at_least_one():
    cond = {"kind": "any_item_checked", "item_ids": [1, 2]}
    assert evaluate_checklist_condition(cond, set()) is False
    assert evaluate_checklist_condition(cond, {2}) is True


def test_sort_task_checklist_items_preserves_api_order_when_order_omitted():
    """Match Client: tie-break by original index when order is absent."""
    items = [
        {"id": 99, "label": "Appears first in API array", "explanation": ""},
        {"id": 77, "label": "Appears second in API array", "explanation": ""},
    ]
    sorted_items = sort_task_checklist_items(items)
    assert [int(it["id"]) for it in sorted_items] == [99, 77]


def test_merge_sequential_blocks_later_step_until_previous_checked():
    """Parity with Client mergeTaskChecklistCheckedIds when allow_unordered_check is absent."""
    items = [
        {"id": 99, "label": "Appears first in API array", "explanation": ""},
        {"id": 77, "label": "Appears second in API array", "explanation": ""},
    ]
    assert 77 not in merge_task_checklist_checked_ids(items, [77], frozenset())
    assert merge_task_checklist_checked_ids(items, [99, 77], frozenset()) == [77, 99]


def test_apply_merge_reports_sequential_order_when_second_requested_without_first():
    items = [
        {"id": 1, "order": 0, "label": "A", "explanation": ""},
        {"id": 2, "order": 1, "label": "B", "explanation": ""},
    ]
    result = apply_task_checklist_merge(items, [2], frozenset())
    assert result.effective_ids == []
    assert result.stripped_requested_ids == [2]
    assert result.stripped_reason_codes == [MERGE_REASON_SEQUENTIAL_ORDER]


def test_merge_auto_complete():
    items = [
        {
            "id": 1,
            "order": 0,
            "label": "A",
            "explanation": "",
            "allow_unordered_check": True,
        },
        {
            "id": 2,
            "order": 1,
            "label": "B",
            "explanation": "",
            "allow_unordered_check": True,
            "auto_complete_when": {"kind": "all_items_checked", "item_ids": [1]},
        },
    ]
    assert merge_task_checklist_checked_ids(items, [1], frozenset()) == [1, 2]


def test_merge_lock_readds():
    items = [
        {
            "id": 1,
            "order": 0,
            "label": "A",
            "explanation": "",
            "allow_unordered_check": True,
        },
        {
            "id": 2,
            "order": 1,
            "label": "B",
            "explanation": "",
            "allow_unordered_check": True,
            "lock_uncheck_when": {"kind": "all_items_checked", "item_ids": [1]},
        },
    ]
    assert merge_task_checklist_checked_ids(items, [1], frozenset({1, 2})) == [1, 2]


def test_merge_persists_previously_checked_without_lock_uncheck_when():
    items = [
        {
            "id": 1,
            "order": 0,
            "label": "A",
            "explanation": "",
            "allow_unordered_check": True,
        },
        {
            "id": 2,
            "order": 1,
            "label": "B",
            "explanation": "",
            "allow_unordered_check": True,
        },
    ]
    assert merge_task_checklist_checked_ids(items, [1], frozenset({1, 2})) == [1, 2]


def test_merge_selectable_strips():
    items = [
        {
            "id": 1,
            "order": 0,
            "label": "A",
            "explanation": "",
            "allow_unordered_check": True,
        },
        {
            "id": 2,
            "order": 1,
            "label": "B",
            "explanation": "",
            "allow_unordered_check": True,
            "selectable_when": {"kind": "all_items_checked", "item_ids": [1]},
        },
    ]
    assert merge_task_checklist_checked_ids(items, [2], frozenset()) == []


def test_merge_search_parallel_integrations_after_preapproval():
    """Budget / areas / criteria: unordered among themselves after item 1; block without pre-approval."""
    items = [
        {"id": 1, "order": 0, "label": "Pre-approval", "explanation": ""},
        {
            "id": 5,
            "order": 1,
            "label": "Budget",
            "explanation": "",
            "allow_unordered_check": True,
            "selectable_when": {"kind": "all_items_checked", "item_ids": [1]},
        },
        {
            "id": 4,
            "order": 2,
            "label": "Areas",
            "explanation": "",
            "allow_unordered_check": True,
            "selectable_when": {"kind": "all_items_checked", "item_ids": [1]},
        },
        {
            "id": 2,
            "order": 3,
            "label": "Criteria",
            "explanation": "",
            "allow_unordered_check": True,
            "selectable_when": {"kind": "all_items_checked", "item_ids": [1]},
        },
        {"id": 3, "order": 4, "label": "Agent", "explanation": ""},
    ]
    assert merge_task_checklist_checked_ids(items, [5], frozenset()) == []
    assert merge_task_checklist_checked_ids(items, [1, 5], frozenset()) == [1, 5]
    assert merge_task_checklist_checked_ids(items, [1, 4], frozenset()) == [1, 4]
    assert merge_task_checklist_checked_ids(items, [1, 2, 4, 5], frozenset()) == [1, 2, 4, 5]
    assert merge_task_checklist_checked_ids(items, [1, 2, 4, 5, 3], frozenset()) == [1, 2, 3, 4, 5]


def test_merge_drops_client_requested_signature_based_ids():
    items = [
        {
            "id": 1,
            "order": 0,
            "label": "A",
            "explanation": "",
            "allow_unordered_check": True,
        },
        {
            "id": 6,
            "order": 1,
            "label": "Sign",
            "explanation": "",
            "allow_unordered_check": True,
            "completionType": "signature_based",
        },
    ]
    assert merge_task_checklist_checked_ids(items, [1, 6], frozenset()) == [1]


def test_apply_merge_budget_without_preapproval_reports_selectable():
    items = [
        {"id": 1, "order": 0, "label": "Pre-approval", "explanation": ""},
        {
            "id": 5,
            "order": 1,
            "label": "Budget",
            "explanation": "",
            "allow_unordered_check": True,
            "selectable_when": {"kind": "all_items_checked", "item_ids": [1]},
        },
    ]
    result = apply_task_checklist_merge(items, [5], frozenset())
    assert result.effective_ids == []
    assert result.stripped_requested_ids == [5]
    assert result.stripped_reason_codes == [MERGE_REASON_SELECTABLE_WHEN]


def test_apply_merge_signature_requested_is_stripped_with_reason():
    items = [
        {
            "id": 1,
            "order": 0,
            "label": "A",
            "explanation": "",
            "allow_unordered_check": True,
        },
        {
            "id": 6,
            "order": 1,
            "label": "Sign",
            "explanation": "",
            "allow_unordered_check": True,
            "completionType": "signature_based",
        },
    ]
    result = apply_task_checklist_merge(items, [1, 6], frozenset())
    assert result.effective_ids == [1]
    assert result.stripped_requested_ids == [6]
    assert result.stripped_reason_codes == [MERGE_REASON_SIGNATURE_BASED]
