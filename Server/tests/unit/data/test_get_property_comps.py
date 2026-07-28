"""Tests for ``get_property_comps`` from the RapidAPI data module.

Covers happy path, missing params, HTTP errors, subject exclusion, and limit.
"""

from __future__ import annotations

from unittest.mock import patch

from ._helpers import _mock_response, _rapidapi_property


class TestGetPropertyComps:
    @patch("app.services.search.data.property.property_comps.rapidapi_get")
    def test_success(self, mock_get):
        mock_get.return_value = _mock_response(
            [
                _rapidapi_property(zpid="C1", price=395000),
                _rapidapi_property(zpid="C2", price=405000),
            ]
        )
        from app.services.search.data.property.property_comps import get_property_comps

        comps, err = get_property_comps(listing_id="SUB-1")
        assert err is None
        assert len(comps) == 2
        assert comps[0]["zpid"] == "C1"
        call_params = mock_get.call_args[1]["params"]
        assert call_params == {"zpid": "SUB-1"}
        assert mock_get.call_args[0][0] == "/propertyComps"

    @patch("app.services.search.data.property.property_comps.rapidapi_get")
    def test_by_address(self, mock_get):
        mock_get.return_value = _mock_response([_rapidapi_property(zpid="C1")])
        from app.services.search.data.property.property_comps import get_property_comps

        comps, err = get_property_comps(address="100 Oak Ave, Atlanta, GA")
        assert err is None
        assert len(comps) == 1
        assert mock_get.call_args[1]["params"] == {"address": "100 Oak Ave, Atlanta, GA"}

    def test_missing_params(self):
        from app.services.search.data.property.property_comps import get_property_comps

        comps, err = get_property_comps()
        assert comps == []
        assert err["error"] == "MISSING_PARAM"

    @patch("app.services.search.data.property.property_comps.rapidapi_get")
    def test_http_error(self, mock_get):
        mock_get.return_value = _mock_response({}, status_code=503, ok=False)
        from app.services.search.data.property.property_comps import get_property_comps

        comps, err = get_property_comps(listing_id="123")
        assert comps == []
        assert err["error"] == "RAPIDAPI_ERROR"
        assert err["status_code"] == 503

    @patch("app.services.search.data.property.property_comps.rapidapi_get")
    def test_excludes_subject(self, mock_get):
        mock_get.return_value = _mock_response(
            [
                _rapidapi_property(zpid="SUB-1"),
                _rapidapi_property(zpid="C1"),
            ]
        )
        from app.services.search.data.property.property_comps import get_property_comps

        comps, err = get_property_comps(listing_id="SUB-1")
        assert err is None
        zpids = [c["zpid"] for c in comps]
        assert "SUB-1" not in zpids
        assert "C1" in zpids

    @patch("app.services.search.data.property.property_comps.rapidapi_get")
    def test_wrapped_data_payload(self, mock_get):
        mock_get.return_value = _mock_response(
            {"data": [_rapidapi_property(zpid="C1"), _rapidapi_property(zpid="C2")]}
        )
        from app.services.search.data.property.property_comps import get_property_comps

        comps, err = get_property_comps(listing_id="X")
        assert err is None
        assert len(comps) == 2

    @patch("app.services.search.data.property.property_comps.rapidapi_get")
    def test_respects_limit(self, mock_get):
        mock_get.return_value = _mock_response([_rapidapi_property(zpid=str(i)) for i in range(5)])
        from app.services.search.data.property.property_comps import get_property_comps

        comps, err = get_property_comps(listing_id="X", limit=2)
        assert err is None
        assert len(comps) == 2
