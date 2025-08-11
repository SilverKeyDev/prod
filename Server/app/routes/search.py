from flask import Blueprint, request, jsonify, current_app
import requests
import os
import json
from typing import Dict, List, Any, Tuple, Optional
from jose import jwk, jwt as jose_jwt
from jose.utils import base64url_decode
from jose.exceptions import JWTError, JWTClaimsError, ExpiredSignatureError
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
from ..models.user import User
from ..utils.locationPolygon import isochrone_polygon
import math

RAPI_HOST = "zillow-com1.p.rapidapi.com"
RAPI_KEY = os.getenv('RAPIDAPI_KEY')

# Build pooled session with retry/backoff
def _build_session() -> requests.Session:
    s = requests.Session()
    retry = Retry(
        total=5,
        backoff_factor=0.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset(["GET"]),
        raise_on_status=False,
    )
    s.mount("https://", HTTPAdapter(max_retries=retry))
    s.mount("http://", HTTPAdapter(max_retries=retry))
    return s

def simplify_polygon(polygon: List[Dict[str, float]], max_points: int = 50) -> List[Dict[str, float]]:
    """
    Simplify a polygon by reducing the number of points while preserving the general shape.
    Uses Douglas-Peucker-like algorithm to keep the most important points.
    """
    if len(polygon) <= max_points:
        return polygon
    
    current_app.logger.info(f"[POLYGON_SIMPLIFY] 🔧 Simplifying polygon from {len(polygon)} to max {max_points} points")
    
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
        current_app.logger.info(f"[POLYGON_SIMPLIFY] ✅ No simplification needed: {len(interior_points)} <= {target_interior}")
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
    
    current_app.logger.info(f"[POLYGON_SIMPLIFY] ✅ Simplified polygon from {len(polygon)} to {len(simplified)} points")
    return simplified

_SESSION = _build_session()

# Base Zillow API URL from your RAPI_HOST
API_BASE = f"https://{RAPI_HOST}"

search_bp = Blueprint('search', __name__, url_prefix='/api/v1/search')

# Cognito Configuration
COGNITO_REGION = os.getenv("S3_REGION", "us-east-2")
COGNITO_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")

if not COGNITO_POOL_ID or not COGNITO_CLIENT_ID:
    raise RuntimeError("COGNITO_POOL_ID and COGNITO_CLIENT_ID must be set in environment variables.")

COGNITO_ISSUER = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_POOL_ID}"
COGNITO_KEYS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"

# Cache the JWKS
jwks = requests.get(COGNITO_KEYS_URL).json()

def get_signing_key(token):
    try:
        headers = jose_jwt.get_unverified_header(token)
        key_id = headers.get('kid')
        
        # Find the key with matching kid
        key = None
        for k in jwks['keys']:
            if k['kid'] == key_id:
                key = k
                break
        
        if not key:
            raise JWTError('Public key not found in jwks')
            
        return jwk.construct(key)
    except Exception as e:
        current_app.logger.error(f"Error getting signing key: {str(e)}")
        raise JWTError('Invalid token header')

def get_current_user():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise JWTError('Missing or invalid Authorization header')
    
    token = auth_header.split(' ')[1]
    
    try:
        # Verify token signature
        key = get_signing_key(token)
        claims = jose_jwt.decode(
            token,
            key=key,
            algorithms=['RS256'],
            audience=COGNITO_CLIENT_ID,
            issuer=COGNITO_ISSUER,
            options={
                'verify_aud': True,
                'verify_iss': True,
                'verify_signature': True
            }
        )
        
        # Get user from database
        user = User.query.filter_by(cognito_id=claims['sub']).first()
        if not user:
            current_app.logger.warning(f"User not found for cognito_id: {claims['sub']}")
            raise JWTError('User not found or not properly registered')
            
        return user
        
    except ExpiredSignatureError:
        current_app.logger.error('Token has expired')
        raise JWTError('Token has expired')
    except JWTClaimsError as e:
        current_app.logger.error(f'Token claims error: {str(e)}')
        raise JWTError(f'Invalid token claims: {str(e)}')
    except JWTError as e:
        current_app.logger.error(f'JWT validation error: {str(e)}')
        raise
    except Exception as e:
        current_app.logger.error(f'Unexpected error during token validation: {str(e)}')
        raise JWTError('Token validation failed')

# Types for better code organization
class LatLng:
    def __init__(self, lon: float, lat: float):
        self.lon = lon
        self.lat = lat

