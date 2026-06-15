"""Option B deal selection: create, list, and resolve active transaction per buyer."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app import db
from app.models import AgentConnections, Transaction, User
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID
from app.services.brokerage.membership import primary_brokerage_org_id_for_agent
from app.services.transactions.persistence import persist_transaction_session
from app.services.transactions.serialization import transaction_to_api_dict
from app.utils.db.orm_lookup import get_model


def _first_agent_for_buyer(buyer_id: str) -> str | None:
    conn = db.session.scalar(
        select(AgentConnections)
        .where(AgentConnections.client_id == str(buyer_id))
        .order_by(AgentConnections.created_at.asc())
    )
    return str(conn.agent_id) if conn and conn.agent_id else None


def _create_transaction_row(
    *,
    buyer_id: str,
    primary_agent_id: str | None = None,
    brokerage_org_id: str | None = None,
    status: str | None = "active",
    display_label: str | None = None,
) -> Transaction:
    buyer_id = str(buyer_id).strip()
    if not buyer_id:
        raise ValueError("buyer_id is required")

    agent_id = primary_agent_id or _first_agent_for_buyer(buyer_id)
    org_id = brokerage_org_id
    if not org_id and agent_id:
        org_id = primary_brokerage_org_id_for_agent(agent_id)
    if not org_id:
        org_id = DEFAULT_BROKERAGE_ORG_ID

    now = datetime.now(timezone.utc)
    tx = Transaction(
        id=str(uuid.uuid4()),
        buyer_id=buyer_id,
        primary_agent_id=agent_id,
        brokerage_org_id=org_id,
        status=status,
        display_label=display_label,
        created_at=now,
        updated_at=now,
    )
    db.session.add(tx)
    db.session.flush()
    return tx


def create_transaction(
    *,
    buyer_id: str,
    primary_agent_id: str | None = None,
    brokerage_org_id: str | None = None,
    set_active: bool = True,
) -> Transaction:
    """Create a new deal row (always inserts; does not dedupe by buyer)."""
    tx = _create_transaction_row(
        buyer_id=buyer_id,
        primary_agent_id=primary_agent_id,
        brokerage_org_id=brokerage_org_id,
    )
    if set_active:
        buyer = get_model(User, buyer_id)
        if buyer:
            buyer.active_transaction_id = str(tx.id)
    return tx


def _transaction_owned_by_buyer(tx: Transaction | None, buyer_id: str) -> bool:
    return tx is not None and str(tx.buyer_id) == str(buyer_id)


def resolve_active_transaction(buyer_id: str) -> Transaction:
    """
    Return the buyer's active deal: explicit pointer, else latest updated, else create first deal.
    """
    buyer_id = str(buyer_id).strip()
    buyer = get_model(User, buyer_id)
    if buyer and buyer.active_transaction_id:
        active = db.session.scalar(
            select(Transaction).where(Transaction.id == str(buyer.active_transaction_id))
        )
        if _transaction_owned_by_buyer(active, buyer_id):
            return active

    latest = db.session.scalar(
        select(Transaction)
        .where(Transaction.buyer_id == buyer_id)
        .order_by(Transaction.updated_at.desc(), Transaction.created_at.desc())
    )
    if latest:
        if buyer and not buyer.active_transaction_id:
            buyer.active_transaction_id = str(latest.id)
        return latest

    tx = _create_transaction_row(buyer_id=buyer_id)
    if buyer:
        buyer.active_transaction_id = str(tx.id)
    return tx


def preferred_transaction_for_buyer(buyer_id: str) -> Transaction:
    """Agent client list / hub: active or latest deal for a buyer."""
    return resolve_active_transaction(buyer_id)


def set_active_transaction(*, buyer_id: str, transaction_id: str) -> Transaction:
    buyer_id = str(buyer_id).strip()
    tx = db.session.scalar(select(Transaction).where(Transaction.id == str(transaction_id)))
    if not _transaction_owned_by_buyer(tx, buyer_id):
        raise ValueError("Transaction not found")
    buyer = get_model(User, buyer_id)
    if not buyer:
        raise ValueError("Buyer not found")
    buyer.active_transaction_id = str(tx.id)
    db.session.flush()
    return tx


def list_transactions_for_actor(
    actor_user_id: str,
    *,
    buyer_id: str | None = None,
    is_agent: bool,
) -> list[Transaction]:
    actor_user_id = str(actor_user_id)
    if is_agent:
        from app.services.agent.client_service import agent_may_access_client

        if not buyer_id:
            raise ValueError("buyer_id is required for agents")
        if not agent_may_access_client(actor_user_id, str(buyer_id)):
            raise PermissionError("Agent does not manage this client")
        target_buyer = str(buyer_id)
    else:
        target_buyer = actor_user_id
        if buyer_id and str(buyer_id) != actor_user_id:
            raise PermissionError("Buyers may only list their own deals")

    rows = db.session.scalars(
        select(Transaction)
        .where(Transaction.buyer_id == target_buyer)
        .order_by(Transaction.updated_at.desc(), Transaction.created_at.desc())
    ).all()
    return list(rows)


def list_transactions_api_payload(rows: list[Transaction]) -> list[dict]:
    return [transaction_to_api_dict(tx) for tx in rows]


def list_transactions_for_actor_with_commit(
    actor_user_id: str,
    *,
    buyer_id: str | None = None,
    is_agent: bool,
) -> list[Transaction]:
    rows = list_transactions_for_actor(actor_user_id, buyer_id=buyer_id, is_agent=is_agent)
    persist_transaction_session()
    return rows


def create_transaction_with_commit(
    *,
    buyer_id: str,
    primary_agent_id: str | None = None,
    brokerage_org_id: str | None = None,
    set_active: bool = True,
    fallback_agent_id: str | None = None,
) -> Transaction:
    tx = create_transaction(
        buyer_id=buyer_id,
        primary_agent_id=primary_agent_id,
        brokerage_org_id=brokerage_org_id,
        set_active=set_active,
    )
    if fallback_agent_id and not tx.primary_agent_id:
        tx.primary_agent_id = str(fallback_agent_id)
    persist_transaction_session()
    return tx


def resolve_active_transaction_with_commit(buyer_id: str) -> Transaction:
    tx = resolve_active_transaction(buyer_id)
    persist_transaction_session()
    return tx


def set_active_transaction_with_commit(*, buyer_id: str, transaction_id: str) -> Transaction:
    tx = set_active_transaction(buyer_id=buyer_id, transaction_id=transaction_id)
    persist_transaction_session()
    return tx
