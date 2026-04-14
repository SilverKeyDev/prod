"""Tests for polygon search post-filters with Slipstream-normalized data.

Ensures that every post-filter correctly reads the field names produced
by the Slipstream normalizer (bedrooms, bathrooms, livingArea,
daysOnMarket, lotAreaValue, lotAreaUnit, yearBuilt, listingStatus,
description, newConstruction, etc.).
"""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest

from app.services.search.data.normalizer import normalize_listing
from app.services.search.helpers.home_age_preference_filter import (
    home_age_years_for_property,
    property_kept_for_home_age_range,
)
from app.services.search.helpers.listing_type_match import property_matches_listing_type_prefs
from app.services.search.home_matching.mcda.criteria.user_feature_match import (
    listing_satisfies_all_must_haves,
    user_feature_need_matches_property,
)
from app.services.search.polygon.polygon_post_filters.beds_baths import apply_beds_baths_filter
from app.services.search.polygon.polygon_post_filters.listing_status import (
    property_kept_for_listing_status_pref,
)
from app.services.search.polygon.polygon_post_filters.sqft_dom_lot import (
    apply_dom_filter,
    apply_lot_size_filter,
    apply_sqft_filter,
)


def _noop_log(*args, **kwargs):
    pass


def _make_normalized(**overrides) -> dict:
    """Build a normalized Slipstream listing dict with sensible defaults."""
    raw = {
        "id": "MLS-001",
        "address": {"deliveryLine": "1 Test Ln", "city": "Atlanta", "state": "GA", "zip": "30301"},
        "beds": 3,
        "baths": {"total": 2, "full": 2, "half": 0},
        "coordinates": {"latitude": 33.75, "longitude": -84.39},
        "listPrice": 400000,
        "size": 2000,
        "lotSize": {"sqft": 10890, "acres": 0.25},
        "propertyType": "Single Family Residence",
        "listingType": "Residential",
        "status": "Active",
        "images": ["photo.jpg"],
        "imageCount": 1,
        "yearBuilt": 2010,
        "daysOnMarket": 7,
        "description": "Lovely home with central air conditioning, attached garage, and a heated pool.",
        "newConstruction": False,
    }
    raw.update(overrides)
    return normalize_listing(raw)


# ---- Beds / Baths post-filter ----

class TestBedsBathsPostFilter:
    def test_keeps_matching(self):
        props = [_make_normalized(beds=3)]
        result = apply_beds_baths_filter(props, 2, None, None, None, "r1", _noop_log)
        assert len(result) == 1

    def test_filters_below_min_beds(self):
        props = [_make_normalized(beds=1)]
        result = apply_beds_baths_filter(props, 2, None, None, None, "r1", _noop_log)
        assert len(result) == 0

    def test_filters_above_max_beds(self):
        props = [_make_normalized(beds=5)]
        result = apply_beds_baths_filter(props, None, 4, None, None, "r1", _noop_log)
        assert len(result) == 0

    def test_keeps_matching_baths(self):
        props = [_make_normalized(baths={"total": 3, "full": 2, "half": 1})]
        result = apply_beds_baths_filter(props, None, None, 2, None, "r1", _noop_log)
        assert len(result) == 1

    def test_filters_below_min_baths(self):
        props = [_make_normalized(baths={"total": 1, "full": 1, "half": 0})]
        result = apply_beds_baths_filter(props, None, None, 2, None, "r1", _noop_log)
        assert len(result) == 0

    def test_keeps_when_missing(self):
        raw = {
            "id": "X", "address": {}, "listPrice": 100000, "status": "Active",
        }
        props = [normalize_listing(raw)]
        result = apply_beds_baths_filter(props, 3, None, 2, None, "r1", _noop_log)
        assert len(result) == 1


# ---- Sqft post-filter ----

class TestSqftPostFilter:
    def test_keeps_in_range(self):
        props = [_make_normalized(size=2000)]
        result = apply_sqft_filter(props, 1500, 2500, "r1", _noop_log)
        assert len(result) == 1

    def test_filters_below(self):
        props = [_make_normalized(size=800)]
        result = apply_sqft_filter(props, 1000, None, "r1", _noop_log)
        assert len(result) == 0

    def test_filters_above(self):
        props = [_make_normalized(size=4000)]
        result = apply_sqft_filter(props, None, 3000, "r1", _noop_log)
        assert len(result) == 0

    def test_keeps_when_missing(self):
        raw = {"id": "X", "address": {}, "listPrice": 100000, "status": "Active"}
        props = [normalize_listing(raw)]
        result = apply_sqft_filter(props, 1500, None, "r1", _noop_log)
        assert len(result) == 1


# ---- Days on market post-filter ----

class TestDomPostFilter:
    def test_keeps_in_range(self):
        props = [_make_normalized(daysOnMarket=14)]
        result = apply_dom_filter(props, 5, 30, "r1", _noop_log)
        assert len(result) == 1

    def test_filters_too_old(self):
        props = [_make_normalized(daysOnMarket=100)]
        result = apply_dom_filter(props, None, 30, "r1", _noop_log)
        assert len(result) == 0

    def test_filters_too_new(self):
        props = [_make_normalized(daysOnMarket=2)]
        result = apply_dom_filter(props, 5, None, "r1", _noop_log)
        assert len(result) == 0


# ---- Lot size post-filter ----

