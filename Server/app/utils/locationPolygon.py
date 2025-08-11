# pip install shapely requests
from __future__ import annotations
import os
import json
import urllib.parse
import requests
from typing import Iterable, Optional, Dict, Any, List, Tuple
from shapely.geometry import shape, mapping, Polygon, MultiPolygon
from shapely.ops import unary_union

MAPBOX_ISOCHRONE_URL = "https://api.mapbox.com/isochrone/v1"
MAPBOX_GEOCODE_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places"

# Allowed Mapbox excludes (docs)
_ALLOWED_EXCLUDES = {"motorway", "toll", "ferry", "unpaved", "cash_only_tolls"}

def _mode_to_profile(mode: str, traffic: bool) -> str:
    m = mode.lower()
    if m in {"drive", "driving", "car"}:
        return "mapbox/driving-traffic" if traffic else "mapbox/driving"
    if m in {"walk", "walking", "hike"}:
        return "mapbox/walking"
    if m in {"bike", "biking", "bicycle", "cycling"}:
        return "mapbox/cycling"
    raise ValueError("mode must be one of: 'walk', 'bike', 'drive'")

def _pick_token(explicit: Optional[str]) -> str:
    # Looks in param first, then common env var names
    for t in (explicit,
              os.getenv("MAPBOX_API_KEY"),
              os.getenv("MAPBOX_ACCESS_TOKEN"),
              os.getenv("MAPBOX_TOKEN")):
        if t:
            return t
    raise RuntimeError(
        "Mapbox access token not found. Set MAPBOX_API_KEY (or MAPBOX_ACCESS_TOKEN / MAPBOX_TOKEN) "
        "or pass access_token=..."
    )

def geocode_address(address: str, *, access_token: Optional[str] = None) -> Tuple[float, float]:
    """
    Geocode a single address using Mapbox Geocoding API.
    Returns (lat, lon). Raises on failure/zero results.
    """
    token = _pick_token(access_token)
    q = urllib.parse.quote(address, safe="")
    url = f"{MAPBOX_GEOCODE_URL}/{q}.json"
    params = {"limit": 1, "access_token": token}
    r = requests.get(url, params=params, timeout=15)
    if r.status_code != 200:
        try:
            data = r.json()
        except Exception:
            data = {}
        raise RuntimeError(f"Mapbox Geocoding error {r.status_code}: {data.get('message') or r.text}")
    data = r.json()
    feats = data.get("features") or []
    if not feats:
        raise RuntimeError(f"No geocoding results for address: {address!r}")
    # Mapbox center is [lon, lat]
    lon, lat = feats[0]["center"]
    return float(lat), float(lon)

def isochrone_polygon(
    lat: float,
    lon: float,
    minutes: float,
    mode: str = "drive",
    *,
    # Mapbox-specific options (optional)
    traffic: bool = False,
    depart_at: Optional[str] = None,            # ISO-8601 time string
    exclude: Optional[Iterable[str]] = None,    # e.g. ["toll","ferry"]
    denoise: float = 1.0,                       # 0.0 .. 1.0
    generalize_m: Optional[float] = None,       # meters
    access_token: Optional[str] = None,
    # Output shaping
    merge: bool = True,                         # union multiple features to one polygon
) -> Dict[str, Any]:
    """
    Build an isochrone polygon using Mapbox Isochrone API.

    Returns a GeoJSON Feature (Polygon or MultiPolygon) in WGS84 for the
    requested `minutes`. If Mapbox returns multiple rings, they are merged
    when merge=True (default).
    """
    if minutes <= 0:
        raise ValueError("minutes must be > 0")
    if minutes > 60:
        raise ValueError("Mapbox max is 60 minutes per request.")

    token = _pick_token(access_token)
    profile = _mode_to_profile(mode, traffic)

    # Build query params
    params = {
        "contours_minutes": int(round(minutes)),
        "polygons": "true",  # filled polygons
        "access_token": token,
    }
    if denoise is not None:
        if not (0.0 <= float(denoise) <= 1.0):
            raise ValueError("denoise must be between 0.0 and 1.0")
        params["denoise"] = float(denoise)

    if generalize_m is not None:
        if float(generalize_m) <= 0:
            raise ValueError("generalize_m must be > 0")
        params["generalize"] = float(generalize_m)

    if depart_at:
        params["depart_at"] = depart_at  # ISO-8601

    if exclude:
        ex = [e for e in exclude if e in _ALLOWED_EXCLUDES]
        if ex:
            params["exclude"] = ",".join(ex)

    url = f"{MAPBOX_ISOCHRONE_URL}/{profile}/{lon:.6f},{lat:.6f}"

    # Call the API
    resp = requests.get(url, params=params, timeout=20)
    if resp.status_code != 200:
        try:
            data = resp.json()
        except Exception:
            data = {}
        code = data.get("code")
        msg = data.get("message") or resp.text
        raise RuntimeError(f"Mapbox Isochrone API error {resp.status_code} {code or ''}: {msg}")

    data = resp.json()
    feats: List[Dict[str, Any]] = data.get("features") or []
    if not feats:
        raise RuntimeError("Mapbox Isochrone API returned no features.")

    if not merge:
        return {"type": "FeatureCollection", "features": feats}

    # Merge all polygons for this single request
    polys = []
    for f in feats:
        geom = f.get("geometry")
        if not geom:
            continue
        shp = shape(geom)
        if isinstance(shp, (Polygon, MultiPolygon)):
            polys.append(shp)

    if not polys:
        raise RuntimeError("No polygonal geometries returned from Mapbox (unexpected).")

    merged = unary_union(polys)
    feature: Dict[str, Any] = {
        "type": "Feature",
        "properties": {
            "origin": {"lat": lat, "lon": lon},
            "minutes": int(round(minutes)),
            "mode": mode.lower(),
            "profile": profile,
            "source": "mapbox-isochrone",
        },
        "geometry": mapping(merged),
    }
    return feature

