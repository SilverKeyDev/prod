import os

from flask import Blueprint, jsonify

from app.schemas import MapsScriptResponse
from app.utils.validation import validate_response

from ..utils.security.app_logging import get_logger

logger = get_logger()

maps_bp = Blueprint("maps", __name__, url_prefix="/api/maps")


@maps_bp.route("/script", methods=["GET"])
@validate_response(MapsScriptResponse)
def get_maps_script_url():
    # Get Google Maps API key from backend environment variable
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not api_key:
        return jsonify({"success": False, "error": "Google Maps API key not configured."}), 500

    # Construct script URL (do NOT return the key itself, only the full script URL)
    # Include routes library for new Routes API (replaces deprecated DirectionsService)
    script_url = f"https://maps.googleapis.com/maps/api/js?key={api_key}&libraries=places,marker,geometry,routes&loading=async"
    return jsonify({"success": True, "script_url": script_url})
