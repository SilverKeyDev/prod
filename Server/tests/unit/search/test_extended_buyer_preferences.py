"""Tests for extended_buyer_preferences merge, validation, and canonical flat keys."""

from app.services.aggregation.extended_buyer_preferences import (
    apply_extended_buyer_preference_canonical_keys,
    merge_extended_buyer_preferences,
    normalize_listing_status,
    normalize_stored_document,
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
    first = merge_extended_buyer_preferences(
        None, {"neighborhood": {"crime_importance": "very_important"}}
    )
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


def test_apply_canonical_walkability_importance_from_nested() -> None:
    out: dict = {
        "extended_buyer_preferences": {
            "v": 1,
            "neighborhood": {"walkability_importance": "very_important"},
        },
    }
    apply_extended_buyer_preference_canonical_keys(out)
    assert out["walkability_importance"] == "very_important"


def test_normalize_listing_status_for_sale_alias() -> None:
    assert normalize_listing_status("FOR_SALE") == "active"
    assert normalize_listing_status("pending") == "pending"
    assert normalize_listing_status("bogus") is None


def test_merge_drops_availability_for_non_agent_writes() -> None:
    """Buyers cannot persist weekly availability; merges without allow_availability ignore it."""
    doc = merge_extended_buyer_preferences(
        None,
        {
            "availability": {
                "timezone": "UTC",
                "weekly": [{"id": "a", "weekday": 1, "start": "10:00", "end": "11:00"}],
            },
            "price_financing": {"hoa_ok": True},
        },
        allow_availability=False,
    )
    assert doc is not None
    assert "availability" not in doc
    assert doc["price_financing"]["hoa_ok"] is True


def test_merge_persists_availability_when_allowed() -> None:
    doc = merge_extended_buyer_preferences(
        None,
        {
            "availability": {
                "timezone": "UTC",
                "weekly": [{"id": "a", "weekday": 1, "start": "10:00", "end": "11:00"}],
            },
        },
        allow_availability=True,
    )
    assert doc is not None
    assert "availability" in doc
    assert doc["availability"]["timezone"] == "UTC"


def test_normalize_stored_document_drops_availability_when_excluded() -> None:
    norm = normalize_stored_document(
        {
            "v": 1,
            "availability": {"timezone": "UTC"},
            "neighborhood": {"crime_importance": "very_important"},
        },
        include_availability=False,
    )
    assert "availability" not in norm
    assert norm["neighborhood"]["crime_importance"] == "very_important"


def test_normalize_stored_document_keeps_availability_when_included() -> None:
    norm = normalize_stored_document(
        {
            "v": 1,
            "availability": {"timezone": "UTC"},
            "neighborhood": {"crime_importance": "very_important"},
        },
        include_availability=True,
    )
    assert "availability" in norm
    assert norm["neighborhood"]["crime_importance"] == "very_important"
