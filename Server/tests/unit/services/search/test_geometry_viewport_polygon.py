"""Unit tests for viewport polygon parsing (geometry_helpers)."""

from app.services.search.helpers.geometry_helpers import parse_viewport_polygon_ring


def test_parse_viewport_valid_rectangle():
    rect = [
        {"lat": 33.75, "lng": -84.39},
        {"lat": 33.76, "lng": -84.39},
        {"lat": 33.76, "lng": -84.38},
        {"lat": 33.75, "lng": -84.38},
    ]
    ring, err = parse_viewport_polygon_ring(rect)
    assert err is None
    assert ring is not None
    assert ring[0]["lat"] == ring[-1]["lat"]


def test_parse_viewport_self_intersecting_bowtie():
    bowtie = [
        {"lat": 33.75, "lng": -84.39},
        {"lat": 33.76, "lng": -84.38},
        {"lat": 33.75, "lng": -84.38},
        {"lat": 33.76, "lng": -84.39},
    ]
    ring, err = parse_viewport_polygon_ring(bowtie)
    assert ring is None
    assert err == "INVALID_VIEWPORT_POLYGON_SELF_INTERSECT"
