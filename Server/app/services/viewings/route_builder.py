"""Build optimized viewing routes using Google Distance Matrix + Directions APIs."""

from __future__ import annotations

import os
from typing import Any

import httpx

from app.utils.geo.google_polyline import decode as decode_polyline
from app.utils.geo.google_polyline import encode as encode_polyline
from app.utils.geo.google_polyline import haversine_meters
from app.utils.security.app_logging import get_logger

logger = get_logger()

# Google Directions allows up to 25 intermediate waypoints (origin + dest + 25 mids → 27 stops).
MAX_STOPS = 27
DISTANCE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json"
DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json"
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"


def _geocode_address(
    address: str, api_key: str, client: httpx.Client
) -> tuple[float, float] | None:
    try:
        r = client.get(
            GEOCODE_URL,
            params={"address": address, "key": api_key},
            timeout=20.0,
        )
        r.raise_for_status()
        data = r.json()
        if data.get("status") != "OK" or not data.get("results"):
            return None
        loc = data["results"][0].get("geometry", {}).get("location")
        if not loc:
            return None
        return (float(loc["lat"]), float(loc["lng"]))
    except Exception:
        return None


def _lat_lng_pair(stop: dict[str, Any]) -> tuple[float, float] | None:
    lat, lng = stop.get("lat"), stop.get("lng")
    if lat is None or lng is None:
        return None
    try:
        return (float(lat), float(lng))
    except (TypeError, ValueError):
        return None


def _duration_matrix_seconds(
    coords: list[tuple[float, float]], api_key: str, client: httpx.Client
) -> list[list[float]]:
    """Symmetric matrix of driving durations in seconds; haversine fallback on failure."""
    n = len(coords)
    pipe = "|".join(f"{lat},{lng}" for lat, lng in coords)
    matrix: list[list[float]] = [[0.0] * n for _ in range(n)]

    try:
        r = client.get(
            DISTANCE_MATRIX_URL,
            params={
                "origins": pipe,
                "destinations": pipe,
                "mode": "driving",
                "key": api_key,
            },
            timeout=30.0,
        )
        r.raise_for_status()
        payload = r.json()
        rows = payload.get("rows") or []
        for i in range(n):
            row_el = rows[i].get("elements") if i < len(rows) else None
            if not row_el:
                continue
            for j in range(n):
                if j >= len(row_el):
                    continue
                el = row_el[j]
                if el.get("status") == "OK" and el.get("duration"):
                    matrix[i][j] = float(el["duration"]["value"])
                elif i != j:
                    matrix[i][j] = _fallback_duration(coords[i], coords[j])
    except Exception as e:
        logger.warning("Distance Matrix failed, using haversine fallback: %s", e)
        for i in range(n):
            for j in range(n):
                if i != j:
                    matrix[i][j] = _fallback_duration(coords[i], coords[j])
    return matrix


