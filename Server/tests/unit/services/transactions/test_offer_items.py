"""Offer checklist task definition tests."""

from app.services.transactions.offer.items import OFFER_ITEMS


def test_first_offer_item_is_decide_on_home_submit_gated():
    first = OFFER_ITEMS[0]
    assert first["label"] == "Decide on a home"
    assert first["component_key"] == "finding_home"
    assert first["completion_requires_submit"] is True
