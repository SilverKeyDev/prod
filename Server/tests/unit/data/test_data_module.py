"""Tests for the Slipstream data module endpoint functions.

Uses mocked HTTP responses to verify that each data function:
- Builds the correct request to Slipstream
- Parses success/error responses correctly
- Normalizes listings through the normalizer
- Handles edge cases (empty, errors, missing fields)
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch


def _mock_response(json_data: dict, status_code: int = 200, ok: bool = True):
    resp = MagicMock()
    resp.status_code = status_code
    resp.ok = ok
    resp.content = True
    resp.json.return_value = json_data
    resp.text = str(json_data)[:500]
    return resp


def _raw_listing(**overrides):
    base = {
        "id": "MLS-100",
        "address": {
            "deliveryLine": "100 Oak Ave",
            "city": "Atlanta",
            "state": "GA",
            "zip": "30301",
        },
        "beds": 4,
        "baths": {"total": 3, "full": 2, "half": 1},
        "coordinates": {"latitude": 33.75, "longitude": -84.39},
        "listPrice": 500000,
        "size": 2500,
        "lotSize": {"sqft": 12000, "acres": 0.28},
        "propertyType": "Single Family Residence",
        "status": "Active",
        "images": ["img1.jpg", "img2.jpg"],
        "yearBuilt": 2015,
        "daysOnMarket": 10,
        "description": "Nice home",
        "newConstruction": False,
    }
    base.update(overrides)
    return base


# ---- search_active_listings ----


class TestSearchActiveListings:
    @patch("app.services.search.data.listings_active.slipstream_get")
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
        from app.services.search.data.listings_active import search_active_listings

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

    @patch("app.services.search.data.listings_active.slipstream_get")
    def test_api_error(self, mock_get):
        mock_get.return_value = _mock_response(
            {"success": False, "error": {"message": "Invalid filter"}},
            status_code=200,
            ok=True,
        )
        from app.services.search.data.listings_active import search_active_listings

        listings, paging, errors = search_active_listings()
        assert listings == []
        assert len(errors) == 1
        assert "Invalid filter" in errors[0]["text"]

    @patch("app.services.search.data.listings_active.slipstream_get")
    def test_http_error(self, mock_get):
        mock_get.return_value = _mock_response({}, status_code=500, ok=False)
        from app.services.search.data.listings_active import search_active_listings

        listings, paging, errors = search_active_listings()
        assert listings == []
        assert len(errors) == 1
        assert errors[0]["status"] == 500

    @patch("app.services.search.data.listings_active.slipstream_get")
    def test_empty_listings(self, mock_get):
        mock_get.return_value = _mock_response(
            {
                "success": True,
                "result": {"listings": [], "paging": {"number": 1, "count": 0, "size": 25}},
            }
        )
        from app.services.search.data.listings_active import search_active_listings

        listings, paging, errors = search_active_listings()
        assert listings == []
        assert errors == []

    @patch("app.services.search.data.listings_active.slipstream_get")
    def test_network_exception(self, mock_get):
        mock_get.side_effect = ConnectionError("timeout")
        from app.services.search.data.listings_active import search_active_listings

        listings, paging, errors = search_active_listings()
        assert listings == []
        assert len(errors) == 1
        assert "timeout" in errors[0]["error"]


# ---- search_inactive_listings ----


class TestSearchInactiveListings:
    @patch("app.services.search.data.listings_inactive.slipstream_get")
    def test_success(self, mock_get):
        mock_get.return_value = _mock_response(
            {
                "success": True,
                "result": {
                    "listings": [_raw_listing(id="S1", status="Sold", salePrice=480000)],
                    "paging": {"number": 1, "count": 1, "size": 25},
                },
            }
        )
        from app.services.search.data.listings_inactive import search_inactive_listings

        listings, paging, errors = search_inactive_listings()
        assert len(listings) == 1
        assert listings[0]["listingStatus"] == "Sold"
        assert listings[0]["salePrice"] == 480000
        mock_get.assert_called_once()
        assert "/ws/listings/inactive/search" in mock_get.call_args[0][0]


# ---- get_property_detail ----


class TestGetPropertyDetail:
    @patch("app.services.search.data.property_detail.slipstream_get")
    def test_by_id(self, mock_get):
        mock_get.return_value = _mock_response(
            {
                "success": True,
                "result": {"listings": [_raw_listing(id="D1")]},
            }
        )
        from app.services.search.data.property_detail import get_property_detail

        data, err = get_property_detail(listing_id="D1")
        assert err is None
        assert data["zpid"] == "D1"
        assert data["bedrooms"] == 4
        call_params = mock_get.call_args[1]["params"]
        assert call_params["id"] == "D1"
        assert call_params["details"] == "true"

    @patch("app.services.search.data.property_detail.slipstream_get")
    def test_by_address(self, mock_get):
        mock_get.return_value = _mock_response(
            {
                "success": True,
                "result": {"listings": [_raw_listing()]},
            }
        )
        from app.services.search.data.property_detail import get_property_detail

        data, err = get_property_detail(address="100 Oak Ave, Atlanta, GA")
        assert err is None
        assert data is not None
        call_params = mock_get.call_args[1]["params"]
        assert call_params["address"] == "100 Oak Ave, Atlanta, GA"

    def test_missing_params(self):
        from app.services.search.data.property_detail import get_property_detail

        data, err = get_property_detail()
        assert data is None
        assert err["error"] == "MISSING_PARAM"

    @patch("app.services.search.data.property_detail.slipstream_get")
    def test_not_found(self, mock_get):
        mock_get.return_value = _mock_response(
            {
                "success": True,
                "result": {"listings": []},
            }
        )
        from app.services.search.data.property_detail import get_property_detail

        data, err = get_property_detail(listing_id="NONEXISTENT")
        assert data is None
        assert err["error"] == "NOT_FOUND"

    @patch("app.services.search.data.property_detail.slipstream_get")
    def test_uuid_listing_id_retries_with_address(self, mock_get):
        """Favorite-row UUIDs are not Slipstream listing ids; address fallback loads the home."""
        uid = "3938fbed-65de-4816-b67b-a24fae9a9678"
        empty = _mock_response({"success": True, "result": {"listings": []}})
        ok = _mock_response(
            {"success": True, "result": {"listings": [_raw_listing(id="MLS-RETRY")]}},
        )
        mock_get.side_effect = [empty, ok]
        from app.services.search.data.property_detail import get_property_detail

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

    @patch("app.services.search.data.property_detail.slipstream_get")
    def test_uuid_listing_id_no_address_single_call(self, mock_get):
        mock_get.return_value = _mock_response(
            {"success": True, "result": {"listings": []}},
        )
        from app.services.search.data.property_detail import get_property_detail

        data, err = get_property_detail(listing_id="3938fbed-65de-4816-b67b-a24fae9a9678")
        assert data is None
        assert err["error"] == "NOT_FOUND"
        mock_get.assert_called_once()


# ---- get_property_images ----


class TestGetPropertyImages:
    @patch("app.services.search.data.property_images.slipstream_get")
    def test_returns_images(self, mock_get):
        mock_get.return_value = _mock_response(
            {
                "success": True,
                "result": {
                    "listings": [{"images": ["a.jpg", "b.jpg", "c.jpg"]}],
                },
            }
        )
        from app.services.search.data.property_images import get_property_images

        imgs = get_property_images("MLS-001")
        assert imgs == ["a.jpg", "b.jpg", "c.jpg"]

    @patch("app.services.search.data.property_images.slipstream_get")
    def test_no_images(self, mock_get):
        mock_get.return_value = _mock_response(
            {
                "success": True,
                "result": {"listings": [{"images": []}]},
            }
        )
        from app.services.search.data.property_images import get_property_images

        imgs = get_property_images("MLS-001")
        assert imgs == []

    def test_empty_id(self):
        from app.services.search.data.property_images import get_property_images

        assert get_property_images("") == []

    @patch("app.services.search.data.property_images.slipstream_get")
    def test_api_failure(self, mock_get):
        mock_get.return_value = _mock_response({}, status_code=500, ok=False)
        from app.services.search.data.property_images import get_property_images

        assert get_property_images("MLS-001") == []


# ---- get_property_comps ----


class TestGetPropertyComps:
    @patch("app.services.search.data.property_comps.slipstream_get")
    @patch("app.services.search.data.property_comps.get_property_detail")
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
        from app.services.search.data.property_comps import get_property_comps

        comps, err = get_property_comps(listing_id="SUB-1")
        assert err is None
        assert len(comps) == 2
        assert comps[0]["zpid"] == "C1"
        call_params = mock_get.call_args[1]["params"]
        assert "circle" in call_params
        assert call_params["beds"] == "2:4"
        assert call_params["propertyType"] == "Single Family Residence"

    @patch("app.services.search.data.property_comps.get_property_detail")
    def test_subject_not_found(self, mock_detail):
        mock_detail.return_value = (None, {"error": "NOT_FOUND"})
        from app.services.search.data.property_comps import get_property_comps

        comps, err = get_property_comps(listing_id="BAD")
        assert comps == []
        assert err["error"] == "NOT_FOUND"

    @patch("app.services.search.data.property_comps.get_property_detail")
    def test_no_coordinates(self, mock_detail):
        mock_detail.return_value = ({"zpid": "X", "latitude": None, "longitude": None}, None)
        from app.services.search.data.property_comps import get_property_comps

        comps, err = get_property_comps(listing_id="X")
        assert comps == []
        assert err["error"] == "NO_COORDINATES"

    @patch("app.services.search.data.property_comps.slipstream_get")
    @patch("app.services.search.data.property_comps.get_property_detail")
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
        from app.services.search.data.property_comps import get_property_comps

        comps, err = get_property_comps(listing_id="SUB-1")
        assert err is None
        zpids = [c["zpid"] for c in comps]
        assert "SUB-1" not in zpids
        assert "C1" in zpids
