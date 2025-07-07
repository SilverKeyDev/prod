from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from app.services.stripe_service import create_checkout_session, create_portal_session, get_subscription_status
from app.models.user import User
from app.models.subscription import Subscription
from app import db

bp = Blueprint('payment', __name__, url_prefix='/api/payment')

# CORS settings for all routes
cors_config = {
    'origins': [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://10.91.128.151:5173",
        "https://silverkeyestates.com"
    ],
    'supports_credentials': True
}

@bp.route('/subscription-status', methods=['GET'])
@jwt_required()
@cross_origin(**cors_config)
def get_subscription():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        subscription = Subscription.query.filter_by(user_id=user_id).first()
        
        if not subscription or not subscription.stripe_subscription_id:
            return jsonify({
                'hasSubscription': False,
                'status': 'inactive'
            })
            
        # Get the latest subscription status from Stripe
        status = get_subscription_status(subscription.stripe_subscription_id)
        
        return jsonify({
            'hasSubscription': True,
            'status': status,
            'planId': subscription.plan_id,
            'currentPeriodEnd': subscription.current_period_end.isoformat() if subscription.current_period_end else None
        })
        
    except Exception as e:
        current_app.logger.error(f'Error getting subscription status: {str(e)}')
        return jsonify({'error': 'Failed to get subscription status'}), 500

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
