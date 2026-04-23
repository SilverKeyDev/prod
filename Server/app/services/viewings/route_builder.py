"""Build optimized viewing routes using Google Distance Matrix + Directions APIs."""

from __future__ import annotations

import os
from itertools import permutations
from typing import Any

import httpx

from app.utils.geo.google_polyline import decode as decode_polyline
from app.utils.geo.google_polyline import encode as encode_polyline
from app.utils.geo.google_polyline import haversine_meters
from app.utils.security.app_logging import get_logger

logger = get_logger()

# Google Directions allows up to 25 intermediate waypoints (origin + dest + 25 mids → 27 stops).
MAX_PATH_NODES = 27
DISTANCE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json"
DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json"
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

BRUTE_FORCE_MIDDLE_MAX = 8


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


def _middle_perm_cost(
    matrix: list[list[float]],
    m: int,
    perm: tuple[int, ...],
    end_mode: str,
) -> float:
    """Total driving time for start at index 0, visiting middles in perm order."""
    # Extended coords: [S] + M (len m+1), or [S] + M + [E] (len m+2) when end_mode == fixed
    cost = 0.0
    first_mid_ext = perm[0] + 1
    cost += matrix[0][first_mid_ext]
    for t in range(m - 1):
        a = perm[t] + 1
        b = perm[t + 1] + 1
        cost += matrix[a][b]
    last_mid_ext = perm[-1] + 1
    if end_mode == "return_to_start":
        cost += matrix[last_mid_ext][0]
    elif end_mode == "fixed":
        e_idx = m + 1
        cost += matrix[last_mid_ext][e_idx]
    return cost


def _nearest_neighbor_middle_order(
    matrix: list[list[float]],
    m: int,
    _end_mode: str,
) -> list[int]:
    """Greedy nearest neighbor from S (index 0) through all middle nodes."""
    unvisited = set(range(m))
    order_m: list[int] = []
    current_ext = 0
    while unvisited:
        nxt_k = min(
            unvisited,
            key=lambda k, c=current_ext: matrix[c][k + 1],
        )
        order_m.append(nxt_k)
        unvisited.remove(nxt_k)
        current_ext = nxt_k + 1
    return order_m


def _best_middle_visit_order(
    matrix: list[list[float]],
    m: int,
    end_mode: str,
) -> list[int]:
    if m <= 1:
        return list(range(m))
    if m <= BRUTE_FORCE_MIDDLE_MAX:
        best: tuple[int, ...] | None = None
        best_cost = float("inf")
        for perm in permutations(range(m)):
            c = _middle_perm_cost(matrix, m, perm, end_mode)
            if c < best_cost:
                best_cost = c
                best = perm
        return list(best) if best is not None else list(range(m))
    return _nearest_neighbor_middle_order(matrix, m, end_mode)


def _normalize_endpoint(ep: Any) -> dict[str, Any] | None:
    if ep is None:
        return None
    if hasattr(ep, "model_dump"):
        d = ep.model_dump(mode="json")
    elif isinstance(ep, dict):
        d = dict(ep)
    else:
        return None
    if not any(d.get(k) is not None for k in ("address", "lat", "lng")):
        return None
    return d


def _enrich_route_endpoint(
    ep: dict[str, Any],
    api_key: str,
    client: httpx.Client,
    default_label: str,
) -> dict[str, Any]:
    out = dict(ep)
    addr = out.get("address")
    if isinstance(addr, str):
        addr = addr.strip()
        out["address"] = addr if addr else None
    pair = _lat_lng_pair(out)
    if pair is None and out.get("address"):
        geo = _geocode_address(str(out["address"]), api_key, client)
        if geo:
            out["lat"], out["lng"] = geo[0], geo[1]
            pair = geo
    if pair is None:
        raise ValueError("Start/end location must include geocodable address or lat/lng")
    if not out.get("label"):
        out["label"] = default_label
    if not out.get("address"):
        out["address"] = f"{pair[0]:.5f}, {pair[1]:.5f}"
    out["listing_id"] = None
    out["notes"] = out.get("notes")
    return out


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


