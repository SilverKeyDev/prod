"""Tests for rev-share analytics CTR and revenue."""

from decimal import Decimal

from app import db
from app.models import BuyerStepView, Partner, RevShareLink, RevShareLinkClick, Transaction, User
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID
from app.services.rev_share.analytics import RevShareAnalyticsFilters, get_rev_share_analytics


def _partner(app, *, slug="test-partner", payout_type="on_click", payout=10):
    with app.app_context():
        p = Partner(
            name="Test",
            slug=slug,
            destination_url_template="https://example.com",
            step_id="closing:13",
            step_ids=["closing:13"],
            target_roles=["buyer"],
            payout_type=payout_type,
            payout_per_conversion=payout,
            is_active=True,
        )
        db.session.add(p)
        db.session.commit()
        return p.id


def _click(**kwargs):
    return RevShareLinkClick(
        payout_per_conversion=kwargs.pop("payout_per_conversion", Decimal("0")),
        payout_type=kwargs.pop("payout_type", "on_click"),
        **kwargs,
    )


def test_ctr_excludes_anonymous_clicks(app, db_session):
    partner_id = _partner(app, slug="test-partner-ctr")
    with app.app_context():
        buyer = User(email="b@test.com", name="Buyer", is_agent=False)
        db.session.add(buyer)
        db.session.commit()

        tx = Transaction(
            id="tx-1",
            buyer_id=buyer.id,
            primary_agent_id=None,
            brokerage_org_id=DEFAULT_BROKERAGE_ORG_ID,
        )
        db.session.add(tx)
        link = RevShareLink(partner_id=partner_id)
        db.session.add(link)
        db.session.flush()
        db.session.add(BuyerStepView(buyer_id=buyer.id, step_id="closing:13", transaction_id=tx.id))
        db.session.add(
            _click(
                partner_id=partner_id,
                link_id=link.id,
                buyer_id=buyer.id,
                transaction_id=tx.id,
                step_id="closing:13",
                payout_per_conversion=Decimal("10"),
            )
        )
        db.session.add(
            _click(
                partner_id=partner_id,
                link_id=link.id,
                buyer_id=None,
                step_id="closing:13",
                payout_per_conversion=Decimal("10"),
            )
        )
        db.session.commit()

        result = get_rev_share_analytics(
            RevShareAnalyticsFilters(partner_id=partner_id, step_id="closing:13")
        )
        assert result["success"] is True
        assert result["total_clicks"] == 2
        assert result["unique_buyer_clicks"] == 1
        assert result["unique_buyer_step_views"] == 1
        assert result["click_through_rate"] == 1.0


def test_on_click_revenue_sums_snapped_payout_per_click(app, db_session):
    partner_id = _partner(app, slug="test-partner-revenue", payout_type="on_click", payout=25)
    with app.app_context():
        buyer = User(email="b2@test.com", name="Buyer", is_agent=False)
        db.session.add(buyer)
        db.session.commit()

        tx = Transaction(
            id="tx-2",
            buyer_id=buyer.id,
            primary_agent_id=None,
            brokerage_org_id=DEFAULT_BROKERAGE_ORG_ID,
        )
        db.session.add(tx)
        link = RevShareLink(partner_id=partner_id)
        db.session.add(link)
        db.session.flush()
        db.session.add(
            _click(
                partner_id=partner_id,
                link_id=link.id,
                buyer_id=buyer.id,
                transaction_id=tx.id,
                step_id="closing:13",
                payout_per_conversion=Decimal("25"),
            )
        )
        db.session.add(
            _click(
                partner_id=partner_id,
                link_id=link.id,
                buyer_id=buyer.id,
                transaction_id=tx.id,
                step_id="closing:13",
                payout_per_conversion=Decimal("25"),
            )
        )
        db.session.commit()

        result = get_rev_share_analytics(
            RevShareAnalyticsFilters(partner_id=partner_id, step_id="closing:13")
        )
        assert result["success"] is True
        assert result["estimated_revenue"] == 50.0
        assert result["payout_type"] == "on_click"


def test_on_click_revenue_uses_snapped_rate_not_live_partner_rate(app, db_session):
    partner_id = _partner(app, slug="test-partner-snap", payout_type="on_click", payout=10)
    with app.app_context():
        buyer = User(email="b4@test.com", name="Buyer", is_agent=False)
        db.session.add(buyer)
        db.session.commit()

        tx = Transaction(
            id="tx-4",
            buyer_id=buyer.id,
            primary_agent_id=None,
            brokerage_org_id=DEFAULT_BROKERAGE_ORG_ID,
        )
        db.session.add(tx)
        link = RevShareLink(partner_id=partner_id)
        db.session.add(link)
        db.session.flush()
        db.session.add(
            _click(
                partner_id=partner_id,
                link_id=link.id,
                buyer_id=buyer.id,
                transaction_id=tx.id,
                step_id="closing:13",
                payout_per_conversion=Decimal("10"),
            )
        )
        db.session.commit()

        partner = Partner.query.filter_by(id=partner_id).first()
        partner.payout_per_conversion = Decimal("100")
        db.session.commit()

        result = get_rev_share_analytics(
            RevShareAnalyticsFilters(partner_id=partner_id, step_id="closing:13")
        )
        assert result["estimated_revenue"] == 10.0


def test_on_close_revenue_zero_until_attribution(app, db_session):
    partner_id = _partner(app, slug="test-partner-close", payout_type="on_close", payout=100)
    with app.app_context():
        buyer = User(email="b3@test.com", name="Buyer", is_agent=False)
        db.session.add(buyer)
        db.session.commit()

        tx = Transaction(
            id="tx-3",
            buyer_id=buyer.id,
            primary_agent_id=None,
            brokerage_org_id=DEFAULT_BROKERAGE_ORG_ID,
        )
        db.session.add(tx)
        link = RevShareLink(partner_id=partner_id)
        db.session.add(link)
        db.session.flush()
        db.session.add(
            _click(
                partner_id=partner_id,
                link_id=link.id,
                buyer_id=buyer.id,
                transaction_id=tx.id,
                step_id="closing:13",
                payout_type="on_close",
                payout_per_conversion=Decimal("100"),
            )
        )
        db.session.commit()

        result = get_rev_share_analytics(
            RevShareAnalyticsFilters(partner_id=partner_id, step_id="closing:13")
        )
        assert result["estimated_revenue"] == 0.0
        assert result["payout_type"] == "on_close"
