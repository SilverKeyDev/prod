from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from app.services.stripe_service import create_checkout_session, create_portal_session
from app.models.user import User

bp = Blueprint('payment', __name__, url_prefix='/api/payment')

@bp.route('/create-checkout-session', methods=['POST', 'OPTIONS'])
@jwt_required()
@cross_origin(origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://10.91.128.151:5173",
    "https://silverkeyestates.com"
], supports_credentials=True)
def create_checkout():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        price_id = data.get('priceId')
        if not price_id:
            return jsonify({'error': 'Missing price ID'}), 400
            
        # Get current user's email
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Create checkout session
        session = create_checkout_session(price_id, user.email)
        return jsonify({
            'sessionId': session.id,
            'url': session.url
        })
        
    except Exception as e:
        current_app.logger.error(f'Error creating checkout session: {str(e)}')
        return jsonify({'error': 'Failed to create checkout session'}), 500

@bp.route('/create-portal-session', methods=['POST', 'OPTIONS'])
@jwt_required()
@cross_origin(origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://10.91.128.151:5173",
    "https://silverkeyestates.com"
], supports_credentials=True)
def create_customer_portal():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        # Get current user's Stripe customer ID
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.stripe_customer_id:
            return jsonify({'error': 'No subscription found'}), 400
            
        # Create portal session
        session = create_portal_session(user.stripe_customer_id)
        return jsonify({
            'url': session.url
        })
        
    except Exception as e:
        current_app.logger.error(f'Error creating portal session: {str(e)}')
        return jsonify({'error': 'Failed to create customer portal session'}), 500
