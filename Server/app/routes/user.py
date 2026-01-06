from flask import Blueprint, request, jsonify, current_app
import json
from jose.exceptions import ExpiredSignatureError, JWTError
from ..services.auth.current_user import get_current_user, SecurityException
from ..utils.security.security import security_error_response, SecurityError, rate_limit
from ..utils.security.secure_errors import SecureErrorHandler
from ..utils.address_format import normalize_address
from .. import db

user_bp = Blueprint('user', __name__, url_prefix='/api/v1/user')


@user_bp.route('/profile', methods=['GET'])
@rate_limit(max_requests=200, window_seconds=60)
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
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'get_user_profile',
            'user_id': 'unknown'
        })


@user_bp.route('/closing-mode', methods=['PUT'])
@rate_limit(max_requests=100, window_seconds=60)
def update_closing_mode():
    """Update the user's closing mode status"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)

        data = request.get_json(force=True)
        if 'is_closing_mode' not in data:
            return jsonify({'success': False, 'error': 'is_closing_mode is required'}), 400
        
        is_closing_mode = data.get('is_closing_mode')
        if not isinstance(is_closing_mode, bool):
            return jsonify({'success': False, 'error': 'is_closing_mode must be a boolean'}), 400

        user.is_closing_mode = is_closing_mode
        db.session.commit()

        return jsonify({
            'success': True,
            'data': {
                'is_closing_mode': user.is_closing_mode
            }
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'update_closing_mode',
            'user_id': 'unknown'
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



@user_bp.route('/close', methods=['GET', 'PUT'])
def close_checklist():
    """Consolidated Close checklist endpoint - handles escrow, financing, closing, and insurance checklists."""
    user = _get_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    # Get checklist type from query parameter
    checklist_type = request.args.get('type', 'escrow')  # Default to escrow for backward compatibility
    
    if request.method == 'GET':
        # Return the appropriate checklist based on type
        checklist_data = None
        if checklist_type == 'escrow':
            checklist_data = user.escrow_checklist
        elif checklist_type == 'financing':
            checklist_data = user.financing_checklist
        elif checklist_type == 'closing':
            checklist_data = user.closing_checklist
        elif checklist_type == 'insurance':
            checklist_data = user.insurance_checklist
        else:
            return jsonify({'success': False, 'error': 'Invalid checklist type'}), 400
        
        checklist = _parse_checklist(checklist_data)
        return _build_response(checklist)
    
    # PUT - update
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({'success': False, 'error': 'Expected JSON array'}), 400
        
        # Update the appropriate checklist based on type
        if checklist_type == 'escrow':
            user.escrow_checklist = json.dumps(data)
        elif checklist_type == 'financing':
            user.financing_checklist = json.dumps(data)
        elif checklist_type == 'closing':
            user.closing_checklist = json.dumps(data)
        elif checklist_type == 'insurance':
            user.insurance_checklist = json.dumps(data)
        else:
            return jsonify({'success': False, 'error': 'Invalid checklist type'}), 400
        
        from app import db
        db.session.commit()
        return _build_response(data)
    except Exception as e:
        current_app.logger.error(f"Failed to update {checklist_type} checklist: {e}")
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
        # Return liked homes and all listings for this user
        from ..models import HomeUniversal
        liked_homes = HomeUniversal.query.filter_by(user_id=str(user.id), is_liked=True).all()
        all_homes = HomeUniversal.query.filter_by(user_id=str(user.id)).all()
        favorites = [home.to_dict() for home in liked_homes]
        listings = [home.to_dict() for home in all_homes]
        return jsonify({"success": True, "favorites": favorites, "listings": listings})

    # POST – replace list (set provided homes as liked)
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({'success': False, 'error': 'Expected JSON array'}), 400
        
        from ..models import HomeUniversal
        from ..services.search.search_db import add_or_update_home_basic, sync_to_home_likes

        # Strategy: mark all existing as not liked, then upsert input list as liked
        existing = HomeUniversal.query.filter_by(user_id=str(user.id)).all()
        for h in existing:
            was_liked = h.is_liked
            h.is_liked = False
            # Sync to HomeLikes with unlike history if it was previously liked
            if was_liked:
                sync_to_home_likes(h, action="unliked")

        existing_by_norm = {}
        for h in existing:
            if h.address:
                try:
                    existing_by_norm[normalize_address(h.address)] = h
                except Exception:
                    existing_by_norm[h.address.strip().lower()] = h

        for home in data:
            try:
                add_or_update_home_basic(user_id=str(user.id), home=home, set_liked=True)
            except Exception as e:
                current_app.logger.warning(f"[FAVORITES] Skipped invalid home during bulk like: {e}")

        db.session.commit()

        # Return updated list
        homes = HomeUniversal.query.filter_by(user_id=str(user.id)).all()
        favorites = [home.to_dict() for home in homes]
        return jsonify({"success": True, "favorites": favorites})
    except Exception as e:
        current_app.logger.error(f"Failed to update favorite homes: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500


@user_bp.route('/favorite-homes/add', methods=['POST'])
def add_favorite_home():
    """Add a single home to the user's favorites list and store full home data in home_universal."""

    user = _get_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    

    try:
        data = request.get_json(force=True)
        
        home = data.get('home')
        if not home or not isinstance(home, dict):
            return jsonify({'success': False, 'error': 'Home object is required'}), 400

        address = home.get('address')
        if not address or not isinstance(address, str):
            return jsonify({'success': False, 'error': 'Address is required and must be a string'}), 400

        from ..services.search.search_db import add_or_update_home_basic
        from ..models import HomeUniversal
        add_or_update_home_basic(user_id=str(user.id), home=home, set_liked=True)
        
        # Return all HomeUniversal rows for this user
        homes = HomeUniversal.query.filter_by(user_id=str(user.id)).all()
        favorites = [home.to_dict() for home in homes]
        
        return jsonify({
            'success': True,
            'message': 'Home added to favorites',
            'favorites': favorites
        })

    except Exception as e:
        current_app.logger.error(f"Failed to add favorite home: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500


@user_bp.route('/favorite-homes/remove', methods=['POST'])
def remove_favorite_home():
    """Unlike a single home by setting is_liked to False without deleting the row."""
    user = _get_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    
    try:
        data = request.get_json(force=True)
        
        address = data.get('address')
        
        if not address or not isinstance(address, str):
            return jsonify({'success': False, 'error': 'Address is required and must be a string'}), 400
        
        from ..models import HomeUniversal
        from ..utils.address_format import normalize_address
        from ..services.search.search_db import sync_to_home_likes
        
        # Find matching record using normalized address
        normalized_target = None
        try:
            normalized_target = normalize_address(address)
        except Exception:
            normalized_target = address.strip().lower()

        existing_home = None
        for h in HomeUniversal.query.filter_by(user_id=str(user.id)).all():
            if not h.address:
                continue
            try:
                norm_existing = normalize_address(h.address)
            except Exception:
                norm_existing = h.address.strip().lower()
            if norm_existing == normalized_target:
                existing_home = h
                break

        if not existing_home:
            return jsonify({'success': False, 'error': 'Home not found in favorites'}), 404

        # Mark as unliked, do not delete
        existing_home.is_liked = False
        db.session.commit()
        
        # Sync to HomeLikes with unlike history
        sync_to_home_likes(existing_home, action="unliked")

        # Return all HomeUniversal rows for this user
        homes = HomeUniversal.query.filter_by(user_id=str(user.id)).all()
        favorites = [home.to_dict() for home in homes]

        return jsonify({
            'success': True,
            'message': 'Home unliked',
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
