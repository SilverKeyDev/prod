"""Unit tests for Option B transaction selection."""

from __future__ import annotations

import uuid

import pytest

from tests.support.user_roles import create_user_with_roles


@pytest.mark.unit
def test_create_transaction_allows_multiple_rows_per_buyer(app, db_session) -> None:
    with app.app_context():
        buyer = create_user_with_roles(
            db_session.session,
            roles=("buyer",),
            cognito_id=f"cognito-buyer-{uuid.uuid4().hex[:8]}",
            email=f"buyer-{uuid.uuid4().hex[:8]}@example.com",
            name="Buyer Multi",
            is_active=True,
            commit=False,
        )
        db_session.session.commit()
        buyer_id = str(buyer.id)

        from app.services.transactions.selection import (
            create_transaction,
            list_transactions_for_actor,
        )

        tx1 = create_transaction(buyer_id=buyer_id, set_active=True)
        tx2 = create_transaction(buyer_id=buyer_id, set_active=False)
        db_session.session.commit()

        assert tx1.id != tx2.id
        rows = list_transactions_for_actor(buyer_id, buyer_id=None, is_agent=False)
        assert len(rows) == 2
        assert str(buyer.active_transaction_id) == str(tx1.id)


@pytest.mark.unit
def test_resolve_active_transaction_uses_pointer(app, db_session) -> None:
    with app.app_context():
        buyer = create_user_with_roles(
            db_session.session,
            roles=("buyer",),
            cognito_id=f"cognito-buyer-{uuid.uuid4().hex[:8]}",
            email=f"buyer-{uuid.uuid4().hex[:8]}@example.com",
            name="Buyer Active",
            is_active=True,
            commit=False,
        )
        db_session.session.commit()
        buyer_id = str(buyer.id)

        from app.services.transactions.selection import (
            create_transaction,
            resolve_active_transaction,
            set_active_transaction,
        )

        older = create_transaction(buyer_id=buyer_id, set_active=True)
        newer = create_transaction(buyer_id=buyer_id, set_active=False)
        set_active_transaction(buyer_id=buyer_id, transaction_id=str(newer.id))
        db_session.session.commit()

        resolved = resolve_active_transaction(buyer_id)
        assert str(resolved.id) == str(newer.id)
        assert str(resolved.id) != str(older.id)


@pytest.mark.unit
def test_list_transactions_for_actor_agent_requires_client(app, db_session) -> None:
    with app.app_context():
        from app.services.transactions.selection import list_transactions_for_actor

        agent = create_user_with_roles(
            db_session.session,
            roles=("agent",),
            cognito_id=f"cognito-agent-{uuid.uuid4().hex[:8]}",
            email=f"agent-{uuid.uuid4().hex[:8]}@example.com",
            name="Agent List",
            is_active=True,
            commit=False,
        )
        db_session.session.commit()

        with pytest.raises(ValueError, match="buyer_id"):
            list_transactions_for_actor(str(agent.id), buyer_id=None, is_agent=True)