class ZillowProperty:
    def __init__(self, data: Dict[str, Any]):
        self.zpid = data.get('zpid')
        self.address = data.get('address')
        self.latitude = data.get('latitude')
        self.longitude = data.get('longitude')
        self.price = data.get('price')
        self.bedrooms = data.get('bedrooms')
        self.bathrooms = data.get('bathrooms')
        self.livingArea = data.get('livingArea')
        self.lotAreaValue = data.get('lotAreaValue')
        self.lotAreaUnit = data.get('lotAreaUnit')
        self.listingStatus = data.get('listingStatus')
        self.propertyType = data.get('propertyType')
        self.imgSrc = data.get('imgSrc')
        self.raw_data = data

@search_bp.route('/property-by-address', methods=['POST'])
def search_property_by_address():
    """
    Fetch property details from Zillow API given a street address.
    """
    try:
        # Authenticate user
        user = get_current_user()
        if not user:
            return jsonify({
                'success': False,
                'error': 'USER_NOT_FOUND',
                'message': 'User not found'
            }), 404
        data = request.get_json()
        address = data.get('address')
        
        if not address:
            return jsonify({'error': 'Address is required'}), 400
            
        if not RAPI_KEY:
            return jsonify({'error': 'RapidAPI key not configured'}), 500

        # Step 1: Search for location suggestions to get zpid
        suggest_url = f"https://{RAPI_HOST}/locationSuggestions?location={requests.utils.quote(address)}"
        
        suggest_headers = {
            "x-rapidapi-host": RAPI_HOST,
            "x-rapidapi-key": RAPI_KEY,
            "Accept": "application/json",
        }
        
        suggest_res = requests.get(suggest_url, headers=suggest_headers)
        
        if not suggest_res.ok:
            return jsonify({
                'error': f'Location suggestions failed: {suggest_res.status_code}',
                'details': suggest_res.text
            }), suggest_res.status_code

        suggestions = suggest_res.json()
        if not isinstance(suggestions, list) or len(suggestions) == 0 or not suggestions[0].get('metaData', {}).get('zpid'):
            return jsonify({
                'error': f'No matching property found for address: {address}'
            }), 404

        zpid = suggestions[0]['metaData']['zpid']
        print(f"Found zpid: {zpid} for address: {address}")

        # Step 2: Get property details by zpid
        property_url = f"https://{RAPI_HOST}/property?zpid={zpid}"
        
        prop_headers = {
            "x-rapidapi-host": RAPI_HOST,
            "x-rapidapi-key": RAPI_KEY,
            "Accept": "application/json",
        }
        
        prop_res = requests.get(property_url, headers=prop_headers)
        
        if not prop_res.ok:
            return jsonify({
                'error': f'Property fetch failed: {prop_res.status_code}',
                'details': prop_res.text
            }), prop_res.status_code

        property_data = prop_res.json()
        return jsonify({
            'success': True,
            'data': property_data
        })
        
    except Exception as e:
        print(f"Error in search_property_by_address: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


def to_polygon_param(ring: List[Dict[str, float]]) -> str:
    """Convert polygon coordinates to API parameter format."""
    if len(ring) < 3:
        raise ValueError("Polygon needs at least 3 points")
    
    # Ensure polygon is closed
    if ring[0]['lon'] != ring[-1]['lon'] or ring[0]['lat'] != ring[-1]['lat']:
        ring = ring + [ring[0]]
    
    # Format: "lon lat,lon lat,..."
    return ", ".join([f"{p['lon']} {p['lat']}" for p in ring])


def fetch_with_retry(url: str, headers: Dict[str, str], max_retries: int = 3) -> Dict[str, Any]:
    """Fetch with retry logic and rate limiting handling."""
    import time
    
    last_err = None
    for i in range(max_retries + 1):
        try:
            response = requests.get(url, headers=headers)
            
            # Handle 429 rate limiting with Retry-After header
            if response.status_code == 429:
                retry_after = int(response.headers.get("retry-after", 1))
                print(f"Rate limited, retrying after {retry_after}s")
                time.sleep(retry_after)
                continue  # Don't count this as a retry attempt
            
            if not response.ok:
                raise Exception(f"HTTP {response.status_code}")
            
            return response.json()
            
        except Exception as err:
            last_err = err
            if i < max_retries:
                time.sleep(1 * (i + 1))  # exponential backoff
    
    raise last_err


# Lot size buckets as expected by Zillow API
LOT_BUCKETS = [
    {"max": 1000, "label": "1,000 sqft"},
    {"max": 2000, "label": "2,000 sqft"},
    {"max": 3000, "label": "3,000 sqft"},
    {"max": 4000, "label": "4,000 sqft"},
    {"max": 5000, "label": "5,000 sqft"},
    {"max": 7500, "label": "7,500 sqft"},
    {"max": 10890, "label": "1/4 acre/10,890 sqft"},
    {"max": 21780, "label": "1/2 acre/21,780 sqft"},
    {"max": 43560, "label": "1 acre/43,560 sqft"},
    {"max": 87120, "label": "2 acres/87,120 sqft"},
    {"max": 217800, "label": "5 acres/217,800 sqft"},
    {"max": 435600, "label": "10 acres/435,600 sqft"},
    {"max": 871200, "label": "20 acres/871,200 sqft"},
    {"max": 2178000, "label": "50 acres/2,178,000 sqft"},
    {"max": 4356000, "label": "100 acres/4,356,000 sqft"},
]


def nearest_lot_bucket_label(sqft: int) -> str:
    """Find the nearest lot bucket label for given square footage."""
    for bucket in LOT_BUCKETS:
        if sqft <= bucket["max"]:
            return bucket["label"]
    return LOT_BUCKETS[-1]["label"]


def geocode_address(address: str) -> Optional[Tuple[float, float]]:
    """
    Geocode an address to lat/lon using Google Geocoding API.
    Returns (lat, lon) tuple or None if geocoding fails.
    """
    current_app.logger.info(f"🗺️ GEOCODING: 🚀 Starting geocoding for address: '{address}'")
    current_app.logger.info(f"🗺️ GEOCODING: 📏 Address length: {len(address)} characters")
    
    try:
        google_api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        if not google_api_key:
            current_app.logger.error("🗺️ GEOCODING: ❌ Google Maps API key not configured")
            return None
        
        current_app.logger.info(f"🗺️ GEOCODING: 🔑 API key found (length: {len(google_api_key)} chars)")
        
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            'address': address,
            'key': google_api_key
        }
        
        current_app.logger.info(f"🗺️ GEOCODING: 🌐 Making request to Google Geocoding API")
        current_app.logger.info(f"🗺️ GEOCODING: 📍 Request URL: {url}")
        current_app.logger.info(f"🗺️ GEOCODING: 📋 Request params: address='{address}', key='***{google_api_key[-4:]}'")
        
        response = requests.get(url, params=params, timeout=10)
        current_app.logger.info(f"🗺️ GEOCODING: 📡 Response status: {response.status_code}")
        response.raise_for_status()
        
        data = response.json()
        current_app.logger.info(f"🗺️ GEOCODING: 📊 Response data: {json.dumps(data, indent=2)}")
        status = data.get('status')
        results = data.get('results', [])
        
        current_app.logger.info(f"🗺️ GEOCODING: 📈 API Status: {status}")
        current_app.logger.info(f"🗺️ GEOCODING: 📊 Results count: {len(results)}")
        
        if status == 'OK' and results:
            location = results[0]['geometry']['location']
            lat, lon = location['lat'], location['lng']
            formatted_address = results[0].get('formatted_address', 'Unknown')
            current_app.logger.info(f"🗺️ GEOCODING: ✅ Successfully geocoded '{address}'")
            current_app.logger.info(f"🗺️ GEOCODING: 📍 Coordinates: lat={lat}, lon={lon}")
            current_app.logger.info(f"🗺️ GEOCODING: 🏠 Formatted address: '{formatted_address}'")
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


