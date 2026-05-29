"""Tests for partner checklist step catalog."""

from app.services.rev_share.admin.checklist_steps import list_partner_eligible_checklist_steps


def test_buyer_catalog_includes_all_sections():
    steps = list_partner_eligible_checklist_steps("buyer")
    sections = {s["section"] for s in steps}
    assert sections == {"search", "offer", "escrow", "inspections", "financing", "closing"}


def test_buyer_catalog_includes_non_integration_steps():
    steps = list_partner_eligible_checklist_steps("buyer")
    step_ids = {s["step_id"] for s in steps}
    assert "search:5" in step_ids
    assert "closing:13" in step_ids


def test_seller_catalog_empty_for_now():
    assert list_partner_eligible_checklist_steps("seller") == []
