from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
import requests
from datetime import datetime
from app.models.user import User
from app.utils.address_format import normalize_address, denormalize_address
import os
from jose import jwk, jwt as jose_jwt
from jose.utils import base64url_decode
from jose.exceptions import JWTError, JWTClaimsError, ExpiredSignatureError
from ..models.user import User
from ..models.subscription import Subscription
from .. import db

user_bp = Blueprint('user', __name__, url_prefix='/api/v1/user')

@user_bp.route('/profile', methods=['GET'])
def get_user_profile():
    """Get the current user's profile information"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({
                'success': False,
                'error': 'USER_NOT_FOUND',
                'message': 'User not found'
            }), 404
            
        user_data = user.to_dict()
        return jsonify({
            'success': True,
            'data': user_data
        })
        
    except Exception as e:
        current_app.logger.error(f'Error getting user profile: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'SERVER_ERROR',
            'message': 'Failed to retrieve user profile'
        }), 500

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
        current_app.error('Token has expired')
        raise JWTError('Token has expired')
    except JWTClaimsError as e:
        current_app.error(f'Token claims error: {str(e)}')
        raise JWTError(f'Invalid token claims: {str(e)}')
    except JWTError as e:
        current_app.error(f'JWT validation error: {str(e)}')
        raise
    except Exception as e:
        current_app.error(f'Unexpected error during token validation: {str(e)}')
        raise JWTError('Token validation failed')

@user_bp.route('/billing-info', methods=['GET'])
def get_billing_info():
    """Get the current user's subscription and report usage information"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({
                'success': False,
                'error': 'USER_NOT_FOUND',
                'message': 'User not found'
            }), 404
        
        # Get subscription info
        subscription = Subscription.query.filter_by(user_id=user.id).first()
        subscription_data = None
        if subscription:
            subscription_data = {
                'status': subscription.status,
                'plan_id': subscription.plan_id,
                'current_period_end': subscription.current_period_end.isoformat() if subscription.current_period_end else None,
                'cancel_at_period_end': subscription.cancel_at_period_end,
                'reports_limit': subscription.reports_limit,
                'stripe_subscription_id': subscription.stripe_subscription_id
            }
      
        
        return jsonify({
            'success': True,
            'data': {
                'subscription': subscription_data,
                'has_active_subscription': subscription and subscription.status == 'active'
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Error getting billing info: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'SERVER_ERROR',
            'message': 'Failed to retrieve billing information'
        }), 500


def _parse_checklist(raw_value):
    """Helper to safely parse a stored checklist string back to Python list."""
    if not raw_value:
        return []
    try:
        # Expecting JSON-encoded list; fall back to comma-separated values
        if raw_value.strip().startswith('['):
            return json.loads(raw_value)
        return [item.strip() for item in raw_value.split(',') if item.strip()]
    except Exception as e:
        current_app.logger.error(f"Failed to parse checklist value: {e}")
        return []

def _build_response(checklist):
    return jsonify({
        'success': True,
        'data': checklist
    })

def _get_user():
    """Wrapper around get_current_user with proper error handling."""
    try:
        return get_current_user()
    except Exception as e:
        current_app.logger.error(f"Authorization failed in checklists route: {e}")
        return None

@user_bp.route('/insurance', methods=['GET', 'PUT'])
def insurance_checklist():
    current_app.logger.info("🔔 /insurance endpoint invoked", extra={"method": request.method})
    user = _get_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    if request.method == 'GET':
        checklist = _parse_checklist(user.insurance_checklist)
        current_app.logger.debug("Returning insurance checklist", extra={"count": len(checklist)})
        return _build_response(checklist)
    # PUT update
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({'success': False, 'error': 'Expected JSON array'}), 400
        current_app.logger.debug("Updating insurance checklist", extra={"new_ids": data})
        user.insurance_checklist = json.dumps(data)
        from app import db
        db.session.commit()
        current_app.logger.info("Insurance checklist updated", extra={"count": len(data)})
        return _build_response(data)
    except Exception as e:
        current_app.logger.error(f"Failed to update insurance checklist: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500

@user_bp.route('/closing', methods=['GET', 'PUT'])
def closing_checklist():
    current_app.logger.info("🔔 /closing endpoint invoked", extra={"method": request.method})
    """GET returns checklist, PUT updates it (expects JSON list)."""
    user = _get_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    if request.method == 'GET':
        checklist = _parse_checklist(user.closing_checklist)
        current_app.logger.debug("Returning closing checklist", extra={"count": len(checklist)})
        return _build_response(checklist)
    # PUT - update
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({'success': False, 'error': 'Expected JSON array'}), 400
        current_app.logger.debug("Updating closing checklist", extra={"new_ids": data})
        user.closing_checklist = json.dumps(data)
        from app import db
        db.session.commit()
        current_app.logger.info("Closing checklist updated and saved", extra={"count": len(data)})
        return _build_response(data)
    except Exception as e:
        current_app.logger.error(f"Failed to update closing checklist: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500

@user_bp.route('/timeline', methods=['GET', 'PUT'])
def timeline_checklist():
    current_app.logger.info("🔔 /timeline endpoint invoked", extra={"method": request.method})
    user = _get_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    if request.method == 'GET':
        checklist = _parse_checklist(user.timeline_checklist)
        current_app.logger.debug("Returning timeline checklist", extra={"count": len(checklist)})
        return _build_response(checklist)
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({'success': False, 'error': 'Expected JSON array'}), 400
        current_app.logger.debug("Updating timeline checklist", extra={"new_ids": data})
        user.timeline_checklist = json.dumps(data)
        from app import db
        db.session.commit()
        current_app.logger.info("Timeline checklist updated", extra={"count": len(data)})
        return _build_response(data)
    except Exception as e:
        current_app.logger.error(f"Failed to update timeline checklist: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500

@user_bp.route('/financing', methods=['GET', 'PUT'])
def financing_checklist():
    current_app.logger.info("🔔 /financing endpoint invoked", extra={"method": request.method})
    user = _get_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    if request.method == 'GET':
        checklist = _parse_checklist(user.financing_checklist)
        current_app.logger.debug("Returning financing checklist", extra={"count": len(checklist)})
        return _build_response(checklist)
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({'success': False, 'error': 'Expected JSON array'}), 400
        current_app.logger.debug("Updating financing checklist", extra={"new_ids": data})
        user.financing_checklist = json.dumps(data)
        from app import db
        db.session.commit()
        current_app.logger.info("Financing checklist updated", extra={"count": len(data)})
        return _build_response(data)
    except Exception as e:
        current_app.logger.error(f"Failed to update financing checklist: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500

@user_bp.route('/escrow', methods=['GET', 'PUT'])
def escrow_checklist():
    current_app.logger.info("🔔 /escrow endpoint invoked", extra={"method": request.method})
    user = _get_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    if request.method == 'GET':
        checklist = _parse_checklist(user.escrow_checklist)
        current_app.logger.debug("Returning escrow checklist", extra={"count": len(checklist)})
        return _build_response(checklist)
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({'success': False, 'error': 'Expected JSON array'}), 400
        current_app.logger.debug("Updating escrow checklist", extra={"new_ids": data})
        user.escrow_checklist = json.dumps(data)
        from app import db
        db.session.commit()
        current_app.logger.info("Escrow checklist updated", extra={"count": len(data)})
        return _build_response(data)
    except Exception as e:
        current_app.logger.error(f"Failed to update escrow checklist: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500

# === Favorite Homes Endpoints ===
@user_bp.route('/favorite-homes', methods=['GET', 'POST'])
def favorite_homes():
    """Retrieve or replace the user's list of favorite home IDs.

    GET  – Returns a list of favorite home IDs (strings).
    POST – Expects a JSON array of strings and overwrites the user's list.
    """
    current_app.logger.info("🔔 /favorite-homes endpoint invoked", extra={"method": request.method})

    user = _get_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    if request.method == 'GET':
        # Return all HomeUniversal rows for this user
        from app.models.home_universal import HomeUniversal
        homes = HomeUniversal.query.filter_by(user_id=str(user.id)).all()
        favorites = [home.to_dict() for home in homes]
        current_app.logger.debug("Returning HomeUniversal favorites", extra={"count": len(favorites)})
        return jsonify({"success": True, "favorites": favorites})

    # POST – update list
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({'success': False, 'error': 'Expected JSON array'}), 400
        current_app.logger.debug("Updating favorite homes", extra={"new_ids": data})
        
        # Remove existing HomeUniversal records for this user
        from app.models.home_universal import HomeUniversal
        HomeUniversal.query.filter_by(user_id=str(user.id)).delete()
        db.session.commit()
        
        # Add new HomeUniversal records for this user
        for home in data:
            home_universal = HomeUniversal(
                user_id=str(user.id),
                address=home.get('address'),
                beds=home.get('bedrooms', ''),
                baths=home.get('bathrooms', ''),
                sqft=home.get('sqft', ''),
                lot_size=home.get('lotSize', ''),
                price=home.get('price', ''),
                image_url=home.get('image_url', '')
            )
            db.session.add(home_universal)
        db.session.commit()
        current_app.logger.info("Favorite homes updated", extra={"count": len(data)})
        return _build_response(data)
    except Exception as e:
        current_app.logger.error(f"Failed to update favorite homes: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500


@user_bp.route('/favorite-homes/add', methods=['POST'])
def add_favorite_home():
    """Add a single home to the user's favorites list and store full home data in home_universal."""
    current_app.logger.info("🏠 ===== HOME SAVE OPERATION STARTED =====")
    current_app.logger.info("🏠 /favorite-homes/add endpoint invoked")
    current_app.logger.info(f"🕐 Timestamp: {datetime.utcnow().isoformat()}")

    user = _get_user()
    if not user:
        current_app.logger.warning("❌ Unauthorized attempt to save home - no valid user found")
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    current_app.logger.info(f"👤 User authenticated: {user.id} ({user.email})")

    try:
        data = request.get_json(force=True)
        current_app.logger.info(f"📥 Received save home request data keys: {list(data.keys()) if data else 'None'}")
        
        home = data.get('home')
        if not home or not isinstance(home, dict):
            current_app.logger.error("❌ Invalid home object in request")
            return jsonify({'success': False, 'error': 'Home object is required'}), 400

        address = home.get('address')
        if not address or not isinstance(address, str):
            current_app.logger.error(f"❌ Invalid address in home object: {address}")
            return jsonify({'success': False, 'error': 'Address is required and must be a string'}), 400
        
        current_app.logger.info(f"🏠 Attempting to save home: {address}")
        current_app.logger.info(f"🏠 Home details: {home.get('bedrooms', 'N/A')}br/{home.get('bathrooms', 'N/A')}ba, {home.get('sqft', 'N/A')} sqft, ${home.get('price', 'N/A')}")

        # Check if home is already in favorites
        from app.models.home_universal import HomeUniversal
        current_app.logger.info(f"🔍 Checking if home already exists in favorites for user {user.id}")
        home_universal = HomeUniversal.query.filter_by(user_id=str(user.id), address=address).first()
        if home_universal:
            current_app.logger.warning(f"⚠️ Home already exists in favorites: {address}")
            return jsonify({'success': False, 'error': 'Home is already in favorites'}), 400
        
        current_app.logger.info("✅ Home not found in existing favorites, proceeding with save")

        # Add new HomeUniversal record for this user
        current_app.logger.info("💾 Creating new HomeUniversal database record")
        
        # Handle both camelCase (imageUrl) and snake_case (image_url) field names
        image_url = home.get('image_url', '') or home.get('imageUrl', '')
        
        home_universal = HomeUniversal(
            user_id=str(user.id),
            address=address,
            beds=home.get('bedrooms', ''),
            baths=home.get('bathrooms', ''),
            sqft=home.get('sqft', ''),
            lot_size=home.get('lotSize', ''),
            price=home.get('price', ''),
            image_url=image_url
        )
        current_app.logger.info(f"💾 Database record details: beds={home.get('bedrooms', '')}, baths={home.get('bathrooms', '')}, sqft={home.get('sqft', '')}, lot_size={home.get('lotSize', '')}, price={home.get('price', '')}, image_url={image_url[:50] if image_url else 'None'}...")
        
        db.session.add(home_universal)
        db.session.commit()
        current_app.logger.info(f"✅ Successfully saved home to database: {address}")
        
        # Return all HomeUniversal rows for this user
        current_app.logger.info("📊 Retrieving updated favorites list for response")
        homes = HomeUniversal.query.filter_by(user_id=str(user.id)).all()
        favorites = [home.to_dict() for home in homes]
        current_app.logger.info(f"📊 User now has {len(favorites)} total saved homes")
        current_app.logger.info("🏠 ===== HOME SAVE OPERATION COMPLETED SUCCESSFULLY =====")
        
        return jsonify({
            'success': True,
            'message': 'Home added to favorites',
            'favorites': favorites
        })

    except Exception as e:
        current_app.logger.error("🏠 ===== HOME SAVE OPERATION FAILED =====")
        current_app.logger.error(f"❌ Failed to add favorite home: {e}")
        current_app.logger.error(f"❌ Exception type: {type(e).__name__}")
        current_app.logger.error(f"❌ Exception details: {str(e)}")
        import traceback
        current_app.logger.error(f"❌ Stack trace: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': 'Server error'}), 500


@user_bp.route('/favorite-homes/remove', methods=['POST'])
def remove_favorite_home():
    """Remove a single home address from the user's favorites list."""
    current_app.logger.info("🗑️ ===== HOME UNSAVE OPERATION STARTED =====")
    current_app.logger.info("🗑️ /favorite-homes/remove endpoint invoked")
    current_app.logger.info(f"🕐 Timestamp: {datetime.utcnow().isoformat()}")
    
    user = _get_user()
    if not user:
        current_app.logger.warning("❌ Unauthorized attempt to remove home - no valid user found")
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    current_app.logger.info(f"👤 User authenticated: {user.id} ({user.email})")
    
    try:
        data = request.get_json(force=True)
        current_app.logger.info(f"📥 Received remove home request data keys: {list(data.keys()) if data else 'None'}")
        
        address = data.get('address')
        
        if not address or not isinstance(address, str):
            current_app.logger.error(f"❌ Invalid address in request: {address}")
            return jsonify({'success': False, 'error': 'Address is required and must be a string'}), 400
        
        current_app.logger.info(f"🗑️ Attempting to remove home: {address}")
        
        # Remove HomeUniversal record for this user and address
        from app.models.home_universal import HomeUniversal
        current_app.logger.info(f"🔍 Checking if home exists in favorites for user {user.id}")
        
        # Check if home exists before attempting to delete
        existing_home = HomeUniversal.query.filter_by(user_id=str(user.id), address=address).first()
        if not existing_home:
            current_app.logger.warning(f"⚠️ Home not found in favorites: {address}")
            return jsonify({'success': False, 'error': 'Home not found in favorites'}), 404
        
        current_app.logger.info(f"✅ Home found in favorites, proceeding with removal")
        current_app.logger.info(f"🗑️ Removing home from database: {address}")
        
        deleted_count = HomeUniversal.query.filter_by(user_id=str(user.id), address=address).delete()
        db.session.commit()
        current_app.logger.info(f"✅ Successfully removed {deleted_count} home record(s) from database: {address}")
        
        # Return all HomeUniversal rows for this user
        current_app.logger.info("📊 Retrieving updated favorites list for response")
        homes = HomeUniversal.query.filter_by(user_id=str(user.id)).all()
        favorites = [home.to_dict() for home in homes]
        current_app.logger.info(f"📊 User now has {len(favorites)} total saved homes")
        current_app.logger.info("🗑️ ===== HOME UNSAVE OPERATION COMPLETED SUCCESSFULLY =====")
        
        return jsonify({
            'success': True,
            'message': 'Home removed from favorites',
            'favorites': favorites
        })
        
    except Exception as e:
        current_app.logger.error("🗑️ ===== HOME UNSAVE OPERATION FAILED =====")
        current_app.logger.error(f"❌ Failed to remove favorite home: {e}")
        current_app.logger.error(f"❌ Exception type: {type(e).__name__}")
        current_app.logger.error(f"❌ Exception details: {str(e)}")
        import traceback
        current_app.logger.error(f"❌ Stack trace: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': 'Server error'}), 500
