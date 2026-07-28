"""Tests for map_user_preferences_to_filters (RapidAPI param generation).

Covers price, beds, baths, sqft, days on market, and home_type.
Lot/year/status/newConstruction stay out of upstream RapidAPI filters
(post-filters still handle them).
"""

from __future__ import annotations

import pytest

from app.services.search.helpers.preferences_helpers import map_user_preferences_to_filters


def _call(prefs: dict, status_type: str = "ForSale") -> dict:
    return map_user_preferences_to_filters(prefs, status_type=status_type)


# ---- Price / Budget ----


class TestPriceFilter:
    def test_budget_range(self):
        f = _call({"home_budget_min": 200000, "home_budget_max": 500000})
        assert f["minPrice"] == 200000
        assert f["maxPrice"] == 500000

    def test_budget_max_only_derives_min(self):
        f = _call({"home_budget_max": 400000})
        assert f["minPrice"] == 260000
        assert f["maxPrice"] == 400000

    def test_no_budget(self):
        f = _call({})
        assert "minPrice" not in f
        assert "maxPrice" not in f

    def test_budget_min_only_no_max(self):
        f = _call({"home_budget_min": 100000})
        assert f["minPrice"] == 100000
        assert "maxPrice" not in f

    def test_for_rent_budget(self):
        f = _call({"home_budget_min": 24000, "home_budget_max": 36000}, status_type="ForRent")
        assert f["rentMinPrice"] == 2000
        assert f["rentMaxPrice"] == 3000
        assert "minPrice" not in f
        assert "maxPrice" not in f

    def test_for_rent_max_only(self):
        f = _call({"home_budget_max": 36000}, status_type="ForRent")
        assert f["rentMaxPrice"] == 3000
        assert f["rentMinPrice"] == int(36000 * 0.7 / 12)

    def test_no_slipstream_list_price(self):
        f = _call({"home_budget_min": 200000, "home_budget_max": 500000})
        assert "listPrice" not in f


# ---- Bedrooms ----


class TestBedsFilter:
    def test_beds_min(self):
        f = _call({"preferred_bedrooms_min": 3})
        assert f["bedsMin"] == 3

    def test_beds_min_zero(self):
        f = _call({"preferred_bedrooms_min": 0})
        assert f["bedsMin"] == 0

    def test_beds_none(self):
        f = _call({})
        assert "bedsMin" not in f

    def test_beds_invalid_string(self):
        f = _call({"preferred_bedrooms_min": "abc"})
        assert "bedsMin" not in f

    def test_beds_float_truncated(self):
        f = _call({"preferred_bedrooms_min": 2.7})
        assert f["bedsMin"] == 2

    def test_no_slipstream_beds_operator(self):
        f = _call({"preferred_bedrooms_min": 3})
        assert "beds" not in f


# ---- Bathrooms ----


class TestBathsFilter:
    def test_baths_min(self):
        f = _call({"preferred_bathrooms_min": 2})
        assert f["bathsMin"] == 2

    def test_baths_none(self):
        f = _call({})
        assert "bathsMin" not in f

    def test_baths_invalid_string(self):
        f = _call({"preferred_bathrooms_min": "xyz"})
        assert "bathsMin" not in f

    def test_no_slipstream_baths_operator(self):
        f = _call({"preferred_bathrooms_min": 2})
        assert "baths" not in f


# ---- Square footage ----


class TestSqftFilter:
    def test_sqft_range(self):
        f = _call({"preferred_sqft_min": 1000, "preferred_sqft_max": 3000})
        assert f["minSqft"] == 1000
        assert f["maxSqft"] == 3000

    def test_sqft_min_only(self):
        f = _call({"preferred_sqft_min": 1500})
        assert f["minSqft"] == 1500
        assert "maxSqft" not in f

    def test_sqft_max_only(self):
        f = _call({"preferred_sqft_max": 2500})
        assert f["maxSqft"] == 2500
        assert "minSqft" not in f

    def test_sqft_none(self):
        f = _call({})
        assert "minSqft" not in f
        assert "maxSqft" not in f

    def test_no_slipstream_size(self):
        f = _call({"preferred_sqft_min": 1000, "preferred_sqft_max": 3000})
        assert "size" not in f


# ---- Days on market ----


