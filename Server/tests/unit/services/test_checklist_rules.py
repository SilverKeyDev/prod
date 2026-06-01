"""Unit tests for checklist rule merge (parity with client)."""

from app.services.transactions.checklist_support.checklist_rules import (
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


def test_merge_allows_later_step_before_earlier_in_template_order():
    """Parity with Client: checklist steps may be completed out of template order."""
    items = [
        {"id": 99, "label": "Appears first in API array", "explanation": ""},
        {"id": 77, "label": "Appears second in API array", "explanation": ""},
    ]
    assert merge_task_checklist_checked_ids(items, [77], frozenset()) == [77]
    assert merge_task_checklist_checked_ids(items, [99, 77], frozenset()) == [77, 99]


def test_apply_merge_keeps_later_step_when_earlier_is_still_open():
    items = [
        {"id": 1, "order": 0, "label": "A", "explanation": ""},
        {"id": 2, "order": 1, "label": "B", "explanation": ""},
    ]
    result = apply_task_checklist_merge(items, [2], frozenset())
    assert result.effective_ids == [2]
    assert result.stripped_requested_ids == []
    assert result.stripped_reason_codes == []


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


def test_merge_allows_uncheck_without_lock_uncheck_when():
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
    assert merge_task_checklist_checked_ids(items, [1], frozenset({1, 2})) == [1]


def test_merge_bypass_progress_gates_allows_submit_gated_without_prerequisites():
    items = [
        {
            "id": 2,
            "order": 1,
            "label": "Budget",
            "explanation": "",
            "component_key": "set_budget",
            "completion_requires_submit": True,
            "selectable_when": {"kind": "all_items_checked", "item_ids": [1]},
        },
    ]
    assert merge_task_checklist_checked_ids(items, [2], frozenset()) == []
    assert merge_task_checklist_checked_ids(
        items, [2], frozenset(), bypass_progress_gates=True
    ) == [2]


def test_merge_selectable_strips_submit_gated_integration():
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
            "label": "Budget",
            "explanation": "",
            "allow_unordered_check": True,
            "component_key": "set_budget",
            "completion_requires_submit": True,
            "selectable_when": {"kind": "all_items_checked", "item_ids": [1]},
        },
    ]
    assert merge_task_checklist_checked_ids(items, [2], frozenset()) == []


def test_merge_ignores_selectable_when_for_non_gated_steps():
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
    assert merge_task_checklist_checked_ids(items, [2], frozenset()) == [2]


def test_merge_search_parallel_integrations_without_preapproval_gate():
    """Budget / areas / criteria: may be checked in parallel without pre-approval (item 1)."""
    items = [
        {"id": 5, "order": 0, "label": "Budget", "explanation": "", "allow_unordered_check": True},
        {"id": 4, "order": 1, "label": "Areas", "explanation": "", "allow_unordered_check": True},
        {
            "id": 2,
            "order": 2,
            "label": "Criteria",
            "explanation": "",
            "allow_unordered_check": True,
        },
        {"id": 1, "order": 3, "label": "Pre-approval", "explanation": ""},
        {"id": 3, "order": 4, "label": "Agent", "explanation": ""},
    ]
    assert merge_task_checklist_checked_ids(items, [5], frozenset()) == [5]
    assert merge_task_checklist_checked_ids(items, [4], frozenset()) == [4]
    assert merge_task_checklist_checked_ids(items, [2], frozenset()) == [2]
    assert merge_task_checklist_checked_ids(items, [2, 4, 5], frozenset()) == [2, 4, 5]
    assert merge_task_checklist_checked_ids(items, [1, 2, 4, 5], frozenset()) == [1, 2, 4, 5]


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


def test_apply_merge_budget_without_preapproval_succeeds_when_no_selectable_gate():
    items = [
        {"id": 5, "order": 0, "label": "Budget", "explanation": "", "allow_unordered_check": True},
        {"id": 1, "order": 3, "label": "Pre-approval", "explanation": ""},
    ]
    result = apply_task_checklist_merge(items, [5], frozenset())
    assert result.effective_ids == [5]
    assert result.stripped_requested_ids == []


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
