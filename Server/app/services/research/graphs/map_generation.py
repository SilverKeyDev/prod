"""Map and commute image generation (Google Maps Static/Directions API)."""

import json
import re
import traceback
import urllib.parse
from io import BytesIO

import requests
from PIL import Image as PILImage

from logger import log

# Get Google Maps Map ID - hardcoded for consistency with frontend
GOOGLE_MAPS_ID = "20e2eb0b8f03975aaf072074"


def _slugify_address(street: str, city: str, state: str, zipcode: str | None = None) -> str:
    """
    Make a property-friendly slug: "1107-E-Beechwood-Dr-NW-Atlanta-GA-30327"
    We keep directionals like NE/NW, collapse punctuation/whitespace to "-".
    """
    parts = [street or "", city or "", state or ""]
    if zipcode:
        parts.append(str(zipcode))
    base = "-".join(p.strip() for p in parts if p and p.strip())
    slug = re.sub(r"[^A-Za-z0-9]+", "-", base).strip("-")
    return slug


def _parse_address_line(addr: str) -> tuple[str, str, str, str | None] | None:
    """
    Parse "935 Cumberland Rd NE, Atlanta, GA 30306" -> (street, city, state, zipcode?)
    Returns None if it can't confidently parse.
    """
    m = re.match(r"^(.*?),\s*([^,]+),\s*([A-Z]{2})(?:\s+(\d{5}(?:-\d{4})?))?$", addr.strip())
    if not m:
        return None
    street, city, state, zipcode = m.groups()
    return street.strip(), city.strip(), state.strip(), (zipcode.strip() if zipcode else None)


def save_map_as_image(url, filename="map.png"):
    """Save a map image from URL to file."""
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            img = PILImage.open(BytesIO(response.content))
            img.save(filename)
            return True
        else:
            log.error("ERRORS", "Failed to fetch map: {response.status_code}, {response.text}")
            return False
    except Exception:
        log.error("ERRORS", "Error saving map image: {e}")
        return False


def fetch_directions_leg(origin, destination, api_key):
    """One driving Directions request: human-readable duration and overview polyline."""
    if not api_key:
        return None
    try:
        url = "https://maps.googleapis.com/maps/api/directions/json"
        params = {
            "origin": origin,
            "destination": destination,
            "mode": "driving",
            "key": api_key,
        }
        response = requests.get(url, params=params, timeout=30)
        if response.status_code != 200:
            log.error("ERRORS", "Directions API error:", {"detail": str(response.status_code)})
            return None
        data = response.json()
        routes = data.get("routes") or []
        if not routes or not routes[0].get("legs"):
            o_prev = origin[:30] if isinstance(origin, str) else ""
            d_prev = destination[:30] if isinstance(destination, str) else ""
            log.warn("API", "No route found from ... to ...", {"detail": f"{o_prev} -> {d_prev}"})
            return None
        leg = routes[0]["legs"][0]
        duration = (leg.get("duration") or {}).get("text")
        enc = (routes[0].get("overview_polyline") or {}).get("points")
        return {"duration_text": duration, "encoded_polyline": enc}
    except Exception as e:
        log.error("ERRORS", "Error fetching directions leg:", {"detail": str(e)})
        return None


def fetch_route_polyline(origin, destination, api_key):
    """Fetch encoded polyline for driving route from origin to destination."""
    leg = fetch_directions_leg(origin, destination, api_key)
    return leg.get("encoded_polyline") if leg else None


def fetch_travel_time(origin, destination, api_key):
    """Fetch travel time from origin to destination using Google Directions API."""
    leg = fetch_directions_leg(origin, destination, api_key)
    return leg.get("duration_text") if leg else None


