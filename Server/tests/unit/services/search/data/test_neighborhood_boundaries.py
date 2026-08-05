"""Unit tests for GeoJSON → viewport ring conversion (public search area handoff)."""

import pytest

from app.services.search.data.neighborhood_boundaries import (
    _extract_centroid,
    geojson_to_viewport_ring,
    search_areas,
)


def test_geojson_polygon_swaps_lng_lat_axes():
    geometry = {
        "type": "Polygon",
        "coordinates": [
            [
                [-84.39, 33.75],
                [-84.38, 33.75],
                [-84.38, 33.76],
                [-84.39, 33.76],
                [-84.39, 33.75],
            ]
        ],
    }
    ring = geojson_to_viewport_ring(geometry)
    assert ring is not None
    assert ring[0] == {"lat": 33.75, "lon": -84.39}
    assert ring[2] == {"lat": 33.76, "lon": -84.38}
    assert len(ring) == 5


def test_geojson_multipolygon_uses_largest_outer_ring():
    geometry = {
        "type": "MultiPolygon",
        "coordinates": [
            [
                [
                    [-84.4, 33.7],
                    [-84.39, 33.7],
                    [-84.39, 33.71],
                    [-84.4, 33.7],
                ]
            ],
            [
                [
                    [-84.5, 33.8],
                    [-84.49, 33.8],
                    [-84.49, 33.81],
                    [-84.48, 33.81],
                    [-84.48, 33.8],
                    [-84.5, 33.8],
                ]
            ],
        ],
    }
    ring = geojson_to_viewport_ring(geometry)
    assert ring is not None
    assert len(ring) == 6
    assert ring[0] == {"lat": 33.8, "lon": -84.5}


def test_geojson_rejects_unsupported_or_too_short_rings():
    assert geojson_to_viewport_ring({"type": "Point", "coordinates": [-84.39, 33.75]}) is None
    assert geojson_to_viewport_ring({"type": "Polygon", "coordinates": []}) is None
    assert (
        geojson_to_viewport_ring(
            {
                "type": "Polygon",
                "coordinates": [[[-84.39, 33.75], [-84.38, 33.75]]],
            }
        )
        is None
    )
    assert geojson_to_viewport_ring({"type": "Polygon"}) is None


def test_extract_centroid_averages_ring_points():
    geometry = {
        "type": "Polygon",
        "coordinates": [
            [
                [-84.4, 33.7],
                [-84.2, 33.7],
                [-84.2, 33.9],
                [-84.4, 33.9],
                [-84.4, 33.7],  # closed ring repeats first vertex
            ]
        ],
    }
    center = _extract_centroid(geometry)
    assert center is not None
    # Mean of all ring vertices (including the closing duplicate).
    assert center["lat"] == pytest.approx(33.78)
    assert center["lng"] == pytest.approx(-84.32)


def test_search_areas_requires_keyword():
    areas, err = search_areas("   ")
    assert areas == []
    assert err == "keyword is required"
