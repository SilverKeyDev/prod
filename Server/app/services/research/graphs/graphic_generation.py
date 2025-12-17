import matplotlib.pyplot as plt
from io import BytesIO
import numpy as np
import logging
import requests
from app import db
from app.models.user_preferences import UserPreferences
import requests
import urllib.parse
from PIL import Image as PILImage
from io import BytesIO
import re
import os



logger = logging.getLogger(__name__)

# Get Google Maps Map ID - hardcoded for consistency with frontend
GOOGLE_MAPS_ID = "20e2eb0b8f03975aaf072074"

# Consistent font sizes for all charts
TITLE_FONTSIZE = 16
LABEL_FONTSIZE = 12
TICK_FONTSIZE = 10
AUTOPCT_FONTSIZE = 10


def _slugify_address(street: str, city: str, state: str, zipcode: str | None = None) -> str:
    """
    Make a property-friendly slug: "1107-E-Beechwood-Dr-NW-Atlanta-GA-30327"
    We keep directionals like NE/NW, collapse punctuation/whitespace to "-".
    """
    parts = [street or "", city or "", state or ""]
    if zipcode:
        parts.append(str(zipcode))
    base = "-".join(p.strip() for p in parts if p and p.strip())
    # Replace any non-alphanumeric runs with a single hyphen; strip leading/trailing hyphens.
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


def format_label(label: str) -> str:
    """Format label by capitalizing and replacing underscores with spaces.
    
    Args:
        label: Raw label string (e.g., 'example_text')
        
    Returns:
        Formatted label string (e.g., 'Example Text')
    """
    return label.replace('_', ' ').title()

def generate_vertical_lollipop_chart(data: dict, title: str) -> BytesIO:
    try:
        labels = [format_label(key) for key in data.keys()]
        sizes = []
        for val in data.values():
            try:
                if isinstance(val, str) and val.endswith('%'):
                    sizes.append(float(val.strip('%')))
                else:
                    sizes.append(float(val))
            except Exception as e:
                logger.error(f"❌ Skipping non-numeric value in vertical lollipop chart for '{title}': {val} - {e}")
                return None
        
        if not sizes or sum(sizes) == 0:
            logger.error(f"❌ Skipping vertical lollipop chart for '{title}' due to empty or invalid data.")
            return None

        fig, ax = plt.subplots(figsize=(0.6 * len(labels) + 1, 4))
        x_pos = np.arange(len(labels))

        ax.vlines(x=x_pos, ymin=0, ymax=sizes, color='gray', alpha=0.7, linewidth=2)
        ax.plot(x_pos, sizes, 'o', color='#2A9D8F', markersize=10)
        ax.set_xticks(x_pos)
        ax.set_xticklabels(labels, rotation=45, ha='right', fontsize=TICK_FONTSIZE)
        ax.set_ylabel("Value", fontsize=LABEL_FONTSIZE)
        ax.set_title(title, fontsize=TITLE_FONTSIZE, fontweight='bold')
        ax.grid(axis='y', linestyle='--', alpha=0.3)
        ax.tick_params(axis='y', labelsize=TICK_FONTSIZE)

        plt.tight_layout()
        img_buffer = BytesIO()
        plt.savefig(img_buffer, format="PNG", bbox_inches="tight")
        plt.close(fig)
        img_buffer.seek(0)
        return img_buffer
    except Exception as e:
        logger.error(f"❌ Failed to generate vertical lollipop chart for {title}: {e}")
        return None


