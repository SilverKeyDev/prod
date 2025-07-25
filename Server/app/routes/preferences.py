from flask import Blueprint, request, jsonify, current_app
from app.models.user import User
from app.models.user_preferences import UserPreferences
from app import db
from jose import jwk, jwt as jose_jwt
from jose.exceptions import JWTError, JWTClaimsError, ExpiredSignatureError
import json
import logging
import os
import requests

logger = logging.getLogger(__name__)
preferences_bp = Blueprint('preferences', __name__)

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
        try:
            current_app.logger.info(f"Fetching JWKS from URL: {COGNITO_KEYS_URL}")
            jwks_response = requests.get(COGNITO_KEYS_URL)
            jwks_cache = jwks_response.json()
            current_app.logger.info(f"JWKS response status: {jwks_response.status_code}")
            current_app.logger.info(f"JWKS keys: {list(jwks_cache.keys()) if isinstance(jwks_cache, dict) else 'Not a dict'}")
            if jwks_response.status_code != 200:
                current_app.logger.error(f"JWKS response body: {jwks_cache}")
        except Exception as e:
            current_app.logger.error(f"Failed to fetch JWKS: {str(e)}")
            jwks_cache = {}
    return jwks_cache

def get_signing_key(token):
    try:
        headers = jose_jwt.get_unverified_header(token)
        key_id = headers.get('kid')
        current_app.logger.info(f"Token kid: {key_id}")
        
        # Get JWKS
        jwks = get_jwks()
        
        # Check if jwks has keys
        if 'keys' not in jwks:
            current_app.logger.error(f"JWKS missing 'keys' field. Available keys: {list(jwks.keys())}")
            raise JWTError('JWKS format error: missing keys field')
        
        # Find the key with matching kid
        key = None
        for k in jwks['keys']:
            if k['kid'] == key_id:
                key = k
                break
        
        if not key:
            available_kids = [k.get('kid', 'no-kid') for k in jwks['keys']]
            current_app.logger.error(f"Public key not found. Looking for kid: {key_id}, Available kids: {available_kids}")
            raise JWTError('Public key not found in jwks')
            
        return jwk.construct(key)
    except Exception as e:
        current_app.logger.error(f"Error getting signing key: {str(e)}")
        raise JWTError('Invalid token header')

def get_current_user():
    auth_header = request.headers.get('Authorization', None)
    current_app.logger.info(f"🔍 Authorization header received: {auth_header[:50] if auth_header else 'None'}...")
    
    if not auth_header:
        current_app.logger.error("❌ Authorization header missing")
        raise Exception("Authorization header missing")
    
    # Check if header starts with 'Bearer '
    if not auth_header.startswith('Bearer '):
        current_app.logger.error(f"❌ Invalid Authorization header format. Expected 'Bearer <token>', got: {auth_header[:50]}...")
        raise Exception("Invalid Authorization header format")
    
    token = auth_header.replace("Bearer ", "")
    current_app.logger.info(f"🎫 Extracted token length: {len(token)} characters")
    
    # Check if token has the expected JWT format (3 parts separated by dots)
    token_parts = token.split('.')
    if len(token_parts) != 3:
        current_app.logger.error(f"❌ Invalid JWT format. Expected 3 parts, got {len(token_parts)} parts: {token_parts}")
        raise Exception(f"Invalid JWT format: token has {len(token_parts)} parts instead of 3")
    
    try:
        current_app.logger.info("🔓 Decoding JWT with 30-second leeway for expiration.")
        # Get the proper signing key for this token
        key = get_signing_key(token)
        claims = jose_jwt.decode(
            token,
            key=key,
            algorithms=["RS256"],
            audience=COGNITO_CLIENT_ID,
            issuer=COGNITO_ISSUER,
            options={
                "leeway": 30,
                "verify_aud": True,
                "verify_iss": True,
                "verify_signature": True
            }
        )
        user = User.query.filter_by(cognito_id=claims['sub']).first()
        if not user:
            current_app.logger.warning(f"User not found for cognito_id: {claims['sub']}")
            # Try to find user by email as fallback
            user_email = claims.get('email')
            if user_email:
                current_app.logger.info(f"Attempting fallback lookup by email: {user_email}")
                user = User.query.filter_by(email=user_email).first()
                if user:
                    current_app.logger.info(f"Found user by email, updating cognito_id from {user.cognito_id} to {claims['sub']}")
                    # Update the user's cognito_id to match the JWT
                    user.cognito_id = claims['sub']
                    db.session.commit()
                else:
                    current_app.logger.error(f"User not found by email either: {user_email}")
            
            if not user:
                raise Exception("User not found or not properly registered")
        return user
    except Exception as e:
        current_app.logger.error(f"Token validation failed: {str(e)}")
        raise