class TestDomFilter:
    def test_dom_range(self):
        f = _call({"days_on_market_min": 5, "days_on_market_max": 30})
        assert f["daysOnMarketMin"] == 5
        assert f["daysOnMarketMax"] == 30

    def test_dom_max_only(self):
        f = _call({"days_on_market_max": 60})
        assert f["daysOnMarketMax"] == 60
        assert "daysOnMarketMin" not in f

    def test_dom_min_only(self):
        f = _call({"days_on_market_min": 10})
        assert f["daysOnMarketMin"] == 10
        assert "daysOnMarketMax" not in f

    def test_dom_none(self):
        f = _call({})
        assert "daysOnMarketMin" not in f
        assert "daysOnMarketMax" not in f

    def test_no_slipstream_days_on_market(self):
        f = _call({"days_on_market_min": 5, "days_on_market_max": 30})
        assert "daysOnMarket" not in f


# ---- Property / housing type ----


class TestPropertyTypeFilter:
    @pytest.mark.parametrize(
        "pref_value,expected",
        [
            ("single_family", "Houses"),
            ("house", "Houses"),
            ("houses", "Houses"),
            ("condo", "Condos"),
            ("condos", "Condos"),
            ("townhouse", "Townhomes"),
            ("townhome", "Townhomes"),
            ("townhomes", "Townhomes"),
            ("apartment", "Apartments"),
            ("apartments", "Apartments"),
            ("multi_family", "Multi-family"),
            ("multi-family", "Multi-family"),
            ("multifamily", "Multi-family"),
            ("manufactured", "Manufactured"),
            ("mobile", "Manufactured"),
            ("land", "LotsLand"),
            ("lot", "LotsLand"),
            ("lots", "LotsLand"),
            ("lots-land", "LotsLand"),
        ],
    )
    def test_property_type_mapping(self, pref_value, expected):
        f = _call({"preferred_housing_type": pref_value})
        assert f["home_type"] == expected

    def test_property_type_multi_value_uses_first(self):
        f = _call({"preferred_housing_type": "townhome,condos-co-ops,lots-land"})
        assert f["home_type"] == "Townhomes"

    def test_property_type_fallback_to_housing_type(self):
        f = _call({"housing_type": "condo"})
        assert f["home_type"] == "Condos"

    def test_property_type_case_insensitive(self):
        f = _call({"preferred_housing_type": "TOWNHOUSE"})
        assert f["home_type"] == "Townhomes"

    def test_unknown_property_type(self):
        f = _call({"preferred_housing_type": "castle"})
        assert "home_type" not in f

    def test_empty_property_type(self):
        f = _call({"preferred_housing_type": ""})
        assert "home_type" not in f

    def test_for_rent_home_type(self):
        f = _call({"preferred_housing_type": "condo"}, status_type="ForRent")
        assert f["home_type"] == "Apartments_Condos_Co-ops"

    def test_no_slipstream_property_type(self):
        f = _call({"preferred_housing_type": "house"})
        assert "propertyType" not in f


# ---- Not forwarded upstream (post-filters handle these) ----


class TestNotForwardedUpstream:
    def test_lot_size_not_in_rapidapi_filters(self):
        f = _call({"preferred_lot_size_min": 0.25, "preferred_lot_size_max": 1.0})
        assert "lotSize" not in f

    def test_year_built_not_in_rapidapi_filters(self):
        f = _call({"preferred_home_age_min": 5, "preferred_home_age_max": 20})
        assert "yearBuilt" not in f

    def test_new_construction_not_in_rapidapi_filters(self):
        f = _call({"listing_type": ["new_construction"]})
        assert "newConstruction" not in f

    def test_listing_status_not_in_rapidapi_filters(self):
        f = _call({"listing_status": "active"})
        assert "status" not in f

    def test_no_slipstream_sort_defaults(self):
        f = _call({})
        assert "sortField" not in f
        assert "sortOrder" not in f


# ---- Combined preferences ----


class TestCombinedFilters:
    def test_full_preferences(self):
        f = _call(
            {
                "home_budget_min": 300000,
                "home_budget_max": 600000,
                "preferred_bedrooms_min": 3,
                "preferred_bathrooms_min": 2,
                "preferred_sqft_min": 1500,
                "preferred_sqft_max": 3000,
                "preferred_housing_type": "house",
                "preferred_lot_size_min": 0.25,
                "days_on_market_max": 30,
                "listing_type": ["new_construction"],
                "listing_status": "active",
            }
        )
        assert f["minPrice"] == 300000
        assert f["maxPrice"] == 600000
        assert f["bedsMin"] == 3
        assert f["bathsMin"] == 2
        assert f["minSqft"] == 1500
        assert f["maxSqft"] == 3000
        assert f["home_type"] == "Houses"
        assert f["daysOnMarketMax"] == 30
        assert "lotSize" not in f
        assert "newConstruction" not in f
        assert "status" not in f
        assert "listPrice" not in f
        assert "sortField" not in f
