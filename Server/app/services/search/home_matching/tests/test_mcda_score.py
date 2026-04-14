"""Tests for deterministic MCDA listing scores."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

# Import `mcda` as a top-level package (parent dir on path) to avoid loading
# `home_matching/__init__.py` (which pulls embedding/Flask stack).
_HOME_MATCHING_ROOT = str(Path(__file__).resolve().parents[1])
if _HOME_MATCHING_ROOT not in sys.path:
    sys.path.insert(0, _HOME_MATCHING_ROOT)

from mcda.criteria import hard_constraints  # noqa: E402
from mcda.criteria.amenities import soft_amenities_normalized  # noqa: E402
from mcda.score import MCDA_CONFIG, score_listing_mcda  # noqa: E402


class McdaScoreTests(unittest.TestCase):
    def setUp(self) -> None:
        self.base_prefs = {
            "home_budget_min": 400_000,
            "home_budget_max": 1_000_000,
            "preferred_bedrooms_min": 3,
            "preferred_bathrooms_min": 2,
            "preferred_housing_type": "single_family",
        }
        self.base_listing = {
            "zpid": "12345",
            "price": 650_000,
            "bedrooms": 4,
            "bathrooms": 2.5,
            "homeType": "SINGLE_FAMILY",
            "sqft": 2200,
            "latitude": 47.6,
            "longitude": -122.3,
            "features": {"garage": "2 car garage", "pool": "heated pool"},
        }

    def test_score_listing_in_display_range(self) -> None:
        s = score_listing_mcda(self.base_prefs, self.base_listing, status_type="ForSale")
        self.assertGreaterEqual(s, 15.0)
        self.assertLessEqual(s, 90.0)

    def test_price_near_peak_higher_than_at_ceiling(self) -> None:
        at_peak = dict(self.base_listing)
        at_peak["price"] = int(0.65 * 1_000_000)
        at_ceiling = dict(self.base_listing)
        at_ceiling["price"] = 1_000_000
        s_peak = score_listing_mcda(self.base_prefs, at_peak, status_type="ForSale")
        s_top = score_listing_mcda(self.base_prefs, at_ceiling, status_type="ForSale")
        self.assertGreater(s_peak, s_top)

    def test_over_budget_pulls_score_down(self) -> None:
        ok = score_listing_mcda(self.base_prefs, self.base_listing, status_type="ForSale")
        over = dict(self.base_listing)
        over["price"] = 1_300_000
        bad = score_listing_mcda(self.base_prefs, over, status_type="ForSale")
        self.assertLess(bad, ok)

    def test_below_min_beds_penalty(self) -> None:
        ok = score_listing_mcda(self.base_prefs, self.base_listing, status_type="ForSale")
        low = dict(self.base_listing)
        low["bedrooms"] = 2
        bad = score_listing_mcda(self.base_prefs, low, status_type="ForSale")
        self.assertLess(bad, ok)

    def test_wrong_property_type_penalty(self) -> None:
        ok = score_listing_mcda(self.base_prefs, self.base_listing, status_type="ForSale")
        condo = dict(self.base_listing)
        condo["homeType"] = "CONDO"
        bad = score_listing_mcda(self.base_prefs, condo, status_type="ForSale")
        self.assertLess(bad, ok)

    def test_amenities_soft_normalized(self) -> None:
        prefs = {"must_have": ["garage"], "preferred_home_features": ["pool"]}
        prop = {"features": {"desc": "2 car garage and heated pool"}}
        s = soft_amenities_normalized(prefs, prop)
        self.assertGreater(s, 0.85)

    def test_hard_multiplier_product(self) -> None:
        prefs = {
            "home_budget_max": 500_000,
            "preferred_bedrooms_min": 3,
            "preferred_housing_type": "condo",
        }
        prop = {
            "price": 700_000,
            "bedrooms": 1,
            "homeType": "SINGLE_FAMILY",
        }
        hm = hard_constraints.hard_constraint_multiplier(
            prefs,
            prop,
            "ForSale",
            MCDA_CONFIG["hard_multipliers"],
        )
        self.assertLess(hm, 1.0)
        self.assertGreaterEqual(hm, MCDA_CONFIG["hard_multipliers"]["multiplier_floor"])

    def test_rent_budget_uses_monthly_equivalent(self) -> None:
        prefs = {"home_budget_max": 36_000}
        listing = {"price": 1800, "bedrooms": 2, "homeType": "APARTMENT"}
        s = score_listing_mcda(prefs, listing, status_type="ForRent")
        self.assertGreaterEqual(s, 15.0)
        self.assertLessEqual(s, 90.0)


if __name__ == "__main__":
    unittest.main()
