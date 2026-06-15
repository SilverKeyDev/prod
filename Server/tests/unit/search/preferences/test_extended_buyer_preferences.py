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


def test_merge_deep_merges_non_replace_sections() -> None:
    first = merge_extended_buyer_preferences(
        None,
        {"condition": {"prefer_price_reduced": True, "foreclosure_ok": False}},
    )
    second = merge_extended_buyer_preferences(
        first,
        {"condition": {"prefer_price_reduced": False}},
    )
    assert second is not None
    assert second["condition"]["prefer_price_reduced"] is False
    assert second["condition"]["foreclosure_ok"] is False


def test_merge_price_financing_replaces_stale_keys() -> None:
    first = merge_extended_buyer_preferences(
        None,
        {
            "price_financing": {
                "lender_status": "pre_approved",
                "lender_name": "Old Lender",
                "hoa_ok": True,
                "hoa_fee_max_monthly": 100,
            }
        },
    )
    second = merge_extended_buyer_preferences(
        first,
        {"price_financing": {"lender_status": "not_yet", "want_lender_connection": True}},
    )
    assert second is not None
    pf = second["price_financing"]
    assert pf["lender_status"] == "not_yet"
    assert pf["want_lender_connection"] is True
    assert "lender_name" not in pf
    assert "hoa_fee_max_monthly" not in pf


def test_sanitize_price_financing_clamps_max_monthly_payment() -> None:
    from app.services.aggregation.extended_buyer_preferences import sanitize_section

    out = sanitize_section("price_financing", {"max_monthly_payment": 999_999})
    assert out is not None
    assert out["max_monthly_payment"] == 500_000


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


def test_sanitize_buyer_about_me_section() -> None:
    from app.services.aggregation.extended_buyer_preferences import sanitize_section

    out = sanitize_section(
        "buyer_about_me",
        {
            "moving_with": ["just_me", "kids", "invalid"],
            "kids_ages": "8 and 12",
            "pet_types": ["dog"],
            "move_motivation": "Growing family",
        },
    )
    assert out is not None
    assert out["moving_with"] == ["just_me", "kids"]
    assert out["kids_ages"] == "8 and 12"
    assert out["pet_types"] == ["dog"]


def test_sanitize_price_financing_buyer_fields() -> None:
    from app.services.aggregation.extended_buyer_preferences import sanitize_section

    out = sanitize_section(
        "price_financing",
        {
            "lender_status": "pre_approved",
            "lender_name": "Acme Lending",
            "loan_type": "conventional",
            "down_payment_band": "10_20",
            "first_home": "yes",
            "max_monthly_payment": 3500,
            "rent_or_own": "rent",
            "move_timeline": "asap",
            "hoa_ok": True,
        },
    )
    assert out is not None
    assert out["lender_status"] == "pre_approved"
    assert out["down_payment_band"] == "10_20"
    assert out["max_monthly_payment"] == 3500


def test_merge_buyer_about_me_section() -> None:
    doc = merge_extended_buyer_preferences(
        None,
        {
            "buyer_about_me": {
                "moving_with": ["partner"],
                "move_motivation": "Job relocation",
            }
        },
    )
    assert doc is not None
    assert doc["buyer_about_me"]["moving_with"] == ["partner"]
