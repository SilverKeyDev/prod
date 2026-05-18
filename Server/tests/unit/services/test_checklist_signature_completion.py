"""Tests for signature-based checklist merge and helpers."""

from unittest.mock import MagicMock, patch

from app.services.transactions.checklist_signature_completion import (
    apply_signature_based_checked_ids,
    is_signature_step_satisfied,
    run_signature_step_auto_send,
)


def test_is_signature_step_satisfied_completed():
    ag = MagicMock()
    ag.status = "completed"
    assert is_signature_step_satisfied(ag) is True
    ag.status = "sent"
    assert is_signature_step_satisfied(ag) is False


@patch(
    "app.services.transactions.checklist_signature_completion.is_signature_step_complete",
    return_value=False,
)
def test_apply_signature_based_strips_without_agreement(_mock_complete):
    items = [
        {"id": 1, "order": 0},
        {"id": 6, "order": 5, "completion_type": "signature_based"},
    ]
    checked = {1, 6}
    apply_signature_based_checked_ids(items, "buyer-1", "search", checked)
    assert checked == {1}


@patch("app.services.transactions.checklist_signature_completion.ChecklistItemDispatchSetting")
@patch(
    "app.services.transactions.checklist_signature_completion.FormsService.send_form_via_docusign"
)
@patch(
    "app.services.transactions.checklist_signature_completion.resolve_agent_id_for_buyer",
    return_value="agent-1",
)
@patch(
    "app.services.transactions.checklist_signature_completion.step_has_non_void_agreement",
    return_value=False,
)
@patch(
    "app.services.transactions.checklist_signature_completion.is_signature_step_complete",
    return_value=False,
)
def test_run_signature_step_auto_send_skips_when_locked(
    _complete,
    _has_agreement,
    _agent,
    _docusign,
    _dispatch_model,
):
    _dispatch_model.query.filter_by.return_value.first.return_value = None
    items_raw = [
        {"id": 1, "order": 0},
        {
            "id": 6,
            "order": 1,
            "completion_type": "signature_based",
            "suggested_form_ids": ["a"],
            "selectable_when": {"kind": "all_items_checked", "item_ids": [1]},
        },
    ]
    run_signature_step_auto_send(
        buyer_user_id="buyer-1",
        checklist_category="search",
        effective_checked_ids=set(),
        items_raw=items_raw,
    )
    _docusign.assert_not_called()


@patch("app.services.transactions.checklist_signature_completion.ChecklistItemDispatchSetting")
@patch(
    "app.services.transactions.checklist_signature_completion.FormsService.send_form_via_docusign"
)
@patch(
    "app.services.transactions.checklist_signature_completion._first_resolved_checklist_form",
    return_value=MagicMock(id="form-1", form_key="buyer_broker_exclusive"),
)
@patch(
    "app.services.transactions.checklist_signature_completion.resolve_agent_id_for_buyer",
    return_value="agent-1",
)
@patch(
    "app.services.transactions.checklist_signature_completion.step_has_non_void_agreement",
    return_value=False,
)
@patch(
    "app.services.transactions.checklist_signature_completion.is_signature_step_complete",
    return_value=False,
)
def test_run_signature_step_auto_send_invokes_docusign_when_unlocked(
    _complete,
    _has_agreement,
    _agent,
    _first_form,
    _docusign,
    _dispatch_model,
):
    _dispatch_model.query.filter_by.return_value.first.return_value = None
    items_raw = [
        {"id": 1, "order": 0},
        {
            "id": 6,
            "order": 1,
            "completion_type": "signature_based",
            "suggested_form_ids": ["a"],
            "selectable_when": {"kind": "all_items_checked", "item_ids": [1]},
        },
    ]
    run_signature_step_auto_send(
        buyer_user_id="buyer-1",
        checklist_category="search",
        effective_checked_ids={1},
        items_raw=items_raw,
    )
    _docusign.assert_called_once()
