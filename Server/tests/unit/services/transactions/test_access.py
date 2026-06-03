"""Unit tests for transaction access authorization."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import patch

import pytest

from app.services.transactions.access import can_access_transaction


def _tx(buyer_id: str = "buyer-1"):
    return SimpleNamespace(buyer_id=buyer_id)


@pytest.mark.parametrize(
    ("user", "transaction", "expected"),
    [
        (None, _tx(), False),
        (SimpleNamespace(id="buyer-1"), None, False),
        (SimpleNamespace(id="buyer-1"), _tx("buyer-1"), True),
        (SimpleNamespace(id="other-user"), _tx("buyer-1"), False),
    ],
)
def test_can_access_transaction_buyer_and_null_cases(user, transaction, expected):
    with patch(
        "app.services.transactions.access.agent_may_access_client",
        return_value=False,
    ):
        assert can_access_transaction(user, transaction) is expected


def test_can_access_transaction_agent_with_client_access():
    user = SimpleNamespace(id="agent-1")
    transaction = _tx("buyer-1")
    with patch(
        "app.services.transactions.access.agent_may_access_client",
        return_value=True,
    ) as mock_access:
        assert can_access_transaction(user, transaction) is True
        mock_access.assert_called_once_with("agent-1", "buyer-1")


def test_can_access_transaction_agent_without_client_access():
    user = SimpleNamespace(id="agent-1")
    transaction = _tx("buyer-1")
    with patch(
        "app.services.transactions.access.agent_may_access_client",
        return_value=False,
    ):
        assert can_access_transaction(user, transaction) is False
