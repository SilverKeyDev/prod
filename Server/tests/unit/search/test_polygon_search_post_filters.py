"""Unit tests for polygon_search_post_filters (bed/bath ranges vs missing listing data)."""

from app.services.search.home_matching.mcda.criteria.user_feature_match import (
    user_feature_need_matches_property,
)
from app.services.search.polygon.polygon_post_filters import (
    PREFERENCE_POST_FILTER_LENIENT_MAX_COUNT,
    apply_polygon_search_post_filters,
)


def _noop_debug_log(*_args, **_kwargs) -> None:
    pass


def test_keeps_listing_when_bedrooms_missing_and_range_set() -> None:
    props = [{"zpid": "1"}]
    user_preferences = {"preferred_bedrooms_min": 2, "preferred_bedrooms_max": 3}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=_noop_debug_log,
    )
    assert len(out) == 1


def test_drops_listing_when_bedrooms_exceed_max() -> None:
    props = [{"zpid": "1", "bedrooms": 5}]
    user_preferences = {"preferred_bedrooms_min": 2, "preferred_bedrooms_max": 3}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=_noop_debug_log,
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
        agent_debug_log=_noop_debug_log,
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
        agent_debug_log=_noop_debug_log,
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
        agent_debug_log=_noop_debug_log,
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
        agent_debug_log=_noop_debug_log,
    )
    assert len(out) == 1


def test_drops_listing_when_bathrooms_exceed_max() -> None:
    props = [{"zpid": "1", "bathrooms": 4}]
    user_preferences = {"preferred_bathrooms_min": 1, "preferred_bathrooms_max": 2}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=_noop_debug_log,
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
        agent_debug_log=_noop_debug_log,
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
        agent_debug_log=_noop_debug_log,
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
        agent_debug_log=_noop_debug_log,
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
            agent_debug_log=_noop_debug_log,
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
            agent_debug_log=_noop_debug_log,
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
        agent_debug_log=_noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 1
    out = apply_polygon_search_post_filters(
        [{"zpid": "1", "beds": 1, "baths": 2}],
        prefs,
        "req_test",
        agent_debug_log=_noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 0
    out = apply_polygon_search_post_filters(
        [{"zpid": "1", "beds": 3, "baths": 5}],
        prefs,
        "req_test",
        agent_debug_log=_noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 0


def test_bedrooms_only_min_no_max_allows_above_range_strict() -> None:
    """With only preferred_bedrooms_min set, there is no upper cap."""
    out = apply_polygon_search_post_filters(
        [{"zpid": "1", "bedrooms": 10}],
        {"preferred_bedrooms_min": 2},
        "req_test",
        agent_debug_log=_noop_debug_log,
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
        agent_debug_log=_noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 1
    out = apply_polygon_search_post_filters(
        [{"zpid": "1", "bedrooms": 3, "bathrooms": 1}],
        prefs,
        "req_test",
        agent_debug_log=_noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 0
    out = apply_polygon_search_post_filters(
        [{"zpid": "1", "bedrooms": 5, "bathrooms": 2}],
        prefs,
        "req_test",
        agent_debug_log=_noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 0


def test_must_have_requires_all_features() -> None:
    props = [
        {"zpid": "1", "homeFacts": {"amenities": "pool and two car garage"}},
        {"zpid": "2", "homeFacts": {"amenities": "pool with large deck"}},
    ]
    user_preferences = {"must_have": ["pool", "garage"]}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=_noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 1
    assert out[0].get("zpid") == "1"


def test_must_have_keeps_listing_when_garage_in_reso() -> None:
    props = [{"zpid": "1", "resoFacts": {"garageParkingCapacity": 1}}]
    user_preferences = {"must_have": ["garage"]}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=_noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 1


def test_must_have_skipped_when_not_strict() -> None:
    """Must-have filter should be skipped when strict_preference_filter is False."""
    props = [
        {"zpid": "1", "bedrooms": 3},
        {"zpid": "2", "bedrooms": 4},
    ]
    user_preferences = {"must_have": ["garage", "pool"]}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=_noop_debug_log,
        strict_preference_filter=False,
    )
    assert len(out) == 2


def test_must_have_applied_when_strict() -> None:
    """Must-have filter should be applied when strict_preference_filter is True."""
    props = [
        {"zpid": "1", "bedrooms": 3, "homeFacts": {"summary": "cozy cottage"}},
        {"zpid": "2", "bedrooms": 4, "homeFacts": {"summary": "urban loft"}},
    ]
    user_preferences = {"must_have": ["garage", "pool"]}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=_noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 0


def test_lenient_mode_skips_filters_when_count_at_threshold() -> None:
    props = [
        {"zpid": str(i), "bedrooms": 5} for i in range(PREFERENCE_POST_FILTER_LENIENT_MAX_COUNT)
    ]
    user_preferences = {"preferred_bedrooms_min": 1, "preferred_bedrooms_max": 3}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=_noop_debug_log,
        strict_preference_filter=False,
    )
    assert len(out) == PREFERENCE_POST_FILTER_LENIENT_MAX_COUNT


def test_owner_posted_only_non_strict_restores_when_no_fsbo_in_feed() -> None:
    """MLS polygon rows are usually for_sale without FSBO markers; do not zero the whole list."""
    n = PREFERENCE_POST_FILTER_LENIENT_MAX_COUNT + 1
    props = [{"listingStatus": "for_sale", "zpid": str(i)} for i in range(n)]
    user_preferences = {"listing_type": ["owner_posted"]}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=_noop_debug_log,
        strict_preference_filter=False,
    )
    assert len(out) == n


def test_owner_posted_only_strict_keeps_empty_without_fsbo() -> None:
    n = PREFERENCE_POST_FILTER_LENIENT_MAX_COUNT + 1
    props = [{"listingStatus": "for_sale", "zpid": str(i)} for i in range(n)]
    user_preferences = {"listing_type": ["owner_posted"]}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=_noop_debug_log,
        strict_preference_filter=True,
    )
    assert len(out) == 0


def test_lenient_mode_applies_filters_when_count_above_threshold() -> None:
    n = PREFERENCE_POST_FILTER_LENIENT_MAX_COUNT + 1
    props = [{"zpid": str(i), "bedrooms": 5} for i in range(n)]
    user_preferences = {"preferred_bedrooms_min": 1, "preferred_bedrooms_max": 3}
    out = apply_polygon_search_post_filters(
        props,
        user_preferences,
        "req_test",
        agent_debug_log=_noop_debug_log,
        strict_preference_filter=False,
    )
    assert len(out) == 0


def test_user_feature_ac_matches_central_air_in_description() -> None:
    prop = {"description": "Lovely home with Central air throughout."}
    assert user_feature_need_matches_property(prop, "ac") is True


def test_user_feature_single_story_rejects_two_stories_reso() -> None:
    prop = {"resoFacts": {"stories": 2}}
    assert user_feature_need_matches_property(prop, "single_story") is False
