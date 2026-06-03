"""Tests for GET /r/<link_id> redirect handler."""

from datetime import date
from decimal import Decimal

from app import db
from app.models import Partner, RevShareLink, RevShareLinkClick, Transaction, User


def test_redirect_logs_click_and_returns_302(app, client, db_session):
    with app.app_context():
        partner = Partner(
            name="MC",
            slug="move-concierge",
            destination_url_template="https://partner.example/{link_id}",
            step_id="closing:13",
            payout_per_conversion=Decimal("5.50"),
            payout_type="on_click",
            is_active=True,
        )
        db.session.add(partner)
        db.session.commit()
        link = RevShareLink(partner_id=partner.id)
        db.session.add(link)
        db.session.commit()
        link_id = link.id

    resp = client.get(f"/r/{link_id}?buyer_id=b1&step_id=closing:13&session_id=sess-1")
    assert resp.status_code == 302
    assert "partner.example" in resp.headers.get("Location", "")

    with app.app_context():
        assert RevShareLinkClick.query.filter_by(link_id=link_id).count() == 1
        click = RevShareLinkClick.query.filter_by(link_id=link_id).one()
        assert click.payout_per_conversion == Decimal("5.50")
        assert click.payout_type == "on_click"
        assert click.session_id == "sess-1"
        assert click.click_date == date.today()


def test_redirect_dedupes_same_session_same_day(app, client, db_session):
    with app.app_context():
        partner = Partner(
            name="MC",
            slug="move-concierge-dedupe",
            destination_url_template="https://partner.example/{link_id}",
            step_id="closing:13",
            is_active=True,
        )
        db.session.add(partner)
        db.session.commit()
        link = RevShareLink(partner_id=partner.id)
        db.session.add(link)
        db.session.commit()
        link_id = link.id

    for _ in range(2):
        resp = client.get(f"/r/{link_id}?session_id=sess-dedupe&step_id=closing:13")
        assert resp.status_code == 302

    with app.app_context():
        assert RevShareLinkClick.query.filter_by(link_id=link_id).count() == 1


def test_redirect_inactive_link_404(app, client, db_session):
    resp = client.get("/r/nonexistent-link")
    assert resp.status_code == 404


def test_redirect_stores_transaction_id_when_valid(app, client, db_session):
    """Rev-share redirect must persist real transactions.id on click rows."""
    from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID

    with app.app_context():
        buyer = User(email="buyer-r@test.com", name="Buyer", is_agent=False)
        db.session.add(buyer)
        db.session.flush()
        tx = Transaction(
            id="tx-redirect-1",
            buyer_id=buyer.id,
            brokerage_org_id=DEFAULT_BROKERAGE_ORG_ID,
        )
        db.session.add(tx)
        partner = Partner(
            name="MC",
            slug="move-concierge",
            destination_url_template="https://partner.example/landing",
            step_id="closing:13",
            is_active=True,
        )
        db.session.add(partner)
        db.session.flush()
        link = RevShareLink(partner_id=partner.id)
        db.session.add(link)
        db.session.commit()
        link_id = link.id
        buyer_id = buyer.id
        tx_id = tx.id

    resp = client.get(f"/r/{link_id}?buyer_id={buyer_id}&transaction_id={tx_id}&step_id=closing:13")
    assert resp.status_code == 302
    assert resp.headers.get("Location", "").startswith("https://partner.example")

    with app.app_context():
        click = RevShareLinkClick.query.filter_by(link_id=link_id).one()
        assert click.buyer_id == buyer_id
        assert click.transaction_id == tx_id
