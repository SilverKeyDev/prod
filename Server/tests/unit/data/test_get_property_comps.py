"""Tests for ``get_property_comps`` from the Slipstream data module.

Covers the comps happy path, subject-not-found and missing-coordinates errors,
and ensuring the subject listing is excluded from the returned comps.
"""

from __future__ import annotations

from unittest.mock import patch

from ._helpers import _mock_response, _raw_listing


class TestGetPropertyComps:
    @patch("app.services.search.data.property.property_comps.slipstream_get")
    @patch("app.services.search.data.property.property_comps.get_property_detail")
    def test_success(self, mock_detail, mock_get):
        subject = {
            "zpid": "SUB-1",
            "latitude": 33.75,
            "longitude": -84.39,
            "bedrooms": 3,
            "propertyType": "Single Family Residence",
        }
        mock_detail.return_value = (subject, None)
        mock_get.return_value = _mock_response(
            {
                "success": True,
                "result": {
                    "listings": [
                        _raw_listing(id="C1", status="Sold"),
                        _raw_listing(id="C2", status="Sold"),
                    ],
                },
            }
        )
        from app.services.search.data.property.property_comps import get_property_comps

        comps, err = get_property_comps(listing_id="SUB-1")
        assert err is None
        assert len(comps) == 2
        assert comps[0]["zpid"] == "C1"
        call_params = mock_get.call_args[1]["params"]
        assert "circle" in call_params
        assert call_params["beds"] == "2:4"
        assert call_params["propertyType"] == "Single Family Residence"

    @patch("app.services.search.data.property.property_comps.get_property_detail")
    def test_subject_not_found(self, mock_detail):
        mock_detail.return_value = (None, {"error": "NOT_FOUND"})
        from app.services.search.data.property.property_comps import get_property_comps

        comps, err = get_property_comps(listing_id="BAD")
        assert comps == []
        assert err["error"] == "NOT_FOUND"

    @patch("app.services.search.data.property.property_comps.get_property_detail")
    def test_no_coordinates(self, mock_detail):
        mock_detail.return_value = ({"zpid": "X", "latitude": None, "longitude": None}, None)
        from app.services.search.data.property.property_comps import get_property_comps

        comps, err = get_property_comps(listing_id="X")
        assert comps == []
        assert err["error"] == "NO_COORDINATES"

    @patch("app.services.search.data.property.property_comps.slipstream_get")
    @patch("app.services.search.data.property.property_comps.get_property_detail")
    def test_excludes_subject(self, mock_detail, mock_get):
        mock_detail.return_value = (
            {
                "zpid": "SUB-1",
                "latitude": 33.75,
                "longitude": -84.39,
                "bedrooms": 3,
                "propertyType": "SFR",
            },
            None,
        )
        mock_get.return_value = _mock_response(
            {
                "success": True,
                "result": {
                    "listings": [
                        _raw_listing(id="SUB-1"),
                        _raw_listing(id="C1"),
                    ],
                },
            }
        )
        from app.services.search.data.property.property_comps import get_property_comps

        comps, err = get_property_comps(listing_id="SUB-1")
        assert err is None
        zpids = [c["zpid"] for c in comps]
        assert "SUB-1" not in zpids
        assert "C1" in zpids
