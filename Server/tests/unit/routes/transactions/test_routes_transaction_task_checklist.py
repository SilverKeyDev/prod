"""Route tests for GET/PUT /api/v1/transactions/<id>/tasks checklist authz."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import patch

import pytest
from flask import Flask


@pytest.mark.api
def test_put_transaction_tasks_forbidden_when_agent_does_not_manage_client(
    client, app: Flask, db_session
) -> None:
    with app.app_context():
        from app.models import User

        agent = User(
            cognito_id="cognito-agent-tasks",
            email="agent-tasks@example.com",
            name="Agent Tasks",
            is_active=True,
        )
        buyer = User(
            cognito_id="cognito-buyer-tasks",
            email="buyer-tasks@example.com",
            name="Buyer Tasks",
            is_active=True,
        )
        db_session.session.add_all([agent, buyer])
        db_session.session.commit()
        agent_id = str(agent.id)
        buyer_id = str(buyer.id)

    actor = SimpleNamespace(id=agent_id)

    with (
        patch("app.services.auth.get_current_user", return_value=actor),
        patch("app.routes.transactions.get_agent_client_ids", return_value=[]),
        patch(
            "app.routes.transactions.perform_task_checklist_put",
            side_effect=AssertionError("PUT must not run when forbidden"),
        ),
    ):
        resp = client.put(
            f"/api/v1/transactions/{buyer_id}/tasks?type=closing",
            headers={"Authorization": "Bearer mock_token"},
            json={"data": {"items": [], "checkedIds": [1]}},
        )
        assert resp.status_code == 403


@pytest.mark.api
def test_put_transaction_tasks_ok_when_agent_manages_client(client, app: Flask, db_session) -> None:
    with app.app_context():
        from app.models import User

        agent = User(
            cognito_id="cognito-agent-tasks-2",
            email="agent-tasks2@example.com",
            name="Agent Tasks Two",
            is_active=True,
        )
        buyer = User(
            cognito_id="cognito-buyer-tasks-2",
            email="buyer-tasks2@example.com",
            name="Buyer Tasks Two",
            is_active=True,
        )
        db_session.session.add_all([agent, buyer])
        db_session.session.commit()
        agent_id = str(agent.id)
        buyer_id = str(buyer.id)

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
        patch("app.routes.transactions.get_agent_client_ids", return_value=[buyer_id]),
        patch("app.routes.transactions.perform_task_checklist_put", return_value=(payload, None)),
    ):
        resp = client.put(
            f"/api/v1/transactions/{buyer_id}/tasks?type=closing",
            headers={"Authorization": "Bearer mock_token"},
            json={"data": {"items": [], "checkedIds": [1]}},
        )
        assert resp.status_code == 200
        body = resp.get_json()
        assert body is not None
        assert body.get("success") is True
