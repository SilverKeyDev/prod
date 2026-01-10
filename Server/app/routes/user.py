from flask import Blueprint, request, jsonify, current_app
import json
from jose.exceptions import ExpiredSignatureError, JWTError
from ..utils.common_patterns import require_authenticated_user, handle_exceptions_with_logging
from ..utils.security.security import security_error_response, SecurityError, rate_limit
from ..utils.security.secure_errors import SecureErrorHandler
from ..utils.address_format import safe_normalize_address
from ..utils.common_patterns import safe_json_loads
from .. import db

user_bp = Blueprint('user', __name__, url_prefix='/api/v1/user')


@user_bp.route('/profile', methods=['GET'])
@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_user_profile(user):
    """Get the current user's profile information"""
    user_data = user.to_dict()
    return jsonify({
        'success': True,
        'data': user_data
    })


@user_bp.route('/closing-mode', methods=['PUT'])
@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def update_closing_mode(user):
    """Update the user's closing mode status"""
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


def _parse_checklist(raw_value):
    """Helper to safely parse a stored checklist string back to Python list."""
    if not raw_value:
        return []
    # Try JSON parsing first
    parsed = safe_json_loads(raw_value, default=None)
    if parsed is not None:
        return parsed if isinstance(parsed, list) else []
    # Fall back to comma-separated values
    return [item.strip() for item in raw_value.split(',') if item.strip()]

def _build_response(checklist):
    return jsonify({
        'success': True,
        'data': checklist
    })

# Removed _get_user() - use @require_authenticated_user decorator instead



