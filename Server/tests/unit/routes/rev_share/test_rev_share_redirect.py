"""Tests for GET /r/<link_id> redirect handler."""

from app import db
from app.models import Partner, RevShareLink, RevShareLinkClick, User


def test_redirect_logs_click_and_returns_302(app, client, db_session):
    with app.app_context():
        partner = Partner(
            name="MC",
            slug="move-concierge",
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

    resp = client.get(f"/r/{link_id}?buyer_id=b1&step_id=closing:13")
    assert resp.status_code == 302
    assert "partner.example" in resp.headers.get("Location", "")

    with app.app_context():
        assert RevShareLinkClick.query.filter_by(link_id=link_id).count() == 1


def test_redirect_inactive_link_404(app, client, db_session):
    resp = client.get("/r/nonexistent-link")
    assert resp.status_code == 404


def test_redirect_buyer_subject_as_transaction_id_does_not_500(app, client, db_session):
    """Checklist paths may pass buyer user id as transaction_id; must not FK-violate clicks."""
    with app.app_context():
        buyer = User(email="buyer-r@test.com", name="Buyer", is_agent=False)
        db.session.add(buyer)
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

    resp = client.get(
        f"/r/{link_id}?buyer_id={buyer_id}&transaction_id={buyer_id}&step_id=closing:13"
    )
    assert resp.status_code == 302
    assert resp.headers.get("Location", "").startswith("https://partner.example")

    with app.app_context():
        click = RevShareLinkClick.query.filter_by(link_id=link_id).one()
        assert click.buyer_id == buyer_id
        assert click.transaction_id is None
