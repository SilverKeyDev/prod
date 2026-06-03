from __future__ import annotations

import time

from flask import jsonify, request

from app.schemas import SearchByPolygonRequest, SearchByPolygonResponse
from app.utils.route.http_errors import (
    external_unavailable,
    forbidden,
    invalid_request,
    not_found,
    server_error,
    unauthorized,
    validation,
)
from app.utils.validation import validate_request, validate_response
from logger import log

from ...services.search.data import get_property_comps as slipstream_get_comps
from ...services.search.data.neighborhood_boundaries import (
    geojson_to_viewport_ring,
    get_area_boundary,
    search_areas,
)
from ...services.search.helpers.preferences_helpers import get_authenticated_user
from ...services.search.polygon.polygon_runner import run_polygon_search
from ...services.search.property.monthly_cost import monthly_cost_addon_estimates
from ...services.search.scoring.research_preferences_context import (
    parse_research_request_body,
    resolve_preferences_user_id_for_research,
)
from ...utils.security.secure_errors import SecureErrorHandler

# Register isochrone route (large handler lives in separate module).
from . import search_isochrone_routes  # noqa: F401
from .search_blueprint import search_bp


def _area_boundary_error_response(err: str):
    log.warn("SEARCH", "area_boundary_error", {"error": str(err)})
    err_lower = err.lower()
    if "invalid area id" in err_lower or "no area found" in err_lower:
        return not_found("Area not found")
    return external_unavailable(
        Exception(err),
        api_name="Slipstream",
        context={"endpoint": "area-boundary"},
    )


@search_bp.route("/propertyComps", methods=["GET"])
def get_property_comps():
    """
    Get property comparables via Slipstream geographic proximity search.
    Prioritizes address parameter, with zpid as fallback.
    """
    try:
        user, auth_error = get_authenticated_user()
        if auth_error:
            return auth_error
        if user is None:
            return unauthorized()

        address = request.args.get("address")
        zpid = request.args.get("zpid")

        if not address and not zpid:
            return invalid_request("Provide address or zpid")

        listing_id = None
        if zpid:
            listing_id = str(zpid).strip()

        comps, err = slipstream_get_comps(
            listing_id=listing_id,
            address=str(address).strip() if address else None,
        )

        if err:
            log.error("SEARCH", "property_comps_slipstream_error", {"error": str(err)})
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
        log.error("SEARCH", "property_comps_unexpected_error", e)
        return server_error(e, context={"endpoint": "propertyComps"})


@search_bp.route("/monthly-cost-estimates", methods=["GET"])
def get_monthly_cost_estimates():
    """
    Placeholder HOA and area-average utilities (USD/month). Both zero until APIs are wired.
    Query: zipcode or zip (at least five digits).
    """
    user, auth_error = get_authenticated_user()
    if auth_error:
        return auth_error
    if user is None:
        return unauthorized()

    zipcode = request.args.get("zipcode") or request.args.get("zip")
    if not zipcode or not str(zipcode).strip():
        return invalid_request("Provide zipcode (or zip) query parameter")
    try:
        data = monthly_cost_addon_estimates(str(zipcode).strip())
    except ValueError as e:
        log.warn("SEARCH", "monthly_cost_validation", {"error": str(e)})
        return validation(
            "Invalid zipcode",
            field_errors={"zipcode": "Invalid zipcode format"},
        )
    return jsonify({"success": True, **data}), 200


