"""Route tests for GET .../tasks/progress-summary."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import patch

import pytest
from flask import Flask


@pytest.mark.api
def test_get_transaction_tasks_progress_summary_forbidden(client, app: Flask, db_session) -> None:
    with app.app_context():
        from app.models import User

        agent = User(
            cognito_id="cognito-agent-summary",
            email="agent-summary@example.com",
            name="Agent Summary",
            is_active=True,
        )
        buyer = User(
            cognito_id="cognito-buyer-summary",
            email="buyer-summary@example.com",
            name="Buyer Summary",
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
            "app.routes.transactions.build_task_checklist_progress_summary",
            side_effect=AssertionError("summary must not run when forbidden"),
        ),
    ):
        resp = client.get(
            f"/api/v1/transactions/{buyer_id}/tasks/progress-summary",
            headers={"Authorization": "Bearer mock_token"},
        )
        assert resp.status_code == 403


@pytest.mark.api
def test_get_transaction_tasks_progress_summary_ok(client, app: Flask, db_session) -> None:
    with app.app_context():
        from app.models import User

        buyer = User(
            cognito_id="cognito-buyer-summary-2",
            email="buyer-summary-2@example.com",
            name="Buyer Summary 2",
            is_active=True,
        )
        db_session.session.add(buyer)
        db_session.session.commit()
        buyer_id = str(buyer.id)

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
            f"/api/v1/transactions/{buyer_id}/tasks/progress-summary",
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
            "app.routes.tasks.build_task_checklist_progress_summary",
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