def generate_isochrone_polygon_from_preferences(user_preferences: Dict[str, Any]) -> Optional[List[Dict[str, float]]]:
    """
    Generate an isochrone polygon from user preferences using the first important location
    and commute tolerance. Returns polygon coordinates as list of {lat, lon} dicts.
    """
    try:
        # Extract important locations
        important_locations = []
        locations_data = user_preferences.get('important_locations')
        
        if isinstance(locations_data, str):
            try:
                locations_data = json.loads(locations_data)
            except json.JSONDecodeError:
                current_app.logger.error("🗺️ ISOCHRONE: ❌ Failed to parse important_locations JSON")
                return None
        
        if isinstance(locations_data, list) and locations_data:
            important_locations = locations_data
        
        if not important_locations:
            current_app.logger.warning("🗺️ ISOCHRONE: ⚠️ No important locations found in user preferences")
            current_app.logger.warning(f"🗺️ ISOCHRONE: ⚠️ Available user preference keys: {list(user_preferences.keys())}")
            current_app.logger.warning(f"🗺️ ISOCHRONE: ⚠️ Important locations data: {locations_data}")
            return None
        
        # Get first location
        first_location = important_locations[0]
        address = first_location.get('address')
        if not address:
            current_app.logger.warning("🗺️ ISOCHRONE: ⚠️ First important location has no address")
            return None
        
        # Geocode the address
        coords = geocode_address(address)
        if not coords:
            current_app.logger.error(f"🗺️ ISOCHRONE: ❌ Failed to geocode address: {address}")
            return None
        
        lat, lon = coords
        
        # Get commute tolerance from the location (in minutes)
        commute_tolerance = first_location.get('commute_tolerance', 30)
        if isinstance(commute_tolerance, str):
            # Handle string values like "under_30", "30_45", etc.
            if commute_tolerance == 'under_15':
                commute_tolerance = 15
            elif commute_tolerance == '15_30':
                commute_tolerance = 30
            elif commute_tolerance == '30_45':
                commute_tolerance = 45
            elif commute_tolerance == '45_60':
                commute_tolerance = 60
            elif commute_tolerance == 'over_60':
                commute_tolerance = 90
            else:
                commute_tolerance = 30  # default
        
        current_app.logger.info(f"🗺️ ISOCHRONE: 📍 Generating isochrone from {address} ({lat}, {lon}) with {commute_tolerance} minutes commute")
        
        # Generate isochrone polygon
        isochrone_feature = isochrone_polygon(lat, lon, commute_tolerance, mode="drive")
        
        # Extract coordinates from GeoJSON
        geometry = isochrone_feature.get('geometry', {})
        coordinates = geometry.get('coordinates', [])
        
        if geometry.get('type') == 'Polygon' and coordinates:
            # Polygon coordinates are [[[lon, lat], [lon, lat], ...]]
            polygon_coords = coordinates[0]  # Get outer ring
            # Convert to [{lat, lon}, {lat, lon}, ...] format expected by search API
            polygon_points = [{'lat': coord[1], 'lon': coord[0]} for coord in polygon_coords]
            current_app.logger.info(f"🗺️ ISOCHRONE: ✅ Generated polygon with {len(polygon_points)} points")
            return polygon_points
            
        elif geometry.get('type') == 'MultiPolygon' and coordinates:
            # Use the largest polygon from MultiPolygon
            largest_polygon = max(coordinates, key=lambda p: len(p[0]))
            polygon_coords = largest_polygon[0]  # Get outer ring of largest polygon
            polygon_points = [{'lat': coord[1], 'lon': coord[0]} for coord in polygon_coords]
            current_app.logger.info(f"🗺️ ISOCHRONE: ✅ Generated MultiPolygon, using largest with {len(polygon_points)} points")
            return polygon_points
        
        else:
            current_app.logger.error(f"🗺️ ISOCHRONE: ❌ Unexpected geometry type: {geometry.get('type')}")
            return None
            
    except Exception as e:
        current_app.logger.error(f"🗺️ ISOCHRONE: ❌ Failed to generate isochrone polygon: {e}")
        return None


