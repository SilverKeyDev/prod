"""Tests for must_have / feature key matching on listing payloads."""

from __future__ import annotations

from app.services.search.home_matching.mcda.criteria.user_feature_match import (
    user_feature_need_matches_property,
)


class TestUserFeatureMatch:
    def test_features_dict_keys_match_garage_and_pool(self) -> None:
        prop = {"features": {"garage": "2-car", "pool": "yes"}}
        assert user_feature_need_matches_property(prop, "garage") is True
        assert user_feature_need_matches_property(prop, "pool") is True

    def test_features_dict_key_with_false_value_does_not_match(self) -> None:
        prop = {"features": {"garage": "no", "pool": "none"}}
        assert user_feature_need_matches_property(prop, "garage") is False
        assert user_feature_need_matches_property(prop, "pool") is False

    def test_reso_facts_still_match_garage(self) -> None:
        prop = {"resoFacts": {"hasAttachedGarage": True}}
        assert user_feature_need_matches_property(prop, "garage") is True

    def test_description_text_blob_still_matches(self) -> None:
        prop = {"description": "Beautiful home with 2 car garage and heated pool"}
        assert user_feature_need_matches_property(prop, "garage") is True
        assert user_feature_need_matches_property(prop, "pool") is True

    def test_home_facts_dict_keys_match(self) -> None:
        prop = {"homeFacts": {"ac": "central air"}}
        assert user_feature_need_matches_property(prop, "ac") is True
