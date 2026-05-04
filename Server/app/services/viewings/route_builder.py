"""Build optimized viewing routes using Google Distance Matrix + Directions APIs."""

from __future__ import annotations

import os
from typing import Any

import httpx

from app.services.viewings.route_builder_support import (
    MAX_PATH_NODES,
    _best_middle_visit_order,
    _duration_matrix_seconds,
    _endpoint_persist_dict,
    _enrich_route_endpoint,
    _fallback_duration,
    _geocode_address,
    _lat_lng_pair,
    _leg_polyline_and_metrics,
    _max_property_stops_for_path,
    _normalize_end_mode,
    _normalize_endpoint,  # re-exported for calendar.viewing_itinerary
    _open_tsp_order,
    _viewing_stop_persist_dict,
)
from app.utils.geo.google_polyline import haversine_meters


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
            s_coord = _lat_lng_pair(start_row) or (0.0, 0.0)
            m = len(prop_coords_typed)

            if optimize_order:
                if end_mode == "fixed" and end_row is not None:
                    ext_coords = (
                        [s_coord] + prop_coords_typed + [_lat_lng_pair(end_row) or (0.0, 0.0)]
                    )
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
