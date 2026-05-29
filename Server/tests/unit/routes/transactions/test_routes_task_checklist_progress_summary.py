"""Route tests for GET .../tasks/progress-summary."""

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
        name="Agent Summary",
        is_active=True,
    )
    buyer = User(
        cognito_id=f"cognito-buyer-{uuid.uuid4().hex[:8]}",
        email=f"buyer-{uuid.uuid4().hex[:8]}@example.com",
        name="Buyer Summary",
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
def test_get_transaction_tasks_progress_summary_forbidden(client, app: Flask, db_session) -> None:
    with app.app_context():
        agent_id, _buyer_id, tx_id = _seed_agent_buyer_tx(db_session)
        db_session.session.commit()

    actor = SimpleNamespace(id=agent_id)

    with (
        patch("app.services.auth.get_current_user", return_value=actor),
        patch(
            "app.routes.transactions.build_task_checklist_progress_summary",
            side_effect=AssertionError("summary must not run when forbidden"),
        ),
    ):
        resp = client.get(
            f"/api/v1/transactions/{tx_id}/tasks/progress-summary",
            headers={"Authorization": "Bearer mock_token"},
        )
        assert resp.status_code == 403


@pytest.mark.api
def test_get_transaction_tasks_progress_summary_ok(client, app: Flask, db_session) -> None:
    with app.app_context():
        _agent_id, buyer_id, tx_id = _seed_agent_buyer_tx(db_session)
        db_session.session.commit()

    actor = SimpleNamespace(id=buyer_id)
    fake_summary = {
        "sections": {"search": {"completed": 1, "total": 2, "isComplete": False}},
        "overall": {"completed": 1, "total": 2, "percent": 50},
    }

    with (
        patch("app.services.auth.get_current_user", return_value=actor),
        patch(
            "app.routes.transactions.build_task_checklist_progress_summary",
            return_value=fake_summary,
        ),
    ):
        resp = client.get(
            f"/api/v1/transactions/{tx_id}/tasks/progress-summary",
            headers={"Authorization": "Bearer mock_token"},
        )
        assert resp.status_code == 200
        body = resp.get_json()
        assert body["success"] is True
        assert body["data"]["overall"]["percent"] == 50


@pytest.mark.api
def test_get_tasks_progress_summary_ok(client, app: Flask, db_session) -> None:
    with app.app_context():
        from app.models import User

        buyer = User(
            cognito_id="cognito-buyer-self-summary",
            email="buyer-self-summary@example.com",
            name="Buyer Self Summary",
            is_active=True,
        )
        db_session.session.add(buyer)
        db_session.session.commit()
        buyer_id = str(buyer.id)

    actor = SimpleNamespace(id=buyer_id)
    fake_summary = {
        "sections": {"closing": {"completed": 0, "total": 3, "isComplete": False}},
        "overall": {"completed": 0, "total": 3, "percent": 0},
    }

    with (
        patch("app.services.auth.get_current_user", return_value=actor),
        patch(
            "app.routes.tasks.build_task_checklist_progress_summary_for_buyer",
            return_value=fake_summary,
        ),
    ):
        resp = client.get(
            "/api/v1/tasks/progress-summary",
            headers={"Authorization": "Bearer mock_token"},
        )
        assert resp.status_code == 200
        body = resp.get_json()
        assert body["success"] is True
        assert body["data"]["sections"]["closing"]["total"] == 3
