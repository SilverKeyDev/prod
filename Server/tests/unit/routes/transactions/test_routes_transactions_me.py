"""Route tests for GET /api/v1/transactions/me active deal payload."""

from __future__ import annotations

import uuid
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from flask import Flask

from app.models import Transaction
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID
from tests.support.user_roles import create_user_with_roles


@pytest.mark.api
def test_get_my_transaction_returns_transaction_me_data_shape(
    client, app: Flask, db_session
) -> None:
    with app.app_context():
        buyer = create_user_with_roles(
            db_session.session,
            roles=("buyer",),
            cognito_id=f"cognito-buyer-{uuid.uuid4().hex[:8]}",
            email=f"buyer-{uuid.uuid4().hex[:8]}@example.com",
            name="Buyer Me",
            is_active=True,
            commit=False,
        )
        tx_id = str(uuid.uuid4())
        db_session.session.add(
            Transaction(
                id=tx_id,
                buyer_id=str(buyer.id),
                brokerage_org_id=DEFAULT_BROKERAGE_ORG_ID,
            )
        )
        buyer.active_transaction_id = tx_id
        db_session.session.commit()
        buyer_id = str(buyer.id)

    actor = SimpleNamespace(id=buyer_id, active_transaction_id=tx_id)

    with patch("app.services.auth.get_current_user", return_value=actor):
        resp = client.get(
            "/api/v1/transactions/me",
            headers={"Authorization": "Bearer mock_token"},
        )

    assert resp.status_code == 200
    body = resp.get_json()
    assert body is not None
    assert body.get("success") is True
    data = body.get("data")
    assert isinstance(data, dict)
    assert "transaction" in data
    assert data["transaction"]["id"] == tx_id
    assert data.get("active_transaction_id") == tx_id
