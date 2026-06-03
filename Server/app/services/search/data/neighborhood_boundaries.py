"""Slipstream area search and boundary polygon retrieval.

Uses the /ws/areas/search and /ws/areas/get endpoints to resolve
neighborhood names, city names, ZIP codes, school districts, and other
geographic areas into boundary polygons suitable for property search.

Slipstream area geoTypes:
  area/neighborhood, area/postal-city, area/census-place,
  area/county, area/zipcode, area/state, area/township

The ``geometry=true`` flag on /ws/areas/get returns a GeoJSON-style
polygon that can be fed directly into the listing search pipeline.
"""

from __future__ import annotations

from typing import Any

from logger import log

from .client import slipstream_get

_DEFAULT_GEO_TYPES = (
    "area/neighborhood",
    "area/postal-city",
    "area/census-place",
    "area/county",
    "area/zipcode",
    "area/township",
)


def search_areas(
    keyword: str,
    *,
    state: str | None = None,
    geo_types: tuple[str, ...] | None = None,
    limit: int = 10,
) -> tuple[list[dict[str, Any]], str | None]:
    """Search Slipstream for geographic areas matching *keyword*.

    Returns:
        (areas, error_message)
        On success ``error_message`` is ``None`` and ``areas`` is a list of
        dicts with keys: id, name, label, geoType, state, place (optional).
    """
    if not keyword or not keyword.strip():
        return [], "keyword is required"

    params: dict[str, Any] = {
        "keyword": keyword.strip(),
        "limit": min(limit, 25),
        "bias": "postal-city",
    }

    if state:
        params["state"] = state.strip()

    selected = geo_types or _DEFAULT_GEO_TYPES
    params["geoType"] = ",".join(selected)

    try:
        resp = slipstream_get("/ws/areas/search", params=params)
        if not resp.ok:
            log.error(
                "API",
                "Slipstream /ws/areas/search HTTP error",
                {"status": resp.status_code, "text": resp.text[:300]},
            )
            return [], f"Slipstream area search HTTP {resp.status_code}"

        body = resp.json() if resp.content else {}
        if not body.get("success"):
            err_msg = (body.get("error") or {}).get("message", "Unknown error")
            return [], f"Slipstream area search failed: {err_msg}"

        result = body.get("result") or {}
        raw_areas = result.get("areas") or []

        areas = [
            {
                "id": a["id"],
                "name": a.get("name", ""),
                "label": a.get("label", ""),
                "geoType": a.get("geoType", ""),
                "state": a.get("state", ""),
                "place": a.get("place"),
            }
            for a in raw_areas
            if a.get("id")
        ]

        log.debug(
            "API",
            "Slipstream /ws/areas/search results",
            {
                "keyword": keyword,
                "state": state,
                "total": result.get("total"),
                "returned": len(areas),
            },
        )

        return areas, None

    except Exception as exc:
        log.error(
            "ERRORS",
            "Slipstream area search exception",
            {"keyword": keyword, "error": str(exc)[:300]},
        )
        return [], f"Area search error: {str(exc)[:200]}"


def get_area_boundary(area_id: str) -> tuple[dict[str, Any] | None, str | None]:
    """Fetch a Slipstream area with its boundary geometry.

    Calls ``/ws/areas/get?id=<area_id>&geometry=true&details=true``.

    Returns:
        (area_data, error_message)
        ``area_data`` contains: id, name, label, geoType, state,
        and ``geometry`` (GeoJSON Polygon / MultiPolygon).
    """
    if not area_id or not area_id.strip():
        return None, "area_id is required"

    try:
        resp = slipstream_get(
            "/ws/areas/get",
            params={
                "id": area_id.strip(),
                "geometry": "true",
                "details": "true",
            },
        )
        if not resp.ok:
            log.error(
                "API",
                "Slipstream /ws/areas/get HTTP error",
                {"area_id": area_id, "status": resp.status_code},
            )
            return None, f"Slipstream area get HTTP {resp.status_code}"

        body = resp.json() if resp.content else {}
        if not body.get("success"):
            err_msg = (body.get("error") or {}).get("message", "Unknown error")
            return None, f"Slipstream area get failed: {err_msg}"

        result = body.get("result") or {}
        areas = result.get("areas") or []
        invalid = result.get("invalid") or []

        if invalid:
            return None, f"Invalid area ID: {area_id}"

        if not areas:
            return None, f"No area found for ID: {area_id}"

        area = areas[0]
        geometry = area.get("geometry")

        if not geometry:
            log.warn(
                "API",
                "Slipstream area has no geometry",
                {"area_id": area_id, "label": area.get("label")},
            )
            return None, "Area has no boundary geometry"

        area_data: dict[str, Any] = {
            "id": area.get("id", area_id),
            "name": area.get("name", ""),
            "label": area.get("label", ""),
            "geoType": area.get("geoType", ""),
            "state": area.get("state", ""),
            "geometry": geometry,
        }

        center = _extract_centroid(geometry)
        if center:
            area_data["center"] = center

        log.info(
            "API",
            "Slipstream area boundary fetched",
            {
                "area_id": area_id,
                "label": area_data["label"],
                "geoType": area_data["geoType"],
                "hasGeometry": geometry is not None,
            },
        )

        return area_data, None

    except Exception as exc:
        log.error(
            "ERRORS",
            "Slipstream area boundary exception",
            {"area_id": area_id, "error": str(exc)[:300]},
        )
        return None, f"Area boundary error: {str(exc)[:200]}"


def geojson_to_viewport_ring(geometry: dict[str, Any]) -> list[dict[str, float]] | None:
    """Convert a GeoJSON Polygon/MultiPolygon to the internal ring format.

    Returns a list of ``{"lat": ..., "lon": ...}`` dicts representing the
    outer ring of the polygon, suitable for ``simplify_polygon`` /
    ``to_geojson_polygon``.  For MultiPolygon, uses the largest ring.
    """
    geo_type = geometry.get("type")
    coords = geometry.get("coordinates")
    if not coords:
        return None

    if geo_type == "Polygon":
        outer_ring = coords[0] if coords else None
    elif geo_type == "MultiPolygon":
        largest = max(coords, key=lambda poly: len(poly[0]) if poly else 0)
        outer_ring = largest[0] if largest else None
    else:
        return None

    if not outer_ring or len(outer_ring) < 3:
        return None

    return [{"lat": pt[1], "lon": pt[0]} for pt in outer_ring]


def _extract_centroid(geometry: dict[str, Any]) -> dict[str, float] | None:
    """Compute a rough centroid from GeoJSON coordinates."""
    ring = geojson_to_viewport_ring(geometry)
    if not ring:
        return None
    lats = [p["lat"] for p in ring]
    lons = [p["lon"] for p in ring]
    return {
        "lat": sum(lats) / len(lats),
        "lng": sum(lons) / len(lons),
    }
