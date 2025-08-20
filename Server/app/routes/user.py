from flask import Blueprint, request, jsonify, current_app
import json
from datetime import datetime
from ..utils.auth import get_current_user
from ..utils.security import security_error_response, SecurityError, rate_limit
from ..utils.secure_errors import SecureErrorHandler
from ..models.subscription import Subscription
from .. import db

user_bp = Blueprint('user', __name__, url_prefix='/api/v1/user')


@user_bp.route('/profile', methods=['GET'])
@rate_limit(max_requests=100, window_seconds=60)
def get_user_profile():
    """Get the current user's profile information"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
            
        user_data = user.to_dict()
        return jsonify({
            'success': True,
            'data': user_data
        })
        
    except tuple as error_tuple:
        return security_error_response(error_tuple)
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'get_user_profile',
            'user_id': getattr(get_current_user(), 'id', 'unknown')
        })


@user_bp.route('/billing-info', methods=['GET'])
@rate_limit(max_requests=50, window_seconds=60)
def get_billing_info():
    """Get the current user's subscription and report usage information"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        
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
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'get_billing_info',
            'user_id': getattr(get_current_user(), 'id', 'unknown')
        })


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
    user = _get_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    if request.method == 'GET':
        checklist = _parse_checklist(user.insurance_checklist)
        return _build_response(checklist)
    # PUT update
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({'success': False, 'error': 'Expected JSON array'}), 400
        user.insurance_checklist = json.dumps(data)
        from app import db
        db.session.commit()
        return _build_response(data)
    except Exception as e:
        current_app.logger.error(f"Failed to update insurance checklist: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500

@user_bp.route('/closing', methods=['GET', 'PUT'])
def closing_checklist():
    """GET returns checklist, PUT updates it (expects JSON list)."""
    user = _get_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    if request.method == 'GET':
        checklist = _parse_checklist(user.closing_checklist)
        return _build_response(checklist)
    # PUT - update
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({'success': False, 'error': 'Expected JSON array'}), 400
        user.closing_checklist = json.dumps(data)
        from app import db
        db.session.commit()
        return _build_response(data)
    except Exception as e:
        current_app.logger.error(f"Failed to update closing checklist: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500

@user_bp.route('/timeline', methods=['GET', 'PUT'])
def timeline_checklist():
    user = _get_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    if request.method == 'GET':
        checklist = _parse_checklist(user.timeline_checklist)
        return _build_response(checklist)
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({'success': False, 'error': 'Expected JSON array'}), 400
        user.timeline_checklist = json.dumps(data)
        from app import db
        db.session.commit()
        return _build_response(data)
    except Exception as e:
        current_app.logger.error(f"Failed to update timeline checklist: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500

@user_bp.route('/financing', methods=['GET', 'PUT'])
def financing_checklist():
    user = _get_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    if request.method == 'GET':
        checklist = _parse_checklist(user.financing_checklist)
        return _build_response(checklist)
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({'success': False, 'error': 'Expected JSON array'}), 400
        user.financing_checklist = json.dumps(data)
        from app import db
        db.session.commit()
        return _build_response(data)
    except Exception as e:
        current_app.logger.error(f"Failed to update financing checklist: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500

@user_bp.route('/escrow', methods=['GET', 'PUT'])
def escrow_checklist():
    user = _get_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    if request.method == 'GET':
        checklist = _parse_checklist(user.escrow_checklist)
        return _build_response(checklist)
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({'success': False, 'error': 'Expected JSON array'}), 400
        user.escrow_checklist = json.dumps(data)
        from app import db
        db.session.commit()
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

    user = _get_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    if request.method == 'GET':
        # Return all HomeUniversal rows for this user
        from app.models.home_universal import HomeUniversal
        homes = HomeUniversal.query.filter_by(user_id=str(user.id)).all()
        favorites = [home.to_dict() for home in homes]
        return jsonify({"success": True, "favorites": favorites})

    # POST – update list
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({'success': False, 'error': 'Expected JSON array'}), 400
        
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
        return _build_response(data)
    except Exception as e:
        current_app.logger.error(f"Failed to update favorite homes: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500


@user_bp.route('/favorite-homes/add', methods=['POST'])
def add_favorite_home():
    """Add a single home to the user's favorites list and store full home data in home_universal."""

    user = _get_user()
    if not user:
        current_app.logger.warning("❌ Unauthorized attempt to save home - no valid user found")
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    

    try:
        data = request.get_json(force=True)
        
        home = data.get('home')
        if not home or not isinstance(home, dict):
            current_app.logger.error("❌ Invalid home object in request")
            return jsonify({'success': False, 'error': 'Home object is required'}), 400

        address = home.get('address')
        if not address or not isinstance(address, str):
            current_app.logger.error(f"❌ Invalid address in home object: {address}")
            return jsonify({'success': False, 'error': 'Address is required and must be a string'}), 400

        from app.models.home_universal import HomeUniversal
        home_universal = HomeUniversal.query.filter_by(user_id=str(user.id), address=address).first()
        if home_universal:
            current_app.logger.warning(f"⚠️ Home already exists in favorites: {address}")
            return jsonify({'success': False, 'error': 'Home is already in favorites'}), 400
        
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
        
        db.session.add(home_universal)
        db.session.commit()
        
        # Return all HomeUniversal rows for this user
        homes = HomeUniversal.query.filter_by(user_id=str(user.id)).all()
        favorites = [home.to_dict() for home in homes]
        
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
    user = _get_user()
    if not user:
        current_app.logger.warning("❌ Unauthorized attempt to remove home - no valid user found")
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    
    try:
        data = request.get_json(force=True)
        
        address = data.get('address')
        
        if not address or not isinstance(address, str):
            current_app.logger.error(f"❌ Invalid address in request: {address}")
            return jsonify({'success': False, 'error': 'Address is required and must be a string'}), 400
        
        
        # Remove HomeUniversal record for this user and address
        from app.models.home_universal import HomeUniversal
        
        # Check if home exists before attempting to delete
        existing_home = HomeUniversal.query.filter_by(user_id=str(user.id), address=address).first()
        if not existing_home:
            current_app.logger.warning(f"⚠️ Home not found in favorites: {address}")
            return jsonify({'success': False, 'error': 'Home not found in favorites'}), 404
        
        # Delete the home record
        db.session.delete(existing_home)
        db.session.commit()
        
        # Return all HomeUniversal rows for this user
        homes = HomeUniversal.query.filter_by(user_id=str(user.id)).all()
        favorites = [home.to_dict() for home in homes]
       
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
