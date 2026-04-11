from __future__ import annotations

import time

from flask import current_app, jsonify, request

from app.schemas import SearchByPolygonRequest, SearchByPolygonResponse
from app.utils.validation import validate_request, validate_response

from ...services.search.data import get_property_comps as slipstream_get_comps
from ...services.search.data.neighborhood_boundaries import (
    geojson_to_viewport_ring,
    get_area_boundary,
    search_areas,
)
from ...services.search.helpers.preferences_helpers import get_authenticated_user
from ...services.search.polygon.polygon_search_runner import run_polygon_search
from ...services.search.property.monthly_cost import monthly_cost_addon_estimates
from ...services.search.scoring.research_preferences_context import (
    parse_research_request_body,
    resolve_preferences_user_id_for_research,
)
from ...utils.security.secure_errors import SecureErrorHandler

# Register isochrone route (large handler lives in separate module).
from . import search_isochrone_routes  # noqa: F401
from .search_blueprint import search_bp


@search_bp.route("/propertyComps", methods=["GET"])
def get_property_comps():
    """
    Get property comparables via Slipstream geographic proximity search.
    Prioritizes address parameter, with zpid as fallback.
    """
    try:
        address = request.args.get("address")
        zpid = request.args.get("zpid")

        if not address and not zpid:
            return jsonify(
                {
                    "success": False,
                    "error": "BAD_REQUEST",
                    "message": "Provide address or zpid",
                }
            ), 400

        listing_id = None
        if zpid:
            listing_id = str(zpid).strip()

        comps, err = slipstream_get_comps(
            listing_id=listing_id,
            address=str(address).strip() if address else None,
        )

        if err:
            current_app.logger.error("[PROPERTY_COMPS] Slipstream error: %s", err)
            return SecureErrorHandler.handle_external_api_error(
                Exception(err.get("details", "Unknown error")),
                "Slipstream API",
                {"endpoint": "propertyComps"},
            )

        return jsonify(
            {
                "success": True,
                "query": {"address": address, "zpid": zpid},
                "data": comps,
                "source": "slipstream_gamls",
            }
        ), 200

    except Exception as e:
        current_app.logger.error("[PROPERTY_COMPS] Unexpected error: %s", e, exc_info=True)
        return jsonify(
            {
                "success": False,
                "error": "INTERNAL_ERROR",
                "message": "An unexpected error occurred while fetching property comparables",
            }
        ), 500


@search_bp.route("/monthly-cost-estimates", methods=["GET"])
def get_monthly_cost_estimates():
    """
    Placeholder HOA and area-average utilities (USD/month). Both zero until APIs are wired.
    Query: zipcode or zip (at least five digits).
    """
    zipcode = request.args.get("zipcode") or request.args.get("zip")
    if not zipcode or not str(zipcode).strip():
        return (
            jsonify(
                {
                    "success": False,
                    "error": "BAD_REQUEST",
                    "message": "Provide zipcode (or zip) query parameter",
                }
            ),
            400,
        )
    try:
        data = monthly_cost_addon_estimates(str(zipcode).strip())
    except ValueError as e:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "BAD_REQUEST",
                    "message": str(e),
                }
            ),
            400,
        )
    return jsonify({"success": True, **data}), 200


@search_bp.route("/properties-by-polygon", methods=["POST"])
@validate_request(SearchByPolygonRequest)
@validate_response(SearchByPolygonResponse)
def search_properties_by_polygon(data: SearchByPolygonRequest | None = None):
    """
    Polygon search endpoint. Without forceSearch: read-only response from persisted results (no new search).
    With forceSearch: run full pipeline (isochrone, search, filters, score, persist).
    Delegates to run_polygon_search; returns JSON and status code.
    """
    start_time = time.time()
    request_id = f"poly_{int(start_time * 1000)}"
    user, auth_error = get_authenticated_user()
    if auth_error:
        return auth_error
    if user is None:
        return jsonify(
            {"success": False, "error": "UNAUTHORIZED", "message": "Authentication required"}
        ), 401
    if data is None:
        request_data = request.get_json(silent=True) or {}
    else:
        request_data = data.model_dump()
    parsed = parse_research_request_body(request_data)
    resolved_pref_uid, resolve_err = resolve_preferences_user_id_for_research(
        user, parsed.get("preferences_user_id")
    )
    if resolve_err is not None:
        return jsonify(resolve_err), 403
    assert resolved_pref_uid is not None
    try:
        result = run_polygon_search(
            str(user.id),
            request_data,
            preferences_subject_user_id=str(resolved_pref_uid),
        )
        if result[0] is None:
            return result[1]
        return jsonify(result[0]), result[1]
    except Exception as e:
        total_time = time.time() - start_time
        current_app.logger.error(
            "[POLYGON_SEARCH] %s - Exception: %s", request_id, e, exc_info=True
        )
        return jsonify(
            {
                "success": False,
                "error": "INTERNAL",
                "message": str(e),
                "requestId": request_id,
                "searchTime": round(total_time, 2),
            }
        ), 500


@search_bp.route("/area-suggestions", methods=["GET"])
def get_area_suggestions():
    """
    Autocomplete for geographic areas (neighborhoods, cities, ZIP codes, counties)
    via Slipstream /ws/areas/search. Returns matching areas with IDs for boundary lookup.
    Query: keyword (required), state (optional, e.g. "GA"), limit (optional, default 10).
    """
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
            current_app.logger.warning("[AREA_SUGGESTIONS] %s", err)
            return jsonify({"success": False, "error": "SEARCH_FAILED", "message": err}), 502

        return jsonify({"success": True, "areas": areas}), 200

    except Exception as e:
        current_app.logger.error("[AREA_SUGGESTIONS] Unexpected error: %s", e, exc_info=True)
        return jsonify(
            {"success": False, "error": "INTERNAL_ERROR", "message": "Failed to search areas"}
        ), 500


@search_bp.route("/area-boundary", methods=["GET"])
def get_area_boundary_route():
    """
    Get the boundary polygon for a Slipstream area by ID.
    Returns GeoJSON geometry and a viewport ring suitable for polygon search.
    Query: id (required).
    """
    area_id = request.args.get("id", "").strip()
    if not area_id:
        return jsonify(
            {"success": False, "error": "BAD_REQUEST", "message": "Provide area id parameter"}
        ), 400

    try:
        area_data, err = get_area_boundary(area_id)
        if err:
            current_app.logger.warning("[AREA_BOUNDARY] %s", err)
            status = 404 if "Invalid" in err or "No area" in err else 502
            return jsonify({"success": False, "error": "BOUNDARY_FAILED", "message": err}), status

        geometry = area_data.get("geometry") if area_data else None
        viewport_ring = None
        if geometry:
            ring = geojson_to_viewport_ring(geometry)
            if ring:
                viewport_ring = [{"lat": p["lat"], "lng": p["lon"]} for p in ring]

        return jsonify(
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
        ), 200

    except Exception as e:
        current_app.logger.error("[AREA_BOUNDARY] Unexpected error: %s", e, exc_info=True)
        return jsonify(
            {
                "success": False,
                "error": "INTERNAL_ERROR",
                "message": "Failed to fetch area boundary",
            }
        ), 500