def _normalize_end_mode(raw: Any) -> str:
    if raw is None:
        return "last_property"
    if hasattr(raw, "value"):
        return str(raw.value)
    s = str(raw)
    if s in ("last_property", "return_to_start", "fixed"):
        return s
    return "last_property"


def _max_property_stops_for_path(*, has_start: bool, end_mode: str) -> int:
    if not has_start:
        return MAX_PATH_NODES
    if end_mode in ("return_to_start", "fixed"):
        return MAX_PATH_NODES - 2
    return MAX_PATH_NODES - 1


def _endpoint_persist_dict(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    return {
        "label": row.get("label"),
        "address": row.get("address"),
        "lat": row.get("lat"),
        "lng": row.get("lng"),
    }


def _viewing_stop_persist_dict(s: dict[str, Any]) -> dict[str, Any]:
    addr = s.get("address")
    if not isinstance(addr, str):
        addr = str(addr) if addr is not None else ""
    return {
        "label": s.get("label"),
        "address": addr,
        "lat": s.get("lat"),
        "lng": s.get("lng"),
        "notes": s.get("notes"),
        "listing_id": s.get("listing_id"),
    }


def itinerary_path_coordinates(itinerary: dict[str, Any]) -> list[tuple[float, float]]:
    """
    Build ordered lat/lng nodes for driving directions from a persisted ViewingItinerary.
    Supports legacy rows where anchors were only present in `stops`.
    """
    end_mode = _normalize_end_mode(itinerary.get("end_mode"))
    raw_stops = itinerary.get("stops") or []
    stops: list[dict[str, Any]] = [s for s in raw_stops if isinstance(s, dict)]
    start = itinerary.get("start")
    end = itinerary.get("end")
    coords: list[tuple[float, float]] = []

    if isinstance(start, dict) and _normalize_endpoint(start):
        pair = _lat_lng_pair(start)
        if pair:
            coords.append(pair)
        for s in stops:
            pair = _lat_lng_pair(s)
            if pair:
                coords.append(pair)
        if end_mode == "return_to_start":
            pair = _lat_lng_pair(start)
            if pair:
                coords.append(pair)
        elif end_mode == "fixed" and isinstance(end, dict):
            pair = _lat_lng_pair(end)
            if pair:
                coords.append(pair)
        return coords

    # Legacy / no explicit start: treat `stops` as the full ordered path.
    for s in stops:
        pair = _lat_lng_pair(s)
        if pair:
            coords.append(pair)
    return coords


def build_viewing_route(request: dict[str, Any]) -> dict[str, Any]:
    """
    Order stops using driving durations, then fill legs via Directions.

    Request keys:
      - stops (required): property stops (ViewingStop-shaped dicts)
      - start (optional): anchor; when set, only property order is optimized
      - end (optional): required when end_mode is fixed
      - end_mode (optional): last_property | return_to_start | fixed
      - optimize_order (optional, default True)

    Returns a dict matching ViewingItinerary (property-only stops, anchors, legs, end_mode).
    """
    stops = request.get("stops")
    if not isinstance(stops, list):
        raise ValueError("stops must be a list")

    start_ep = _normalize_endpoint(request.get("start"))
    end_ep = _normalize_endpoint(request.get("end"))
    end_mode = _normalize_end_mode(request.get("end_mode"))

    if len(stops) < 1:
        raise ValueError("At least one property stop is required")
    if len(stops) < 2 and not start_ep:
        raise ValueError("At least two property stops are required without a start anchor")
    optimize_order = request.get("optimize_order")
    if optimize_order is None:
        optimize_order = True

    if start_ep and end_mode == "fixed" and not end_ep:
        raise ValueError("end is required when end_mode is fixed")

    max_props = _max_property_stops_for_path(has_start=bool(start_ep), end_mode=end_mode)
    if len(stops) > max_props:
        raise ValueError(
            f"At most {max_props} property stops for this route configuration "
            f"(maps provider limit {MAX_PATH_NODES} total path nodes). "
            "Split into multiple events if you need more."
        )

    api_key = os.environ.get("GOOGLE_MAPS_SERVER_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GOOGLE_MAPS_SERVER_KEY is not configured")

    with httpx.Client() as client:
        enriched_props: list[dict[str, Any]] = []
        for s in stops:
            s_copy = dict(s) if isinstance(s, dict) else {}
            pair = _lat_lng_pair(s_copy)
            if pair is None and s_copy.get("address"):
                geo = _geocode_address(str(s_copy["address"]), api_key, client)
                if geo:
                    s_copy["lat"], s_copy["lng"] = geo[0], geo[1]
                    pair = geo
            if pair is None:
                raise ValueError("Each stop must be geocodable (address or lat/lng)")
            enriched_props.append(s_copy)

        prop_coords = [_lat_lng_pair(s) for s in enriched_props]
        assert all(c is not None for c in prop_coords)
        prop_coords_typed = [c for c in prop_coords if c is not None]

        start_row: dict[str, Any] | None = None
        end_row: dict[str, Any] | None = None
        if start_ep:
            start_row = _enrich_route_endpoint(start_ep, api_key, client, "Start")
        if end_mode == "fixed" and end_ep:
            end_row = _enrich_route_endpoint(end_ep, api_key, client, "End")

        ordered_props = enriched_props
        ordered_prop_coords = prop_coords_typed
        route_ordered = bool(optimize_order)

        if not start_ep:
            if optimize_order:
                matrix = _duration_matrix_seconds(prop_coords_typed, api_key, client)
                order_idx = _open_tsp_order(matrix)
                ordered_prop_coords = [prop_coords_typed[i] for i in order_idx]
                ordered_props = [dict(enriched_props[i]) for i in order_idx]
            else:
                route_ordered = False
            full_coords = ordered_prop_coords
        else:
            assert start_row is not None
            s_coord = (_lat_lng_pair(start_row) or (0.0, 0.0))
            m = len(prop_coords_typed)

            if optimize_order:
                if end_mode == "fixed" and end_row is not None:
                    ext_coords = [s_coord] + prop_coords_typed + [
                        _lat_lng_pair(end_row) or (0.0, 0.0)
                    ]
                else:
                    ext_coords = [s_coord] + prop_coords_typed
                matrix_full = _duration_matrix_seconds(ext_coords, api_key, client)
                mid_order = _best_middle_visit_order(matrix_full, m, end_mode)
                ordered_prop_coords = [prop_coords_typed[i] for i in mid_order]
                ordered_props = [dict(enriched_props[i]) for i in mid_order]
            else:
                route_ordered = False

            full_coords = [s_coord] + ordered_prop_coords
            if end_mode == "return_to_start":
                full_coords = full_coords + [s_coord]
            elif end_mode == "fixed" and end_row is not None:
                e_coord = _lat_lng_pair(end_row) or (0.0, 0.0)
                full_coords = full_coords + [e_coord]

        legs, err = _leg_polyline_and_metrics(full_coords, api_key, client)
        if err or len(legs) != len(full_coords) - 1:
            if len(full_coords) >= 2:
                matrix_fb = _duration_matrix_seconds(full_coords, api_key, client)
            else:
                matrix_fb = []
            legs = []
            for i in range(len(full_coords) - 1):
                a, b = full_coords[i], full_coords[i + 1]
                sec = int(matrix_fb[i][i + 1]) if matrix_fb else int(_fallback_duration(a, b))
                meters = int(haversine_meters(a[0], a[1], b[0], b[1]))
                legs.append(
                    {
                        "duration_seconds": sec,
                        "distance_meters": meters,
                        "encoded_polyline": None,
                    }
                )

        persist_start = _endpoint_persist_dict(start_row) if start_row else None
        persist_end: dict[str, Any] | None = None
        if end_mode == "fixed" and end_row is not None:
            persist_end = _endpoint_persist_dict(end_row)

        property_stops_out = [_viewing_stop_persist_dict(s) for s in ordered_props]

        return {
            "stops": property_stops_out,
            "ordered": route_ordered,
            "legs": legs,
            "start": persist_start,
            "end": persist_end,
            "end_mode": end_mode,
        }


def build_google_maps_navigate_url(itinerary: dict[str, Any]) -> str:
    """https://www.google.com/maps/dir/... with origin, destination, waypoints."""
    coords = itinerary_path_coordinates(itinerary)
    if len(coords) < 2:
        raise ValueError("Itinerary needs at least two nodes with coordinates")

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
