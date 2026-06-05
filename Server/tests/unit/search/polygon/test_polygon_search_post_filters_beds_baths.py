"""Bed/bath range tests for polygon_search_post_filters."""

from app.services.search.polygon.polygon_post_filters import apply_polygon_search_post_filters

from .polygon_post_filters_test_helpers import noop_debug_log


def test_keeps_listing_when_bedrooms_missing_and_range_set() -> None:
    props = [{"zpid": "1"}]
    user_preferences = {"preferred_bedrooms_min": 2, "preferred_bedrooms_max": 3}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=noop_debug_log,
    )
    assert len(out) == 1


def test_drops_listing_when_bedrooms_exceed_max() -> None:
    props = [{"zpid": "1", "bedrooms": 5}]
    user_preferences = {"preferred_bedrooms_min": 2, "preferred_bedrooms_max": 3}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 0


def test_keeps_listing_when_bedrooms_within_range_strict() -> None:
    props = [{"zpid": "1", "bedrooms": 3}]
    user_preferences = {"preferred_bedrooms_min": 2, "preferred_bedrooms_max": 4}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 1
    assert out[0].get("zpid") == "1"


def test_drops_listing_when_bedrooms_below_min_strict() -> None:
    props = [{"zpid": "1", "bedrooms": 1}]
    user_preferences = {"preferred_bedrooms_min": 2, "preferred_bedrooms_max": 4}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 0


def test_drops_listing_when_bedrooms_above_max_strict() -> None:
    props = [{"zpid": "1", "bedrooms": 5}]
    user_preferences = {"preferred_bedrooms_min": 2, "preferred_bedrooms_max": 4}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 0


def test_keeps_listing_when_bathrooms_missing_and_range_set() -> None:
    props = [{"zpid": "1", "bedrooms": 2}]
    user_preferences = {"preferred_bathrooms_min": 1, "preferred_bathrooms_max": 2}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=noop_debug_log,
    )
    assert len(out) == 1


def test_drops_listing_when_bathrooms_exceed_max() -> None:
    props = [{"zpid": "1", "bathrooms": 4}]
    user_preferences = {"preferred_bathrooms_min": 1, "preferred_bathrooms_max": 2}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 0


def test_keeps_listing_when_bathrooms_within_range_strict() -> None:
    props = [{"zpid": "1", "bathrooms": 2}]
    user_preferences = {"preferred_bathrooms_min": 1, "preferred_bathrooms_max": 3}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 1
    assert out[0].get("zpid") == "1"


def test_drops_listing_when_bathrooms_below_min_strict() -> None:
    props = [{"zpid": "1", "bathrooms": 1}]
    user_preferences = {"preferred_bathrooms_min": 2, "preferred_bathrooms_max": 4}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 0


def test_drops_listing_when_bathrooms_above_max_strict() -> None:
    props = [{"zpid": "1", "bathrooms": 5}]
    user_preferences = {"preferred_bathrooms_min": 2, "preferred_bathrooms_max": 4}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 0


def test_bedrooms_range_within_below_above_strict() -> None:
    """Range [2, 4]: inside passes; below min or above max fails."""
    prefs = {"preferred_bedrooms_min": 2, "preferred_bedrooms_max": 4}
    for beds, expected in ((3, 1), (2, 1), (4, 1), (1, 0), (5, 0)):
        out = apply_polygon_search_post_filters(
            [{"zpid": "1", "bedrooms": beds}],
            prefs,
            "req_test",
            agent_debug_log=noop_debug_log,
            strict_preference_filter=True,
        )
        assert len(out) == expected, beds


def test_bathrooms_range_within_below_above_strict() -> None:
    """Range [2, 4]: inside passes; below min or above max fails."""
    prefs = {"preferred_bathrooms_min": 2, "preferred_bathrooms_max": 4}
    for baths, expected in ((3, 1), (2, 1), (4, 1), (1, 0), (5, 0)):
        out = apply_polygon_search_post_filters(
            [{"zpid": "1", "bathrooms": baths}],
            prefs,
            "req_test",
            agent_debug_log=noop_debug_log,
            strict_preference_filter=True,
        )
        assert len(out) == expected, baths


def test_beds_baths_field_aliases_respected_for_range_strict() -> None:
    """Listings may expose counts as beds/baths; range filter uses the same rules."""
    prefs = {
        "preferred_bedrooms_min": 2,
        "preferred_bedrooms_max": 4,
        "preferred_bathrooms_min": 2,
        "preferred_bathrooms_max": 3,
    }
    out = apply_polygon_search_post_filters(
        [{"zpid": "1", "beds": 3, "baths": 2}],
        prefs,
        "req_test",
        agent_debug_log=noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 1
    out = apply_polygon_search_post_filters(
        [{"zpid": "1", "beds": 1, "baths": 2}],
        prefs,
        "req_test",
        agent_debug_log=noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 0
    out = apply_polygon_search_post_filters(
        [{"zpid": "1", "beds": 3, "baths": 5}],
        prefs,
        "req_test",
        agent_debug_log=noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 0


def test_bedrooms_only_min_no_max_allows_above_range_strict() -> None:
    """With only preferred_bedrooms_min set, there is no upper cap."""
    out = apply_polygon_search_post_filters(
        [{"zpid": "1", "bedrooms": 10}],
        {"preferred_bedrooms_min": 2},
        "req_test",
        agent_debug_log=noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 1


def test_beds_and_baths_ranges_both_enforced_strict() -> None:
    """Listing must satisfy both bedroom and bathroom ranges when both are set."""
    prefs = {
        "preferred_bedrooms_min": 2,
        "preferred_bedrooms_max": 4,
        "preferred_bathrooms_min": 2,
        "preferred_bathrooms_max": 3,
    }
    out = apply_polygon_search_post_filters(
        [{"zpid": "1", "bedrooms": 3, "bathrooms": 2}],
        prefs,
        "req_test",
        agent_debug_log=noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 1
    out = apply_polygon_search_post_filters(
        [{"zpid": "1", "bedrooms": 3, "bathrooms": 1}],
        prefs,
        "req_test",
        agent_debug_log=noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 0
    out = apply_polygon_search_post_filters(
        [{"zpid": "1", "bedrooms": 5, "bathrooms": 2}],
        prefs,
        "req_test",
        agent_debug_log=noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 0
