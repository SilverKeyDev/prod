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


logger = logging.getLogger(__name__)

# Consistent font sizes for all charts
TITLE_FONTSIZE = 16
LABEL_FONTSIZE = 12
TICK_FONTSIZE = 10
AUTOPCT_FONTSIZE = 10

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
                logger.warning(f"Skipping non-numeric value in vertical lollipop chart for '{title}': {val} - {e}")
                return None

        if not sizes or sum(sizes) == 0:
            logger.warning(f"Skipping vertical lollipop chart for '{title}' due to empty or invalid data.")
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
        logger.warning(f"Failed to generate vertical lollipop chart for {title}: {e}")
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
                logger.warning(f"Skipping non-numeric value in bar chart for '{title}': {val} - {e}")
                return None

        if not sizes or sum(sizes) == 0:
            logger.warning(f"Skipping bar chart for '{title}' due to empty or invalid data.")
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
        logger.warning(f"Failed to generate horizontal bar chart for {title}: {e}")
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
            logger.info(f"✅ Map image saved as {filename}")
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
                logger.info(f"🕐 Travel time from {origin[:30]}... to {destination[:30]}...: {duration}")
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


def generate_static_map_url(primary_address, secondary_locations, api_key):
    base_url = "https://maps.googleapis.com/maps/api/staticmap?"
    params = {
        "size": "800x600",
        "maptype": "roadmap",
        "key": api_key,
    }

    markers = []
    paths = []

    markers.append(f"label:A|{primary_address}")

    for i, loc in enumerate(secondary_locations):
        label = chr(ord("B") + i)
        markers.append(f"label:{label}|{loc['address']}")
        polyline = fetch_route_polyline(primary_address, loc['address'], api_key)
        if polyline:
            paths.append(f"enc:{polyline}")
        else:
            paths.append(f"color:0x888888|weight:1|{primary_address}|{loc['address']}")

    params["markers"] = markers
    params["path"] = paths

    query_string = ""
    for k, v in params.items():
        if isinstance(v, list):
            for item in v:
                query_string += f"{k}={urllib.parse.quote_plus(item)}&"
        else:
            query_string += f"{k}={urllib.parse.quote_plus(v)}&"

    return base_url + query_string.rstrip("&")


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
            logger.info(f"✅ Map image loaded to buffer")
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
        logger.info(f"🗺️ COMMUTE MAP: Starting generation for address: {primary_address}")
        logger.info(f"🗺️ COMMUTE MAP: API key provided: {'Yes' if api_key else 'No'}")
        logger.info(f"🗺️ COMMUTE MAP: User preferences provided: {'Yes' if user_preferences else 'No'}")
        
        if not api_key:
            logger.error("🗺️ COMMUTE MAP: ❌ No API key provided")
            return None
            
        if not user_preferences:
            logger.error("🗺️ COMMUTE MAP: ❌ No user preferences provided")
            return None

        important_locations = []
        locations_data = None
        
        # Log user preferences structure for debugging
        logger.info(f"🗺️ COMMUTE MAP: User preferences type: {type(user_preferences)}")
        if isinstance(user_preferences, dict):
            logger.info(f"🗺️ COMMUTE MAP: Available keys: {list(user_preferences.keys())}")
            location_prefs = user_preferences.get("location_preferences", {})
            logger.info(f"🗺️ COMMUTE MAP: Location preferences found: {'Yes' if location_prefs else 'No'}")
            if location_prefs:
                logger.info(f"🗺️ COMMUTE MAP: Location preferences keys: {list(location_prefs.keys()) if isinstance(location_prefs, dict) else 'Not a dict'}")
            
            locations_data = location_prefs.get("important_locations") if location_prefs else None
            logger.info(f"🗺️ COMMUTE MAP: Found nested important_locations: {'Yes' if locations_data else 'No'}")
            
            # Fallback to top-level for backward compatibility
            if not locations_data:
                locations_data = user_preferences.get("important_locations")
                logger.info(f"🗺️ COMMUTE MAP: Found top-level important_locations: {'Yes' if locations_data else 'No'}")
                
        elif hasattr(user_preferences, "important_locations"):
            locations_data = user_preferences.important_locations
            logger.info(f"🗺️ COMMUTE MAP: Found object important_locations: {'Yes' if locations_data else 'No'}")
        elif hasattr(user_preferences, "location_preferences"):
            locations_data = getattr(user_preferences.location_preferences, "important_locations", None)
            logger.info(f"🗺️ COMMUTE MAP: Found nested object important_locations: {'Yes' if locations_data else 'No'}")
        else:
            logger.warning(f"🗺️ COMMUTE MAP: Unable to extract locations from user preferences")

        logger.info(f"🗺️ COMMUTE MAP: Raw locations_data: {locations_data}")
        logger.info(f"🗺️ COMMUTE MAP: Locations_data type: {type(locations_data)}")

        # Parse JSON string if needed
        if isinstance(locations_data, str):
            import json
            try:
                locations_data = json.loads(locations_data)
                logger.info(f"🗺️ COMMUTE MAP: ✅ Successfully parsed JSON locations: {locations_data}")
            except json.JSONDecodeError as e:
                logger.error(f"🗺️ COMMUTE MAP: ❌ Failed to parse important_locations JSON: {e}")
                logger.error(f"🗺️ COMMUTE MAP: Raw JSON string: {repr(locations_data)}")
                return None

        # Process locations list
        if isinstance(locations_data, list):
            logger.info(f"🗺️ COMMUTE MAP: Processing {len(locations_data)} locations")
            for i, loc in enumerate(locations_data):
                logger.info(f"🗺️ COMMUTE MAP: Processing location {i+1}: {loc} (type: {type(loc)})")
                if isinstance(loc, dict) and "name" in loc and "address" in loc:
                    important_locations.append({"name": loc["name"], "address": loc["address"]})
                    logger.info(f"🗺️ COMMUTE MAP: ✅ Added location: {loc['name']} -> {loc['address']}")
                else:
                    logger.warning(f"🗺️ COMMUTE MAP: ❌ Skipped invalid location {i+1}: missing name/address or not dict")
        else:
            logger.warning(f"🗺️ COMMUTE MAP: locations_data is not a list: {type(locations_data)}")

        if not important_locations:
            logger.warning("🗺️ COMMUTE MAP: ❌ No valid locations found after processing")
            return None

        logger.info(f"🗺️ COMMUTE MAP: ✅ Found {len(important_locations)} valid locations")
        
        # Limit to 5 locations to avoid map clutter
        original_count = len(important_locations)
        important_locations = important_locations[:5]
        if original_count > 5:
            logger.info(f"🗺️ COMMUTE MAP: Limited from {original_count} to {len(important_locations)} locations")
        
        # Fetch travel times for each location
        logger.info(f"🗺️ COMMUTE MAP: Fetching travel times for {len(important_locations)} locations...")
        locations_with_times = []
        for loc in important_locations:
            travel_time = fetch_travel_time(primary_address, loc['address'], api_key)
            locations_with_times.append({
                'name': loc['name'],
                'address': loc['address'],
                'travel_time': travel_time or 'Unknown'
            })
        
        # Generate map URL and fetch image
        logger.info(f"🗺️ COMMUTE MAP: Generating static map URL...")
        map_url = generate_static_map_url(primary_address, important_locations, api_key)
        logger.info(f"🗺️ COMMUTE MAP: Generated map URL (first 100 chars): {map_url[:100]}...")
        
        logger.info(f"🗺️ COMMUTE MAP: Fetching map image buffer...")
        buffer_result = save_map_as_buffer(map_url)
        logger.info(f"🗺️ COMMUTE MAP: Buffer result: {'✅ Success' if buffer_result else '❌ Failed'}")
        
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
