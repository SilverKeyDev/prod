"""Tests for Slipstream HTTP client, geometry helpers, and persistence compatibility.

Covers:
- Client session/headers/URL construction
- GeoJSON polygon conversion
- Persistence layer field mapping from normalized data
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest


# ---- Client: headers & URL construction ----

class TestSlipstreamClient:
    @patch("app.services.search.data.client.SLIPSTREAM_PRIVATE", "s9-test-token")
    def test_headers(self):
        from app.services.search.data.client import get_slipstream_headers

        h = get_slipstream_headers()
        assert h["Authorization"] == "s9-test-token"
        assert h["Accept"] == "application/json"

    @patch("app.services.search.data.client.SLIPSTREAM_PRIVATE", None)
    def test_headers_missing_token(self):
        from app.services.search.data.client import get_slipstream_headers

        h = get_slipstream_headers()
        assert h["Authorization"] == ""

    def test_session_singleton(self):
        import app.services.search.data.client as mod

        old = mod._session
        mod._session = None
        try:
            s1 = mod.get_session()
            s2 = mod.get_session()
            assert s1 is s2
        finally:
            mod._session = old


# ---- Config ----

class TestSlipstreamConfig:
    def test_constants(self):
        from app.services.search.data.config import SLIPSTREAM_BASE, SLIPSTREAM_MARKET

        assert SLIPSTREAM_BASE == "https://slipstream.homejunction.com"
        assert SLIPSTREAM_MARKET == "GAMLS"


# ---- GeoJSON polygon conversion ----

class TestGeoJsonPolygon:
    def test_basic_conversion(self):
        from app.services.search.helpers.geometry_helpers import to_geojson_polygon

        ring = [
            {"lat": 33.75, "lon": -84.40},
            {"lat": 33.80, "lon": -84.40},
            {"lat": 33.80, "lon": -84.30},
            {"lat": 33.75, "lon": -84.30},
        ]
        geojson = to_geojson_polygon(ring)
        assert geojson["type"] == "Polygon"
        coords = geojson["coordinates"][0]
        assert coords[0] == [-84.40, 33.75]
        assert coords[-1] == coords[0]

    def test_auto_closes(self):
        from app.services.search.helpers.geometry_helpers import to_geojson_polygon

        ring = [
            {"lat": 33.0, "lon": -84.0},
            {"lat": 34.0, "lon": -84.0},
            {"lat": 34.0, "lon": -83.0},
        ]
        geojson = to_geojson_polygon(ring)
        coords = geojson["coordinates"][0]
        assert len(coords) == 4
        assert coords[0] == coords[-1]

    def test_already_closed(self):
        from app.services.search.helpers.geometry_helpers import to_geojson_polygon

        ring = [
            {"lat": 33.0, "lon": -84.0},
            {"lat": 34.0, "lon": -84.0},
            {"lat": 34.0, "lon": -83.0},
            {"lat": 33.0, "lon": -84.0},
        ]
        geojson = to_geojson_polygon(ring)
        coords = geojson["coordinates"][0]
        assert len(coords) == 4

    def test_too_few_points(self):
        from app.services.search.helpers.geometry_helpers import to_geojson_polygon

        with pytest.raises(ValueError, match="at least 3"):
            to_geojson_polygon([{"lat": 33.0, "lon": -84.0}, {"lat": 34.0, "lon": -84.0}])

    def test_lon_lat_order(self):
        from app.services.search.helpers.geometry_helpers import to_geojson_polygon

        ring = [{"lat": 40.0, "lon": -75.0}, {"lat": 41.0, "lon": -75.0}, {"lat": 41.0, "lon": -74.0}]
        coords = to_geojson_polygon(ring)["coordinates"][0]
        for c in coords:
            assert c[0] < 0
            assert c[1] > 0


# ---- Persistence field mapping ----

class TestPersistenceFieldMapping:
    """Verify that normalized Slipstream data maps correctly to PropertyCache columns."""

    def _normalized(self):
        from app.services.search.data.normalizer import normalize_listing

        raw = {
            "id": "MLS-789",
            "address": {"deliveryLine": "500 Elm St", "city": "Decatur", "state": "GA", "zip": "30030"},
            "beds": 3,
            "baths": {"total": 2.5},
            "size": 1850,
            "lotSize": {"sqft": 7500, "acres": 0.17},
            "listPrice": 375000,
            "coordinates": {"latitude": 33.77, "longitude": -84.30},
            "propertyType": "Single Family Residence",
            "status": "Active",
            "yearBuilt": 2008,
            "images": ["main.jpg"],
        }
        return normalize_listing(raw)

    def test_zpid_and_mls(self):
        n = self._normalized()
        assert n["zpid"] == "MLS-789"
        assert n["mls_home_id"] == "MLS-789"

    def test_address_fields(self):
        n = self._normalized()
        assert n["streetAddress"] == "500 Elm St"
        assert n["city"] == "Decatur"
        assert n["state"] == "GA"
        assert n["zipcode"] == "30030"
        assert "500 Elm St" in n["address"]

    def test_numeric_fields(self):
        n = self._normalized()
        assert n["bedrooms"] == 3
        assert n["bathrooms"] == 2.5
        assert n["livingArea"] == 1850
        assert n["lotAreaValue"] == 7500
        assert n["lotAreaUnit"] == "sqft"
        assert n["yearBuilt"] == 2008
        assert n["price"] == 375000

    def test_geo_fields(self):
        n = self._normalized()
        assert n["latitude"] == 33.77
        assert n["longitude"] == -84.30

    def test_type_status(self):
        n = self._normalized()
        assert n["propertyType"] == "Single Family Residence"
        assert n["homeType"] == "Single Family Residence"
        assert n["listingStatus"] == "Active"

    def test_images(self):
        n = self._normalized()
        assert n["imgSrc"] == "main.jpg"
        assert n["images"] == ["main.jpg"]


# ---- Data module barrel exports ----

class TestDataModuleBarrel:
    def test_all_exports(self):
        from app.services.search.data import (
            SLIPSTREAM_BASE,
            SLIPSTREAM_MARKET,
            SLIPSTREAM_PRIVATE,
            get_property_comps,
            get_property_detail,
            get_property_images,
            get_slipstream_headers,
            normalize_listing,
            normalize_listings,
            search_active_listings,
            search_inactive_listings,
            slipstream_get,
            slipstream_post,
            validate_token,
        )

        assert SLIPSTREAM_BASE == "https://slipstream.homejunction.com"
        assert SLIPSTREAM_MARKET == "GAMLS"
        assert callable(search_active_listings)
        assert callable(search_inactive_listings)
        assert callable(get_property_detail)
        assert callable(get_property_images)
        assert callable(get_property_comps)
        assert callable(normalize_listing)
        assert callable(normalize_listings)
        assert callable(slipstream_get)
        assert callable(slipstream_post)
        assert callable(validate_token)
