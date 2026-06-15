"""Tests for rev-share step view recording."""

from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch

from sqlalchemy import func, select

from app import db
from app.models import BuyerStepView, Partner, Transaction, User
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID

from .conftest import assert_resource_not_found

_BUYER = SimpleNamespace(
    id="buyer-1",
    user_roles=[SimpleNamespace(role="buyer")],
)


def test_step_view_idempotent(client, app, db_session):
    with app.app_context():
        buyer = User(id="buyer-1", email="buyer@v.com", name="B")
        agent = User(id="agent-1", email="ag@v.com", name="A")
        db.session.add_all([buyer, agent])
        db.session.commit()
        tx = Transaction(
            id="tx-v",
            buyer_id=buyer.id,
            primary_agent_id=agent.id,
            brokerage_org_id=DEFAULT_BROKERAGE_ORG_ID,
        )
        db.session.add(tx)
        db.session.commit()

    with patch("app.services.auth.get_current_user", return_value=_BUYER):
        for _ in range(2):
            resp = client.post(
                "/api/v1/rev-share/step-views",
                headers={"Authorization": "Bearer mock"},
                json={"step_id": "closing:13", "transaction_id": "tx-v"},
            )
            assert resp.status_code == 200

    with app.app_context():
        assert db.session.scalar(select(func.count()).select_from(BuyerStepView)) == 1


def test_step_view_snapshots_partner_payout_on_create(client, app, db_session):
    with app.app_context():
        buyer = User(id="buyer-1", email="buyer@v.com", name="B")
        agent = User(id="agent-1", email="ag@v.com", name="A")
        partner = Partner(
            name="Snap Partner",
            slug="snap-partner",
            destination_url_template="https://example.com",
            step_id="closing:13",
            step_ids=["closing:13"],
            target_roles=["buyer"],
            payout_type="on_click",
            payout_per_conversion=Decimal("12.50"),
            is_active=True,
        )
        db.session.add_all([buyer, agent, partner])
        db.session.commit()
        tx = Transaction(
            id="tx-v",
            buyer_id=buyer.id,
            primary_agent_id=agent.id,
            brokerage_org_id=DEFAULT_BROKERAGE_ORG_ID,
        )
        db.session.add(tx)
        db.session.commit()
        partner_id = partner.id

    with patch("app.services.auth.get_current_user", return_value=_BUYER):
        resp = client.post(
            "/api/v1/rev-share/step-views",
            headers={"Authorization": "Bearer mock"},
            json={"step_id": "closing:13", "transaction_id": "tx-v"},
        )
        assert resp.status_code == 200

    with app.app_context():
        row = db.session.scalar(select(BuyerStepView))
        assert row.partner_payout_snapshot == [
            {
                "partner_id": partner_id,
                "payout_type": "on_click",
                "payout_per_conversion": "12.50",
            }
        ]


def test_step_view_posthog_only_on_first_create(client, app, db_session):
    with app.app_context():
        buyer = User(id="buyer-1", email="buyer@v.com", name="B")
        agent = User(id="agent-1", email="ag@v.com", name="A")
        db.session.add_all([buyer, agent])
        db.session.commit()
        tx = Transaction(
            id="tx-v",
            buyer_id=buyer.id,
            primary_agent_id=agent.id,
            brokerage_org_id=DEFAULT_BROKERAGE_ORG_ID,
        )
        db.session.add(tx)
        db.session.commit()

    with (
        patch("app.services.auth.get_current_user", return_value=_BUYER),
        patch("app.routes.rev_share.handlers.step_views.capture_product_event") as mock_capture,
    ):
        for _ in range(2):
            resp = client.post(
                "/api/v1/rev-share/step-views",
                headers={"Authorization": "Bearer mock"},
                json={"step_id": "closing:13", "transaction_id": "tx-v"},
            )
            assert resp.status_code == 200

    assert mock_capture.call_count == 1


def test_step_view_exposure_includes_partners_on_secondary_step_id(client, app, db_session):
    with app.app_context():
        buyer = User(id="buyer-1", email="buyer@v.com", name="B")
        agent = User(id="agent-1", email="ag@v.com", name="A")
        partner = Partner(
            name="RON Partner",
            slug="ron-partner",
            destination_url_template="https://example.com/notary",
            step_id="closing:2",
            step_ids=["closing:2", "closing:13"],
            target_roles=["buyer"],
            payout_type="on_click",
            is_active=True,
        )
        db.session.add_all([buyer, agent, partner])
        db.session.commit()
        tx = Transaction(
            id="tx-v",
            buyer_id=buyer.id,
            primary_agent_id=agent.id,
            brokerage_org_id=DEFAULT_BROKERAGE_ORG_ID,
        )
        db.session.add(tx)
        db.session.commit()
        partner_id = partner.id

    with (
        patch("app.services.auth.get_current_user", return_value=_BUYER),
        patch("app.routes.rev_share.handlers.step_views.capture_product_event") as mock_capture,
    ):
        resp = client.post(
            "/api/v1/rev-share/step-views",
            headers={"Authorization": "Bearer mock"},
            json={"step_id": "closing:13", "transaction_id": "tx-v"},
        )
        assert resp.status_code == 200

    assert mock_capture.call_count == 1
    props = mock_capture.call_args.kwargs.get("properties") or mock_capture.call_args[1].get(
        "properties"
    )
    assert props["step_id"] == "closing:13"
    assert partner_id in props["partner_ids"]


def test_step_view_unknown_transaction_returns_resource_not_found(client, app):
    with patch("app.services.auth.get_current_user", return_value=_BUYER):
        resp = client.post(
            "/api/v1/rev-share/step-views",
            headers={"Authorization": "Bearer mock"},
            json={"step_id": "closing:13", "transaction_id": "missing-tx"},
        )

    assert_resource_not_found(resp)
