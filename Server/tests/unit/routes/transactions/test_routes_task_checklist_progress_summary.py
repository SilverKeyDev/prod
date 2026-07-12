"""Route tests for GET .../tasks/progress-summary."""

from __future__ import annotations

import uuid
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from flask import Flask

from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID
from tests.support.user_roles import create_user_with_roles


def _seed_agent_buyer_tx(db_session):
    from app.models import Transaction

    agent = create_user_with_roles(
        db_session.session,
        roles=("agent",),
        cognito_id=f"cognito-agent-{uuid.uuid4().hex[:8]}",
        email=f"agent-{uuid.uuid4().hex[:8]}@example.com",
        name="Agent Summary",
        is_active=True,
        commit=False,
    )
    buyer = create_user_with_roles(
        db_session.session,
        roles=("buyer",),
        cognito_id=f"cognito-buyer-{uuid.uuid4().hex[:8]}",
        email=f"buyer-{uuid.uuid4().hex[:8]}@example.com",
        name="Buyer Summary",
        is_active=True,
        commit=False,
    )
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
def test_get_transaction_tasks_progress_summary_forbidden_when_agent_does_not_manage_client(
    client, app: Flask, db_session
) -> None:
    with app.app_context():
        _, _buyer_id, tx_id = _seed_agent_buyer_tx(db_session)
        other_agent = create_user_with_roles(
            db_session.session,
            roles=("agent",),
            cognito_id=f"cognito-other-agent-{uuid.uuid4().hex[:8]}",
            email=f"other-agent-{uuid.uuid4().hex[:8]}@example.com",
            name="Other Agent",
            is_active=True,
            commit=False,
        )
        db_session.session.commit()
        agent_id = str(other_agent.id)

    actor = SimpleNamespace(id=agent_id)

    with (
        patch("app.services.auth.get_current_user", return_value=actor),
        patch(
            "app.routes.transactions.handlers.checklist.build_task_checklist_progress_summary",
            side_effect=AssertionError("summary must not run when forbidden"),
        ),
    ):
        resp = client.get(
            f"/api/v1/transactions/{tx_id}/tasks/progress-summary",
            headers={"Authorization": "Bearer mock_token"},
        )
        assert resp.status_code == 403
        body = resp.get_json()
        assert body is not None
        assert body.get("success") is False
        assert body.get("error") == "FORBIDDEN"


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
            "app.routes.transactions.handlers.checklist.build_task_checklist_progress_summary",
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
def test_get_transaction_tasks_progress_summary_ok_when_agent_manages_client(
    client, app: Flask, db_session
) -> None:
    with app.app_context():
        agent_id, _buyer_id, tx_id = _seed_agent_buyer_tx(db_session)
        db_session.session.commit()

    actor = SimpleNamespace(id=agent_id)
    fake_summary = {
        "sections": {"search": {"completed": 1, "total": 2, "isComplete": False}},
        "overall": {"completed": 1, "total": 2, "percent": 50},
    }

    with (
        patch("app.services.auth.get_current_user", return_value=actor),
        patch(
            "app.routes.transactions.handlers.checklist.build_task_checklist_progress_summary",
            return_value=fake_summary,
        ),
    ):
        resp = client.get(
            f"/api/v1/transactions/{tx_id}/tasks/progress-summary",
            headers={"Authorization": "Bearer mock_token"},
        )
        assert resp.status_code == 200, resp.get_json()
        body = resp.get_json()
        assert body["success"] is True
        assert body["data"]["overall"]["percent"] == 50
