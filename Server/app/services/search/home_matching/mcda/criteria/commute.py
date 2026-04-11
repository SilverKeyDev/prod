"""
Commute soft score: listing commute_minutes, else haversine vs important_locations with lat/lng.

Uses a fixed km-per-minute heuristic for drive time when only straight-line distance is known.
"""

from __future__ import annotations

import json
import math
from typing import Any

# Urban/suburban average: ~0.75 km per minute of driving (rough deterministic proxy).
_KM_PER_COMMUTE_MINUTE = 0.75


def _parse_float(v: Any) -> float | None:
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1 - a)))
    return r * c


def _property_lat_lon(property_dict: dict[str, Any]) -> tuple[float, float] | None:
    lat = _parse_float(property_dict.get("latitude") or property_dict.get("lat"))
    lon = _parse_float(
        property_dict.get("longitude") or property_dict.get("lon") or property_dict.get("lng")
    )
    if lat is None or lon is None:
        return None
    return (lat, lon)


def _important_locations_list(preferences: dict[str, Any]) -> list[dict[str, Any]]:
    raw = preferences.get("important_locations")
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except json.JSONDecodeError:
            return []
    if not isinstance(raw, list):
        return []
    return [x for x in raw if isinstance(x, dict)]


def _minutes_from_distance_km(km: float) -> float:
    if km <= 0:
        return 0.0
    return km / _KM_PER_COMMUTE_MINUTE


def soft_commute_normalized(preferences: dict[str, Any], property_dict: dict[str, Any]) -> float:
    cm = _parse_float(property_dict.get("commute_minutes"))
    if cm is not None and cm >= 0:
        max_pref = _parse_float(preferences.get("max_commute_minutes"))
        locs = _important_locations_list(preferences)
        tolerances = [
            _parse_float(loc.get("commute_tolerance") or loc.get("max_commute_minutes"))
            for loc in locs
        ]
        nums = [t for t in tolerances if t is not None and t > 0]
        limit = max_pref if max_pref and max_pref > 0 else None
        if nums:
            limit = min(nums) if limit is None else min(limit, min(nums))
        if limit is None or limit <= 0:
            limit = 45.0
        if cm <= 0:
            return 1.0
        if cm >= limit:
            return max(0.0, 1.0 - (cm - limit) / max(limit, 1.0) * 0.85)
        return max(0.15, min(1.0, 1.0 - (cm / limit) * 0.5))

    coords = _property_lat_lon(property_dict)
    if coords is None:
        return 0.5

    lat_p, lon_p = coords
    locs = _important_locations_list(preferences)
    best_minutes: float | None = None

    for loc in locs:
        lat = _parse_float(loc.get("lat"))
        lon = _parse_float(loc.get("lng"))
        if lat is None or lon is None:
            continue
        km = _haversine_km(lat_p, lon_p, lat, lon)
        est_min = _minutes_from_distance_km(km)
        tol = _parse_float(loc.get("commute_tolerance") or loc.get("max_commute_minutes"))
        limit_m = tol if tol and tol > 0 else 30.0
        ratio = est_min / max(limit_m, 1.0)
        if best_minutes is None or ratio < best_minutes:
            best_minutes = ratio

    if best_minutes is None:
        return 0.5

    if best_minutes <= 1.0:
        return max(0.2, min(1.0, 1.0 - 0.45 * best_minutes))
    return max(0.0, min(0.35, 0.35 / best_minutes))
