"""Tests for extended_buyer_preferences merge, validation, and canonical flat keys."""

from app.services.aggregation.extended_buyer_preferences import (
    apply_extended_buyer_preference_canonical_keys,
    merge_extended_buyer_preferences,
    normalize_listing_status,
)


def test_merge_drops_unknown_top_level_keys() -> None:
    doc = merge_extended_buyer_preferences(
        None,
        {"nope": {"x": 1}, "price_financing": {"hoa_ok": True}},
    )
    assert doc is not None
    assert "nope" not in doc
    assert doc["price_financing"]["hoa_ok"] is True


def test_merge_clearing_section_with_empty_dict_removes_storage_when_only_section() -> None:
    first = merge_extended_buyer_preferences(None, {"neighborhood": {"walk_score_min": 80}})
    assert first is not None
    second = merge_extended_buyer_preferences(first, {"neighborhood": {}})
    assert second is None


def test_merge_deep_merges_section_fields() -> None:
    first = merge_extended_buyer_preferences(
        None,
        {"price_financing": {"hoa_ok": True, "hoa_fee_max_monthly": 100}},
    )
    second = merge_extended_buyer_preferences(
        first,
        {"price_financing": {"hoa_ok": False}},
    )
    assert second is not None
    assert second["price_financing"]["hoa_ok"] is False
    assert second["price_financing"]["hoa_fee_max_monthly"] == 100


def test_apply_canonical_walk_score_min_from_nested() -> None:
    out: dict = {
        "extended_buyer_preferences": {"v": 1, "neighborhood": {"walk_score_min": 72}},
    }
    apply_extended_buyer_preference_canonical_keys(out)
    assert out["walk_score_min"] == 72


def test_normalize_listing_status_for_sale_alias() -> None:
    assert normalize_listing_status("FOR_SALE") == "active"
    assert normalize_listing_status("pending") == "pending"
    assert normalize_listing_status("bogus") is None
