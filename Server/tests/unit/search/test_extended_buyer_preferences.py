"""Tests for extended_buyer_preferences merge, validation, and canonical flat keys."""

from app.services.aggregation.extended_buyer_preferences import (
    apply_extended_buyer_preference_canonical_keys,
    merge_extended_buyer_preferences,
    normalize_listing_status,
    sanitize_section,
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


def test_sanitize_availability_weekly_and_oneoff() -> None:
    doc = sanitize_section(
        "availability",
        {
            "timezone": "America/Chicago",
            "weekly": [
                {
                    "id": "w1",
                    "weekday": 2,
                    "start": "09:00",
                    "end": "10:00",
                }
            ],
            "oneOff": [
                {
                    "id": "o1",
                    "date": "2026-04-20",
                    "start": "14:00",
                    "end": "15:30",
                }
            ],
            "exceptions": [
                {
                    "id": "e1",
                    "scope": "weekly",
                    "ruleId": "w1",
                    "date": "2026-04-22",
                }
            ],
        },
    )
    assert doc is not None
    assert doc["timezone"] == "America/Chicago"
    assert doc["weekly"][0]["weekday"] == 2
    assert doc["oneOff"][0]["date"] == "2026-04-20"
    assert doc["exceptions"][0]["ruleId"] == "w1"


def test_merge_availability_replaces_section() -> None:
    first = merge_extended_buyer_preferences(
        None,
        {
            "availability": {
                "timezone": "UTC",
                "weekly": [{"id": "a", "weekday": 1, "start": "10:00", "end": "11:00"}],
            }
        },
    )
    assert first is not None
    second = merge_extended_buyer_preferences(
        first,
        {
            "availability": {
                "timezone": "America/New_York",
                "weekly": [{"id": "b", "weekday": 3, "start": "12:00", "end": "13:00"}],
            }
        },
    )
    assert second is not None
    assert second["availability"]["timezone"] == "America/New_York"
    assert len(second["availability"]["weekly"]) == 1
    assert second["availability"]["weekly"][0]["id"] == "b"


def test_sanitize_availability_drops_invalid_time_order() -> None:
    doc = sanitize_section(
        "availability",
        {
            "weekly": [
                {"id": "bad", "weekday": 0, "start": "18:00", "end": "09:00"},
                {"id": "ok", "weekday": 0, "start": "09:00", "end": "10:00"},
            ],
        },
    )
    assert doc is not None
    assert len(doc["weekly"]) == 1
    assert doc["weekly"][0]["id"] == "ok"
