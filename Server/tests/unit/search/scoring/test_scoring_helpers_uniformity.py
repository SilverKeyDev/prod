"""Characterization tests for uniform vs spread match scores in polygon search scoring."""

from __future__ import annotations

from unittest.mock import patch

import pytest

from app.services.search.helpers.scoring_helpers import score_and_sort_properties


def _realistic_prefs() -> dict:
    return {
        "home_budget_min": 300_000,
        "home_budget_max": 600_000,
        "preferred_bedrooms_min": 3,
        "preferred_bathrooms_min": 2,
        "preferred_sqft_min": 1_400,
        "preferred_sqft_max": 2_800,
    }


def _diverse_listings() -> list[dict]:
    return [
        {
            "zpid": "1",
            "price": 320_000,
            "bedrooms": 3,
            "bathrooms": 2,
            "livingArea": 1_600,
            "daysOnMarket": 7,
        },
        {
            "zpid": "2",
            "price": 480_000,
            "bedrooms": 4,
            "bathrooms": 2.5,
            "livingArea": 2_400,
            "daysOnMarket": 45,
            "features": {"garage": "2-car", "pool": "yes"},
        },
        {
            "zpid": "3",
            "price": 550_000,
            "bedrooms": 2,
            "bathrooms": 1,
            "livingArea": 1_200,
            "daysOnMarket": 120,
            "homeType": "CONDO",
        },
    ]


def _identical_market_listings(n: int = 10) -> list[dict]:
    return [
        {
            "zpid": str(1000 + i),
            "price": 350_000,
            "bedrooms": 3,
            "bathrooms": 2,
            "livingArea": 1_800,
            "daysOnMarket": 14,
        }
        for i in range(n)
    ]


@pytest.fixture
def flask_ctx():
    """Minimal Flask context (avoids full create_app in unit tests)."""
    from flask import Flask

    app = Flask("scoring_uniformity_test")
    with app.app_context():
        yield


class TestScoreAndSortPropertiesUniformity:
    def test_distinct_scores_for_diverse_listings(self, flask_ctx) -> None:
        out = score_and_sort_properties(
            properties=_diverse_listings(),
            user_data={"preferences": _realistic_prefs()},
            request_id="test-req-1",
        )
        scores = [p.get("_score") for p in out]
        assert len(scores) == 3
        assert len({round(s, 1) for s in scores if s is not None}) >= 2

    def test_homogeneous_market_listings_do_not_all_tie(self, flask_ctx) -> None:
        """Many near-identical listings must not collapse to one rounded score (e.g. all 54)."""
        out = score_and_sort_properties(
            properties=_identical_market_listings(10),
            user_data={"preferences": {}},
            request_id="test-req-homogeneous",
        )
        rounded = {round(float(p.get("_score", 0)), 1) for p in out}
        assert len(rounded) >= 2, f"expected score spread, got {sorted(rounded)}"

    def test_preferred_bedrooms_min_max_activates_preference_fit(self, flask_ctx) -> None:
        prefs = {
            "home_budget_max": 500_000,
            "preferred_bedrooms_min": 3,
            "preferred_bathrooms_min": 2,
        }
        good = {
            "zpid": "good",
            "price": 400_000,
            "bedrooms": 3,
            "bathrooms": 2,
            "livingArea": 2_000,
        }
        poor = {
            "zpid": "poor",
            "price": 400_000,
            "bedrooms": 1,
            "bathrooms": 1,
            "livingArea": 900,
            "homeType": "CONDO",
        }
        out = score_and_sort_properties(
            properties=[good, poor],
            user_data={"preferences": prefs},
            request_id="test-req-legacy",
        )
        by_zpid = {str(p["zpid"]): float(p["_score"]) for p in out}
        assert by_zpid["good"] > by_zpid["poor"]

    def test_missing_listing_fields_collapses_to_same_score(self, flask_ctx) -> None:
        props = [{"zpid": str(i)} for i in range(5)]
        out = score_and_sort_properties(
            properties=props,
            user_data={"preferences": {}},
            request_id="test-req-sparse",
        )
        rounded = {round(float(p.get("_score", 0)), 1) for p in out}
        assert len(rounded) == 1

    def test_scoring_exception_zeros_all_properties(self, flask_ctx) -> None:
        with patch(
            "app.services.search.helpers.scoring_helpers.score_listing_mcda",
            side_effect=RuntimeError("boom"),
        ):
            out = score_and_sort_properties(
                properties=_diverse_listings(),
                user_data={"preferences": _realistic_prefs()},
                request_id="test-req-err",
            )
        assert all(float(p.get("_score", -1)) == 0.0 for p in out)

    def test_missing_zpid_gets_zero_score(self, flask_ctx) -> None:
        props = [
            {"price": 400_000, "bedrooms": 3},
            {"zpid": "ok", "price": 400_000, "bedrooms": 3},
        ]
        out = score_and_sort_properties(
            properties=props,
            user_data={"preferences": _realistic_prefs()},
            request_id="test-req-no-zpid",
        )
        no_zpid = [p for p in out if p.get("zpid") is None]
        assert len(no_zpid) == 1
        assert float(no_zpid[0].get("_score", -1)) == 0.0
