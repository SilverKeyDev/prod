"""
Geometry and geocoding helper functions for polygon manipulation, formatting, and address geocoding.
"""
from __future__ import annotations

import os
from typing import List, Dict, Optional, Tuple
from flask import current_app
import requests


def simplify_polygon(polygon: List[Dict[str, float]], max_points: int = 50) -> List[Dict[str, float]]:
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


def to_polygon_param(ring: List[Dict[str, float]]) -> str:
    """Convert polygon coordinates to API parameter format."""
    if len(ring) < 3:
        raise ValueError("Polygon needs at least 3 points")
    
    # Ensure polygon is closed
    if ring[0]['lon'] != ring[-1]['lon'] or ring[0]['lat'] != ring[-1]['lat']:
        ring = ring + [ring[0]]
    
    # Format: "lon lat,lon lat,..."
    return ", ".join([f"{p['lon']} {p['lat']}" for p in ring])


def geocode_address_google(address: str) -> Optional[Tuple[float, float]]:
    """
    Geocode an address to lat/lon using Google Geocoding API.
    Returns (lat, lon) tuple or None if geocoding fails.
    """
    try:
        google_api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        if not google_api_key:
            current_app.logger.error("🗺️ GEOCODING: ❌ Google Maps API key not configured")
            return None
        
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            'address': address,
            'key': google_api_key
        }
        
        response = requests.get(url, params=params, timeout=300)
        response.raise_for_status()
        
        data = response.json()
        status = data.get('status')
        results = data.get('results', [])
        
        if status == 'OK' and results:
            location = results[0]['geometry']['location']
            lat, lon = location['lat'], location['lng']
            return (lat, lon)
        else:
            current_app.logger.warning(f"🗺️ GEOCODING: ⚠️ Geocoding failed for address: '{address}'")
            current_app.logger.warning(f"🗺️ GEOCODING: ⚠️ Status: {status}")
            current_app.logger.warning(f"🗺️ GEOCODING: ⚠️ Error message: {data.get('error_message', 'No error message')}")
            if status == 'ZERO_RESULTS':
                current_app.logger.warning(f"🗺️ GEOCODING: ⚠️ No results found for this address")
            elif status == 'OVER_QUERY_LIMIT':
                current_app.logger.error(f"🗺️ GEOCODING: ❌ API quota exceeded")
            elif status == 'REQUEST_DENIED':
                current_app.logger.error(f"🗺️ GEOCODING: ❌ API request denied - check API key")
            elif status == 'INVALID_REQUEST':
                current_app.logger.error(f"🗺️ GEOCODING: ❌ Invalid request - missing address parameter")
            return None
            
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"🗺️ GEOCODING: ❌ Network error geocoding '{address}': {e}")
        current_app.logger.error(f"🗺️ GEOCODING: ❌ Error type: {type(e)}")
        return None
    except Exception as e:
        current_app.logger.error(f"🗺️ GEOCODING: ❌ Unexpected error geocoding '{address}': {e}")
        current_app.logger.error(f"🗺️ GEOCODING: ❌ Error type: {type(e)}")
        current_app.logger.error(f"🗺️ GEOCODING: ❌ Error traceback:", exc_info=True)
        return None