def generate_static_map_url(primary_address, secondary_locations, api_key, map_id=None):
    """Generate a static map URL with proper zoom to show all routes.

    Args:
        primary_address: The main property address
        secondary_locations: List of dicts with 'name' and 'address' keys
        api_key: Google Maps API key
        map_id: Optional Google Maps map ID for cloud styling (matches search map styling).
                If None, uses GOOGLE_MAPS_ID from environment variables.
    """
    base_url = "https://maps.googleapis.com/maps/api/staticmap?"

    if map_id is None:
        map_id = GOOGLE_MAPS_ID

    params = {
        "size": "800x600",
        "maptype": "roadmap",
        "key": api_key,
        "format": "png",
        "scale": "2",
    }

    if map_id:
        params["map_id"] = map_id

    markers = []
    paths = []

    markers.append(f"color:0x8B4513%7Clabel:P%7C{primary_address}")

    location_colors = [
        "0x556B2F",
        "0x9CAF88",
        "0xA0826D",
        "0x6B8E23",
        "0xBC8A5F",
    ]
    for i, loc in enumerate(secondary_locations):
        color = location_colors[i % len(location_colors)]
        label = loc.get("name", f"L{i + 1}")[:1].upper()
        markers.append(f"color:{color}%7Clabel:{label}%7C{loc['address']}")

        polyline = fetch_route_polyline(primary_address, loc["address"], api_key)
        if polyline:
            path_color = "0x654321"
            paths.append(f"color:{path_color}%7Cweight:4%7Cenc:{polyline}")
        else:
            path_color = "0x654321"
            paths.append(f"color:{path_color}%7Cweight:2%7C{primary_address}%7C{loc['address']}")

    params["markers"] = markers
    if paths:
        params["path"] = paths

    query_string = ""
    for k, v in params.items():
        if isinstance(v, list):
            for item in v:
                query_string += f"{k}={item}&"
        else:
            query_string += f"{k}={urllib.parse.quote_plus(str(v))}&"

    final_url = base_url + query_string.rstrip("&")
    return final_url


def save_map_as_buffer(url):
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            img = PILImage.open(BytesIO(response.content))
            if img.mode not in ("RGB", "L"):
                img = img.convert("RGB")
            output = BytesIO()
            img.save(output, format="PNG")
            output.seek(0)
            return output
        else:
            log.error("ERRORS", "Failed to fetch map: {response.status_code}, {response.text}")
            return None
    except Exception:
        log.error("ERRORS", "Error loading map image to buffer: {e}")
        return None


def generate_commute_map(primary_address, user_preferences, api_key):
    """Generate a commute map showing routes from primary address to important locations."""
    try:
        if not api_key:
            log.error("ERRORS", "🗺️ COMMUTE MAP: ❌ No API key provided")
            return None

        if not user_preferences:
            log.error("ERRORS", "🗺️ COMMUTE MAP: ❌ No user preferences provided")
            return None

        important_locations = []
        locations_data = (
            user_preferences.get("important_locations")
            if isinstance(user_preferences, dict)
            else getattr(user_preferences, "important_locations", None)
        )

        if isinstance(locations_data, str):
            try:
                locations_data = json.loads(locations_data)
            except json.JSONDecodeError as e:
                log.error(
                    "ERRORS",
                    "COMMUTE MAP: Failed to parse important_locations JSON",
                    {"error": str(e), "raw_json": repr(locations_data)},
                )
                return None

        if isinstance(locations_data, list):
            for i, loc in enumerate(locations_data):
                if isinstance(loc, dict) and "address" in loc:
                    loc_name = (
                        loc.get("name")
                        or loc.get("label")
                        or loc.get("address", "")[:20]
                        or f"Location {i + 1}"
                    )
                    important_locations.append({"name": loc_name, "address": loc["address"]})
                else:
                    log.warn(
                        "API",
                        "🗺️ COMMUTE MAP: Skipped invalid location {i + 1}: missing address or not dict",
                    )
        else:
            log.warn(
                "API",
                "COMMUTE MAP: locations_data is not a list",
                {"type": str(type(locations_data))},
            )

        if not important_locations:
            log.warn("PROPERTY_DETAILS", "COMMUTE MAP: No valid locations found after processing")
            return None

        important_locations = important_locations[:5]

        locations_with_times = []
        for loc in important_locations:
            leg = fetch_directions_leg(primary_address, loc["address"], api_key)
            travel_time = leg.get("duration_text") if leg else None
            encoded_polyline = leg.get("encoded_polyline") if leg else None
            locations_with_times.append(
                {
                    "name": loc["name"],
                    "address": loc["address"],
                    "travel_time": travel_time or "Unknown",
                    "encoded_polyline": encoded_polyline,
                }
            )

        map_url = generate_static_map_url(
            primary_address, important_locations, api_key, map_id=GOOGLE_MAPS_ID
        )

        buffer_result = save_map_as_buffer(map_url)

        if buffer_result:
            return {"map_buffer": buffer_result, "travel_times": locations_with_times}
        else:
            return None

    except Exception as e:
        log.error(
            "ERRORS",
            "COMMUTE MAP exception",
            {"error": str(e), "traceback": traceback.format_exc()},
        )
        return None