def generate_horizontal_bar_chart(data: dict, title: str) -> BytesIO:
    try:
        labels = [format_label(key) for key in data.keys()]
        sizes = []
        for val in data.values():
            try:
                if isinstance(val, str) and '%' in val:
                    val = val.split('%')[0]  # Keep everything before the first %
                    sizes.append(float(val))
                else:
                    sizes.append(float(val))
            except Exception as e:
                logger.error(f"❌ Skipping non-numeric value in bar chart for '{title}': {val} - {e}")
                return None
        
        if not sizes or sum(sizes) == 0:
            logger.error(f"❌ Skipping bar chart for '{title}' due to empty or invalid data.")
            return None

        fig, ax = plt.subplots(figsize=(6, 0.4 * len(labels) + 1))
        colors = plt.cm.PuBuGn_r(np.linspace(0.3, 0.9, len(sizes)))
        ax.barh(labels, sizes, color=colors)
        ax.set_xlabel("Value", fontsize=LABEL_FONTSIZE)
        ax.set_title(title, fontsize=TITLE_FONTSIZE, fontweight='bold')
        ax.grid(axis='x', linestyle='--', alpha=0.4)
        ax.tick_params(axis='both', labelsize=TICK_FONTSIZE)

        plt.tight_layout()
        img_buffer = BytesIO()
        plt.savefig(img_buffer, format="PNG", bbox_inches="tight")
        plt.close(fig)
        img_buffer.seek(0)
        return img_buffer
    except Exception as e:
        logger.error(f"❌ Failed to generate horizontal bar chart for {title}: {e}")
        return None

def generate_donut_chart(data: dict, title: str) -> BytesIO:
    try:
        labels = [format_label(key) for key in data.keys()]
        sizes = []
        for val in data.values():
            try:
                if isinstance(val, str) and '%' in val:
                    val = val.split('%')[0]  # Keep everything before the first %
                    sizes.append(float(val))
                else:
                    sizes.append(float(val))
            except Exception as e:
                logger.warning(f"Skipping non-numeric value in donut chart for '{title}': {val} - {e}")
                return None

        if not sizes or sum(sizes) == 0:
            logger.warning(f"Skipping donut chart for '{title}' due to empty or invalid data.")
            return None

        fig, ax = plt.subplots()
        pie_colors = [
            '#A3B18A', '#E5E5E5', '#4A5A28', '#4A3228', '#DAD7CD',
            '#588157', '#BC6C25', '#6C584C', '#CCD5AE', '#B5838D',
        ]
        colors = [pie_colors[i % len(pie_colors)] for i in range(len(sizes))]
        wedges, texts, autotexts = ax.pie(sizes, labels=labels, autopct='%1.1f%%',
                                          startangle=140, colors=colors, wedgeprops=dict(width=0.4),
                                          textprops={'fontsize': TICK_FONTSIZE})
        # Update autopct text size
        for autotext in autotexts:
            autotext.set_fontsize(AUTOPCT_FONTSIZE)
            autotext.set_fontweight('bold')
        ax.axis('equal')
        plt.title(title, fontsize=TITLE_FONTSIZE, fontweight='bold')

        img_buffer = BytesIO()
        plt.savefig(img_buffer, format="PNG", bbox_inches="tight")
        plt.close(fig)
        img_buffer.seek(0)
        return img_buffer
    except Exception as e:
        logger.warning(f"Failed to generate donut chart for {title}: {e}")
        return None

def generate_lollipop_chart(data: dict, title: str) -> BytesIO:
    try:
        labels = [format_label(key) for key in data.keys()]
        sizes = []
        for val in data.values():
            try:
                if isinstance(val, str) and '%' in val:
                    val = val.split('%')[0]  # Keep everything before the first %
                    sizes.append(float(val))
                else:
                    sizes.append(float(val))
            except Exception as e:
                logger.warning(f"Skipping non-numeric value in lollipop chart for '{title}': {val} - {e}")
                return None

        if not sizes or sum(sizes) == 0:
            logger.warning(f"Skipping lollipop chart for '{title}' due to empty or invalid data.")
            return None

        fig, ax = plt.subplots(figsize=(6, 0.4 * len(labels) + 1))
        y_pos = np.arange(len(labels))

        ax.hlines(y=y_pos, xmin=0, xmax=sizes, color='gray', alpha=0.7, linewidth=2)
        ax.plot(sizes, y_pos, 'o', color='#2A9D8F', markersize=10)
        ax.set_yticks(y_pos)
        ax.set_yticklabels(labels, fontsize=TICK_FONTSIZE)
        ax.set_xlabel("Value", fontsize=LABEL_FONTSIZE)
        ax.set_title(title, fontsize=TITLE_FONTSIZE, fontweight='bold')
        ax.grid(axis='x', linestyle='--', alpha=0.3)
        ax.tick_params(axis='x', labelsize=TICK_FONTSIZE)

        plt.tight_layout()
        img_buffer = BytesIO()
        plt.savefig(img_buffer, format="PNG", bbox_inches="tight")
        plt.close(fig)
        img_buffer.seek(0)
        return img_buffer
    except Exception as e:
        logger.warning(f"Failed to generate lollipop chart for {title}: {e}")
        return None


