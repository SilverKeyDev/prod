"""Encode/decode Google Maps encoded polylines (used by Directions API)."""

from __future__ import annotations

from math import atan2, cos, radians, sin, sqrt


def decode(polyline: str) -> list[tuple[float, float]]:
    """Return list of (lat, lng) from an encoded polyline string."""
    index = 0
    lat = 0
    lng = 0
    coordinates: list[tuple[float, float]] = []

    while index < len(polyline):
        result = 0
        shift = 0
        while True:
            b = ord(polyline[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlat = ~(result >> 1) if (result & 1) else (result >> 1)
        lat += dlat

        result = 0
        shift = 0
        while True:
            b = ord(polyline[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlng = ~(result >> 1) if (result & 1) else (result >> 1)
        lng += dlng

        # Integer deltas × 1e-5 degrees; round so encode→decode round-trips without float drift.
        coordinates.append((round(lat * 1e-5, 5), round(lng * 1e-5, 5)))

    return coordinates


def encode(coordinates: list[tuple[float, float]]) -> str:
    """Encode (lat, lng) points to a Google polyline string."""
    last_lat = 0
    last_lng = 0
    result: list[str] = []

    for lat, lng in coordinates:
        lat_i = int(round(lat * 1e5))
        lng_i = int(round(lng * 1e5))
        d_lat = lat_i - last_lat
        d_lng = lng_i - last_lng
        last_lat = lat_i
        last_lng = lng_i
        result.append(_encode_signed(d_lat))
        result.append(_encode_signed(d_lng))

    return "".join(result)


def _encode_signed(value: int) -> str:
    sgn = value << 1
    if value < 0:
        sgn = ~sgn
    chunks: list[str] = []
    while sgn >= 0x20:
        chunks.append(chr((0x20 | (sgn & 0x1F)) + 63))
        sgn >>= 5
    chunks.append(chr(sgn + 63))
    return "".join(chunks)


def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in meters (WGS84 sphere)."""
    r = 6371000.0
    p1, p2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlmb = radians(lon2 - lon1)
    a = sin(dphi / 2) ** 2 + cos(p1) * cos(p2) * sin(dlmb / 2) ** 2
    return 2 * r * atan2(sqrt(a), sqrt(1 - a))
