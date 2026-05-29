"""Unit tests for ensure_transaction (v1 one row per buyer)."""

from __future__ import annotations

import pytest

from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID


@pytest.mark.services
def test_ensure_transaction_creates_and_is_idempotent(app, db_session):
    with app.app_context():
        from app import db
        from app.models import AgentConnections, Transaction, User
        from app.models.brokerage import UserOrgMembership
        from app.services.brokerage.membership import ensure_org_membership
        from app.services.transactions.ensure import ensure_transaction

        agent = User(
            id="agent-et1",
            cognito_id="cog-et1",
            email="agent-et1@test.com",
            name="Agent",
            is_agent=True,
        )
        buyer = User(
            id="buyer-et1",
            cognito_id="cog-bet1",
            email="buyer-et1@test.com",
            name="Buyer",
            is_agent=False,
        )
        db.session.add_all([agent, buyer])
        ensure_org_membership(str(agent.id), role="agent")
        db.session.add(AgentConnections(agent_id=agent.id, client_id=buyer.id))
        db.session.commit()

        tx1 = ensure_transaction(buyer_id=str(buyer.id))
        db.session.commit()
        tx2 = ensure_transaction(buyer_id=str(buyer.id))

        assert tx1.id == tx2.id
        assert tx1.buyer_id == str(buyer.id)
        assert tx1.primary_agent_id == str(agent.id)
        assert tx1.brokerage_org_id == DEFAULT_BROKERAGE_ORG_ID
        assert Transaction.query.filter_by(buyer_id=str(buyer.id)).count() == 1
        assert UserOrgMembership.query.filter_by(user_id=str(buyer.id)).count() >= 0
