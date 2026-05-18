"""Viewing route build and navigation link endpoints."""

from __future__ import annotations

from flask import jsonify

from app.schemas import (
    BuildRouteRequest,
    ViewingBuildRouteApiResponse,
    ViewingItinerary,
    ViewingNavigateApiResponse,
    ViewingNavigateResponse,
)
from app.services.calendar.core import get_authenticated_user_id
from app.services.calendar.permissions import require_permission
from app.services.viewings.route_builder import build_google_maps_navigate_url, build_viewing_route
from app.utils.security import rate_limit
from app.utils.validation import validate_request


@rate_limit(max_requests=40, window_seconds=60)
@validate_request(BuildRouteRequest)
def post_build_route(data: BuildRouteRequest | None = None):
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    if user_id is None:
        return jsonify({"success": False, "data": None, "error": "Unauthorized"}), 401

    has_permission, perm_err = require_permission(
        user_id, "calendar_app_created", context="build a viewing route"
    )
    if not has_permission:
        return jsonify(perm_err), 403

    if data is None:
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": "Invalid request body",
            }
        ), 400

    try:
        payload = data.model_dump(mode="json")
        raw = build_viewing_route(payload)
        itinerary = ViewingItinerary.model_validate(raw)
        body = ViewingBuildRouteApiResponse(success=True, data=itinerary, error=None)
        return jsonify(body.model_dump(mode="json")), 200
    except ValueError as e:
        return jsonify(
            ViewingBuildRouteApiResponse(success=False, data=None, error=str(e)).model_dump(
                mode="json"
            )
        ), 400
    except RuntimeError as e:
        return jsonify(
            ViewingBuildRouteApiResponse(success=False, data=None, error=str(e)).model_dump(
                mode="json"
            )
        ), 500
    except Exception:
        return jsonify(
            ViewingBuildRouteApiResponse(
                success=False, data=None, error="Route computation failed"
            ).model_dump(mode="json")
        ), 500


@rate_limit(max_requests=60, window_seconds=60)
@validate_request(ViewingItinerary)
def post_navigate_link(data: ViewingItinerary | None = None):
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    if user_id is None:
        return jsonify({"success": False, "data": None, "error": "Unauthorized"}), 401

    has_permission, perm_err = require_permission(
        user_id, "calendar_app_created", context="open viewing navigation"
    )
    if not has_permission:
        return jsonify(perm_err), 403

    if data is None:
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": "Invalid request body",
            }
        ), 400

    try:
        url = build_google_maps_navigate_url(data.model_dump(mode="json"))
        body = ViewingNavigateApiResponse(
            success=True,
            data=ViewingNavigateResponse(url=url),
            error=None,
        )
        return jsonify(body.model_dump(mode="json")), 200
    except ValueError as e:
        return jsonify(
            ViewingNavigateApiResponse(success=False, data=None, error=str(e)).model_dump(
                mode="json"
            )
        ), 400
