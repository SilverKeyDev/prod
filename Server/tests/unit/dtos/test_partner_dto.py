"""Partner / rev-share DTO unit tests."""

from datetime import datetime, timezone
from decimal import Decimal

from app.dtos.partner import BuyerStepViewDTO, PartnerDTO, RevShareLinkClickDTO
from app.models import Partner


def test_partner_dto_matches_legacy_shape():
    partner = Partner(
        id="p-1",
        name="Acme",
        slug="acme",
        destination_url_template="https://example.com/?lid={link_id}",
        step_id="closing:1",
        step_ids=["closing:1", "closing:2"],
        target_roles=["buyer"],
        payout_type="on_click",
        payout_per_conversion=Decimal("12.50"),
        is_active=True,
    )
    payload = PartnerDTO.to_response(partner)
    assert payload["id"] == "p-1"
    assert payload["step_ids"] == ["closing:1", "closing:2"]
    assert payload["step_id"] == "closing:1"
    assert payload["payout_per_conversion"] == 12.5


def test_buyer_step_view_dto_to_response():
    from app.models.partners.buyer_step_view import BuyerStepView

    row = BuyerStepView(
        id="bsv-1",
        buyer_id="buyer-1",
        step_id="closing:1",
        transaction_id="tx-1",
        viewed_at=datetime.now(timezone.utc),
        partner_payout_snapshot=[{"partner_id": "p-1"}],
    )
    payload = BuyerStepViewDTO.to_response(row)
    assert payload["id"] == "bsv-1"
    assert payload["partner_payout_snapshot"] == [{"partner_id": "p-1"}]


def test_rev_share_link_click_dto_recent_click_names():
    from app.models.partners.rev_share_link_click import RevShareLinkClick
    from app.models.user.user import User

    click = RevShareLinkClick(
        id="click-1",
        partner_id="p-1",
        link_id="link-1",
        step_id="closing:1",
        clicked_at=datetime.now(timezone.utc),
        payout_per_conversion=Decimal("1"),
        payout_type="on_click",
    )
    buyer = User(
        id="b-1",
        cognito_id="c-b",
        email="buyer@example.com",
        name="Buyer Name",
    )
    agent = User(
        id="a-1",
        cognito_id="c-a",
        email="agent@example.com",
        name="Agent Name",
    )
    payload = RevShareLinkClickDTO.to_recent_click(click, buyer=buyer, agent=agent)
    assert payload["buyer_name"] == "Buyer Name"
    assert payload["agent_name"] == "Agent Name"
    assert payload["partner_id"] == "p-1"
