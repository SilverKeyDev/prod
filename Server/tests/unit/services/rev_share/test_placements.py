"""Tests for partner placement filtering by workspace and step_ids."""

from app import db
from app.models import Partner, RevShareLink, Transaction, User
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID
from app.services.rev_share.placements import get_placements_for_step


def test_placements_require_matching_step_and_workspace(app, db_session):
    with app.app_context():
        partner = Partner(
            name="Placement Partner",
            slug="placement-partner",
            destination_url_template="https://example.com",
            step_id="closing:13",
            step_ids=["closing:13"],
            target_roles=["buyer"],
            payout_type="on_click",
            integration_display_mode="link_only",
            is_active=True,
        )
        db.session.add(partner)
        db.session.flush()
        link = RevShareLink(partner_id=partner.id)
        db.session.add(link)
        db.session.commit()

        matched = get_placements_for_step(
            step_id="closing:13",
            workspace="buyer",
        )
        assert len(matched) == 1
        assert matched[0]["destination_url"] == "https://example.com"
        assert matched[0]["embed_src"] is None
        assert "agent_id" not in matched[0]

        partner.integration_display_mode = "iframe_and_link"
        partner.embed_url_template = "https://embed.example/{transaction_id}"
        db.session.commit()

        buyer = User(email="buyer-pl@test.com", name="Buyer", is_agent=False)
        db.session.add(buyer)
        tx = Transaction(
            id="tx-pl",
            buyer_id=buyer.id,
            primary_agent_id=None,
            brokerage_org_id=DEFAULT_BROKERAGE_ORG_ID,
        )
        db.session.add(tx)
        db.session.commit()

        with_iframe = get_placements_for_step(
            step_id="closing:13",
            workspace="buyer",
            transaction_id=tx.id,
        )
        assert with_iframe[0]["embed_src"] == f"https://embed.example/{tx.id}"

        without_tx = get_placements_for_step(
            step_id="closing:13",
            workspace="buyer",
        )
        assert without_tx[0]["embed_src"] == "https://embed.example/{transaction_id}"

        wrong_step = get_placements_for_step(
            step_id="closing:99",
            workspace="buyer",
        )
        assert wrong_step == []

        wrong_workspace = get_placements_for_step(
            step_id="closing:13",
            workspace="agent",
        )
        assert wrong_workspace == []
