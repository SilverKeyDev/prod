"""MCDA secondary soft signals and hard max-sqft."""

from app.services.search.home_matching.mcda.criteria.days_on_market import (
    soft_days_on_market_normalized,
)
from app.services.search.home_matching.mcda.criteria.hard_constraints import (
    hard_constraint_multiplier,
)
from app.services.search.home_matching.mcda.criteria.home_age_band import soft_home_age_normalized
from app.services.search.home_matching.mcda.criteria.listing_type_fit import (
    soft_listing_type_normalized,
)
from app.services.search.home_matching.mcda.criteria.lot_acres import soft_lot_acres_normalized
from app.services.search.home_matching.mcda.criteria.walkability_fit import (
    soft_walkability_normalized,
)
from app.services.search.home_matching.mcda.score import score_listing_mcda


def test_soft_lot_neutral_without_prefs() -> None:
    assert soft_lot_acres_normalized({}, {"lotAreaValue": 1.0, "lotAreaUnit": "acres"}) == 0.5


def test_soft_lot_in_band_high() -> None:
    prefs = {"preferred_lot_size_min": 0.5, "preferred_lot_size_max": 2.0}
    prop = {"lotAreaValue": 1.0, "lotAreaUnit": "acres"}
    assert soft_lot_acres_normalized(prefs, prop) >= 0.6


def test_soft_dom_in_band() -> None:
    prefs = {"days_on_market_min": 10, "days_on_market_max": 120}
    prop = {"daysOnMarket": 60}
    assert soft_days_on_market_normalized(prefs, prop) >= 0.85


def test_soft_dom_missing_neutral() -> None:
    prefs = {"days_on_market_min": 0, "days_on_market_max": 30}
    assert soft_days_on_market_normalized(prefs, {}) == 0.5


def test_soft_home_age_neutral_without_year_built() -> None:
    prefs = {"preferred_home_age_min": 5, "preferred_home_age_max": 30}
    assert soft_home_age_normalized(prefs, {}) == 0.5


def test_soft_home_age_in_band() -> None:
    prefs = {"preferred_home_age_min": 5, "preferred_home_age_max": 30}
    prop = {"yearBuilt": 2010}
    assert soft_home_age_normalized(prefs, prop) >= 0.85


def test_soft_walkability_neutral_when_not_important() -> None:
    prefs = {"walkability_importance": "not_important"}
    assert soft_walkability_normalized(prefs, {"walkScore": 90}) == 0.5


def test_soft_walkability_very_important_rewards_score() -> None:
    prefs = {"walkability_importance": "very_important"}
    low = soft_walkability_normalized(prefs, {"walkScore": 20})
    high = soft_walkability_normalized(prefs, {"walkScore": 90})
    assert high > low


def test_soft_listing_type_neutral_when_empty() -> None:
    assert soft_listing_type_normalized({}, {"listingStatus": "for_sale"}) == 0.5


def test_hard_above_max_sqft_applies() -> None:
    prefs = {"preferred_sqft_max": 1500}
    prop = {"livingArea": 3000}
    hard = {
        "above_max_sqft": 0.5,
        "multiplier_floor": 0.15,
    }
    m = hard_constraint_multiplier(prefs, prop, "ForSale", hard)
    assert m <= 0.51


def test_score_listing_mcda_runs_with_secondary_weights() -> None:
    prefs = {
        "home_budget_max": 500_000,
        "preferred_bedrooms": 2,
        "preferred_bathrooms": 1,
        "preferred_sqft_min": 800,
        "preferred_sqft_max": 2500,
        "preferred_lot_size_min": 0.1,
        "preferred_lot_size_max": 5.0,
        "days_on_market_min": 0,
        "days_on_market_max": 365,
        "walkability_importance": "somewhat_important",
        "listing_type": ["owner_posted"],
    }
    prop = {
        "price": 400_000,
        "bedrooms": 3,
        "bathrooms": 2,
        "livingArea": 1400,
        "lotAreaValue": 0.25,
        "lotAreaUnit": "acres",
        "daysOnMarket": 14,
        "walkScore": 55,
        "yearBuilt": 2010,
        "homeType": "SINGLE_FAMILY",
        "listingStatus": "for_sale",
    }
    s = score_listing_mcda(prefs, prop, status_type="ForSale")
    assert 1.0 <= s <= 99.0