def isochrone_union_for_addresses(
    addresses_and_minutes: Iterable[Tuple[str, float]],
    *,
    mode: str = "drive",
    traffic: bool = False,
    depart_at: Optional[str] = None,
    exclude: Optional[Iterable[str]] = None,
    denoise: float = 1.0,
    generalize_m: Optional[float] = None,
    access_token: Optional[str] = None,
    include_individual: bool = False,
) -> Dict[str, Any]:
    """
    Given many (address, minutes) pairs, build an isochrone for each and return the
    union of ALL isochrones as a single GeoJSON Feature. Optionally include individual
    per-address isochrones under 'extras.individual_features'.

    Parameters apply to every request (minutes vary per address).
    """
    token = _pick_token(access_token)
    geo_cache: Dict[str, Tuple[float, float]] = {}
    geoms: List[Polygon | MultiPolygon] = []
    indiv_features: List[Dict[str, Any]] = []

    for address, minutes in addresses_and_minutes:
        # Geocode (cached per identical address)
        if address not in geo_cache:
            lat, lon = geocode_address(address, access_token=token)
            geo_cache[address] = (lat, lon)
        else:
            lat, lon = geo_cache[address]

        feat = isochrone_polygon(
            lat=lat,
            lon=lon,
            minutes=minutes,
            mode=mode,
            traffic=traffic,
            depart_at=depart_at,
            exclude=exclude,
            denoise=denoise,
            generalize_m=generalize_m,
            access_token=token,
            merge=True,
        )
        shp = shape(feat["geometry"])
        if isinstance(shp, (Polygon, MultiPolygon)):
            geoms.append(shp)
            if include_individual:
                # add a bit of context to properties
                f2 = json.loads(json.dumps(feat))  # deep-ish copy
                f2["properties"]["address"] = address
                indiv_features.append(f2)

    if not geoms:
        raise RuntimeError("No isochrones could be generated for the given inputs.")

    merged = unary_union(geoms)
    out: Dict[str, Any] = {
        "type": "Feature",
        "properties": {
            "source": "mapbox-isochrone",
            "count": len(geoms),
            "mode": mode.lower(),
            "traffic": bool(traffic),
            "depart_at": depart_at,
            "exclude": [e for e in (exclude or []) if e in _ALLOWED_EXCLUDES] or None,
            "denoise": denoise,
            "generalize_m": generalize_m,
            "notes": "Union of all requested address/time isochrones",
        },
        "geometry": mapping(merged),
    }
    if include_individual:
        out.setdefault("extras", {})["individual_features"] = indiv_features
    return out

# -------- Example usage --------
# addresses = [
#     ("North Ave NW, Atlanta, GA 30332", 20),
#     ("Ponce City Market, Atlanta, GA", 15),
#     ("Hartsfield-Jackson Atlanta International Airport", 25),
# ]
# union_feature = isochrone_union_for_addresses(
#     addresses,
#     mode="drive",
#     traffic=True,
#     exclude=["toll", "ferry"],
#     denoise=1.0,
#     generalize_m=25,
#     include_individual=True,
# )
# print(union_feature["geometry"]["type"])  # "Polygon" or "MultiPolygon"