class TestLotSizePostFilter:
    def test_keeps_in_range_acres(self):
        props = [_make_normalized(lotSize={"sqft": 21780, "acres": 0.5})]
        result = apply_lot_size_filter(props, 0.25, 1.0, "r1", _noop_log)
        assert len(result) == 1

    def test_filters_too_small(self):
        props = [_make_normalized(lotSize={"sqft": 4356, "acres": 0.1})]
        result = apply_lot_size_filter(props, 0.25, None, "r1", _noop_log)
        assert len(result) == 0

    def test_sqft_to_acres_conversion(self):
        props = [_make_normalized(lotSize={"sqft": 43560, "acres": 1.0})]
        result = apply_lot_size_filter(props, 0.5, 1.5, "r1", _noop_log)
        assert len(result) == 1

    def test_keeps_when_missing(self):
        raw = {"id": "X", "address": {}, "listPrice": 100000, "status": "Active"}
        props = [normalize_listing(raw)]
        result = apply_lot_size_filter(props, 0.5, None, "r1", _noop_log)
        assert len(result) == 1


# ---- Home age post-filter ----

class TestHomeAgePostFilter:
    def test_age_calculation(self):
        prop = _make_normalized(yearBuilt=2010)
        age = home_age_years_for_property(prop, 2026)
        assert age == 16

    def test_age_missing_year(self):
        raw = {"id": "X", "address": {}, "listPrice": 100000, "status": "Active"}
        prop = normalize_listing(raw)
        assert home_age_years_for_property(prop, 2026) is None

    def test_keeps_in_range(self):
        prop = _make_normalized(yearBuilt=2010)
        assert property_kept_for_home_age_range(prop, age_min=10, age_max=20, current_year=2026) is True

    def test_too_new(self):
        prop = _make_normalized(yearBuilt=2024)
        assert property_kept_for_home_age_range(prop, age_min=5, age_max=None, current_year=2026) is False

    def test_too_old(self):
        prop = _make_normalized(yearBuilt=1950)
        assert property_kept_for_home_age_range(prop, age_min=None, age_max=30, current_year=2026) is False

    def test_missing_kept(self):
        raw = {"id": "X", "address": {}, "listPrice": 100000, "status": "Active"}
        prop = normalize_listing(raw)
        assert property_kept_for_home_age_range(prop, age_min=5, age_max=20, current_year=2026) is True


# ---- Listing status post-filter ----

class TestListingStatusPostFilter:
    def test_active_matches_active(self):
        prop = _make_normalized(status="Active")
        assert property_kept_for_listing_status_pref(prop, "active") is True

    def test_pending_matches_pending(self):
        prop = _make_normalized(status="Pending")
        assert property_kept_for_listing_status_pref(prop, "pending") is True

    def test_active_rejects_sold(self):
        prop = _make_normalized(status="Sold")
        assert property_kept_for_listing_status_pref(prop, "active") is False

    def test_missing_status_kept(self):
        raw = {"id": "X", "address": {}, "listPrice": 100000}
        prop = normalize_listing(raw)
        assert property_kept_for_listing_status_pref(prop, "active") is True


# ---- Listing type post-filter ----

class TestListingTypePostFilter:
    def test_agent_listed_active(self):
        prop = _make_normalized(status="Active")
        assert property_matches_listing_type_prefs(prop, ["agent_listed"]) is True

    def test_new_construction_by_year(self):
        current_year = datetime.now(tz=timezone.utc).year
        prop = _make_normalized(yearBuilt=current_year, status="Active")
        assert property_matches_listing_type_prefs(prop, ["new_construction"]) is True


# ---- Must-have features (garage, ac, pool, basement, etc.) ----

class TestMustHaveFeatures:
    def test_garage_in_description(self):
        prop = _make_normalized(description="This home has an attached garage and nice yard.")
        assert user_feature_need_matches_property(prop, "garage") is True

    def test_ac_in_description(self):
        prop = _make_normalized(description="Central air conditioning throughout.")
        assert user_feature_need_matches_property(prop, "ac") is True

    def test_pool_in_description(self):
        prop = _make_normalized(description="Enjoy the private swimming pool.")
        assert user_feature_need_matches_property(prop, "pool") is True

    def test_basement_in_description(self):
        prop = _make_normalized(description="Finished basement with walkout access.")
        assert user_feature_need_matches_property(prop, "basement") is True

    def test_waterfront_in_description(self):
        prop = _make_normalized(description="Beautiful lakefront property with dock.")
        assert user_feature_need_matches_property(prop, "waterfront") is True

    def test_heating_in_description(self):
        prop = _make_normalized(description="Forced air heating system recently updated.")
        assert user_feature_need_matches_property(prop, "heating") is True

    def test_single_story_in_description(self):
        prop = _make_normalized(description="Single story ranch-style home.")
        assert user_feature_need_matches_property(prop, "single_story") is True

    def test_feature_not_present(self):
        prop = _make_normalized(description="Basic home in quiet neighborhood.")
        assert user_feature_need_matches_property(prop, "pool") is False

    def test_satisfies_all_must_haves(self):
        prop = _make_normalized(
            description="Home with garage, central air conditioning, and heated pool."
        )
        assert listing_satisfies_all_must_haves(prop, ["garage", "ac", "pool"]) is True

    def test_fails_one_must_have(self):
        prop = _make_normalized(description="Home with garage and nice yard.")
        assert listing_satisfies_all_must_haves(prop, ["garage", "waterfront"]) is False

    def test_empty_must_have_list(self):
        prop = _make_normalized()
        assert listing_satisfies_all_must_haves(prop, []) is True

    def test_no_description_no_facts(self):
        raw = {"id": "X", "address": {}, "listPrice": 100000, "status": "Active"}
        prop = normalize_listing(raw)
        assert user_feature_need_matches_property(prop, "garage") is False
