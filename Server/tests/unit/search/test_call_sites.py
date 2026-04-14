"""Tests for Slipstream call sites: property_stream_steps and property_research_cache.

Verifies that the functions that used to call RapidAPI now correctly
delegate to the Slipstream data module.

These tests pre-mock deep dependency chains (models, db, scoring, home_matching)
to isolate just the data-fetching logic we're auditing in the migration.
"""

from __future__ import annotations

import sys
from unittest.mock import MagicMock, patch


def _mock_detail_success():
    return {
        "zpid": "MLS-555",
        "mls_home_id": "MLS-555",
        "address": "300 Pine St, Atlanta, GA 30301",
        "streetAddress": "300 Pine St",
        "city": "Atlanta",
        "state": "GA",
        "zipcode": "30301",
        "bedrooms": 3,
        "bathrooms": 2,
        "livingArea": 1800,
        "price": 350000,
        "latitude": 33.75,
        "longitude": -84.39,
        "imgSrc": "photo.jpg",
        "images": ["photo.jpg", "photo2.jpg"],
        "propertyType": "Single Family",
        "homeType": "Single Family",
        "listingStatus": "Active",
        "yearBuilt": 2012,
        "lotAreaValue": 8000,
        "lotAreaUnit": "sqft",
    }


def _stub_if_missing(name: str) -> None:
    """Insert a MagicMock module stub into sys.modules if not already present."""
    if name not in sys.modules:
        sys.modules[name] = MagicMock()


_DEEP_STUBS = [
    "app.home_matching",
    "app.home_matching.mcda",
    "app.home_matching.mcda.score",
    "app.services.search.models",
    "app.services.search.home_matching",
    "app.services.search.home_matching.preprocessing",
    "app.services.search.home_matching.preprocessing.home_input_data",
    "app.services.search.scoring",
    "app.services.search.scoring.match_score_pros_cons_counts",
    "app.services.search.scoring.research_preferences_context",
]

for _mod_name in _DEEP_STUBS:
    _stub_if_missing(_mod_name)


import importlib  # noqa: E402 (after sys.modules patching)

_stream_mod = importlib.import_module("app.services.search.property.property_stream_steps")
_cache_mod = importlib.import_module("app.services.research.property.property_research_cache")


# ---- fetch_basic_property_data ----


class TestFetchBasicPropertyData:
    def test_by_zpid(self):
        with patch.object(_stream_mod, "get_property_detail") as mock_detail:
            mock_detail.return_value = (_mock_detail_success(), None)
            data, err = _stream_mod.fetch_basic_property_data({"zpid": "MLS-555"})
            assert err is None
            assert data["zpid"] == "MLS-555"
            assert data["bedrooms"] == 3
            mock_detail.assert_called_once_with(listing_id="MLS-555", address=None)

    def test_by_address(self):
        with patch.object(_stream_mod, "get_property_detail") as mock_detail:
            mock_detail.return_value = (_mock_detail_success(), None)
            data, err = _stream_mod.fetch_basic_property_data(
                {"address": "300 Pine St, Atlanta, GA"}
            )
            assert err is None
            assert data is not None
            mock_detail.assert_called_once_with(listing_id=None, address="300 Pine St, Atlanta, GA")

    def test_error(self):
        with patch.object(_stream_mod, "get_property_detail") as mock_detail:
            mock_detail.return_value = (None, {"success": False, "error": "NOT_FOUND"})
            data, err = _stream_mod.fetch_basic_property_data({"zpid": "BAD"})
            assert data is None
            assert err["error"] == "NOT_FOUND"

    def test_empty_data_returns_error(self):
        with patch.object(_stream_mod, "get_property_detail") as mock_detail:
            mock_detail.return_value = (None, None)
            data, err = _stream_mod.fetch_basic_property_data({"zpid": "X"})
            assert data is None
            assert err["error"] == "SLIPSTREAM_ERROR"


# ---- fetch_zillow_images (now Slipstream) ----


