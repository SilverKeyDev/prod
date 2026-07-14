"""Public (unauthenticated) area lookups for the agent public site search bar (SIL-291).

The `/a/{slug}` page embeds the regular search bar; anonymous visitors get area
suggestions and boundaries without an account. Continuing into the actual property
search happens on the authenticated dashboard.
"""

from __future__ import annotations

from flask import jsonify, request

from app.services.search.data.neighborhood_boundaries import (
    geojson_to_viewport_ring,
    get_area_boundary,
    search_areas,
)
from app.utils.http.cache import apply_edge_cache
from app.utils.route.http_errors import (
    external_unavailable,
    invalid_request,
    not_found,
    server_error,
)
from app.utils.security import rate_limit
from logger import log

from . import public_bp


@public_bp.route("/search/area-suggestions", methods=["GET"])
@rate_limit(max_requests=30, window_seconds=60)
def public_get_area_suggestions():
    """Anonymous area autocomplete (same Slipstream lookup as the authed route)."""
    keyword = request.args.get("keyword", "").strip()
    if not keyword or len(keyword) < 2:
        return jsonify({"success": True, "areas": []}), 200

    state = request.args.get("state")
    try:
        limit = min(int(request.args.get("limit", "10")), 25)
    except (ValueError, TypeError):
        limit = 10

    try:
        areas, err = search_areas(keyword, state=state, limit=limit)
        if err:
            log.warn("SEARCH", "public_area_suggestions_error", {"error": str(err)})
            return external_unavailable(
                Exception(err),
                api_name="Slipstream",
                context={"endpoint": "public/area-suggestions"},
            )
        out = jsonify({"success": True, "areas": areas})
        apply_edge_cache(out, max_age=300, stale_while_revalidate=600)
        return out, 200
    except Exception as e:
        log.error("SEARCH", "public_area_suggestions_unexpected_error", e)
        return server_error(e, context={"endpoint": "public/area-suggestions"})


@public_bp.route("/search/area-boundary", methods=["GET"])
@rate_limit(max_requests=30, window_seconds=60)
def public_get_area_boundary():
    """Anonymous area boundary lookup (same Slipstream lookup as the authed route)."""
    area_id = request.args.get("id", "").strip()
    if not area_id:
        return invalid_request("Provide area id parameter")

    try:
        area_data, err = get_area_boundary(area_id)
        if err:
            err_lower = str(err).lower()
            if "invalid area id" in err_lower or "no area found" in err_lower:
                return not_found("Area not found")
            log.warn("SEARCH", "public_area_boundary_error", {"error": str(err)})
            return external_unavailable(
                Exception(err),
                api_name="Slipstream",
                context={"endpoint": "public/area-boundary"},
            )

        geometry = area_data.get("geometry") if area_data else None
        viewport_ring = None
        if geometry:
            ring = geojson_to_viewport_ring(geometry)
            if ring:
                viewport_ring = [{"lat": p["lat"], "lng": p["lon"]} for p in ring]

        out = jsonify(
            {
                "success": True,
                "area": {
                    "id": area_data.get("id"),
                    "name": area_data.get("name"),
                    "label": area_data.get("label"),
                    "geoType": area_data.get("geoType"),
                    "state": area_data.get("state"),
                    "center": area_data.get("center"),
                },
                "geometry": geometry,
                "viewport_ring": viewport_ring,
            }
        )
        apply_edge_cache(out, max_age=3600, stale_while_revalidate=86400)
        return out, 200
    except Exception as e:
        log.error("SEARCH", "public_area_boundary_unexpected_error", e)
        return server_error(e, context={"endpoint": "public/area-boundary"})
