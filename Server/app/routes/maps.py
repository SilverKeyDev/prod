from flask import Blueprint, jsonify, current_app, request
from jose import jwk, jwt as jose_jwt
from jose.exceptions import JWTError, JWTClaimsError, ExpiredSignatureError
import os
import requests
import logging

logger = logging.getLogger(__name__)

maps_bp = Blueprint('maps', __name__, url_prefix='/api/maps')

# JWT Configuration
COGNITO_REGION = os.getenv("S3_REGION", "us-east-2")
COGNITO_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")

if not COGNITO_POOL_ID or not COGNITO_CLIENT_ID:
    raise RuntimeError("COGNITO_POOL_ID and COGNITO_CLIENT_ID must be set in environment variables.")

COGNITO_ISSUER = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_POOL_ID}"
COGNITO_KEYS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"

# JWKS cache
jwks_cache = None

def get_jwks():
    global jwks_cache
    if jwks_cache is None:
        response = requests.get(COGNITO_KEYS_URL)
        jwks_cache = response.json()
    return jwks_cache

def get_signing_key(token):
    jwks = get_jwks()
    unverified_header = jose_jwt.get_unverified_header(token)
    
    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            return jwk.construct(key)
    
    raise JWTError("Unable to find a signing key that matches")

def get_current_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    
    try:
        token = auth_header.split(' ')[1]  # Remove 'Bearer ' prefix
        signing_key = get_signing_key(token)
        
        payload = jose_jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=COGNITO_CLIENT_ID,
            issuer=COGNITO_ISSUER
        )
        
        return payload.get('sub')  # Return user ID
        
    except (JWTError, JWTClaimsError, ExpiredSignatureError, IndexError) as e:
        logger.warning(f"JWT validation failed: {str(e)}")
        return None

@maps_bp.route('/script', methods=['GET'])
def get_maps_script_url():
    # Authenticate user with JWT
    user_id = get_current_user()
    if not user_id:
        return jsonify({'success': False, 'error': 'Authentication required.'}), 401
    
    # Get Google Maps API key from backend environment variable
    api_key = os.environ.get('GOOGLE_MAPS_API_KEY')
    if not api_key:
        return jsonify({'success': False, 'error': 'Google Maps API key not configured.'}), 500

    # Construct script URL (do NOT return the key itself, only the full script URL)
    script_url = f'https://maps.googleapis.com/maps/api/js?key={api_key}&libraries=places'
    return jsonify({'success': True, 'script_url': script_url})
