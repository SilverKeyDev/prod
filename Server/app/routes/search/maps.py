import os

from flask import Blueprint, jsonify

from app.schemas import MapsScriptResponse
from app.utils.common_patterns import configuration_unavailable
from app.utils.security import rate_limit
from app.utils.validation import validate_response

maps_bp = Blueprint("maps", __name__, url_prefix="/api/maps")


@maps_bp.route("/script", methods=["GET"])
@rate_limit(max_requests=60, window_seconds=60)
@validate_response(MapsScriptResponse)
def get_maps_script_url():
    # Get Google Maps API key from backend environment variable
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not api_key:
        return configuration_unavailable(context={"function": "get_maps_script_url"})

    # Construct script URL (do NOT return the key itself, only the full script URL)
    # Include routes library for new Routes API (replaces deprecated DirectionsService)
    script_url = f"https://maps.googleapis.com/maps/api/js?key={api_key}&libraries=places,marker,geometry,routes&loading=async"
    return jsonify({"success": True, "script_url": script_url})
