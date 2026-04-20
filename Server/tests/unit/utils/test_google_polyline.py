"""Tests for encoded polyline helpers used by viewing route legs."""

from app.utils.geo.google_polyline import decode, encode, haversine_meters


def test_polyline_round_trip() -> None:
    pts = [(38.5, -120.2), (40.7, -120.95), (43.252, -126.453)]
    assert decode(encode(pts)) == pts


def test_haversine_meters_antipodes_order_of_magnitude() -> None:
    # Rough half Earth circumference ~ 20 Mm
    d = haversine_meters(0, 0, 0, 180)
    assert 19_000_000 < d < 21_000_000