def map_user_preferences_to_filters(user_preferences: Dict[str, Any], status_type: str = "ForSale") -> Dict[str, Any]:
    """Map user preferences to Zillow API filters."""
    filters = {}
    
    # Map budget to price filters
    if user_preferences.get('home_budget'):
        budget = user_preferences['home_budget']
        if status_type == "ForRent":
            filters['rentMaxPrice'] = int(budget / 12)  # Convert annual to monthly
            filters['rentMinPrice'] = int(budget * 0.7 / 12)
        else:
            filters['maxPrice'] = budget
            filters['minPrice'] = int(budget * 0.7)
    
    # Map preferred bedrooms
    if user_preferences.get('preferred_bedrooms'):
        filters['bedsMin'] = user_preferences['preferred_bedrooms']
        filters['bedsMax'] = user_preferences['preferred_bedrooms']
    
    # Map preferred bathrooms
    if user_preferences.get('preferred_bathrooms'):
        filters['bathsMin'] = user_preferences['preferred_bathrooms']
        filters['bathsMax'] = user_preferences['preferred_bathrooms']
    
    # Map housing type based on status type
    raw_type = str(user_preferences.get('preferred_housing_type', user_preferences.get('housing_type', '')))
    if raw_type:
        user_type = raw_type.lower()
        
        if status_type == "ForRent":
            # For Rent: Townhomes, Houses, Apartments_Condos_Co-ops
            rent_type_map = {
                'single_family': 'Houses',
                'house': 'Houses',
                'houses': 'Houses',
                'townhouse': 'Townhomes',
                'townhomes': 'Townhomes',
                'condo': 'Apartments_Condos_Co-ops',
                'condos': 'Apartments_Condos_Co-ops',
                'apartment': 'Apartments_Condos_Co-ops',
                'apartments': 'Apartments_Condos_Co-ops',
                'co-op': 'Apartments_Condos_Co-ops',
                'coop': 'Apartments_Condos_Co-ops'
            }
            mapped_type = rent_type_map.get(user_type)
            if mapped_type:
                filters['home_type'] = mapped_type
        else:
            # For Sale/RecentlySold: Multi-family, Apartments, Houses, Manufactured, Condos, LotsLand, Townhomes
            sale_type_map = {
                'single_family': 'Houses',
                'house': 'Houses',
                'houses': 'Houses',
                'condo': 'Condos',
                'condos': 'Condos',
                'townhouse': 'Townhomes',
                'townhomes': 'Townhomes',
                'apartment': 'Apartments',
                'apartments': 'Apartments',
                'multi_family': 'Multi-family',
                'multifamily': 'Multi-family',
                'manufactured': 'Manufactured',
                'mobile': 'Manufactured',
                'land': 'LotsLand',
                'lot': 'LotsLand',
                'lots': 'LotsLand'
            }
            mapped_type = sale_type_map.get(user_type)
            if mapped_type:
                filters['home_type'] = mapped_type
    
    # Map home age to build year range
    if user_preferences.get('preferred_home_age'):
        from datetime import datetime
        current_year = datetime.now().year
        age_map = {
            'new': {'min': current_year - 5},  # 0-5 years
            'recent': {'min': current_year - 15, 'max': current_year - 5},  # 5-15 years
            'established': {'min': current_year - 30, 'max': current_year - 15},  # 15-30 years
            'mature': {'min': current_year - 50, 'max': current_year - 30},  # 30-50 years
            'historic': {'max': current_year - 50}  # 50+ years
        }
        
        age_range = age_map.get(user_preferences['preferred_home_age'].lower())
        if age_range:
            if age_range.get('min'):
                filters['buildYearMin'] = age_range['min']
            if age_range.get('max'):
                filters['buildYearMax'] = age_range['max']
    
    # Map lot size preferences
    if user_preferences.get('preferred_lot_size'):
        lot_size_str = user_preferences['preferred_lot_size'].lower()
        lot_size_map = {
            'small': 5000,
            'medium': 10000,
            'large': 20000,
            'extra_large': 43560,  # 1 acre
            'acre': 43560,
            'multi_acre': 87120  # 2 acres
        }
        
        target_sqft = lot_size_map.get(lot_size_str)
        if target_sqft:
            filters['lotSize'] = nearest_lot_bucket_label(target_sqft)
    
    return filters