def generate_pie_chart(data: dict, title: str) -> BytesIO:
    try:
        labels = [format_label(key) for key in data.keys()]
        sizes = []
        for val in data.values():
            try:
                if isinstance(val, str) and '%' in val:
                    val = val.split('%')[0]
                    sizes.append(float(val))
                else:
                    sizes.append(float(val))
            except Exception as e:
                logger.warning(f"Skipping non-numeric value in pie chart for '{title}': {val} - {e}")
                return None

        if not sizes or sum(sizes) == 0:
            logger.warning(f"Skipping pie chart for '{title}' due to empty or invalid data.")
            return None

        pie_colors = [
            '#A3B18A', '#E5E5E5', '#4A5A28', '#4A3228', '#DAD7CD',
            '#588157', '#BC6C25', '#6C584C', '#CCD5AE', '#B5838D',
        ]
        colors = [pie_colors[i % len(pie_colors)] for i in range(len(sizes))]
        fig, ax = plt.subplots()
        wedges, texts, autotexts = ax.pie(sizes, labels=labels, autopct="%1.1f%%", startangle=140, colors=colors,
                                         textprops={'fontsize': TICK_FONTSIZE})
        # Update autopct text size
        for autotext in autotexts:
            autotext.set_fontsize(AUTOPCT_FONTSIZE)
            autotext.set_fontweight('bold')
        ax.axis("equal")
        plt.title(title, fontsize=TITLE_FONTSIZE, fontweight='bold')
        img_buffer = BytesIO()
        plt.savefig(img_buffer, format="PNG", bbox_inches="tight")
        plt.close(fig)
        img_buffer.seek(0)
        return img_buffer
    except Exception as e:
        logger.warning(f"Failed to generate pie chart for {title}: {e}")
        return None

import urllib.parse


def save_map_as_image(url, filename="map.png"):
    """Save a map image from URL to file."""
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            img = PILImage.open(BytesIO(response.content))
            img.save(filename)
            return True
        else:
            logger.error(f"❌ Failed to fetch map: {response.status_code}, {response.text}")
            return False
    except Exception as e:
        logger.error(f"❌ Error saving map image: {e}")
        return False





def fetch_route_polyline(origin, destination, api_key):
    """Fetch encoded polyline for driving route from origin to destination."""
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": origin,
        "destination": destination,
        "mode": "driving",
        "key": api_key,
    }
    response = requests.get(url, params=params, timeout=30)
    if response.status_code == 200:
        data = response.json()
        if data.get("routes"):
            return data["routes"][0]["overview_polyline"]["points"]
    return None