class TestFetchZillowImages:
    def test_images_from_data(self):
        data = {"images": ["a.jpg", "b.jpg"]}
        imgs = _stream_mod.fetch_zillow_images({}, data)
        assert imgs == ["a.jpg", "b.jpg"]

    def test_fallback_to_api(self):
        with patch.object(_stream_mod, "get_property_images") as mock_imgs:
            mock_imgs.return_value = ["x.jpg", "y.jpg"]
            data = {"images": [], "zpid": "MLS-123"}
            imgs = _stream_mod.fetch_zillow_images({"zpid": "MLS-123"}, data)
            assert imgs == ["x.jpg", "y.jpg"]
            mock_imgs.assert_called_once_with("MLS-123")

    def test_no_images_no_id(self):
        imgs = _stream_mod.fetch_zillow_images({}, {})
        assert imgs == []

    def test_fallback_from_data_mls_home_id(self):
        with patch.object(_stream_mod, "get_property_images") as mock_imgs:
            mock_imgs.return_value = ["z.jpg"]
            data = {"images": [], "mls_home_id": "MLS-999"}
            imgs = _stream_mod.fetch_zillow_images({}, data)
            assert imgs == ["z.jpg"]


# ---- get_property_address ----


class TestGetPropertyAddress:
    def test_from_provided_address(self):
        assert _stream_mod.get_property_address({}, "100 Main St") == "100 Main St"

    def test_from_data(self):
        data = {
            "streetAddress": "200 Oak Ave",
            "city": "Atlanta",
            "state": "GA",
            "zipcode": "30301",
        }
        addr = _stream_mod.get_property_address(data, None)
        assert "200 Oak Ave" in addr
        assert "Atlanta" in addr

    def test_missing_data(self):
        assert _stream_mod.get_property_address(None, None) is None
        assert _stream_mod.get_property_address({}, None) is None

    def test_provided_address_takes_priority(self):
        data = {"streetAddress": "Ignore", "city": "Ignored", "state": "XX", "zipcode": "00000"}
        assert _stream_mod.get_property_address(data, "  Use This  ") == "Use This"


# ---- fetch_property_from_rapidapi (backward compat shim) ----


class TestFetchPropertyFromRapidapi:
    def test_delegates_to_slipstream(self):
        with patch.object(_cache_mod, "get_property_detail") as mock_detail:
            mock_detail.return_value = (_mock_detail_success(), None)
            data, err = _cache_mod.fetch_property_from_rapidapi({"zpid": "MLS-555"})
            assert err is None
            assert data["zpid"] == "MLS-555"
            mock_detail.assert_called_once()

    def test_error_returns_tuple(self):
        with patch.object(_cache_mod, "get_property_detail") as mock_detail:
            mock_detail.return_value = (
                None,
                {"success": False, "error": "NOT_FOUND", "status_code": 404},
            )
            data, err_tuple = _cache_mod.fetch_property_from_rapidapi({"zpid": "BAD"})
            assert data is None
            err, status = err_tuple
            assert status == 404

    def test_address_lookup(self):
        with patch.object(_cache_mod, "get_property_detail") as mock_detail:
            mock_detail.return_value = (_mock_detail_success(), None)
            data, err = _cache_mod.fetch_property_from_rapidapi({"address": "300 Pine St"})
            assert err is None
            mock_detail.assert_called_once_with(listing_id=None, address="300 Pine St")


# ---- research/property/property_images.py ----


class TestResearchPropertyImages:
    @patch("app.services.research.property.property_images._slipstream_get_images")
    def test_delegates_to_slipstream(self, mock_imgs):
        mock_imgs.return_value = ["a.jpg", "b.jpg"]

        with patch("app.services.research.property.property_images.current_app", MagicMock()):
            from app.services.research.property.property_images import fetch_zillow_images

            imgs = fetch_zillow_images("MLS-123")
            assert imgs == ["a.jpg", "b.jpg"]
            mock_imgs.assert_called_once_with("MLS-123")

    def test_extract_primary_image_from_list(self):
        from app.services.research.property.property_images import extract_primary_image

        assert extract_primary_image(["a.jpg", "b.jpg"], {}) == "a.jpg"

    def test_extract_primary_image_from_data(self):
        from app.services.research.property.property_images import extract_primary_image

        assert extract_primary_image([], {"images": ["x.jpg"]}) == "x.jpg"
        assert extract_primary_image([], {"imgSrc": "y.jpg"}) == "y.jpg"

    def test_extract_primary_image_none(self):
        from app.services.research.property.property_images import extract_primary_image

        assert extract_primary_image([], {}) is None
        assert extract_primary_image([], None) is None
