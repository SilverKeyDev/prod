"""Tests for ``get_property_detail`` from the RapidAPI data module.

Covers zpid and address lookup paths, missing-param validation, not-found,
list payloads, HTTP errors, and normalization of returned fields.
"""

from __future__ import annotations

from unittest.mock import patch

from ._helpers import _mock_response, _rapidapi_property


class TestGetPropertyDetail:
    @patch("app.services.search.data.property.property_detail.rapidapi_get")
    def test_by_id(self, mock_get):
        mock_get.return_value = _mock_response(_rapidapi_property(zpid="D1", bedrooms=4))
        from app.services.search.data.property.property_detail import get_property_detail

        data, err = get_property_detail(listing_id="D1")
        assert err is None
        assert data["zpid"] == "D1"
        assert data["bedrooms"] == 4
        assert "Oak" in data["streetAddress"] or data["city"] == "Atlanta"
        call_params = mock_get.call_args[1]["params"]
        assert call_params["zpid"] == "D1"
        assert "address" not in call_params

    @patch("app.services.search.data.property.property_detail.rapidapi_get")
    def test_by_address(self, mock_get):
        mock_get.return_value = _mock_response(_rapidapi_property())
        from app.services.search.data.property.property_detail import get_property_detail

        data, err = get_property_detail(address="100 Oak Ave, Atlanta, GA")
        assert err is None
        assert data is not None
        assert data["zpid"] == "12345"
        call_params = mock_get.call_args[1]["params"]
        assert call_params["address"] == "100 Oak Ave, Atlanta, GA"
        assert "zpid" not in call_params

    def test_missing_params(self):
        from app.services.search.data.property.property_detail import get_property_detail

        data, err = get_property_detail()
        assert data is None
        assert err["error"] == "MISSING_PARAM"

    @patch("app.services.search.data.property.property_detail.rapidapi_get")
    def test_not_found_empty_list(self, mock_get):
        mock_get.return_value = _mock_response([])
        from app.services.search.data.property.property_detail import get_property_detail

        data, err = get_property_detail(listing_id="NONEXISTENT")
        assert data is None
        assert err["error"] == "NOT_FOUND"

    @patch("app.services.search.data.property.property_detail.rapidapi_get")
    def test_list_payload_uses_first_item(self, mock_get):
        mock_get.return_value = _mock_response([_rapidapi_property(zpid="999")])
        from app.services.search.data.property.property_detail import get_property_detail

        data, err = get_property_detail(listing_id="999")
        assert err is None
        assert data["zpid"] == "999"

    @patch("app.services.search.data.property.property_detail.rapidapi_get")
    def test_http_error(self, mock_get):
        mock_get.return_value = _mock_response({}, status_code=502, ok=False)
        from app.services.search.data.property.property_detail import get_property_detail

        data, err = get_property_detail(listing_id="123")
        assert data is None
        assert err["error"] == "RAPIDAPI_ERROR"
        assert err["status_code"] == 502

    @patch("app.services.search.data.property.property_detail.rapidapi_get")
    def test_address_preferred_over_listing_id(self, mock_get):
        mock_get.return_value = _mock_response(_rapidapi_property())
        from app.services.search.data.property.property_detail import get_property_detail

        get_property_detail(listing_id="123", address="100 Oak Ave, Atlanta, GA")
        call_params = mock_get.call_args[1]["params"]
        assert call_params == {"address": "100 Oak Ave, Atlanta, GA"}
