from __future__ import annotations

from flask import Blueprint, request, jsonify, current_app
import requests
import os
import json
import re
import redis
import time
from typing import Dict, List, Any, Tuple, Optional
from jose import jwk, jwt as jose_jwt
from jose.exceptions import JWTError, JWTClaimsError, ExpiredSignatureError
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
from ..models.user import User
from ..utils.locationPolygon import isochrone_union_for_addresses
from flask_cors import cross_origin
from ..services.search_help import extract_property_features
from ..home_matching.app.match import find_best_matches

RAPI_HOST = "zillow-com1.p.rapidapi.com"
RAPI_KEY = os.getenv('RAPIDAPI_KEY')

# CORS settings
cors_config = {
    'origins': [
        "*"
    ],
    'supports_credentials': True
}


def _slugify_address(street: str, city: str, state: str, zipcode: str | None = None) -> str:
    parts = [street or "", city or "", state or ""]
    if zipcode:
        parts.append(str(zipcode))
    base = "-".join(p.strip() for p in parts if p and p.strip())
    return re.sub(r"[^A-Za-z0-9]+", "-", base).strip("-")

def _extract_address_fields_from_data(data: dict) -> tuple[str, str, str, str | None]:
    """
    Prefer data['address'] {...}; fall back to top-level keys.
    """
    street = city = state = ""
    zipcode = None

    addr = data.get("address") or {}
    if isinstance(addr, dict):
        street = (addr.get("streetAddress") or "").strip()
        city   = (addr.get("city") or "").strip()
        state  = (addr.get("state") or "").strip()
        zipcode = (addr.get("zipcode") or addr.get("zipCode") or None)
        zipcode = (str(zipcode).strip() if zipcode else None)

    # fallbacks if nested block was incomplete
    street = street or (data.get("streetAddress") or "").strip()
    city   = city   or (data.get("city") or "").strip()
    state  = state  or (data.get("state") or "").strip()
    zipcode = zipcode or (str(data.get("zipcode") or data.get("zipCode") or "").strip() or None)

    return street, city, state, zipcode

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

        
@search_bp.route('/property', methods=['POST'])
@cross_origin(**cors_config)
def get_property_via_address():
    """
    Call RapidAPI Zillow /property using exactly one of:
    zpid, property_url, or address (address-only is fine).
    Enhanced with commute map visualization data.
    """
    import os, time, json, requests
    from flask import current_app, jsonify, request as req
    from ..services.graphic_generation import fetch_travel_time, generate_static_map_url
    from ..models.user_preferences import UserPreferences
    from ..services.search_help import analyze_property_with_sonar_pro, extract_and_clean_features

    start = time.time()
    RAPI_HOST = os.getenv("RAPIDAPI_HOST", "zillow-com1.p.rapidapi.com")
    RAPI_KEY  = os.getenv("RAPIDAPI_KEY")
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
    
    if not RAPI_KEY:
        return jsonify({"success": False, "error": "CONFIG", "message": "RapidAPI key not configured"}), 500

    body = req.get_json(silent=True) or {}
    zpid = body.get("zpid")
    property_url = body.get("property_url")
    address = body.get("address")  # full address string, e.g., "935 Cumberland Rd NE, Atlanta, GA 30306"

    # Priority: zpid > property_url > address
    params = None
    if zpid is not None:
        try:
            params = {"zpid": str(int(str(zpid).strip()))}
        except Exception:
            current_app.logger.warning(f"[PROPERTY] Invalid zpid: {zpid}")
    if params is None and isinstance(property_url, str) and property_url.strip():
        params = {"property_url": property_url.strip()}
    if params is None and isinstance(address, str) and address.strip():
        params = {"address": address.strip()}

    if params is None:
        return jsonify({"success": False, "error": "BAD_REQUEST",
                        "message": "Provide one of: zpid, property_url, or address"}), 400

    url = f"https://{RAPI_HOST}/property"
    headers = {
        "x-rapidapi-host": RAPI_HOST,
        "x-rapidapi-key": RAPI_KEY,
        "Accept": "application/json",
    }

    current_app.logger.info(f"🏠 [PROPERTY] GET {url} params={params}")
    r = requests.get(url, headers=headers, params=params, timeout=20)
    current_app.logger.info(f"🏠 [PROPERTY] status={r.status_code}")

    if not r.ok:
        return jsonify({"success": False, "error": "RAPIDAPI_ERROR",
                        "status_code": r.status_code, "details": r.text[:800]}), r.status_code

    data = r.json()
    # Optional: log shape to help the client pick fields
    if isinstance(data, dict):
        current_app.logger.info(f"🏠 [PROPERTY] keys={list(data.keys())[:12]}")

    # Enhanced: Add commute map visualization data
    commute_data = {}
    map_url = None
    
    # Get the property address for commute calculations
    property_address = None
    if address:
        property_address = address.strip()
    elif data and isinstance(data, dict):
        # Try to extract address from property data
        street = data.get('streetAddress', '')
        city = data.get('city', '')
        state = data.get('state', '')
        zipcode = data.get('zipcode', '')
        if street and city and state:
            property_address = f"{street}, {city}, {state} {zipcode}".strip()
    
    # Get user's important locations for commute calculations
    try:
        current_user = get_current_user()
        if current_user and property_address and GOOGLE_MAPS_API_KEY:
            user_preferences = UserPreferences.query.filter_by(user_id=current_user.id).first()
            
            if user_preferences:
                important_locations = []
                locations_data = user_preferences.important_locations
                
                # Parse important_locations (could be JSON string or list)
                if isinstance(locations_data, str):
                    try:
                        locations_data = json.loads(locations_data)
                    except json.JSONDecodeError:
                        current_app.logger.error("🗺️ [PROPERTY] Failed to parse important_locations JSON")
                        locations_data = []
                
                if isinstance(locations_data, list):
                    important_locations = locations_data
                
                current_app.logger.info(f"🗺️ [PROPERTY] Found {len(important_locations)} important locations for commute calculation")
                
                # Calculate travel times for each important location
                travel_times = []
                secondary_locations = []
                
                for i, location in enumerate(important_locations):
                    if isinstance(location, dict) and 'address' in location:
                        location_address = location['address']
                        location_name = location.get('name', f'Location {i+1}')
                        
                        # Fetch travel time
                        travel_time = fetch_travel_time(property_address, location_address, GOOGLE_MAPS_API_KEY)
                        
                        travel_times.append({
                            'name': location_name,
                            'address': location_address,
                            'travel_time': travel_time,
                            'commute_tolerance': location.get('commute_tolerance', 30)
                        })
                        
                        # Prepare for map generation
                        secondary_locations.append({
                            'name': location_name,
                            'address': location_address
                        })
                        
                        current_app.logger.info(f"🗺️ [PROPERTY] Travel time to {location_name}: {travel_time}")
                
                commute_data['travel_times'] = travel_times
                
                # Generate static map URL with commute routes
                if secondary_locations:
                    try:
                        map_url = generate_static_map_url(property_address, secondary_locations, GOOGLE_MAPS_API_KEY)
                        current_app.logger.info(f"🗺️ [PROPERTY] Generated commute map URL")
                    except Exception as e:
                        current_app.logger.error(f"🗺️ [PROPERTY] Error generating map URL: {e}")
                
                commute_data['map_url'] = map_url
                commute_data['property_address'] = property_address
                
    except Exception as e:
        current_app.logger.error(f"🗺️ [PROPERTY] Error calculating commute data: {e}")
        # Don't fail the entire request if commute calculation fails
        commute_data = {'error': 'Failed to calculate commute data'}
    
    # Enhanced: Add property analysis using Perplexity Sonar Pro
    property_analysis = None
    try:
        current_user = get_current_user()
        if current_user and data and isinstance(data, dict):
            user_preferences = UserPreferences.query.filter_by(user_id=current_user.id).first()
            
            if user_preferences:
                # Convert user preferences to dict format
                user_prefs_dict = user_preferences.to_dict() if hasattr(user_preferences, 'to_dict') else {
                    'home_budget': user_preferences.home_budget,
                    'occupation': user_preferences.occupation,
                    'age': user_preferences.age,
                    'important_locations': user_preferences.important_locations,
                    'preferred_home_features': user_preferences.preferred_home_features,
                    'deal_breakers': user_preferences.deal_breakers,
                    'gross_income': user_preferences.gross_income,
                    'housing_type': user_preferences.housing_type,
                    'preferred_regions': user_preferences.preferred_regions
                }
                
                # Parse JSON fields if they're strings
                for field in ['important_locations', 'preferred_home_features', 'deal_breakers', 'preferred_regions']:
                    if hasattr(user_preferences, field):
                        field_value = getattr(user_preferences, field)
                        if isinstance(field_value, str):
                            try:
                                user_prefs_dict[field] = json.loads(field_value)
                            except json.JSONDecodeError:
                                user_prefs_dict[field] = []
                        else:
                            user_prefs_dict[field] = field_value or []
                
                # Prepare home object for analysis
                home_object = {
                    'address': property_address or data.get('streetAddress', 'Unknown address'),
                    'price': data.get('price', data.get('listPrice', 0)),
                    'bedrooms': data.get('bedrooms', data.get('beds', 0)),
                    'bathrooms': data.get('bathrooms', data.get('baths', 0)),
                    'livingArea': data.get('livingArea', data.get('sqft', 0)),
                    'propertyType': data.get('propertyType', data.get('homeType', 'Unknown')),
                    'lotAreaValue': data.get('lotAreaValue'),
                    'lotAreaUnit': data.get('lotAreaUnit'),
                    'listingStatus': data.get('listingStatus'),
                    'city': data.get('city'),
                    'state': data.get('state'),
                    'zipcode': data.get('zipcode')
                }
                
                current_app.logger.info(f"🔍 [PROPERTY] Starting Perplexity analysis for property: {home_object.get('address')}")
                
                # Call the property analysis function
                analysis_result = analyze_property_with_sonar_pro(user_prefs_dict, home_object)
                
                if analysis_result:
                    # Convert Pydantic model to dict for JSON response
                    property_analysis = {
                        'pros': analysis_result.pros,
                        'cons': analysis_result.cons,
                        'neighborhood_overview': analysis_result.neighborhood_overview,
                        'crime_stats': analysis_result.crime_stats,
                        'gentrification_index': analysis_result.gentrification_index,
                        'roi_explanation': analysis_result.roi_explanation
                    }
                    current_app.logger.info(f"✅ [PROPERTY] Successfully completed Perplexity analysis")
                    current_app.logger.info(f"🔍 [PROPERTY] Returning property_analysis with keys: {list(property_analysis.keys())}")
                    if 'neighborhood_overview' in property_analysis:
                        current_app.logger.info(f"✅ [PROPERTY] neighborhood_overview being sent to frontend: {property_analysis['neighborhood_overview']}")
                    else:
                        current_app.logger.warning(f"⚠️ [PROPERTY] neighborhood_overview missing from response to frontend")
                else:
                    current_app.logger.warning(f"⚠️ [PROPERTY] Perplexity analysis returned no results")
                    
    except Exception as e:
        current_app.logger.error(f"🔍 [PROPERTY] Error during property analysis: {e}")
        # Don't fail the entire request if analysis fails
        property_analysis = {'error': 'Failed to analyze property'}
    
        # --- Build Zillow URL from payload/zpid/address ---
    zillow_url = None
    zillow_base = "https://www.zillow.com"

    try:
        if isinstance(data, dict):
            # 1) Prefer direct/relative URL from payload
            for key in ("url", "detailUrl", "homeDetailsUrl", "propertyUrl", "hdpUrl"):
                val = data.get(key)
                if isinstance(val, str) and val.strip():
                    if val.startswith("http"):
                        zillow_url = val
                    elif val.startswith("/"):
                        zillow_url = f"{zillow_base}{val}"
                    # If found anything, stop here
                    if zillow_url:
                        break

        # 2) zpid from params or payload
        zpid_val = None
        if isinstance(params, dict) and params.get("zpid"):
            zpid_val = str(params["zpid"]).strip()
        if not zpid_val and isinstance(data, dict) and data.get("zpid"):
            zpid_val = str(data["zpid"]).strip()

        # 3) Address parts for slug (from nested 'address' first)
        street, city, state, zipcode = _extract_address_fields_from_data(data)

        # 4) Construct canonical URL if not provided
        if not zillow_url and zpid_val and street and city and state:
            slug = _slugify_address(street, city, state, zipcode)
            zillow_url = f"{zillow_base}/homedetails/{slug}/{zpid_val}_zpid/"

        # 5) Last-resort: zpid-only homedetails route
        if not zillow_url and zpid_val:
            zillow_url = f"{zillow_base}/homedetails/{zpid_val}_zpid/"

    except Exception as e:
        current_app.logger.warning(f"🔗 [PROPERTY] Failed to build Zillow URL: {e}")
    
    # Fetch additional images from Zillow images API if we have a zpid
    zillow_api_images = []
    if zpid_val:
        try:
            current_app.logger.info(f"🖼️ [PROPERTY] Fetching images from Zillow API for zpid: {zpid_val}")
            images_url = f"https://{RAPI_HOST}/images"
            images_params = {"zpid": zpid_val}
            images_headers = {
                "X-RapidAPI-Key": RAPI_KEY,
                "X-RapidAPI-Host": RAPI_HOST
            }
            
            images_response = requests.get(images_url, headers=images_headers, params=images_params, timeout=10)
            current_app.logger.info(f"🖼️ [PROPERTY] Images API status: {images_response.status_code}")
            
            if images_response.status_code == 200:
                images_data = images_response.json()
                current_app.logger.info(f"🖼️ [PROPERTY] Images API response keys: {list(images_data.keys()) if isinstance(images_data, dict) else 'not dict'}")
                
                # Extract image URLs from the response
                if isinstance(images_data, dict):
                    # Look for images in various possible fields
                    for key in ['images', 'photos', 'imageList', 'data']:
                        if key in images_data and isinstance(images_data[key], list):
                            for img_item in images_data[key]:
                                if isinstance(img_item, str):
                                    zillow_api_images.append(img_item)
                                elif isinstance(img_item, dict):
                                    # Look for URL fields
                                    for url_key in ['url', 'src', 'href', 'link']:
                                        if url_key in img_item and isinstance(img_item[url_key], str):
                                            zillow_api_images.append(img_item[url_key])
                                            break
                
                current_app.logger.info(f"🖼️ [PROPERTY] Found {len(zillow_api_images)} images from Zillow API")
            else:
                current_app.logger.warning(f"🖼️ [PROPERTY] Images API failed with status {images_response.status_code}")
                
        except Exception as e:
            current_app.logger.warning(f"🖼️ [PROPERTY] Failed to fetch images from Zillow API: {e}")
    
    # Enhanced: Extract features from property images using AI vision
    image_features = None
    try:
        if zillow_api_images and len(zillow_api_images) > 0:
            current_app.logger.info(f"🔍 [PROPERTY] Starting AI image feature extraction for {len(zillow_api_images)} images")
            
            # Limit to first 5 images for cost efficiency
            images_to_analyze = zillow_api_images[:5]
            current_app.logger.info(f"🔍 [PROPERTY] Analyzing first {len(images_to_analyze)} images for features")
            
            # Extract features using OpenAI vision
            image_features = extract_and_clean_features(images_to_analyze)
            
            if image_features:
                current_app.logger.info(f"✅ [PROPERTY] Successfully extracted image features:")
                current_app.logger.info(f"🔍 [PROPERTY] Raw features: {len(image_features.get('raw', []))} items")
                current_app.logger.info(f"🔍 [PROPERTY] Clean features: {len(image_features.get('clean', []))} items")
                current_app.logger.info(f"🔍 [PROPERTY] Clean features: {image_features.get('clean', [])}")
            else:
                current_app.logger.warning(f"⚠️ [PROPERTY] Image feature extraction returned no results")
                
    except Exception as e:
        current_app.logger.error(f"🔍 [PROPERTY] Error during image feature extraction: {e}")
        # Don't fail the entire request if image analysis fails
        image_features = {'error': 'Failed to extract features from images'}
    
    features = extract_property_features(data)
    current_app.logger.info(f"🏠 [PROPERTY] Features: {features}")
    # Include commute data, property analysis, and image features in response
    response_data = {
        "success": True, 
        "query": params, 
        "data": data,
        "features": features,
        "commute_data": commute_data,
        "property_analysis": property_analysis,
        "image_features": image_features,
        "zillow_url": zillow_url,
        "images": zillow_api_images
    }
    
    return jsonify(response_data), 200


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
        

        
        response = requests.get(url, params=params, timeout=10)

        response.raise_for_status()
        
        data = response.json()

        status = data.get('status')
        results = data.get('results', [])
        

        
        if status == 'OK' and results:
            location = results[0]['geometry']['location']
            lat, lon = location['lat'], location['lng']
            formatted_address = results[0].get('formatted_address', 'Unknown')

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
    Generate an isochrone polygon from user preferences using ALL important locations
    and their respective commute tolerances. Returns union polygon coordinates as list of {lat, lon} dicts.
    """
    try:
        # DEBUG: Log the full user_preferences being passed to helper function

        
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
        
        # Prepare address and commute tolerance pairs for all locations
        addresses_and_minutes = []
        
        for i, location in enumerate(important_locations):
            address = location.get('address')
            if not address:
                current_app.logger.warning(f"🗺️ ISOCHRONE: ⚠️ Location {i+1} has no address, skipping")
                continue
            
            # Get commute tolerance from the location (in minutes)
            commute_tolerance = location.get('commute_tolerance', 30)
            
            addresses_and_minutes.append((address, commute_tolerance))
        
        if not addresses_and_minutes:
            current_app.logger.error("🗺️ ISOCHRONE: ❌ No valid locations with addresses found")
            return None
        
        # Generate union isochrone polygon for all locations
        isochrone_feature = isochrone_union_for_addresses(
            addresses_and_minutes, 
            mode="drive",
            include_individual=False  # We only want the union, not individual polygons
        )
        
        # Extract coordinates from GeoJSON
        geometry = isochrone_feature.get('geometry', {})
        coordinates = geometry.get('coordinates', [])
        
        if geometry.get('type') == 'Polygon' and coordinates:
            # Polygon coordinates are [[[lon, lat], [lon, lat], ...]]
            polygon_coords = coordinates[0]  # Get outer ring
            # Convert to [{lat, lon}, {lat, lon}, ...] format expected by search API
            polygon_points = [{'lat': coord[1], 'lon': coord[0]} for coord in polygon_coords]

            return polygon_points
            
        elif geometry.get('type') == 'MultiPolygon' and coordinates:
            # Use the largest polygon from MultiPolygon
            largest_polygon = max(coordinates, key=lambda p: len(p[0]))
            polygon_coords = largest_polygon[0]  # Get outer ring of largest polygon
            polygon_points = [{'lat': coord[1], 'lon': coord[0]} for coord in polygon_coords]

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
        
        # Debug: Log important_locations data being passed to helper
        important_locations_data = user_preferences.get('important_locations')
        current_app.logger.info(f"[POLYGON_SEARCH] 🔍 Debug - important_locations type: {type(important_locations_data)}")
        current_app.logger.info(f"[POLYGON_SEARCH] 🔍 Debug - important_locations data: {important_locations_data}")

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

        # ---- Apply home matching scores ----
        scored_properties = []
        if all_properties:
            current_app.logger.info(f"[POLYGON_SEARCH] 🎯 Applying home matching scores to {len(all_properties)} properties")
            
            try:
                # Prepare user data for home matching
                user_data = {
                    "user_id": user.id,
                    "preferences": user_preferences
                }
                
                # Convert properties to format expected by home matching system
                homes_data = []
                for prop in all_properties:
                    # Transform Zillow property format to home matching format
                    home_data = {
                        "zpid": prop.get("zpid"),
                        "address": prop.get("address", ""),
                        "price": prop.get("price"),
                        "bedrooms": prop.get("bedrooms"),
                        "bathrooms": prop.get("bathrooms"),
                        "livingArea": prop.get("livingArea"),
                        "lotAreaValue": prop.get("lotAreaValue"),
                        "propertyType": prop.get("propertyType"),
                        "latitude": prop.get("latitude"),
                        "longitude": prop.get("longitude"),
                        "listingStatus": prop.get("listingStatus"),
                        "yearBuilt": prop.get("yearBuilt"),
                        "homeType": prop.get("homeType"),
                        "raw_data": prop
                    }
                    homes_data.append(home_data)
                
                # Get scored matches (returns all properties with scores)
                scored_matches = find_best_matches(
                    user_data=user_data,
                    homes_data=homes_data,
                    top_k=len(homes_data),  # Score all properties
                    include_explanations=False,  # Skip explanations for performance
                    embedding_provider="sentence_transformer",
                    llm_provider="openai"
                )
                
                # Use Redis sorted set for efficient sorting by score
                redis_client = None
                try:
                    # Connect to Redis
                    redis_client = redis.Redis(
                        host=os.getenv('REDIS_HOST', 'localhost'),
                        port=int(os.getenv('REDIS_PORT', 6379)),
                        db=0,
                        decode_responses=False
                    )
                    
                    # Create unique key for this search session
                    sort_key = f"property_scores:{request_id}:{int(time.time())}"
                    
                    # Create a mapping of zpid to score and add to Redis sorted set
                    score_map = {}
                    for match in scored_matches:
                        # Extract zpid from home_data within the match result
                        home_data = match.get("home_data", {})
                        zpid = home_data.get("zpid")
                        
                        # Get the final ensemble score
                        score = match.get("final_score", 0.0)
                        
                        if zpid:
                            score_map[zpid] = score
                            # Add to Redis sorted set (score as the sort value)
                            redis_client.zadd(sort_key, {str(zpid): score})
                    
                    # Set expiration for cleanup (5 minutes)
                    redis_client.expire(sort_key, 300)
                    
                    # Get sorted zpids from Redis (highest score first)
                    sorted_zpids = redis_client.zrevrange(sort_key, 0, -1, withscores=False)
                    sorted_zpids = [zpid.decode('utf-8') if isinstance(zpid, bytes) else str(zpid) for zpid in sorted_zpids]
                    
                    # Create property lookup map
                    prop_map = {str(prop.get("zpid")): prop for prop in all_properties}
                    
                    # Build sorted properties list using Redis order
                    for zpid in sorted_zpids:
                        if zpid in prop_map:
                            prop = prop_map[zpid]
                            prop["_score"] = score_map.get(zpid, 0.0)
                            scored_properties.append(prop)
                    
                    # Add any remaining properties that weren't scored
                    for prop in all_properties:
                        zpid = str(prop.get("zpid"))
                        if zpid not in score_map:
                            prop["_score"] = 0.0
                            scored_properties.append(prop)
                    
                    # Clean up Redis key
                    redis_client.delete(sort_key)
                    
                    current_app.logger.info(
                        f"[POLYGON_SEARCH] ✅ Redis sorted {len(scored_properties)} properties by score. "
                        f"Top score: {scored_properties[0].get('_score', 0.0) if scored_properties else 'N/A'}"
                    )
                    
                except Exception as redis_error:
                    current_app.logger.warning(f"[POLYGON_SEARCH] ⚠️ Redis sorting failed: {str(redis_error)}, falling back to Python sort")
                    
                    # Fallback to Python sorting if Redis fails
                    score_map = {}
                    for match in scored_matches:
                        zpid = match.get("zpid")
                        score = match.get("_score", 0.0)
                        if zpid:
                            score_map[zpid] = score
                    
                    # Add scores to original properties
                    for prop in all_properties:
                        zpid = prop.get("zpid")
                        prop["_score"] = score_map.get(zpid, 0.0)
                        scored_properties.append(prop)
                    
                    # Sort properties by score (highest first)
                    scored_properties.sort(key=lambda x: x.get("_score", 0.0), reverse=True)
                    
                    current_app.logger.info(
                        f"[POLYGON_SEARCH] ✅ Python sorted {len(scored_properties)} properties by score. "
                    )
                
                finally:
                    # Ensure Redis connection is closed
                    if redis_client:
                        try:
                            redis_client.close()
                        except:
                            pass
                
                # Get top 5 scores for logging
                top_scores = [prop.get('_score', 0) for prop in scored_properties[:5]]
                scores_str = ', '.join([f"{score:.6f}" for score in top_scores])
                current_app.logger.info(
                    f"[POLYGON_SEARCH] ✅ Successfully scored {len(scored_properties)} properties. "
                    f"Top scores: {scores_str}"
                )
                
            except Exception as e:
                current_app.logger.error(f"[POLYGON_SEARCH] ⚠️ Home matching failed: {str(e)}")
                # Fallback: add default scores and use original properties
                for prop in all_properties:
                    prop["_score"] = 0.0
                    scored_properties.append(prop)
        else:
            scored_properties = all_properties

        # Convert scores to integer percentages (multiply by 100 and convert to int)
        for prop in scored_properties:
            if "_score" in prop and prop["_score"] is not None:
                prop["_score"] = int(prop["_score"] * 100)
            else:
                prop["_score"] = 0

        total_time = time.time() - start_time
        response_data = {
            "success": True,
            "data": {
                "properties": scored_properties,
                "meta": {
                    "requestsMade": requests_made,
                    "deduped": len(scored_properties),
                    "errors": errors[:20],
                    "status_type": status_type,
                    "pagesTried": per_pages + 1,
                    "searchTime": round(total_time, 2),
                    "requestId": request_id,
                    "limit": TARGET_LIMIT,
                    "scored": len(scored_properties) > 0 and scored_properties[0].get("_score", 0.0) > 0
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

        # Prepare address and commute tolerance pairs for all locations
        addresses_and_minutes = []
        
        for i, location in enumerate(important_locations):
            address = location.get('address')
            if not address:
                current_app.logger.warning(f"[ISOCHRONE] ⚠️ Location {i+1} has no address, skipping")
                continue
            
            # Get commute tolerance from the location (in minutes)
            commute_tolerance = location.get('commute_tolerance', 30)
            
            location_name = location.get('name', f'Location {i+1}')
            current_app.logger.info(f"[ISOCHRONE] 📍 Location {i+1}: {location_name} at {address} with {commute_tolerance} minutes commute")
            
            addresses_and_minutes.append((address, commute_tolerance))
        
        if not addresses_and_minutes:
            current_app.logger.error("[ISOCHRONE] ❌ No valid locations with addresses found")
            return jsonify({
                "success": False,
                "error": "NO_VALID_LOCATIONS",
                "message": "No valid locations with addresses found"
            }), 400

        current_app.logger.info(f"[ISOCHRONE] 🔧 Generating union isochrone for {len(addresses_and_minutes)} locations")

        # Generate union isochrone polygon for all locations
        try:
            isochrone_feature = isochrone_union_for_addresses(
                addresses_and_minutes, 
                mode="drive",
                include_individual=True  # Include individual polygons for rendering
            )
            current_app.logger.info(f"[ISOCHRONE] ✅ Isochrone generation completed")
            current_app.logger.info(f"[ISOCHRONE] 📊 Isochrone feature type: {type(isochrone_feature)}")
            current_app.logger.info(f"[ISOCHRONE] 📊 Isochrone feature keys: {list(isochrone_feature.keys()) if isinstance(isochrone_feature, dict) else 'Not a dict'}")
            if isinstance(isochrone_feature, dict) and 'geometry' in isochrone_feature:
                geom = isochrone_feature['geometry']
                current_app.logger.info(f"[ISOCHRONE] 🗺️ Geometry type: {geom.get('type')}")
                current_app.logger.info(f"[ISOCHRONE] 📐 Coordinates length: {len(geom.get('coordinates', []))}")
        except Exception as e:
            current_app.logger.error(f"[ISOCHRONE] ❌ Error generating union isochrone polygon: {e}")
            current_app.logger.error(f"[ISOCHRONE] ❌ Error type: {type(e)}")
            current_app.logger.error(f"[ISOCHRONE] ❌ Error details: {str(e)}")
            return jsonify({
                "success": False,
                "error": "ISOCHRONE_GENERATION_FAILED",
                "message": f"Failed to generate isochrone polygon: {str(e)}"
            }), 500
        
        current_app.logger.info(f"[ISOCHRONE] ✅ Successfully generated union isochrone for {len(addresses_and_minutes)} locations")

        # Calculate center point from all locations (use first location as primary center for backward compatibility)
        primary_location = important_locations[0]
        primary_address = primary_location.get('address')
        primary_name = primary_location.get('name', 'Multiple Locations')
        
        # For center coordinates, we'll use the first location's coordinates
        # In the future, we could calculate the centroid of all locations
        try:
            coords = geocode_address(primary_address) if primary_address else None
            if coords:
                center_lat, center_lon = coords
            else:
                # Fallback: use center of isochrone bounds if available
                center_lat, center_lon = 0, 0
        except:
            center_lat, center_lon = 0, 0

        # Extract individual isochrones if available
        individual_isochrones = []
        if isinstance(isochrone_feature, dict) and 'extras' in isochrone_feature:
            individual_features = isochrone_feature['extras'].get('individual_features', [])
            for i, feature in enumerate(individual_features):
                if i < len(important_locations):
                    location = important_locations[i]
                    individual_isochrones.append({
                        "name": location.get('name', f'Location {i+1}'),
                        "address": location.get('address'),
                        "commute_tolerance": location.get('commute_tolerance', 30),
                        "isochrone": feature
                    })

        # Return the isochrone data
        response_data = {
            "success": True,
            "data": {
                "isochrone": isochrone_feature,
                "individual_isochrones": individual_isochrones,
                "center": {
                    "lat": center_lat,
                    "lon": center_lon,
                    "address": primary_address,
                    "name": primary_name
                },
                "locations": [
                    {
                        "name": loc.get('name', f'Location {i+1}'),
                        "address": loc.get('address'),
                        "commute_tolerance": loc.get('commute_tolerance', 30)
                    }
                    for i, loc in enumerate(important_locations)
                ],
                "commute_tolerance": primary_location.get('commute_tolerance', 30),  # Primary location's tolerance for backward compatibility
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



