"""Tests for partner admin create/update validation."""

from sqlalchemy import func, select

from app import db
from app.models import Partner, RevShareLink, RevShareLinkClick
from app.services.rev_share.admin.partners_admin import (
    create_partner,
    delete_partner,
    update_partner,
)


def test_create_partner_with_roles_and_steps(app, db_session):
    with app.app_context():
        row, err = create_partner(
            {
                "name": "New Partner",
                "slug": "new-partner",
                "destination_url_template": "https://example.com/{agent_id}",
                "target_roles": ["buyer"],
                "step_ids": ["closing:13"],
                "payout_type": "on_click",
                "payout_per_conversion": 5,
            }
        )
        assert err is None
        assert row is not None
        assert row["target_roles"] == ["buyer"]
        assert row["step_ids"] == ["closing:13"]
        assert row["payout_type"] == "on_click"
        assert row["is_active"] is True
        assert row["integration_display_mode"] == "iframe_and_link"


def test_create_partner_link_only_display_mode(app, db_session):
    with app.app_context():
        row, err = create_partner(
            {
                "name": "Link Partner",
                "slug": "link-partner",
                "destination_url_template": "https://example.com/{agent_id}",
                "target_roles": ["buyer"],
                "step_ids": ["closing:13"],
                "payout_type": "on_click",
                "integration_display_mode": "link_only",
            }
        )
        assert err is None
        assert row is not None
        assert row["integration_display_mode"] == "link_only"


def test_create_partner_buyer_without_steps_fails(app, db_session):
    with app.app_context():
        row, err = create_partner(
            {
                "name": "Bad Partner",
                "slug": "bad-partner",
                "destination_url_template": "https://example.com",
                "target_roles": ["buyer"],
                "step_ids": [],
                "payout_type": "on_click",
            }
        )
        assert row is None
        assert err == "missing_step_ids"


def test_update_partner_payout_type(app, db_session):
    with app.app_context():
        partner = Partner(
            name="Updatable",
            slug="updatable-partner",
            destination_url_template="https://example.com",
            step_id="closing:13",
            step_ids=["closing:13"],
            target_roles=["buyer"],
            payout_type="on_click",
            is_active=True,
        )
        db.session.add(partner)
        db.session.commit()

        row, err = update_partner(partner.id, {"payout_type": "on_close"})
        assert err is None
        assert row["payout_type"] == "on_close"


def test_delete_partner_removes_links_and_clicks(app, db_session):
    with app.app_context():
        partner = Partner(
            name="Gone",
            slug="gone-partner",
            destination_url_template="https://example.com",
            step_id="closing:13",
            step_ids=["closing:13"],
            target_roles=["buyer"],
            payout_type="on_click",
            is_active=True,
        )
        db.session.add(partner)
        db.session.commit()

        link = RevShareLink(partner_id=partner.id, is_active=True)
        db.session.add(link)
        db.session.commit()

        click = RevShareLinkClick(
            partner_id=partner.id,
            link_id=link.id,
            step_id="closing:13",
        )
        db.session.add(click)
        db.session.commit()

        assert delete_partner(partner.id) is True
        assert db.session.scalar(select(Partner).where(Partner.id == partner.id)) is None
        assert (
            db.session.scalar(
                select(func.count())
                .select_from(RevShareLink)
                .where(RevShareLink.partner_id == partner.id)
            )
            == 0
        )
        assert (
            db.session.scalar(
                select(func.count())
                .select_from(RevShareLinkClick)
                .where(RevShareLinkClick.partner_id == partner.id)
            )
            == 0
        )


def test_delete_partner_missing_returns_false(app, db_session):
    with app.app_context():
        assert delete_partner("00000000-0000-0000-0000-000000000000") is False
