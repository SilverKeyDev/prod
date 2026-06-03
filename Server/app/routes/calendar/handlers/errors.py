"""HTTP error helpers for Google Calendar route handlers."""

from __future__ import annotations

from typing import Any

from app.utils.route import http_errors
from app.utils.route.response_helpers import standardize_error_response
from logger import log


def itinerary_resolution_error(exc: Exception):
    """Map viewing-itinerary resolution failures to safe ErrorResponse envelopes."""
    if isinstance(exc, ValueError):
        return http_errors.validation(str(exc))
    if isinstance(exc, RuntimeError):
        log.error("CALENDAR", "viewing_itinerary_route_failed", exc)
        msg = str(exc)
        if "GOOGLE_MAPS_SERVER_KEY" in msg or "not configured" in msg.lower():
            return http_errors.configuration_unavailable(exc, context={"feature": "google_maps"})
        return http_errors.external_unavailable(exc, api_name="Google Maps")
    return http_errors.server_error(exc, context={"operation": "itinerary_resolution"})


def calendar_permission_response(perm_err: dict[str, Any]):
    """403 for require_permission payloads (stable code + safe user message)."""
    return standardize_error_response(
        perm_err.get("message", "Access denied"),
        status_code=403,
        error_code=perm_err.get("error", "permission_required"),
    )