def fetch_travel_time(origin, destination, api_key):
    """Fetch travel time from origin to destination using Google Directions API."""
    try:
        url = "https://maps.googleapis.com/maps/api/directions/json"
        params = {
            "origin": origin,
            "destination": destination,
            "mode": "driving",
            "key": api_key,
        }
        response = requests.get(url, params=params, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if data.get("routes") and data["routes"][0].get("legs"):
                duration = data["routes"][0]["legs"][0]["duration"]["text"]
                return duration
            else:
                logger.warning(f"🕐 No route found from {origin[:30]}... to {destination[:30]}...")
                return None
        else:
            logger.error(f"🕐 Directions API error: {response.status_code}, {response.text}")
            return None
    except Exception as e:
        logger.error(f"🕐 Error fetching travel time: {e}")
        return None


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
    
    # Get map_id from parameter or module-level constant
    if map_id is None:
        map_id = GOOGLE_MAPS_ID
    
    # Map parameters
    params = {
        "size": "800x600",
        "maptype": "roadmap",
        "key": api_key,
        "format": "png",
        "scale": "2",  # High resolution for better quality
    }
    
    # Use cloud-styled map if map_id is available (matches search map styling)
    if map_id:
        params["map_id"] = map_id
    
    markers = []
    paths = []
    all_addresses = [primary_address]

    # Marker for primary address (property) - using saddle brown to match theme
    markers.append(f"color:0x8B4513%7Clabel:P%7C{primary_address}")

    # Markers for secondary locations with olive/brown theme colors
    # Location 1: dark olive, Location 2: light olive, Location 3: medium brown, Location 4: olive drab, Location 5: tan
    location_colors = ["0x556B2F", "0x9CAF88", "0xA0826D", "0x6B8E23", "0xBC8A5F"]  # dark olive, light olive, medium brown, olive drab, tan
    for i, loc in enumerate(secondary_locations):
        color = location_colors[i % len(location_colors)]
        label = loc.get('name', f'L{i+1}')[:1].upper()  # Use first letter of location name
        markers.append(f"color:{color}%7Clabel:{label}%7C{loc['address']}")
        all_addresses.append(loc['address'])
        
        # Path styling - use dark brown for drive between locations
        polyline = fetch_route_polyline(primary_address, loc['address'], api_key)
        if polyline:
            # Use dark brown for all routes
            path_color = "0x654321"  # dark brown
            paths.append(f"color:{path_color}%7Cweight:4%7Cenc:{polyline}")
        else:
            # Fallback straight line - also use dark brown
            path_color = "0x654321"  # dark brown
            paths.append(f"color:{path_color}%7Cweight:2%7C{primary_address}%7C{loc['address']}")

    # Auto-zoom: Let Google determine the best zoom to fit all markers
    # Don't set center or zoom, let Google auto-fit based on markers
    
    params["markers"] = markers
    if paths:  # Only add paths if we have routes
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
            logger.error(f"❌ Failed to fetch map: {response.status_code}, {response.text}")
            return None
    except Exception as e:
        logger.error(f"❌ Error loading map image to buffer: {e}")
        return None


def generate_commute_map(primary_address, user_preferences, api_key):
    """Generate a commute map showing routes from primary address to important locations."""
    try:
        if not api_key:
            logger.error("🗺️ COMMUTE MAP: ❌ No API key provided")
            return None
            
        if not user_preferences:
            logger.error("🗺️ COMMUTE MAP: ❌ No user preferences provided")
            return None

        important_locations = []
        locations_data = None

        # Parse JSON string if needed
        if isinstance(locations_data, str):
            import json
            try:
                locations_data = json.loads(locations_data)
            except json.JSONDecodeError as e:
                logger.error(f"🗺️ COMMUTE MAP: ❌ Failed to parse important_locations JSON: {e}")
                logger.error(f"🗺️ COMMUTE MAP: Raw JSON string: {repr(locations_data)}")
                return None

        # Process locations list
        if isinstance(locations_data, list):
            for i, loc in enumerate(locations_data):
                if isinstance(loc, dict) and "name" in loc and "address" in loc:
                    important_locations.append({"name": loc["name"], "address": loc["address"]})
                else:
                    logger.warning(f"🗺️ COMMUTE MAP: ❌ Skipped invalid location {i+1}: missing name/address or not dict")
        else:
            logger.warning(f"🗺️ COMMUTE MAP: locations_data is not a list: {type(locations_data)}")

        if not important_locations:
            logger.warning("🗺️ COMMUTE MAP: ❌ No valid locations found after processing")
            return None
        
        # Limit to 5 locations to avoid map clutter
        important_locations = important_locations[:5]
       
        locations_with_times = []
        for loc in important_locations:
            travel_time = fetch_travel_time(primary_address, loc['address'], api_key)
            locations_with_times.append({
                'name': loc['name'],
                'address': loc['address'],
                'travel_time': travel_time or 'Unknown'
            })
        
        # Generate map URL and fetch image
        map_url = generate_static_map_url(primary_address, important_locations, api_key, map_id=GOOGLE_MAPS_ID)
        
        buffer_result = save_map_as_buffer(map_url)
        
        # Return both the map buffer and travel time data
        if buffer_result:
            return {
                'map_buffer': buffer_result,
                'travel_times': locations_with_times
            }
        else:
            return None

    except Exception as e:
        logger.error(f"🗺️ COMMUTE MAP: ❌ Exception: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return None
