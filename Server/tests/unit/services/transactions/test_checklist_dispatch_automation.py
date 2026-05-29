"""Unit tests for checklist dispatch automation helpers."""

from types import SimpleNamespace
from unittest.mock import patch

from app.services.transactions.checklist_dispatch_automation import (
    _recipient_ids_for_setting,
    item_supports_dispatch_automation,
)


def test_item_supports_dispatch_automation_escrow_deposit_step():
    assert item_supports_dispatch_automation("escrow", 2) is True
    assert item_supports_dispatch_automation("escrow", 1) is False


def test_recipient_ids_selected_clients_filters_to_agent_roster():
    setting = SimpleNamespace(
        recipient_scope="selected_clients",
        selected_client_ids=["keep", "drop", "keep2"],
    )
    with patch(
        "app.services.transactions.checklist_dispatch_automation.get_agent_client_ids",
        return_value=["keep", "keep2"],
    ):
        out = _recipient_ids_for_setting(
            agent_id="agent-1",
            checker_client_id="buyer-1",
            setting=setting,
        )
    assert out == ["keep", "keep2"]


def test_recipient_ids_context_client():
    setting = SimpleNamespace(recipient_scope="context_client", selected_client_ids=None)
    out = _recipient_ids_for_setting(
        agent_id="agent-1",
        checker_client_id="buyer-1",
        setting=setting,
    )
    assert out == ["buyer-1"]
