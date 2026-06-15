"""Serialize transaction rows for API responses."""

from __future__ import annotations

from typing import Any

from app.models import Transaction


def transaction_to_api_dict(tx: Transaction) -> dict[str, Any]:
    created = tx.created_at.isoformat() if tx.created_at else None
    updated = tx.updated_at.isoformat() if tx.updated_at else None
    return {
        "id": str(tx.id),
        "buyer_id": str(tx.buyer_id),
        "primary_agent_id": str(tx.primary_agent_id) if tx.primary_agent_id else None,
        "brokerage_org_id": str(tx.brokerage_org_id),
        "status": tx.status,
        "display_label": tx.display_label,
        "created_at": created,
        "updated_at": updated,
    }
