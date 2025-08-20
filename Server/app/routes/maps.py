from flask import Blueprint, jsonify
import os
from ..utils.app_logging import get_logger

logger = get_logger()

maps_bp = Blueprint('maps', __name__, url_prefix='/api/maps')


@maps_bp.route('/script', methods=['GET'])
def get_maps_script_url():
    
    # Get Google Maps API key from backend environment variable
    api_key = os.environ.get('GOOGLE_MAPS_API_KEY')
    if not api_key:
        return jsonify({'success': False, 'error': 'Google Maps API key not configured.'}), 500

    # Construct script URL (do NOT return the key itself, only the full script URL)
    script_url = f'https://maps.googleapis.com/maps/api/js?key={api_key}&libraries=places,marker&loading=async'
    return jsonify({'success': True, 'script_url': script_url})
