"""End-to-end pipeline test for the Slipstream migration.

Traces the full flow:
1. User preferences -> API filter parameters
2. Polygon geometry -> GeoJSON
3. Search API call (mocked) -> raw response
4. Raw response -> normalized listings
5. Normalized listings -> post-filter
6. Normalized fields -> client-side field mapping compatibility

This is the definitive integration test that proves the migration works.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch


def _slipstream_raw_response(count: int = 5) -> dict:
    """Simulate a realistic Slipstream /ws/listings/search response."""
    listings = []
    for i in range(count):
        listings.append(
            {
                "id": f"GAMLS-{1000 + i}",
                "address": {
                    "deliveryLine": f"{100 + i} Test St",
                    "city": "Atlanta",
                    "state": "GA",
                    "zip": f"3030{i}",
                },
                "beds": 3 + (i % 3),
                "baths": {"total": 2 + (i % 2), "full": 2, "half": i % 2},
                "coordinates": {"latitude": 33.75 + i * 0.01, "longitude": -84.39 + i * 0.01},
                "listPrice": 300000 + i * 50000,
                "size": 1500 + i * 200,
                "lotSize": {"sqft": 5000 + i * 1000, "acres": 0.12 + i * 0.02},
                "propertyType": "Single Family Residence" if i < 3 else "Condo",
                "listingType": "Residential",
                "status": "Active",
                "images": [f"img{i}_1.jpg", f"img{i}_2.jpg"] if i < 4 else [],
                "yearBuilt": 2000 + i * 5,
                "daysOnMarket": 5 + i * 3,
                "description": f"Beautiful home #{i} with modern kitchen and large yard.",
                "newConstruction": i == 0,
                "county": "Fulton",
                "subdivision": f"Subdivision {i}",
                "associationFee": 150 if i >= 3 else None,
            }
        )
    return {
        "success": True,
        "result": {
            "listings": listings,
            "paging": {"number": 1, "count": 1, "size": 25},
        },
    }


class TestEndToEndPipeline:
    """Verify the full polygon search pipeline works with Slipstream data."""

    def test_preferences_to_filters(self):
        """Step 1: User preferences become Slipstream API filter params.

        Delegates to the dedicated test (test_preferences_filters.py has 61
        tests). Here we verify the function is importable and test a basic case.
        """
        from unittest.mock import MagicMock, patch

        with patch("app.services.search.helpers.preferences_helpers.current_app", MagicMock()):
            from app.services.search.helpers.preferences_helpers import (
                map_user_preferences_to_filters,
            )

            filters = map_user_preferences_to_filters(
                {"budget_min": 250000, "budget_max": 500000, "bedrooms_min": 3},
                "ForSale",
            )
            assert isinstance(filters, dict)
            assert "sortField" in filters

    def test_geometry_conversion(self):
        """Step 2: Internal polygon coords -> GeoJSON for Slipstream."""
        from app.services.search.helpers.geometry_helpers import to_geojson_polygon

        ring = [
            {"lat": 33.70, "lon": -84.45},
            {"lat": 33.80, "lon": -84.45},
            {"lat": 33.80, "lon": -84.30},
            {"lat": 33.70, "lon": -84.30},
        ]
        geojson = to_geojson_polygon(ring)
        assert geojson["type"] == "Polygon"
        assert geojson["coordinates"][0][0] == [-84.45, 33.70]
        assert geojson["coordinates"][0][-1] == geojson["coordinates"][0][0]

    @patch("app.services.search.data.listings.listings_active.slipstream_get")
    def test_search_and_normalize(self, mock_get):
        """Steps 3-4: API call -> raw -> normalized."""
        mock_get.return_value = MagicMock(
            ok=True,
            status_code=200,
            content=True,
            json=MagicMock(return_value=_slipstream_raw_response(5)),
        )
        from app.services.search.data.listings.listings_active import search_active_listings

        listings, paging, errors = search_active_listings(
            polygon_geojson={
                "type": "Polygon",
                "coordinates": [[[-84, 33], [-84, 34], [-83, 34], [-83, 33], [-84, 33]]],
            },
        )
        assert len(listings) == 5
        assert errors == []
        for i, listing in enumerate(listings):
            assert listing["zpid"] == f"GAMLS-{1000 + i}"
            assert listing["mls_home_id"] == f"GAMLS-{1000 + i}"
            assert "Test St" in listing["streetAddress"]
            assert listing["city"] == "Atlanta"
            assert listing["bedrooms"] is not None
            assert listing["bathrooms"] is not None
            assert listing["livingArea"] is not None
            assert listing["price"] is not None
            assert listing["latitude"] is not None
            assert listing["longitude"] is not None
            assert listing["yearBuilt"] is not None

    def test_normalized_fields_for_client_transform(self):
        """Step 6: Verify normalized output has every field searchTransform.ts reads."""
        from app.services.search.data.normalizer import normalize_listing

        raw = _slipstream_raw_response(1)["result"]["listings"][0]
        n = normalize_listing(raw)

        client_required = [
            "zpid",
            "address",
            "bedrooms",
            "bathrooms",
            "livingArea",
            "latitude",
            "longitude",
            "lotAreaValue",
            "lotAreaUnit",
            "propertyType",
            "listingStatus",
            "imgSrc",
        ]
        for field in client_required:
            assert field in n, f"Missing field: {field}"
            assert n[field] is not None, f"Null field: {field}"

    def test_normalized_fields_for_shared_cache(self):
        """Verify normalized output has every field update_property_basic_data reads."""
        from app.services.search.data.normalizer import normalize_listing

        raw = _slipstream_raw_response(1)["result"]["listings"][0]
        n = normalize_listing(raw)

        cache_fields = [
            "streetAddress",
            "city",
            "state",
            "zipcode",
            "bedrooms",
            "bathrooms",
            "livingArea",
            "lotAreaValue",
            "zpid",
            "mls_home_id",
            "listingStatus",
            "propertyType",
            "homeType",
            "yearBuilt",
            "latitude",
            "longitude",
            "lotAreaUnit",
        ]
        for field in cache_fields:
            assert field in n, f"Missing cache field: {field}"

    def test_normalized_fields_for_scoring(self):
        """Verify normalized output has fields scoring uses."""
        from app.services.search.data.normalizer import normalize_listing

        raw = _slipstream_raw_response(1)["result"]["listings"][0]
        n = normalize_listing(raw)

        scoring_fields = [
            "bedrooms",
            "bathrooms",
            "livingArea",
            "price",
            "yearBuilt",
            "daysOnMarket",
            "description",
        ]
        for field in scoring_fields:
            assert field in n, f"Missing scoring field: {field}"

    def test_post_filter_compatibility(self):
        """Step 5: Verify post-filters work on normalized data.

        Uses the actual post-filter function signatures (individual args, not prefs dict).
        """
        import importlib.util
        import os

        from app.services.search.data.normalizer import normalize_listing

        base = os.path.join(os.path.dirname(__file__), "..", "..", "..", "app")

        def _load(name, fp):
            spec = importlib.util.spec_from_file_location(name, fp)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            return mod

        _bb = _load(
            "bb_pipe",
            os.path.join(
                base, "services", "search", "polygon", "polygon_post_filters", "beds_baths.py"
            ),
        )
        _sq = _load(
            "sq_pipe",
            os.path.join(
                base, "services", "search", "polygon", "polygon_post_filters", "sqft_dom_lot.py"
            ),
        )

        raw_response = _slipstream_raw_response(5)
        listings = [normalize_listing(r) for r in raw_response["result"]["listings"]]

        def _noop(*_a: object, **_k: object) -> None:
            return None

        filtered = _bb.apply_beds_baths_filter(
            listings,
            beds_min=4,
            beds_max=None,
            baths_min=None,
            baths_max=None,
            request_id="test",
            log_fn=_noop,
        )
        for p in filtered:
            assert p["bedrooms"] >= 4

        filtered_sqft = _sq.apply_sqft_filter(
            listings,
            sqft_min=1800,
            sqft_max=None,
            request_id="test",
            log_fn=_noop,
        )
        for p in filtered_sqft:
            assert p["livingArea"] >= 1800


class TestMultipleListingNormalization:
    """Verify normalize_listings works correctly on batches."""

    def test_batch(self):
        from app.services.search.data.normalizer import normalize_listings

        raw = _slipstream_raw_response(10)["result"]["listings"]
        normalized = normalize_listings(raw)
        assert len(normalized) == 10
        ids = [n["zpid"] for n in normalized]
        assert len(set(ids)) == 10

    def test_empty(self):
        from app.services.search.data.normalizer import normalize_listings

        assert normalize_listings([]) == []


class TestEdgeCases:
    """Edge cases that could cause issues in production."""

    def test_missing_address_object(self):
        from app.services.search.data.normalizer import normalize_listing

        raw = {"id": "X", "beds": 2}
        n = normalize_listing(raw)
        assert n["zpid"] == "X"
        assert n["address"] == ""
        assert n["streetAddress"] == ""

    def test_baths_as_number(self):
        from app.services.search.data.normalizer import normalize_listing

        raw = {"id": "Y", "baths": 2}
        n = normalize_listing(raw)
        assert n["bathrooms"] == 2

    def test_no_images(self):
        from app.services.search.data.normalizer import normalize_listing

        raw = {"id": "Z", "images": []}
        n = normalize_listing(raw)
        assert n["imgSrc"] is None
        assert n["images"] == []

    def test_lot_size_as_number(self):
        from app.services.search.data.normalizer import normalize_listing

        raw = {"id": "W", "lotSize": 5000}
        n = normalize_listing(raw)
        assert n["lotAreaValue"] == 5000

    def test_none_fields(self):
        from app.services.search.data.normalizer import normalize_listing

        raw = {"id": "V"}
        n = normalize_listing(raw)
        assert n["bedrooms"] is None
        assert n["bathrooms"] is None
        assert n["livingArea"] is None
        assert n["price"] is None
        assert n["latitude"] is None
        assert n["longitude"] is None