@preferences_bp.route('/api/v1/preferences', methods=['POST'])
def create_or_update_preferences():
    logger = current_app.logger
    logger.info("🔐 [POST] /api/v1/preferences - Start processing user preferences")

    try:
        user = get_current_user()
        if not user:
            logger.warning("🚫 Unauthorized request: user not found in token")
            return jsonify({'error': 'Unauthorized', 'success': False}), 401
        logger.info(f"👤 Authenticated user ID: {user.id}")
    except Exception as e:
        logger.error(f"🔥 Failed to get current user: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': 'Authorization failure'}), 500

    try:
        data = request.get_json()
        if not data:
            logger.warning("⚠️ No JSON data received in request body")
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        logger.debug(f"📦 Received data: {json.dumps(data, indent=2)}")
    except Exception as e:
        logger.error(f"🔥 Failed to parse JSON body: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': 'Invalid JSON format'}), 400

    try:
        preferences = UserPreferences.query.filter_by(user_id=user.id).first()
        if preferences:
            logger.info("✏️ Existing preferences found — will update")
        else:
            preferences = UserPreferences(user_id=user.id)
            db.session.add(preferences)
            logger.info("🆕 No preferences found — creating new record")
    except Exception as e:
        logger.error(f"🔥 Error accessing UserPreferences from DB: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': 'Database access error'}), 500

    try:
        # JSON-encoded field list (all Text fields that store JSON in UserPreferences model)
        json_fields = {
            'children_ages', 'preferred_home_features', 'preferred_regions',
            'hobbies_interests', 'dining_preferences', 'fitness_activities',
            'property_features_priority', 'deal_breakers', 'content_feedback_log',
            'agent_interaction_history', 'personality_insights', 'quote_bubbles',
            'deal_makers', 'concerns_or_fears', 'solo_reports_addresses',
            'group_reports_addresses', 'chat_sessions', 'data_sources'
        }

        updated_fields = []
        skipped_fields = []
        json_encoded_fields = []

        logger.info(f"🔍 Processing {len(data)} incoming fields...")
        
        for field, value in data.items():
            logger.debug(f"🌾 Processing field: '{field}' with type: {type(value).__name__} and value: {value}")
            
            if hasattr(preferences, field):
                try:
                    # Check if this field should be JSON-encoded
                    if field in json_fields:
                        if isinstance(value, (list, dict)):
                            json_value = json.dumps(value)
                            setattr(preferences, field, json_value)
                            json_encoded_fields.append(field)
                            logger.debug(f"📝 JSON-encoded field '{field}': {json_value[:100]}...")
                        else:
                            # Value is already a string (maybe pre-encoded JSON)
                            setattr(preferences, field, value)
                            logger.debug(f"📝 Set field '{field}' as-is (string): {str(value)[:100]}...")
                    else:
                        # Regular field, set directly
                        setattr(preferences, field, value)
                        logger.debug(f"📝 Set regular field '{field}': {value}")
                    
                    updated_fields.append(field)
                    
                except Exception as field_error:
                    logger.error(f"🔥 Failed to set field '{field}': {field_error}", exc_info=True)
                    skipped_fields.append(f"{field} (error: {field_error})")
            else:
                logger.warning(f"❓ Field '{field}' not found on UserPreferences model — skipping")
                skipped_fields.append(f"{field} (not found)")

        logger.info(f"🛠 Successfully updated {len(updated_fields)} fields: {updated_fields}")
        if json_encoded_fields:
            logger.info(f"📦 JSON-encoded {len(json_encoded_fields)} fields: {json_encoded_fields}")
        if skipped_fields:
            logger.warning(f"⏭️ Skipped {len(skipped_fields)} fields: {skipped_fields}")

        # Set has_preferences flag on user
        user.has_preferences = True
        logger.debug(f"🏷️ Set has_preferences=True for user {user.id}")

        # Log what we're about to commit
        logger.debug(f"💾 About to commit preferences for user {user.id}")
        
        db.session.commit()
        logger.info(f"✅ Database commit succeeded - preferences {'updated' if preferences else 'created'} for user {user.id}")

        return jsonify({
            'success': True,
            'message': 'Preferences saved successfully',
            'preferences': preferences.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"🔥 Exception during preference save: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': 'Failed to save preferences'}), 500


@preferences_bp.route('/api/v1/preferences', methods=['GET'])
def get_preferences():
    logger = current_app.logger
    logger.info("📥 [GET] /api/v1/preferences - Fetching user preferences")

    try:
        user = get_current_user()
        if not user:
            logger.warning("🚫 Unauthorized request: user not found in token")
            return jsonify({'error': 'Unauthorized', 'success': False}), 401
        logger.info(f"👤 Authenticated user ID: {user.id}")
    except Exception as e:
        logger.error(f"🔥 Failed to get current user: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': 'Authorization failure'}), 500

    try:
        preferences = UserPreferences.query.filter_by(user_id=user.id).first()
        if not preferences:
            logger.info(f"ℹ️ No preferences found for user {user.id}")
            return jsonify({
                'success': True,
                'preferences': None,
                'has_preferences': False
            })

        logger.info(f"✅ Preferences retrieved successfully for user {user.id}")
        return jsonify({
            'success': True,
            'preferences': preferences.to_dict(),
            'has_preferences': True
        })

    except Exception as e:
        logger.error(f"🔥 Failed to fetch preferences from DB: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': 'Failed to get preferences'}), 500
