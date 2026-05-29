"""Tests for map_user_preferences_to_filters (Slipstream API param generation).

Covers every filter dimension: price, beds, baths, sqft, days on market,
property type, lot size, year built / home age, new construction, and
listing status.  Each dimension tested in isolation and with edge cases.
"""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest


def _call(prefs: dict) -> dict:
    """Shorthand to call map_user_preferences_to_filters with a mock Flask app."""
    with patch("app.services.search.helpers.preferences_helpers.current_app", MagicMock()):
        from app.services.search.helpers.preferences_helpers import map_user_preferences_to_filters

        return map_user_preferences_to_filters(prefs)


# ---- Price / Budget ----


class TestPriceFilter:
    def test_budget_range(self):
        f = _call({"home_budget_min": 200000, "home_budget_max": 500000})
        assert f["listPrice"] == "200000:500000"

    def test_budget_max_only_derives_min(self):
        f = _call({"home_budget_max": 400000})
        assert f["listPrice"] == "260000:400000"

    def test_no_budget(self):
        f = _call({})
        assert "listPrice" not in f

    def test_budget_min_only_no_max(self):
        f = _call({"home_budget_min": 100000})
        assert f["listPrice"] == ">=100000"


# ---- Bedrooms ----


class TestBedsFilter:
    def test_beds_min(self):
        f = _call({"preferred_bedrooms_min": 3})
        assert f["beds"] == ">=3"

    def test_beds_min_zero(self):
        f = _call({"preferred_bedrooms_min": 0})
        assert f["beds"] == ">=0"

    def test_beds_none(self):
        f = _call({})
        assert "beds" not in f

    def test_beds_invalid_string(self):
        f = _call({"preferred_bedrooms_min": "abc"})
        assert "beds" not in f

    def test_beds_float_truncated(self):
        f = _call({"preferred_bedrooms_min": 2.7})
        assert f["beds"] == ">=2"


# ---- Bathrooms ----


class TestBathsFilter:
    def test_baths_min(self):
        f = _call({"preferred_bathrooms_min": 2})
        assert f["baths"] == ">=2"

    def test_baths_none(self):
        f = _call({})
        assert "baths" not in f

    def test_baths_invalid_string(self):
        f = _call({"preferred_bathrooms_min": "xyz"})
        assert "baths" not in f


# ---- Square footage ----


class TestSqftFilter:
    def test_sqft_range(self):
        f = _call({"preferred_sqft_min": 1000, "preferred_sqft_max": 3000})
        assert f["size"] == "1000:3000"

    def test_sqft_min_only(self):
        f = _call({"preferred_sqft_min": 1500})
        assert f["size"] == ">=1500"

    def test_sqft_max_only(self):
        f = _call({"preferred_sqft_max": 2500})
        assert f["size"] == "<=2500"

    def test_sqft_none(self):
        f = _call({})
        assert "size" not in f


# ---- Days on market ----


class TestDomFilter:
    def test_dom_range(self):
        f = _call({"days_on_market_min": 5, "days_on_market_max": 30})
        assert f["daysOnMarket"] == "5:30"

    def test_dom_max_only(self):
        f = _call({"days_on_market_max": 60})
        assert f["daysOnMarket"] == "<=60"

    def test_dom_min_only(self):
        f = _call({"days_on_market_min": 10})
        assert "daysOnMarket" not in f

    def test_dom_none(self):
        f = _call({})
        assert "daysOnMarket" not in f


# ---- Property / housing type ----


class TestPropertyTypeFilter:
    @pytest.mark.parametrize(
        "pref_value,expected",
        [
            ("single_family", "Single Family Residence"),
            ("house", "Single Family Residence"),
            ("houses", "Single Family Residence"),
            ("condo", "Condominium"),
            ("condos", "Condominium"),
            ("condos-co-ops", "Condominium"),
            ("townhouse", "Townhouse"),
            ("townhome", "Townhouse"),
            ("townhomes", "Townhouse"),
            ("apartment", "Condominium"),
            ("apartments", "Condominium"),
            ("multi_family", "Multi-Family"),
            ("multi-family", "Multi-Family"),
            ("multifamily", "Multi-Family"),
            ("manufactured", "Manufactured Home"),
            ("mobile", "Manufactured Home"),
            ("land", "Land"),
            ("lot", "Land"),
            ("lots", "Land"),
            ("lots-land", "Land"),
        ],
    )
    def test_property_type_mapping(self, pref_value, expected):
        f = _call({"preferred_housing_type": pref_value})
        assert f["propertyType"] == expected

    def test_property_type_multi_value_mapping(self):
        f = _call({"preferred_housing_type": "townhome,condos-co-ops,lots-land"})
        assert f["propertyType"] == "Townhouse,Condominium,Land"

    def test_property_type_fallback_to_housing_type(self):
        f = _call({"housing_type": "condo"})
        assert f["propertyType"] == "Condominium"

    def test_property_type_case_insensitive(self):
        f = _call({"preferred_housing_type": "TOWNHOUSE"})
        assert f["propertyType"] == "Townhouse"

    def test_unknown_property_type(self):
        f = _call({"preferred_housing_type": "castle"})
        assert "propertyType" not in f

    def test_empty_property_type(self):
        f = _call({"preferred_housing_type": ""})
        assert "propertyType" not in f


