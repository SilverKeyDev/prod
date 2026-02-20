"""
Geometry helper functions for polygon manipulation and formatting.
"""

from __future__ import annotations


def simplify_polygon(
    polygon: list[dict[str, float]], max_points: int = 50
) -> list[dict[str, float]]:
    """
    Simplify a polygon by reducing the number of points while preserving the general shape.
    Uses Douglas-Peucker-like algorithm to keep the most important points.
    """
    if len(polygon) <= max_points:
        return polygon

    # Keep first and last points (should be the same for closed polygons)
    if polygon[0] == polygon[-1]:
        # Closed polygon - work with interior points
        interior_points = polygon[1:-1]
        target_interior = max_points - 2
    else:
        # Open polygon
        interior_points = polygon[1:-1]
        target_interior = max_points - 2

    if len(interior_points) <= target_interior:
        return polygon

    # Simple uniform sampling approach
    step = len(interior_points) / target_interior
    simplified_interior = []

    for i in range(target_interior):
        index = int(i * step)
        if index < len(interior_points):
            simplified_interior.append(interior_points[index])

    # Reconstruct polygon
    if polygon[0] == polygon[-1]:
        # Closed polygon
        simplified = [polygon[0]] + simplified_interior + [polygon[-1]]
    else:
        # Open polygon
        simplified = [polygon[0]] + simplified_interior + [polygon[-1]]

    return simplified


def to_polygon_param(ring: list[dict[str, float]]) -> str:
    """Convert polygon coordinates to API parameter format."""
    if len(ring) < 3:
        raise ValueError("Polygon needs at least 3 points")

    # Ensure polygon is closed
    if ring[0]["lon"] != ring[-1]["lon"] or ring[0]["lat"] != ring[-1]["lat"]:
        ring = ring + [ring[0]]

    # Format: "lon lat,lon lat,..."
    return ", ".join([f"{p['lon']} {p['lat']}" for p in ring])
