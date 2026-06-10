"""
Geometry and geocoding helper functions for polygon manipulation, formatting, and address geocoding.
"""

from __future__ import annotations

import os

import requests

from logger import log


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
            log.error("API", "Google Maps API key not configured")
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
            log.warn(
                "API",
                "Geocoding failed for address",
                {
                    "address": address,
                    "status": status,
                    "error_message": data.get("error_message", "No error message"),
                },
            )
            if status == "ZERO_RESULTS":
                log.warn("API", "No geocoding results for address", {"address": address})
            elif status == "OVER_QUERY_LIMIT":
                log.error("API", "Google geocoding API quota exceeded")
            elif status == "REQUEST_DENIED":
                log.error("API", "Google geocoding API request denied")
            elif status == "INVALID_REQUEST":
                log.error("API", "Invalid geocoding request (missing address)")
            return None

    except requests.exceptions.RequestException as e:
        log.error(
            "ERRORS",
            "Network error geocoding address",
            {"address": address, "error": str(e), "error_type": type(e).__name__},
        )
        return None
    except Exception as e:
        log.error("ERRORS", "Unexpected geocoding error", e)
        return None


# Max ~85 mi N–S / E–W at mid-latitudes; rejects continent-scale viewports.
_MAX_VIEWPORT_LAT_SPAN = 1.25
_MAX_VIEWPORT_LON_SPAN = 1.25
_MIN_VIEWPORT_RING_POINTS = 4
_MAX_VIEWPORT_RING_POINTS = 50


def _segments_intersect_open(
    ax: float,
    ay: float,
    bx: float,
    by: float,
    cx: float,
    cy: float,
    dx: float,
    dy: float,
) -> bool:
    """True if segment AB intersects CD at a point interior to both (proper intersection)."""
    o1 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
    o2 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax)
    o3 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx)
    o4 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx)
    if o1 * o2 < 0 and o3 * o4 < 0:
        return True
    return False


def viewport_ring_self_intersects(ring: list[dict[str, float]]) -> bool:
    """
    Detect self-intersection for a simple closed ring (lat/lon space, degrees).

    Uses non-adjacent edge–edge intersection tests. Adjacent edges share a vertex and are skipped.
    """
    if len(ring) < 4:
        return False
    closed = ring[0]["lat"] == ring[-1]["lat"] and ring[0]["lon"] == ring[-1]["lon"]
    pts = ring[:-1] if closed else ring
    n = len(pts)
    if n < 3:
        return False

    def pt(i: int) -> tuple[float, float, float, float]:
        p = pts[i % n]
        q = pts[(i + 1) % n]
        return (p["lon"], p["lat"], q["lon"], q["lat"])

    for i in range(n):
        ax, ay, bx, by = pt(i)
        for j in range(i + 1, n):
            if j == (i + 1) % n or i == (j + 1) % n:
                continue
            if i == 0 and j == n - 1:
                continue
            cx, cy, dx, dy = pt(j)
            if _segments_intersect_open(ax, ay, bx, by, cx, cy, dx, dy):
                return True
    return False


def parse_viewport_polygon_ring(raw: object) -> tuple[list[dict[str, float]] | None, str | None]:
    """
    Parse JSON `viewport_polygon`: list of {lat, lng} or {lat, lon}.

    Returns:
        (None, None) — field omitted or JSON null; use preference isochrone.
        (None, err) — invalid payload (stable error codes for clients).
        (points, None) — success; closed ring as [{"lat","lon"}, ...] for simplify/to_geojson_polygon.

    Error codes: INVALID_VIEWPORT_POLYGON, VIEWPORT_TOO_LARGE,
    INVALID_VIEWPORT_POLYGON_SELF_INTERSECT
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

    if viewport_ring_self_intersects(out):
        return (None, "INVALID_VIEWPORT_POLYGON_SELF_INTERSECT")

    return (out, None)
