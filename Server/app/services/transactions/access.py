"""Authorize access to a transaction row."""

from __future__ import annotations

from typing import Any

from app.models import Transaction
from app.services.agent.client_service import agent_may_access_client


def can_access_transaction(user: Any, transaction: Transaction) -> bool:
    if transaction is None or user is None:
        return False
    if str(user.id) == str(transaction.buyer_id):
        return True
    return agent_may_access_client(str(user.id), str(transaction.buyer_id))
