"""Multi-value home type matching for MCDA."""

from app.services.search.home_matching.mcda.criteria.property_type import (
    listing_matches_preferred_housing_type,
)


def test_comma_separated_matches_second_type() -> None:
    prefs = {"preferred_housing_type": "house,condos-co-ops"}
    prop = {"homeType": "CONDO"}
    assert listing_matches_preferred_housing_type(prefs, prop, "ForSale") is True


def test_comma_separated_false_when_none_match() -> None:
    prefs = {"housing_type": "house,apartments"}
    prop = {"homeType": "CONDO"}
    assert listing_matches_preferred_housing_type(prefs, prop, "ForSale") is False


def test_single_token_still_works() -> None:
    prefs = {"housing_type": "house"}
    prop = {"homeType": "SINGLE_FAMILY"}
    assert listing_matches_preferred_housing_type(prefs, prop, "ForSale") is True


def test_unknown_listing_type_returns_none() -> None:
    prefs = {"housing_type": "house"}
    prop = {"homeType": ""}
    assert listing_matches_preferred_housing_type(prefs, prop, "ForSale") is None