@search_bp.route('/properties-by-polygon', methods=['POST'])
def search_properties_by_polygon():
    """
    Polygon search WITHOUT price buckets.
    Grabs pages until we collect the first TARGET_LIMIT unique homes (or results end).
    minPrice / maxPrice are set from user_preferences.home_budget.
    """
    import time
    start_time = time.time()
    request_id = f"poly_{int(start_time * 1000)}"
    TARGET_LIMIT = 100  # hard cap on deduped results

    current_app.logger.info(f"[POLYGON_SEARCH] 🔍 Starting polygon search request {request_id}")

    try:
        user = get_current_user()
        if not user:
            current_app.logger.error(f"[POLYGON_SEARCH] ❌ User authentication failed for {request_id}")
            return jsonify({"success": False, "error": "USER_NOT_FOUND", "message": "User not found"}), 404

        current_app.logger.info(f"[POLYGON_SEARCH] 🔐 User authenticated: {user.id} for request {request_id}")

        data = request.get_json(silent=True) or {}
        user_preferences = data.get("user_preferences") or {}
        status_type = "ForSale"
        per_pages = data.get("perBucketPages", 20)
        max_retries = int(data.get("maxRetries", 3))

        current_app.logger.info(
            f"[POLYGON_SEARCH] 📊 Input parameters for {request_id}: "
            f"status_type={status_type}, per_pages={per_pages}, max_retries={max_retries}, "
            f"user_preferences_keys={list(user_preferences.keys())}"
        )

        per_pages = max(0, min(int(per_pages), 20))
        if not RAPI_KEY:
            return jsonify({"success": False, "error": "CONFIG", "message": "RapidAPI key not configured"}), 500
        if not user_preferences:
            return jsonify({"success": False, "error": "NO_PREFS", "message": "User preferences are required"}), 400

        # ---- Generate polygon ----
        polygon = generate_isochrone_polygon_from_preferences(user_preferences)
        if not polygon:
            return jsonify({"success": False, "error": "ISOCHRONE_FAILED", "message": "Failed to generate search area"}), 400
        if polygon[0] != polygon[-1]:
            polygon.append(polygon[0])
        polygon = simplify_polygon(polygon, max_points=50)

        polygon_param = to_polygon_param(polygon)

        # ---- Filters ----
        filters = map_user_preferences_to_filters(user_preferences, status_type)

        # Apply min/max price from home_budget
        home_budget = user_preferences.get("home_budget")
        if home_budget:
            try:
                hb_val = float(home_budget)
                filters["minPrice"] = int(hb_val * 0.6)
                filters["maxPrice"] = int(hb_val * 1.05)
                current_app.logger.info(
                    f"[POLYGON_SEARCH] 💰 Set minPrice={filters['minPrice']} maxPrice={filters['maxPrice']} "
                    f"from home_budget={hb_val}"
                )
            except (TypeError, ValueError):
                current_app.logger.warning(
                    f"[POLYGON_SEARCH] ⚠️ home_budget value invalid: {home_budget}"
                )

        headers = {
            "x-rapidapi-host": RAPI_HOST,
            "x-rapidapi-key": RAPI_KEY,
            "Accept": "application/json"
        }

        # ---- Search loop ----
        seen = set()
        all_properties = []
        requests_made = 0
        errors = []
        try_page_orders = [1, 0]

        for start_page in try_page_orders:
            for page in range(start_page, per_pages + 1):
                if len(all_properties) >= TARGET_LIMIT:
                    break

                params = {
                    "polygon": polygon_param,
                    "status_type": status_type,
                    "page": page,
                    "sort": "Price_Low_High",
                }

                # Apply filters
                if filters.get("home_type"):
                    params["home_type"] = filters["home_type"]
                for key in ("bedsMin", "bedsMax", "bathsMin", "bathsMax",
                            "minPrice", "maxPrice", "buildYearMin", "buildYearMax", "lotSize"):
                    if filters.get(key) is not None:
                        params[key] = filters[key]

                try:
                    resp = requests.get(f"{API_BASE}/propertyByPolygon",
                                        headers=headers, params=params, timeout=20)
                    requests_made += 1
                    if resp.status_code == 429:
                        time.sleep(1.25)
                        continue
                    if resp.status_code >= 400:
                        errors.append({"page": page, "status": resp.status_code, "text": resp.text[:300]})
                        continue

                    result = resp.json() if resp.content else {}
                    props = (result or {}).get("props") or []
                    page_size = (result or {}).get("pageSize") or 20

                    if not props:
                        break

                    for prop in props:
                        if len(all_properties) >= TARGET_LIMIT:
                            break
                        zpid = prop.get("zpid")
                        if zpid and zpid not in seen:
                            seen.add(zpid)
                            all_properties.append(prop)

                    if len(props) < int(page_size):
                        break

                except Exception as e:
                    errors.append({"page": page, "error": str(e)[:300]})
                    continue

            if len(all_properties) >= TARGET_LIMIT:
                break

        total_time = time.time() - start_time
        response_data = {
            "success": True,
            "data": {
                "properties": all_properties,
                "meta": {
                    "requestsMade": requests_made,
                    "deduped": len(all_properties),
                    "errors": errors[:20],
                    "status_type": status_type,
                    "pagesTried": per_pages + 1,
                    "searchTime": round(total_time, 2),
                    "requestId": request_id,
                    "limit": TARGET_LIMIT
                }
            }
        }
        return jsonify(response_data), 200

    except Exception as e:
        total_time = time.time() - start_time
        return jsonify({
            "success": False,
            "error": "INTERNAL",
            "message": str(e),
            "requestId": request_id,
            "searchTime": round(total_time, 2)
        }), 500