@search_bp.route("/properties-by-polygon", methods=["POST"])
@validate_request(SearchByPolygonRequest)
@validate_response(SearchByPolygonResponse)
def search_properties_by_polygon(data: SearchByPolygonRequest):
    """
    Polygon search endpoint. Without forceSearch: read-only response from persisted results (no new search).
    With forceSearch: run full pipeline (isochrone, search, filters, score, persist).
    Delegates to run_polygon_search; returns JSON and status code.
    """
    start_time = time.time()
    raw_header_rid = request.headers.get("X-Request-Id")
    header_rid = (
        str(raw_header_rid).strip()
        if raw_header_rid is not None and str(raw_header_rid).strip()
        else None
    )
    user, auth_error = get_authenticated_user()
    if auth_error:
        return auth_error
    if user is None:
        return unauthorized()
    request_data = data.model_dump()
    parsed = parse_research_request_body(request_data)
    resolved_pref_uid, resolve_err = resolve_preferences_user_id_for_research(
        user, parsed.get("preferences_user_id")
    )
    if resolve_err is not None:
        return forbidden()
    assert resolved_pref_uid is not None
    try:
        result = run_polygon_search(
            str(user.id),
            request_data,
            preferences_subject_user_id=str(resolved_pref_uid),
            correlation_id=header_rid,
        )
        elapsed = time.time() - start_time
        payload, status_second = result
        meta_rid = None
        if isinstance(payload, dict):
            meta = payload.get("meta")
            if isinstance(meta, dict):
                meta_rid = meta.get("requestId")
        ok = bool(isinstance(payload, dict) and payload.get("success"))
        log.info(
            "POLYGON_SEARCH",
            "polygon_route_complete",
            {
                "elapsed_s": round(elapsed, 3),
                "status_code": status_second if isinstance(status_second, int) else None,
                "viewer_id": str(user.id),
                "preferences_subject_id": str(resolved_pref_uid),
                "force_search": bool(request_data.get("forceSearch")),
                "only_cached": bool(request_data.get("onlyCached")),
                "success": ok,
                "request_id": meta_rid,
            },
        )
        if ok and bool(request_data.get("forceSearch")):
            from app.services.analytics.posthog_events import capture_product_event

            capture_product_event(
                str(user.id),
                "property_search_run",
                properties={
                    "elapsed_s": round(elapsed, 3),
                    "for_self": str(resolved_pref_uid) == str(user.id),
                },
            )

        if payload is None:
            return status_second
        return jsonify(payload), status_second
    except Exception as e:
        total_time = time.time() - start_time
        rid = header_rid or f"poly_{int(start_time * 1000)}"
        log.error("POLYGON_SEARCH", f"polygon_search_exception request_id={rid}", e)
        return server_error(
            e,
            context={
                "endpoint": "properties-by-polygon",
                "request_id": rid,
                "search_time_s": round(total_time, 2),
            },
        )


@search_bp.route("/area-suggestions", methods=["GET"])
def get_area_suggestions():
    """
    Autocomplete for geographic areas (neighborhoods, cities, ZIP codes, counties)
    via Slipstream /ws/areas/search. Returns matching areas with IDs for boundary lookup.
    Query: keyword (required), state (optional, e.g. "GA"), limit (optional, default 10).
    """
    user, auth_error = get_authenticated_user()
    if auth_error:
        return auth_error
    if user is None:
        return unauthorized()

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
            log.warn("SEARCH", "area_suggestions_error", {"error": str(err)})
            return external_unavailable(
                Exception(err),
                api_name="Slipstream",
                context={"endpoint": "area-suggestions"},
            )

        return jsonify({"success": True, "areas": areas}), 200

    except Exception as e:
        log.error("SEARCH", "area_suggestions_unexpected_error", e)
        return server_error(e, context={"endpoint": "area-suggestions"})


@search_bp.route("/area-boundary", methods=["GET"])
def get_area_boundary_route():
    """
    Get the boundary polygon for a Slipstream area by ID.
    Returns GeoJSON geometry and a viewport ring suitable for polygon search.
    Query: id (required).
    """
    user, auth_error = get_authenticated_user()
    if auth_error:
        return auth_error
    if user is None:
        return unauthorized()

    area_id = request.args.get("id", "").strip()
    if not area_id:
        return invalid_request("Provide area id parameter")

    try:
        area_data, err = get_area_boundary(area_id)
        if err:
            return _area_boundary_error_response(err)

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
        log.error("SEARCH", "area_boundary_unexpected_error", e)
        return server_error(e, context={"endpoint": "area-boundary"})
