from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.user import User
from ..models.subscription import Subscription
from .. import db

user_bp = Blueprint('user', __name__, url_prefix='/api/v1/user')

@user_bp.route('/report-usage', methods=['GET'])
@jwt_required()
def get_report_usage():
    """Get the current user's report usage and limit"""
    current_user_id = get_jwt_identity()
    
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({
            'success': False,
            'error': 'USER_NOT_FOUND',
            'message': 'User not found'
        }), 404
    
    # Default values if no subscription
    reports_used = user.reports_available
    reports_limit = 0  # Default to 0 if no subscription
    
    # If user has a subscription, use that for the limit
    if hasattr(user, 'subscription') and user.subscription:
        reports_limit = user.subscription.reports_limit
    
    return jsonify({
        'success': True,
        'data': {
            'reports_used': reports_used,
            'reports_limit': reports_limit
        }
    })
