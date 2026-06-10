"""Shared response builders for transaction route handlers."""

from app.models import Transaction
from app.services.transactions.address import address_payload_for_transaction
from app.services.transactions.serialization import transaction_to_api_dict


def me_transaction_payload(user, tx: Transaction) -> dict:
    active_id = str(user.active_transaction_id) if user.active_transaction_id else str(tx.id)
    return {
        "transaction": transaction_to_api_dict(tx),
        "active_transaction_id": active_id,
        "address": address_payload_for_transaction(str(tx.id)),
    }