@search_bp.route('/isochrone', methods=['GET'])
def get_isochrone():
    """
    Generate and return isochrone polygon data based on user preferences.
    Returns GeoJSON polygon representing areas reachable within commute tolerance
    from the first important location.
    """
    try:
        # Get current user
        user = get_current_user()
        if not user:
            current_app.logger.error("[ISOCHRONE] ❌ User authentication failed")
            return jsonify({
                "success": False,
                "error": "USER_NOT_FOUND",
                "message": "User not found"
            }), 404

        current_app.logger.info(f"[ISOCHRONE] 🔐 User authenticated: {user.id}")

        # Get user preferences from the preferences table, not user profile
        from app.models.user_preferences import UserPreferences
        user_prefs_obj = UserPreferences.query.filter_by(user_id=user.id).first()
        
        if not user_prefs_obj:
            current_app.logger.warning(f"[ISOCHRONE] ⚠️ No preferences found for user {user.id}")
            return jsonify({
                "success": False,
                "error": "NO_PREFERENCES",
                "message": "User preferences not found. Please complete your profile setup."
            }), 400
        
        user_preferences = user_prefs_obj.to_dict()
        current_app.logger.info(f"[ISOCHRONE] 📊 Retrieved user preferences for user {user.id}")
        current_app.logger.info(f"[ISOCHRONE] 🔍 Raw user preferences keys: {list(user_preferences.keys())}")
        current_app.logger.info(f"[ISOCHRONE] 📋 User preferences sample: {dict(list(user_preferences.items())[:5])}")

        # Extract important locations
        important_locations = []
        locations_data = user_preferences.get('important_locations')
        current_app.logger.info(f"[ISOCHRONE] 📍 Raw important_locations data: {locations_data}")
        current_app.logger.info(f"[ISOCHRONE] 📍 Important_locations type: {type(locations_data)}")
        
        if isinstance(locations_data, str):
            current_app.logger.info(f"[ISOCHRONE] 🔄 Parsing JSON string: {locations_data[:200]}...")
            try:
                locations_data = json.loads(locations_data)
                current_app.logger.info(f"[ISOCHRONE] ✅ Successfully parsed JSON: {locations_data}")
            except json.JSONDecodeError as e:
                current_app.logger.error(f"[ISOCHRONE] ❌ Failed to parse important_locations JSON: {e}")
                current_app.logger.error(f"[ISOCHRONE] ❌ Original string was: {locations_data}")
                return jsonify({
                    "success": False,
                    "error": "INVALID_LOCATIONS",
                    "message": "Invalid important locations data"
                }), 400
        
        if isinstance(locations_data, list) and locations_data:
            important_locations = locations_data
            current_app.logger.info(f"[ISOCHRONE] 📋 Found {len(important_locations)} important locations")
            for i, loc in enumerate(important_locations):
                current_app.logger.info(f"[ISOCHRONE] 📍 Location {i+1}: {loc}")
        else:
            current_app.logger.warning(f"[ISOCHRONE] ⚠️ Locations data is not a valid list: {type(locations_data)} - {locations_data}")
        
        if not important_locations:
            current_app.logger.warning("[ISOCHRONE] ⚠️ No important locations found after processing")
            current_app.logger.warning(f"[ISOCHRONE] ⚠️ Original data: {user_preferences.get('important_locations')}")
            return jsonify({
                "success": False,
                "error": "NO_LOCATIONS",
                "message": "No important locations found in user preferences"
            }), 400

        # Get first location
        first_location = important_locations[0]
        current_app.logger.info(f"[ISOCHRONE] 🎯 First location data: {first_location}")
        
        address = first_location.get('address')
        location_name = first_location.get('name', 'Unknown Location')
        
        current_app.logger.info(f"[ISOCHRONE] 📍 Extracted address: '{address}'")
        current_app.logger.info(f"[ISOCHRONE] 🏷️ Location name: '{location_name}'")
        
        if not address:
            current_app.logger.warning("[ISOCHRONE] ⚠️ First important location has no address")
            current_app.logger.warning(f"[ISOCHRONE] ⚠️ First location keys: {list(first_location.keys()) if isinstance(first_location, dict) else 'Not a dict'}")
            return jsonify({
                "success": False,
                "error": "NO_ADDRESS",
                "message": "First important location has no address"
            }), 400

        # Geocode the address
        current_app.logger.info(f"[ISOCHRONE] 🌍 Starting geocoding for address: '{address}'")
        coords = geocode_address(address)
        
        if not coords:
            current_app.logger.error(f"[ISOCHRONE] ❌ Failed to geocode address: {address}")
            return jsonify({
                "success": False,
                "error": "GEOCODING_FAILED",
                "message": f"Failed to geocode address: {address}"
            }), 400

        lat, lon = coords
        current_app.logger.info(f"[ISOCHRONE] ✅ Geocoded coordinates: lat={lat}, lon={lon}")

        # Get commute tolerance from the location (in minutes)
        commute_tolerance = first_location.get('commute_tolerance', 30)
        if isinstance(commute_tolerance, str):
            # Handle string values like "under_30", "30_45", etc.
            if commute_tolerance == 'under_15':
                commute_tolerance = 15
            elif commute_tolerance == '15_30':
                commute_tolerance = 30
            elif commute_tolerance == '30_45':
                commute_tolerance = 45
            elif commute_tolerance == '45_60':
                commute_tolerance = 60
            elif commute_tolerance == 'over_60':
                commute_tolerance = 90
            else:
                commute_tolerance = 30  # default

        current_app.logger.info(f"[ISOCHRONE] 📍 Generating isochrone from {address} ({lat}, {lon}) with {commute_tolerance} minutes commute")

        # Generate isochrone polygon using the locationPolygon utility
        try:
            current_app.logger.info(f"[ISOCHRONE] 🔧 Calling isochrone_polygon function...")
            isochrone_feature = isochrone_polygon(lat, lon, commute_tolerance, mode="drive")
            current_app.logger.info(f"[ISOCHRONE] ✅ Isochrone generation completed")
            current_app.logger.info(f"[ISOCHRONE] 📊 Isochrone feature type: {type(isochrone_feature)}")
            current_app.logger.info(f"[ISOCHRONE] 📊 Isochrone feature keys: {list(isochrone_feature.keys()) if isinstance(isochrone_feature, dict) else 'Not a dict'}")
            if isinstance(isochrone_feature, dict) and 'geometry' in isochrone_feature:
                geom = isochrone_feature['geometry']
                current_app.logger.info(f"[ISOCHRONE] 🗺️ Geometry type: {geom.get('type')}")
                current_app.logger.info(f"[ISOCHRONE] 📐 Coordinates length: {len(geom.get('coordinates', []))}")
        except Exception as e:
            current_app.logger.error(f"[ISOCHRONE] ❌ Error generating isochrone polygon: {e}")
            current_app.logger.error(f"[ISOCHRONE] ❌ Error type: {type(e)}")
            current_app.logger.error(f"[ISOCHRONE] ❌ Error details: {str(e)}")
            return jsonify({
                "success": False,
                "error": "ISOCHRONE_GENERATION_FAILED",
                "message": f"Failed to generate isochrone polygon: {str(e)}"
            }), 500
        
        current_app.logger.info(f"[ISOCHRONE] ✅ Successfully generated isochrone for {location_name}")

        # Return the isochrone data
        response_data = {
            "success": True,
            "data": {
                "isochrone": isochrone_feature,
                "center": {
                    "lat": lat,
                    "lon": lon,
                    "address": address,
                    "name": location_name
                },
                "commute_tolerance": commute_tolerance,
                "mode": "drive"
            }
        }
        
        current_app.logger.info(f"[ISOCHRONE] 🎉 Returning successful response")
        current_app.logger.info(f"[ISOCHRONE] 📊 Response data keys: {list(response_data['data'].keys())}")
        current_app.logger.info(f"[ISOCHRONE] 📍 Center: {response_data['data']['center']}")
        
        return jsonify(response_data), 200

    except Exception as e:
        current_app.logger.error(f"[ISOCHRONE] ❌ Unexpected error in get_isochrone: {e}")
        current_app.logger.error(f"[ISOCHRONE] ❌ Error type: {type(e)}")
        current_app.logger.error(f"[ISOCHRONE] ❌ Error traceback:", exc_info=True)
        return jsonify({
            "success": False,
            "error": "INTERNAL_ERROR",
            "message": f"Internal server error: {str(e)}"
        }), 500