def _fallback_duration(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Approximate driving seconds from straight-line distance (30 km/h average)."""
    m = haversine_meters(a[0], a[1], b[0], b[1])
    return max(60.0, m / 8.33)


def _open_tsp_order(matrix: list[list[float]]) -> list[int]:
    """Multi-start nearest-neighbor for open path (try each start, best total time)."""
    n = len(matrix)
    if n <= 1:
        return list(range(n))

    best_order: list[int] = list(range(n))
    best_cost = float("inf")

    for start in range(n):
        unvisited = set(range(n)) - {start}
        order = [start]
        current = start
        cost = 0.0
        while unvisited:
            nxt = min(unvisited, key=lambda j, c=current: matrix[c][j])
            cost += matrix[current][nxt]
            order.append(nxt)
            unvisited.remove(nxt)
            current = nxt
        if cost < best_cost:
            best_cost = cost
            best_order = order

    return best_order


def _leg_polyline_and_metrics(
    coords: list[tuple[float, float]],
    api_key: str,
    client: httpx.Client,
) -> tuple[list[dict[str, Any]], list[str] | None]:
    """
    One Directions request for full path. Returns legs metadata and None for errors.
    """
    if len(coords) < 2:
        return [], None

    origin = f"{coords[0][0]},{coords[0][1]}"
    dest = f"{coords[-1][0]},{coords[-1][1]}"
    waypoints = ""
    if len(coords) > 2:
        inner = "|".join(f"{coords[i][0]},{coords[i][1]}" for i in range(1, len(coords) - 1))
        waypoints = inner

    params: dict[str, str] = {
        "origin": origin,
        "destination": dest,
        "mode": "driving",
        "key": api_key,
    }
    if waypoints:
        params["waypoints"] = waypoints

    try:
        r = client.get(DIRECTIONS_URL, params=params, timeout=45.0)
        r.raise_for_status()
        data = r.json()
        if data.get("status") != "OK" or not data.get("routes"):
            logger.warning("Directions API status: %s", data.get("status"))
            return [], None
        route = data["routes"][0]
        legs_out: list[dict[str, Any]] = []
        for leg in route.get("legs") or []:
            duration = leg.get("duration") or {}
            distance = leg.get("distance") or {}
            points: list[tuple[float, float]] = []
            for step in leg.get("steps") or []:
                poly = (step.get("polyline") or {}).get("points")
                if poly:
                    points.extend(decode_polyline(poly))
            encoded = encode_polyline(points) if points else None
            legs_out.append(
                {
                    "duration_seconds": int(duration.get("value", 0)) or None,
                    "distance_meters": int(distance.get("value", 0)) or None,
                    "encoded_polyline": encoded,
                }
            )
        return legs_out, None
    except Exception as e:
        logger.error("Directions request failed: %s", e, exc_info=True)
        return [], str(e)


def build_viewing_route(stops: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Order stops with open-TSP on driving durations, then fill legs via Directions.

    Returns a dict matching ViewingItinerary (stops, ordered, legs).
    """
    if len(stops) < 2:
        raise ValueError("At least two stops are required")
    if len(stops) > MAX_STOPS:
        raise ValueError(
            f"At most {MAX_STOPS} stops per route (maps provider waypoint limit). "
            "Split into multiple events if you need more."
        )

    api_key = os.environ.get("GOOGLE_MAPS_SERVER_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GOOGLE_MAPS_SERVER_KEY is not configured")

    with httpx.Client() as client:
        enriched: list[dict[str, Any]] = []
        for s in stops:
            s_copy = dict(s)
            pair = _lat_lng_pair(s_copy)
            if pair is None and s_copy.get("address"):
                geo = _geocode_address(str(s_copy["address"]), api_key, client)
                if geo:
                    s_copy["lat"], s_copy["lng"] = geo[0], geo[1]
                    pair = geo
            if pair is None:
                raise ValueError("Each stop must be geocodable (address or lat/lng)")
            enriched.append(s_copy)
        stops = enriched

        coords = [_lat_lng_pair(s) for s in stops]
        assert all(c is not None for c in coords)
        coords_typed = [c for c in coords if c is not None]

        matrix = _duration_matrix_seconds(coords_typed, api_key, client)
        order_idx = _open_tsp_order(matrix)
        ordered_coords = [coords_typed[i] for i in order_idx]
        ordered_stops = [dict(stops[i]) for i in order_idx]

        legs, err = _leg_polyline_and_metrics(ordered_coords, api_key, client)
        if err or len(legs) != len(ordered_coords) - 1:
            legs = []
            for i in range(len(ordered_coords) - 1):
                a, b = ordered_coords[i], ordered_coords[i + 1]
                sec = int(matrix[order_idx[i]][order_idx[i + 1]])
                meters = int(haversine_meters(a[0], a[1], b[0], b[1]))
                legs.append(
                    {
                        "duration_seconds": sec,
                        "distance_meters": meters,
                        "encoded_polyline": None,
                    }
                )

        return {
            "stops": ordered_stops,
            "ordered": True,
            "legs": legs,
        }


def build_google_maps_navigate_url(itinerary: dict[str, Any]) -> str:
    """https://www.google.com/maps/dir/... with origin, destination, waypoints."""
    stops = itinerary.get("stops") or []
    coords: list[tuple[float, float]] = []
    for s in stops:
        if not isinstance(s, dict):
            continue
        pair = _lat_lng_pair(s)
        if pair:
            coords.append(pair)
    if len(coords) < 2:
        raise ValueError("Itinerary needs at least two stops with coordinates")

    origin = f"{coords[0][0]},{coords[0][1]}"
    destination = f"{coords[-1][0]},{coords[-1][1]}"
    waypoints = "|".join(f"{c[0]},{c[1]}" for c in coords[1:-1])

    from urllib.parse import quote

    base = "https://www.google.com/maps/dir/?api=1"
    parts = [
        f"{base}&origin={quote(origin)}&destination={quote(destination)}",
        "&travelmode=driving",
    ]
    if waypoints:
        parts.append(f"&waypoints={quote(waypoints)}")
    return "".join(parts)
