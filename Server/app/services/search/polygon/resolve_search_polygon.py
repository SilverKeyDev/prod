"""Resolve search polygon from request viewport or user preference isochrone."""

from __future__ import annotations

from typing import Any

from app.services.search.helpers.geometry_helpers import parse_viewport_polygon_ring
from app.services.search.helpers.preferences_helpers import (
    generate_isochrone_polygon_from_preferences,
)


def resolve_search_polygon(
    data: dict[str, Any],
    user_preferences: dict[str, Any],
) -> tuple[list[dict[str, float]] | None, str, str | None]:
    """
    Resolve the polygon ring used for forceSearch.

    Returns:
        (polygon, search_area_mode, viewport_error)
        search_area_mode: ``viewport`` | ``isochrone`` | ``none``
        viewport_error: set when ``viewport_polygon`` was sent but invalid
    """
    viewport_raw = data.get("viewport_polygon")
    if viewport_raw is not None:
        parsed_vp, vp_err = parse_viewport_polygon_ring(viewport_raw)
        if vp_err:
            return None, "viewport", vp_err
        if parsed_vp is not None:
            return parsed_vp, "viewport", None

    polygon = generate_isochrone_polygon_from_preferences(user_preferences)
    if polygon:
        return polygon, "isochrone", None

    return None, "none", None
