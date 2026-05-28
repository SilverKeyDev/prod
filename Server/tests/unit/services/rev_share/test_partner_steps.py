"""Tests for checklist step → active partner resolution."""

from app import db
from app.models import Partner
from app.services.rev_share.partner_steps import list_active_partners_for_step


def test_list_active_partners_matches_any_step_id(app, db_session):
    with app.app_context():
        primary = Partner(
            name="Multi-step",
            slug="multi-step-partner",
            destination_url_template="https://example.com",
            step_id="closing:2",
            step_ids=["closing:2", "closing:13"],
            target_roles=["buyer"],
            payout_type="on_click",
            is_active=True,
        )
        inactive = Partner(
            name="Inactive",
            slug="inactive-partner",
            destination_url_template="https://example.com",
            step_id="closing:13",
            step_ids=["closing:13"],
            target_roles=["buyer"],
            payout_type="on_click",
            is_active=False,
        )
        db.session.add_all([primary, inactive])
        db.session.commit()

        on_primary = list_active_partners_for_step("closing:2")
        assert [p.slug for p in on_primary] == ["multi-step-partner"]

        on_secondary = list_active_partners_for_step("closing:13")
        assert [p.slug for p in on_secondary] == ["multi-step-partner"]

        assert list_active_partners_for_step("search:1") == []
