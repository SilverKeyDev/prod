"""Tests for partner admin validation helpers."""

from app.services.rev_share.admin.partner_validation import (
    normalize_payout_type,
    normalize_target_roles,
    validate_partner_fields,
)


def test_validate_buyer_requires_steps():
    err = validate_partner_fields(
        target_roles=["buyer"],
        step_ids=[],
        payout_type="on_click",
    )
    assert err == "missing_step_ids"


def test_validate_agent_only_allows_empty_steps():
    err = validate_partner_fields(
        target_roles=["agent"],
        step_ids=[],
        payout_type="on_close",
    )
    assert err is None


def test_normalize_payout_type():
    assert normalize_payout_type("on_click") == "on_click"
    assert normalize_payout_type("invalid") is None


def test_normalize_target_roles_rejects_unknown():
    assert normalize_target_roles(["buyer", "unknown"]) is None
    assert normalize_target_roles(["buyer", "seller"]) == ["buyer", "seller"]
