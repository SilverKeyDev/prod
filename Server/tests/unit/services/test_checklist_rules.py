"""Unit tests for checklist rule merge (parity with client)."""

from app.services.transactions.checklist_rules import (
    evaluate_checklist_condition,
    merge_task_checklist_checked_ids,
)


def test_evaluate_all_items_checked_empty_ids():
    assert evaluate_checklist_condition({"kind": "all_items_checked", "item_ids": []}, {1}) is True


def test_evaluate_any_item_checked_empty_ids():
    assert evaluate_checklist_condition({"kind": "any_item_checked", "item_ids": []}, {1}) is False


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
