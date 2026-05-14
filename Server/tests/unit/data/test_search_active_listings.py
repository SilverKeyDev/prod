"""Tests for ``search_active_listings`` from the Slipstream data module.

Verifies request shape, response parsing, error paths, and edge cases for the
active-listings endpoint.
"""

from __future__ import annotations

from unittest.mock import patch

from ._helpers import _mock_response, _raw_listing


class TestSearchActiveListings:
    @patch("app.services.search.data.listings.listings_active.slipstream_get")
    def test_success(self, mock_get):
        mock_get.return_value = _mock_response(
            {
                "success": True,
                "result": {
                    "listings": [_raw_listing(id="A1"), _raw_listing(id="A2")],
                    "paging": {"number": 1, "count": 1, "size": 25},
                },
            }
        )
        from app.services.search.data.listings.listings_active import search_active_listings

        listings, paging, errors = search_active_listings(
            polygon_geojson={
                "type": "Polygon",
                "coordinates": [[[-84, 33], [-84, 34], [-83, 34], [-83, 33], [-84, 33]]],
            },
            filters={"beds": ">=3"},
        )
        assert len(listings) == 2
        assert listings[0]["zpid"] == "A1"
        assert listings[0]["bedrooms"] == 4
        assert paging["count"] == 1
        assert errors == []
        mock_get.assert_called_once()
        call_params = mock_get.call_args[1]["params"]
        assert call_params["market"] == "GAMLS"
        assert "polygon" in call_params
        assert call_params["beds"] == ">=3"

    @patch("app.services.search.data.listings.listings_active.slipstream_get")
    def test_api_error(self, mock_get):
        mock_get.return_value = _mock_response(
            {"success": False, "error": {"message": "Invalid filter"}},
            status_code=200,
            ok=True,
        )
        from app.services.search.data.listings.listings_active import search_active_listings

        listings, paging, errors = search_active_listings()
        assert listings == []
        assert len(errors) == 1
        assert "Invalid filter" in errors[0]["text"]

    @patch("app.services.search.data.listings.listings_active.slipstream_get")
    def test_http_error(self, mock_get):
        mock_get.return_value = _mock_response({}, status_code=500, ok=False)
        from app.services.search.data.listings.listings_active import search_active_listings

        listings, paging, errors = search_active_listings()
        assert listings == []
        assert len(errors) == 1
        assert errors[0]["status"] == 500

    @patch("app.services.search.data.listings.listings_active.slipstream_get")
    def test_empty_listings(self, mock_get):
        mock_get.return_value = _mock_response(
            {
                "success": True,
                "result": {"listings": [], "paging": {"number": 1, "count": 0, "size": 25}},
            }
        )
        from app.services.search.data.listings.listings_active import search_active_listings

        listings, paging, errors = search_active_listings()
        assert listings == []
        assert errors == []

    @patch("app.services.search.data.listings.listings_active.slipstream_get")
    def test_network_exception(self, mock_get):
        mock_get.side_effect = ConnectionError("timeout")
        from app.services.search.data.listings.listings_active import search_active_listings

        listings, paging, errors = search_active_listings()
        assert listings == []
        assert len(errors) == 1
        assert "timeout" in errors[0]["error"]
