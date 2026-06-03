"""Tests for rev_share link provisioning."""

from sqlalchemy import func, select

from app import db
from app.models import Partner, RevShareLink, User
from app.services.rev_share.link_provisioning import ensure_links_for_partner


def test_ensure_links_for_partner_creates_one_platform_row(app, db_session):
    with app.app_context():
        partner = Partner(
            name="P",
            slug="p-one",
            destination_url_template="https://x.com",
            step_id="closing:1",
            is_active=True,
        )
        User(email="ag@test.com", name="A")
        db.session.add(partner)
        db.session.commit()

        created = ensure_links_for_partner(partner.id)
        assert created == 1
        links = db.session.scalars(
            select(RevShareLink).where(RevShareLink.partner_id == partner.id)
        ).all()
        assert len(links) == 1
        assert links[0].is_active is True

        created_again = ensure_links_for_partner(partner.id)
        assert created_again == 0
        assert (
            db.session.scalar(
                select(func.count())
                .select_from(RevShareLink)
                .where(RevShareLink.partner_id == partner.id)
            )
            == 1
        )
