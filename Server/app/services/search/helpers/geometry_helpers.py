"""
Geometry and geocoding helper functions for polygon manipulation, formatting, and address geocoding.
"""

from __future__ import annotations

import os

import requests
from flask import current_app


def simplify_polygon(
    polygon: list[dict[str, float]], max_points: int = 50
) -> list[dict[str, float]]:
    """
    Simplify a polygon by reducing the number of points while preserving the general shape.
    Uses Douglas-Peucker-like algorithm to keep the most important points.
    """
    if len(polygon) <= max_points:
        return polygon

    # Keep first and last points (should be the same for closed polygons)
    if polygon[0] == polygon[-1]:
        # Closed polygon - work with interior points
        interior_points = polygon[1:-1]
        target_interior = max_points - 2
    else:
        # Open polygon
        interior_points = polygon[1:-1]
        target_interior = max_points - 2

    if len(interior_points) <= target_interior:
        return polygon

    # Simple uniform sampling approach
    step = len(interior_points) / target_interior
    simplified_interior = []

    for i in range(target_interior):
        index = int(i * step)
        if index < len(interior_points):
            simplified_interior.append(interior_points[index])

    # Reconstruct polygon
    if polygon[0] == polygon[-1]:
        # Closed polygon
        simplified = [polygon[0]] + simplified_interior + [polygon[-1]]
    else:
        # Open polygon
        simplified = [polygon[0]] + simplified_interior + [polygon[-1]]

    return simplified


def to_polygon_param(ring: list[dict[str, float]]) -> str:
    """Convert polygon coordinates to comma-separated lat/lon pairs (legacy, unused)."""
    if len(ring) < 3:
        raise ValueError("Polygon needs at least 3 points")

    # Ensure polygon is closed
    if ring[0]["lon"] != ring[-1]["lon"] or ring[0]["lat"] != ring[-1]["lat"]:
        ring = ring + [ring[0]]

    # Format: "lon lat,lon lat,..."
    return ", ".join([f"{p['lon']} {p['lat']}" for p in ring])


def to_geojson_polygon(ring: list[dict[str, float]]) -> dict:
    """Convert internal polygon coords to GeoJSON Polygon for Slipstream.

    Input:  [{lat: 33.7, lon: -84.3}, ...]
    Output: {"type": "Polygon", "coordinates": [[[-84.3, 33.7], ...]]}

    GeoJSON uses [longitude, latitude] order.  The polygon is closed automatically.
    """
    if len(ring) < 3:
        raise ValueError("Polygon needs at least 3 points")

    coords = [[p["lon"], p["lat"]] for p in ring]
    if coords[0] != coords[-1]:
        coords.append(coords[0])
    return {"type": "Polygon", "coordinates": [coords]}


def geocode_address_google(address: str) -> tuple[float, float] | None:
    """
    Geocode an address to lat/lon using Google Geocoding API.
    Returns (lat, lon) tuple or None if geocoding fails.
    """
    try:
        google_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        if not google_api_key:
            current_app.logger.error("🗺️ GEOCODING: ❌ Google Maps API key not configured")
            return None

        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {"address": address, "key": google_api_key}

        response = requests.get(url, params=params, timeout=300)
        response.raise_for_status()

        data = response.json()
        status = data.get("status")
        results = data.get("results", [])

        if status == "OK" and results:
            location = results[0]["geometry"]["location"]
            lat, lon = location["lat"], location["lng"]
            return (lat, lon)
        else:
            current_app.logger.warning(f"🗺️ GEOCODING: ⚠️ Geocoding failed for address: '{address}'")
            current_app.logger.warning(f"🗺️ GEOCODING: ⚠️ Status: {status}")
            current_app.logger.warning(
                f"🗺️ GEOCODING: ⚠️ Error message: {data.get('error_message', 'No error message')}"
            )
            if status == "ZERO_RESULTS":
                current_app.logger.warning("🗺️ GEOCODING: ⚠️ No results found for this address")
            elif status == "OVER_QUERY_LIMIT":
                current_app.logger.error("🗺️ GEOCODING: ❌ API quota exceeded")
            elif status == "REQUEST_DENIED":
                current_app.logger.error("🗺️ GEOCODING: ❌ API request denied - check API key")
            elif status == "INVALID_REQUEST":
                current_app.logger.error(
                    "🗺️ GEOCODING: ❌ Invalid request - missing address parameter"
                )
            return None

    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"🗺️ GEOCODING: ❌ Network error geocoding '{address}': {e}")
        current_app.logger.error(f"🗺️ GEOCODING: ❌ Error type: {type(e)}")
        return None
    except Exception as e:
        current_app.logger.error(f"🗺️ GEOCODING: ❌ Unexpected error geocoding '{address}': {e}")
        current_app.logger.error(f"🗺️ GEOCODING: ❌ Error type: {type(e)}")
        current_app.logger.error("🗺️ GEOCODING: ❌ Error traceback:", exc_info=True)
        return None


# Max ~85 mi N–S / E–W at mid-latitudes; rejects continent-scale viewports.
_MAX_VIEWPORT_LAT_SPAN = 1.25
_MAX_VIEWPORT_LON_SPAN = 1.25
_MIN_VIEWPORT_RING_POINTS = 4
_MAX_VIEWPORT_RING_POINTS = 50


def parse_viewport_polygon_ring(raw: object) -> tuple[list[dict[str, float]] | None, str | None]:
    """
    Parse JSON `viewport_polygon`: list of {lat, lng} or {lat, lon}.

    Returns:
        (None, None) — field omitted or JSON null; use preference isochrone.
        (None, err) — invalid payload (stable error codes for clients).
        (points, None) — success; closed ring as [{"lat","lon"}, ...] for simplify/to_polygon_param.

    Error codes: INVALID_VIEWPORT_POLYGON, VIEWPORT_TOO_LARGE
    """
    if raw is None:
        return (None, None)
    if not isinstance(raw, list):
        return (None, "INVALID_VIEWPORT_POLYGON")
    if len(raw) < _MIN_VIEWPORT_RING_POINTS or len(raw) > _MAX_VIEWPORT_RING_POINTS:
        return (None, "INVALID_VIEWPORT_POLYGON")

    out: list[dict[str, float]] = []
    for pt in raw:
        if not isinstance(pt, dict):
            return (None, "INVALID_VIEWPORT_POLYGON")
        lat_v = pt.get("lat")
        lon_v = pt.get("lon")
        if lon_v is None and pt.get("lng") is not None:
            lon_v = pt.get("lng")
        try:
            lat_f = float(lat_v)
            lon_f = float(lon_v)
        except (TypeError, ValueError):
            return (None, "INVALID_VIEWPORT_POLYGON")
        if not (-90.0 <= lat_f <= 90.0 and -180.0 <= lon_f <= 180.0):
            return (None, "INVALID_VIEWPORT_POLYGON")
        out.append({"lat": lat_f, "lon": lon_f})

    lats = [p["lat"] for p in out]
    lons = [p["lon"] for p in out]
    lat_span = max(lats) - min(lats)
    lon_span = max(lons) - min(lons)
    if lat_span <= 0 or lon_span <= 0:
        return (None, "INVALID_VIEWPORT_POLYGON")
    if lat_span > _MAX_VIEWPORT_LAT_SPAN or lon_span > _MAX_VIEWPORT_LON_SPAN:
        return (None, "VIEWPORT_TOO_LARGE")

    first = out[0]
    last = out[-1]
    if first["lat"] != last["lat"] or first["lon"] != last["lon"]:
        out = out + [{"lat": first["lat"], "lon": first["lon"]}]

    return (out, None)
