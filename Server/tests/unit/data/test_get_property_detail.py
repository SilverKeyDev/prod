"""Tests for ``get_property_detail`` from the Slipstream data module.

Covers id and address lookup paths, missing-param validation, not-found responses,
and the UUID-fallback retry logic for favorite-row identifiers.
"""

from __future__ import annotations

from unittest.mock import patch

from ._helpers import _mock_response, _raw_listing


class TestGetPropertyDetail:
    @patch("app.services.search.data.property.property_detail.rapidapi_get")
    def test_by_id(self, mock_get):
        mock_get.return_value = _mock_response(
            {
                "success": True,
                "result": {"listings": [_raw_listing(id="D1")]},
            }
        )
        from app.services.search.data.property.property_detail import get_property_detail

        data, err = get_property_detail(listing_id="D1")
        assert err is None
        assert data["zpid"] == "D1"
        assert data["bedrooms"] == 4
        call_params = mock_get.call_args[1]["params"]
        assert call_params["zpid"] == "D1"
        assert call_params["details"] == "true"

    @patch("app.services.search.data.property.property_detail.slipstream_get")
    def test_by_address(self, mock_get):
        mock_get.return_value = _mock_response(
            {
                "success": True,
                "result": {"listings": [_raw_listing()]},
            }
        )
        from app.services.search.data.property.property_detail import get_property_detail

        data, err = get_property_detail(address="100 Oak Ave, Atlanta, GA")
        assert err is None
        assert data is not None
        call_params = mock_get.call_args[1]["params"]
        assert call_params["address"] == "100 Oak Ave, Atlanta, GA"

    def test_missing_params(self):
        from app.services.search.data.property.property_detail import get_property_detail

        data, err = get_property_detail()
        assert data is None
        assert err["error"] == "MISSING_PARAM"

    @patch("app.services.search.data.property.property_detail.slipstream_get")
    def test_not_found(self, mock_get):
        mock_get.return_value = _mock_response(
            {
                "success": True,
                "result": {"listings": []},
            }
        )
        from app.services.search.data.property.property_detail import get_property_detail

        data, err = get_property_detail(listing_id="NONEXISTENT")
        assert data is None
        assert err["error"] == "NOT_FOUND"

    @patch("app.services.search.data.property.property_detail.slipstream_get")
    def test_uuid_listing_id_retries_with_address(self, mock_get):
        """Favorite-row UUIDs are not Slipstream listing ids; address fallback loads the home."""
        uid = "3938fbed-65de-4816-b67b-a24fae9a9678"
        empty = _mock_response({"success": True, "result": {"listings": []}})
        ok = _mock_response(
            {"success": True, "result": {"listings": [_raw_listing(id="MLS-RETRY")]}},
        )
        mock_get.side_effect = [empty, ok]
        from app.services.search.data.property.property_detail import get_property_detail

        data, err = get_property_detail(
            listing_id=uid,
            address="100 Oak Ave, Atlanta, GA",
        )
        assert err is None
        assert data is not None
        assert data["zpid"] == "MLS-RETRY"
        assert mock_get.call_count == 2
        assert mock_get.call_args_list[0][1]["params"]["id"] == uid
        assert mock_get.call_args_list[1][1]["params"]["address"] == "100 Oak Ave, Atlanta, GA"

    @patch("app.services.search.data.property.property_detail.slipstream_get")
    def test_uuid_listing_id_no_address_single_call(self, mock_get):
        mock_get.return_value = _mock_response(
            {"success": True, "result": {"listings": []}},
        )
        from app.services.search.data.property.property_detail import get_property_detail

        data, err = get_property_detail(listing_id="3938fbed-65de-4816-b67b-a24fae9a9678")
        assert data is None
        assert err["error"] == "NOT_FOUND"
        mock_get.assert_called_once()
