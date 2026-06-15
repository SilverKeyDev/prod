"""Authorize access to a transaction row."""

from __future__ import annotations

from typing import Any

from app.models import Transaction
from app.services.agent.client_service import agent_may_access_client
from app.services.transactions.lookup import get_transaction_by_id


def resolve_authorized_transaction(user: Any, transaction_id: str) -> Transaction | None:
    tx = get_transaction_by_id(str(transaction_id))
    if tx is None or not can_access_transaction(user, tx):
        return None
    return tx


def can_access_transaction(user: Any, transaction: Transaction) -> bool:
    if transaction is None or user is None:
        return False
    if str(user.id) == str(transaction.buyer_id):
        return True
    return agent_may_access_client(str(user.id), str(transaction.buyer_id))
