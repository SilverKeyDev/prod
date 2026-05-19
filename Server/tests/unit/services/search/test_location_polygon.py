"""Unit tests for isochrone polygon generation (locationPolygon)."""

from unittest.mock import patch

import pytest
from shapely.geometry import Polygon
from shapely.ops import unary_union

from app.services.search.polygon.locationPolygon import (
    _intersection_all,
    isochrone_polygon,
    isochrone_union_for_addresses,
)

MOCK_GEOCODE = "app.services.search.polygon.locationPolygon.geocode_address"
MOCK_ISO_POLYGON = "app.services.search.polygon.locationPolygon.isochrone_polygon"
MOCK_PICK_TOKEN = "app.services.search.polygon.locationPolygon._pick_token"


def _square_polygon(lon_offset: float = 0.0) -> dict:
    """GeoJSON Feature with a unit square polygon."""
    return {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [lon_offset, 0],
                    [1 + lon_offset, 0],
                    [1 + lon_offset, 1],
                    [lon_offset, 1],
                    [lon_offset, 0],
                ]
            ],
        },
        "properties": {},
    }


class TestShapelyGeometrySmoke:
    """Regression: Shapely + NumPy must not raise create_collection on union/intersection."""

    def test_unary_union_and_intersection_all_do_not_raise(self):
        a = Polygon([(0, 0), (2, 0), (2, 2), (0, 2)])
        b = Polygon([(1, 1), (3, 1), (3, 3), (1, 3)])
        merged = unary_union([a, b])
        assert not merged.is_empty

        overlap = _intersection_all([a, b])
        assert not overlap.is_empty


class TestIsochroneUnionForAddresses:
    @patch(MOCK_PICK_TOKEN, return_value="test-token")
    def test_zero_addresses_raises(self, _mock_token):
        with pytest.raises(RuntimeError, match="No isochrones could be generated"):
            isochrone_union_for_addresses([])

    @patch(MOCK_ISO_POLYGON)
    @patch(MOCK_GEOCODE)
    @patch(MOCK_PICK_TOKEN, return_value="test-token")
    def test_one_location_returns_feature(self, _mock_token, mock_geocode, mock_iso):
        mock_geocode.return_value = (33.75, -84.39)
        mock_iso.return_value = _square_polygon()

        result = isochrone_union_for_addresses(
            [("123 Main St, Atlanta, GA", 30)],
            include_individual=True,
        )

        assert result["type"] == "Feature"
        assert result["geometry"]["type"] == "Polygon"
        assert mock_geocode.call_count == 1
        assert mock_iso.call_count == 1

    @patch(MOCK_ISO_POLYGON)
    @patch(MOCK_GEOCODE)
    @patch(MOCK_PICK_TOKEN, return_value="test-token")
    def test_multiple_locations_intersection(self, _mock_token, mock_geocode, mock_iso):
        mock_geocode.side_effect = [(33.75, -84.39), (33.8, -84.35)]
        mock_iso.side_effect = [_square_polygon(0.0), _square_polygon(0.5)]

        result = isochrone_union_for_addresses(
            [
                ("Work, Atlanta, GA", 30),
                ("School, Atlanta, GA", 20),
            ],
            combine="intersection",
            include_individual=True,
        )

        assert result["type"] == "Feature"
        assert result["properties"]["combine"] == "intersection"
        assert result["properties"]["count"] == 2
        assert len(result["extras"]["individual_features"]) == 2
        assert mock_iso.call_count == 2

    @patch(MOCK_ISO_POLYGON)
    @patch(MOCK_GEOCODE)
    @patch(MOCK_PICK_TOKEN, return_value="test-token")
    def test_multiple_locations_disjoint_intersection_empty(self, _mock_token, mock_geocode, mock_iso):
        mock_geocode.side_effect = [(0.0, 0.0), (10.0, 10.0)]
        mock_iso.side_effect = [_square_polygon(0.0), _square_polygon(5.0)]

        result = isochrone_union_for_addresses(
            [("A", 30), ("B", 30)],
            combine="intersection",
        )

        assert result["properties"]["empty"] is True
        assert result["geometry"]["type"] == "GeometryCollection"
        assert result["geometry"]["geometries"] == []

    @patch(MOCK_ISO_POLYGON)
    @patch(MOCK_GEOCODE)
    @patch(MOCK_PICK_TOKEN, return_value="test-token")
    def test_multiple_locations_union(self, _mock_token, mock_geocode, mock_iso):
        mock_geocode.side_effect = [(33.75, -84.39), (33.8, -84.35)]
        mock_iso.side_effect = [_square_polygon(0.0), _square_polygon(0.5)]

        result = isochrone_union_for_addresses(
            [("A", 30), ("B", 20)],
            combine="union",
        )

        assert result["properties"]["combine"] == "union"
        assert result["properties"]["empty"] is False
        assert result["geometry"]["type"] in ("Polygon", "MultiPolygon")

    @patch(MOCK_PICK_TOKEN, return_value="test-token")
    def test_invalid_minutes_zero_raises(self, _mock_token):
        with pytest.raises(ValueError, match="minutes must be > 0"):
            isochrone_polygon(33.75, -84.39, 0, access_token="test-token")

    @patch(MOCK_PICK_TOKEN, return_value="test-token")
    def test_invalid_minutes_over_sixty_raises(self, _mock_token):
        with pytest.raises(ValueError, match="Mapbox max is 60 minutes"):
            isochrone_polygon(33.75, -84.39, 90, access_token="test-token")

    @patch(MOCK_PICK_TOKEN, return_value="test-token")
    def test_string_minutes_coerced(self, _mock_token):
        with patch(
            "app.services.search.polygon.locationPolygon.requests.get"
        ) as mock_get:
            mock_get.return_value.status_code = 200
            mock_get.return_value.json.return_value = {
                "features": [_square_polygon()],
            }
            result = isochrone_polygon(
                33.75,
                -84.39,
                "30",
                access_token="test-token",
            )
            assert result["type"] == "Feature"
            call_params = mock_get.call_args[1]["params"]
            assert call_params["contours_minutes"] == 30

    @patch(MOCK_GEOCODE)
    @patch(MOCK_PICK_TOKEN, return_value="test-token")
    def test_geocode_failure_propagates(self, _mock_token, mock_geocode):
        mock_geocode.side_effect = RuntimeError("No geocoding results for address: 'bad'")

        with pytest.raises(RuntimeError, match="No geocoding results"):
            isochrone_union_for_addresses([("bad", 30)])