# ---- Lot size ----


class TestLotSizeFilter:
    def test_lot_range(self):
        f = _call({"preferred_lot_size_min": 0.25, "preferred_lot_size_max": 1.0})
        assert f["lotSize"] == "0.25:1.0"

    def test_lot_min_only(self):
        f = _call({"preferred_lot_size_min": 0.5})
        assert f["lotSize"] == ">=0.5"

    def test_lot_max_only(self):
        f = _call({"preferred_lot_size_max": 2.0})
        assert f["lotSize"] == "<=2.0"

    def test_lot_none(self):
        f = _call({})
        assert "lotSize" not in f


# ---- Year built / home age ----


class TestYearBuiltFilter:
    @pytest.fixture(autouse=True)
    def _freeze_year(self):
        self.current_year = datetime.now(tz=timezone.utc).year

    def test_age_range(self):
        f = _call({"preferred_home_age_min": 5, "preferred_home_age_max": 20})
        expected_oldest = self.current_year - 20
        expected_newest = self.current_year - 5
        assert f["yearBuilt"] == f"{expected_oldest}:{expected_newest}"

    def test_age_min_only(self):
        f = _call({"preferred_home_age_min": 10})
        expected_newest = self.current_year - 10
        assert f["yearBuilt"] == f"<={expected_newest}"

    def test_age_max_only(self):
        f = _call({"preferred_home_age_max": 30})
        expected_oldest = self.current_year - 30
        assert f["yearBuilt"] == f">={expected_oldest}"

    def test_age_none(self):
        f = _call({})
        assert "yearBuilt" not in f

    def test_age_zero_min(self):
        f = _call({"preferred_home_age_min": 0, "preferred_home_age_max": 5})
        expected_oldest = self.current_year - 5
        expected_newest = self.current_year
        assert f["yearBuilt"] == f"{expected_oldest}:{expected_newest}"


# ---- New construction ----


class TestNewConstructionFilter:
    def test_new_construction_in_listing_type(self):
        f = _call({"listing_type": ["new_construction"]})
        assert f["newConstruction"] == "true"

    def test_new_construction_mixed(self):
        f = _call({"listing_type": ["agent_listed", "new_construction"]})
        assert f["newConstruction"] == "true"

    def test_no_new_construction(self):
        f = _call({"listing_type": ["agent_listed"]})
        assert "newConstruction" not in f

    def test_empty_listing_type(self):
        f = _call({"listing_type": []})
        assert "newConstruction" not in f


# ---- Listing status ----


class TestListingStatusFilter:
    def test_active_status(self):
        f = _call({"listing_status": "active"})
        assert f["status"] == "Active"

    def test_pending_status(self):
        f = _call({"listing_status": "pending"})
        assert f["status"] == "Pending"

    def test_contingent_status(self):
        f = _call({"listing_status": "contingent"})
        assert f["status"] == "Contingent"

    def test_coming_soon_status(self):
        f = _call({"listing_status": "coming_soon"})
        assert f["status"] == "Coming Soon"

    def test_unknown_status(self):
        f = _call({"listing_status": "sold"})
        assert "status" not in f

    def test_empty_status(self):
        f = _call({"listing_status": ""})
        assert "status" not in f


# ---- Sort defaults ----


class TestSortDefaults:
    def test_sort_always_present(self):
        f = _call({})
        assert f["sortField"] == "listPrice"
        assert f["sortOrder"] == "asc"


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
        assert f["listPrice"] == "300000:600000"
        assert f["beds"] == ">=3"
        assert f["baths"] == ">=2"
        assert f["size"] == "1500:3000"
        assert f["propertyType"] == "Single Family Residence"
        assert f["lotSize"] == ">=0.25"
        assert f["daysOnMarket"] == "<=30"
        assert f["newConstruction"] == "true"
        assert f["status"] == "Active"
