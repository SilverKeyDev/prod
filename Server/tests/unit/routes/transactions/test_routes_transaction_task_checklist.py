"""Route tests for GET/PUT /api/v1/transactions/<id>/tasks checklist authz."""

from __future__ import annotations

import uuid
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from flask import Flask

from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID


def _seed_agent_buyer_tx(db_session):
    from app.models import Transaction, User, UserRole

    agent = User(
        cognito_id=f"cognito-agent-{uuid.uuid4().hex[:8]}",
        email=f"agent-{uuid.uuid4().hex[:8]}@example.com",
        name="Agent Tasks",
        is_active=True,
    )
    buyer = User(
        cognito_id=f"cognito-buyer-{uuid.uuid4().hex[:8]}",
        email=f"buyer-{uuid.uuid4().hex[:8]}@example.com",
        name="Buyer Tasks",
        is_active=True,
    )
    db_session.session.add_all([agent, buyer])
    db_session.session.flush()
    db_session.session.add(UserRole(user_id=str(agent.id), role="agent"))
    db_session.session.add(UserRole(user_id=str(buyer.id), role="buyer"))
    tx_id = str(uuid.uuid4())
    db_session.session.add(
        Transaction(
            id=tx_id,
            buyer_id=str(buyer.id),
            primary_agent_id=str(agent.id),
            brokerage_org_id=DEFAULT_BROKERAGE_ORG_ID,
        )
    )
    return str(agent.id), str(buyer.id), tx_id


@pytest.mark.api
def test_get_transaction_tasks_forbidden_when_agent_does_not_manage_client(
    client, app: Flask, db_session
) -> None:
    with app.app_context():
        agent_id, buyer_id, tx_id = _seed_agent_buyer_tx(db_session)
        db_session.session.commit()

    actor = SimpleNamespace(id=agent_id)

    with (
        patch("app.services.auth.get_current_user", return_value=actor),
        patch(
            "app.routes.transactions.build_task_checklist_data",
            side_effect=AssertionError("GET must not run when forbidden"),
        ),
    ):
        resp = client.get(
            f"/api/v1/transactions/{tx_id}/tasks?type=closing",
            headers={"Authorization": "Bearer mock_token"},
        )
        assert resp.status_code == 403
        body = resp.get_json()
        assert body is not None
        assert body.get("success") is False


@pytest.mark.api
def test_put_transaction_tasks_forbidden_when_agent_does_not_manage_client(
    client, app: Flask, db_session
) -> None:
    with app.app_context():
        agent_id, buyer_id, tx_id = _seed_agent_buyer_tx(db_session)
        db_session.session.commit()

    actor = SimpleNamespace(id=agent_id)

    with (
        patch("app.services.auth.get_current_user", return_value=actor),
        patch(
            "app.routes.transactions.perform_task_checklist_put",
            side_effect=AssertionError("PUT must not run when forbidden"),
        ),
    ):
        resp = client.put(
            f"/api/v1/transactions/{tx_id}/tasks?type=closing",
            headers={"Authorization": "Bearer mock_token"},
            json={"data": {"items": [], "checkedIds": [1]}},
        )
        assert resp.status_code == 403


@pytest.mark.api
def test_put_transaction_tasks_ok_when_agent_manages_client(client, app: Flask, db_session) -> None:
    with app.app_context():
        from app.models import AgentConnections
        from app.services.agent.client_service import agent_may_access_client
        from app.services.auth.user_role_helpers import get_user_if_agent
        from app.services.transactions.lookup import get_transaction_by_id

        agent_id, buyer_id, tx_id = _seed_agent_buyer_tx(db_session)
        db_session.session.add(AgentConnections(agent_id=agent_id, client_id=buyer_id))
        db_session.session.commit()

        assert get_transaction_by_id(tx_id) is not None
        assert get_user_if_agent(agent_id) is not None
        assert (
            AgentConnections.query.filter_by(agent_id=agent_id, client_id=buyer_id).first()
            is not None
        )
        assert agent_may_access_client(agent_id, buyer_id) is True

    actor = SimpleNamespace(id=agent_id)

    payload = {
        "success": True,
        "data": {
            "items": [],
            "checkedIds": [1],
            "title": "t",
            "subtitle": None,
            "deadline": None,
            "date_finished": None,
        },
    }

    with (
        patch("app.services.auth.get_current_user", return_value=actor),
        patch("app.routes.transactions.perform_task_checklist_put", return_value=(payload, None)),
    ):
        resp = client.put(
            f"/api/v1/transactions/{tx_id}/tasks?type=closing",
            headers={"Authorization": "Bearer mock_token"},
            json={"data": {"items": [], "checkedIds": [1]}},
        )
        assert resp.status_code == 200, resp.get_json()
        body = resp.get_json()
        assert body is not None
        assert body.get("success") is True