@user_bp.route('/timeline', methods=['GET', 'PUT'])
@require_authenticated_user
def timeline_checklist(user):
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
@require_authenticated_user
def close_checklist(user):
    """Consolidated Close checklist endpoint - handles escrow, financing, closing, and insurance checklists."""
    
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
@require_authenticated_user
def favorite_homes(user):
    """Retrieve or replace the user's list of favorite home IDs.

    GET  – Returns a list of favorite home IDs (strings).
    POST – Expects a JSON array of strings and overwrites the user's list.
    """

    if request.method == 'GET':
        # Return liked homes and all listings for this user (only current ones)
        from ..models import HomeUniversal
        liked_homes = HomeUniversal.query.filter_by(user_id=str(user.id), is_liked=True, current=True).all()
        all_homes = HomeUniversal.query.filter_by(user_id=str(user.id), current=True).all()
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

        # Strategy: mark all existing current homes as not liked, then upsert input list as liked
        existing = HomeUniversal.query.filter_by(user_id=str(user.id), current=True).all()
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

        # Return updated list (only current ones)
        homes = HomeUniversal.query.filter_by(user_id=str(user.id), current=True).all()
        favorites = [home.to_dict() for home in homes]
        return jsonify({"success": True, "favorites": favorites})
    except Exception as e:
        current_app.logger.error(f"Failed to update favorite homes: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500


@user_bp.route('/favorite-homes/add', methods=['POST'])
@require_authenticated_user
def add_favorite_home(user):
    """Add a single home to the user's favorites list and store full home data in home_universal."""
    

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
        
        # Return all current HomeUniversal rows for this user
        homes = HomeUniversal.query.filter_by(user_id=str(user.id), current=True).all()
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
@require_authenticated_user
def remove_favorite_home(user):
    """Unlike a single home by setting is_liked to False without deleting the row."""
    
    
    try:
        data = request.get_json(force=True)
        
        address = data.get('address')
        
        if not address or not isinstance(address, str):
            return jsonify({'success': False, 'error': 'Address is required and must be a string'}), 400
        
        from ..models import HomeUniversal
        from ..utils.address_format import normalize_address
        from ..services.search.search_db import sync_to_home_likes
        
        # Find matching record using normalized address
        normalized_target = safe_normalize_address(address)

        existing_home = None
        # Check both current and non-current records when finding by address
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

        # Return all current HomeUniversal rows for this user
        homes = HomeUniversal.query.filter_by(user_id=str(user.id), current=True).all()
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


# === Not Interested Homes Endpoints ===
@user_bp.route('/not-interested-homes', methods=['GET'])
@require_authenticated_user
def not_interested_homes(user):
    """Retrieve the user's list of not-interested homes."""

    if request.method == 'GET':
        # Return not-interested homes for this user
        from ..models import HomeNotInterested
        not_interested_homes = HomeNotInterested.query.filter_by(user_id=str(user.id), is_not_interested=True).all()
        homes = [home.to_dict() for home in not_interested_homes]
        return jsonify({"success": True, "notInterested": homes})


@user_bp.route('/not-interested-homes/add', methods=['POST'])
@require_authenticated_user
def add_not_interested_home(user):
    """Mark a single home as not interested."""
    
    try:
        data = request.get_json(force=True)
        
        home = data.get('home')
        if not home or not isinstance(home, dict):
            return jsonify({'success': False, 'error': 'Home object is required'}), 400

        address = home.get('address')
        if not address or not isinstance(address, str):
            return jsonify({'success': False, 'error': 'Address is required and must be a string'}), 400

        from ..services.search.search_db import add_or_update_home_basic, sync_to_home_not_interested
        from ..models import HomeUniversal
        # Add or update the home in HomeUniversal first
        home_record = add_or_update_home_basic(user_id=str(user.id), home=home, set_liked=False)
        
        # Get optional why field
        why = data.get('why')
        if why and isinstance(why, str):
            why = why.strip()
            if not why:
                why = None
        else:
            why = None
        
        # Sync to HomeNotInterested with not_interested history
        sync_to_home_not_interested(home_record, action="not_interested", why=why)
        
        # Return all HomeNotInterested rows for this user
        from ..models import HomeNotInterested
        homes = HomeNotInterested.query.filter_by(user_id=str(user.id), is_not_interested=True).all()
        not_interested = [home.to_dict() for home in homes]
        
        return jsonify({
            'success': True,
            'message': 'Home marked as not interested',
            'notInterested': not_interested
        })

    except Exception as e:
        current_app.logger.error(f"Failed to add not-interested home: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500


@user_bp.route('/not-interested-homes/remove', methods=['POST'])
@require_authenticated_user
def remove_not_interested_home(user):
    """Undo not-interested status for a single home."""
    
    try:
        data = request.get_json(force=True)
        
        address = data.get('address')
        
        if not address or not isinstance(address, str):
            return jsonify({'success': False, 'error': 'Address is required and must be a string'}), 400
        
        from ..models import HomeNotInterested
        from ..utils.address_format import normalize_address
        from ..services.search.search_db import sync_to_home_not_interested
        from ..models import HomeUniversal
        
        # Find matching record using normalized address
        normalized_target = safe_normalize_address(address)

        existing_home = None
        for h in HomeNotInterested.query.filter_by(user_id=str(user.id)).all():
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
            return jsonify({'success': False, 'error': 'Home not found in not-interested list'}), 404

        # Find corresponding HomeUniversal record to sync undo action
        home_universal = None
        for h in HomeUniversal.query.filter_by(user_id=str(user.id)).all():
            if not h.address:
                continue
            try:
                norm_existing = normalize_address(h.address)
            except Exception:
                norm_existing = h.address.strip().lower()
            if norm_existing == normalized_target:
                home_universal = h
                break

        # Mark as not not-interested (undo)
        existing_home.is_not_interested = False
        db.session.commit()
        
        # Sync undo action to history if HomeUniversal record exists
        if home_universal:
            sync_to_home_not_interested(home_universal, action="undo")

        # Return all HomeNotInterested rows for this user
        homes = HomeNotInterested.query.filter_by(user_id=str(user.id), is_not_interested=True).all()
        not_interested = [home.to_dict() for home in homes]

        return jsonify({
            'success': True,
            'message': 'Home removed from not-interested list',
            'notInterested': not_interested
        })
        
    except Exception as e:
        current_app.logger.error(f"Failed to remove not-interested home: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500


@user_bp.route('/not-interested-homes/update', methods=['POST'])
@require_authenticated_user
def update_not_interested_home(user):
    """Update the reason for a not-interested home."""
    
    try:
        data = request.get_json(force=True)
        
        address = data.get('address')
        if not address or not isinstance(address, str):
            return jsonify({'success': False, 'error': 'Address is required and must be a string'}), 400
        
        why = data.get('why')
        if not why or not isinstance(why, str):
            return jsonify({'success': False, 'error': 'Why is required and must be a string'}), 400
        
        why = why.strip()
        if not why:
            return jsonify({'success': False, 'error': 'Why cannot be empty'}), 400
        
        from ..models import HomeNotInterested
        from ..utils.address_format import normalize_address
        
        # Find matching record using normalized address
        normalized_target = safe_normalize_address(address)

        existing_home = None
        for h in HomeNotInterested.query.filter_by(user_id=str(user.id)).all():
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
            return jsonify({'success': False, 'error': 'Home not found in not-interested list'}), 404

        # Update why field
        existing_home.why = why
        
        # Add timestamp entry to not_interested_history for the reason update
        from datetime import datetime
        if existing_home.not_interested_history is None:
            existing_home.not_interested_history = []
        
        # Find the most recent "not_interested" entry and update it with why, or add new entry
        updated = False
        for entry in reversed(existing_home.not_interested_history):
            if entry.get('action') == 'not_interested':
                entry['why'] = why
                updated = True
                break
        
        if not updated:
            # Add new entry if no not_interested entry found
            timestamp_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "action": "not_interested",
                "why": why
            }
            existing_home.not_interested_history.append(timestamp_entry)
        
        db.session.commit()
        
        # Return all HomeNotInterested rows for this user
        homes = HomeNotInterested.query.filter_by(user_id=str(user.id), is_not_interested=True).all()
        not_interested = [home.to_dict() for home in homes]
        
        return jsonify({
            'success': True,
            'message': 'Not-interested reason updated',
            'notInterested': not_interested
        })
        
    except Exception as e:
        current_app.logger.error(f"Failed to update not-interested home: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500
