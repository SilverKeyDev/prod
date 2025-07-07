from flask import Blueprint, request, jsonify, current_app
from flask_cors import cross_origin
from jose import jwt
import requests
import os
import stripe

# Import db from the main app package to ensure we're using the same instance
from app import db
from app.models.user import User
from app.models.subscription import Subscription

# Import services
from app.services.stripe_service import (
    create_checkout_session, 
    create_portal_session, 
    get_subscription_status,
    handle_checkout_session,
    handle_successful_payment,
    handle_subscription_updated,
    handle_subscription_cancelled
)

bp = Blueprint('payment', __name__, url_prefix='/api/v1/payment')

# CORS settings
cors_config = {
    'origins': [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://10.91.128.151:5173",
        "https://silverkeyestates.com"
    ],
    'supports_credentials': True
}

COGNITO_REGION = os.getenv("S3_REGION", "us-east-2")
COGNITO_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")

if not COGNITO_POOL_ID or not COGNITO_CLIENT_ID:
    raise RuntimeError("COGNITO_POOL_ID and COGNITO_CLIENT_ID must be set in environment variables.")

COGNITO_KEYS_URL = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_POOL_ID}/.well-known/jwks.json"


# cache the JWKS
JWKS = requests.get(COGNITO_KEYS_URL).json()

def get_current_user():
    auth_header = request.headers.get('Authorization', None)
    if not auth_header:
        raise Exception("Authorization header missing")
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        claims = jwt.decode(
            token,
            JWKS,
            algorithms=["RS256"],
            audience=COGNITO_CLIENT_ID
        )
        # claims['sub'] is the Cognito user UUID
        user = User.query.filter_by(cognito_id=claims['sub']).first()
        if not user:
            current_app.logger.warning(f"User not found for cognito_id: {claims['sub']}")
            raise Exception("User not found or not properly registered")
        return user
    except Exception as e:
        current_app.logger.error(f"Token validation failed: {str(e)}")
        raise

# ------------------------

@bp.route('/subscription-status', methods=['GET'])
@cross_origin(**cors_config)
def get_subscription():
    try:
        user = get_current_user()
        
        # Initialize default response
        response = {
            'has_subscription': False,
            'status': 'inactive',
            'reports_used': 0,
            'reports_limit': 0,
            'plan_id': None,
            'current_period_end': None,
            'is_trial': False
        }
        
        # Check if user has a subscription
        subscription = Subscription.query.filter_by(user_id=user.id).first()
        if not subscription:
            return jsonify(response)
            
        # Update response with subscription data
        response.update({
            'has_subscription': subscription.status in ['active', 'trialing'],
            'status': subscription.status,
            'reports_used': subscription.reports_used,
            'reports_limit': subscription.reports_limit,
            'plan_id': subscription.plan_id,
            'current_period_end': (
                subscription.current_period_end.isoformat() 
                if subscription.current_period_end else None
            ),
            'is_trial': subscription.status == 'trialing'
        })
        
        # If we have a Stripe subscription ID, get the latest status
        if subscription.stripe_subscription_id:
            try:
                stripe_status = get_subscription_status(subscription.stripe_subscription_id)
                if stripe_status:
                    response['status'] = stripe_status
                    response['has_subscription'] = stripe_status in ['active', 'trialing']
            except Exception as stripe_err:
                current_app.logger.error(f'Error fetching Stripe status: {str(stripe_err)}')
        
        return jsonify(response)
        
    except Exception as e:
        current_app.logger.error(f'Error in get_subscription: {str(e)}')
        return jsonify({
            'error': 'Failed to get subscription status',
            'details': str(e)
        }), 500

# ------------------------

@bp.route('/create-checkout-session', methods=['POST', 'OPTIONS'])
@cross_origin(**cors_config)
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
        
        user = get_current_user()
        
        session_result = create_checkout_session(price_id, user.email)
        return jsonify({
            'sessionId': session_result['session_id']
        })
    except Exception as e:
        current_app.logger.error(f'Error creating checkout session: {str(e)}')
        return jsonify({'error': 'Failed to create checkout session'}), 401

# ------------------------

@bp.route('/create-customer-portal', methods=['POST'])
@cross_origin(**cors_config)
def create_customer_portal():
    try:
        user = get_current_user()
        subscription = Subscription.query.filter_by(user_id=user.id).first()
        
        if not subscription or not subscription.stripe_customer_id:
            return jsonify({'error': 'No subscription found'}), 404
            
        session = create_portal_session(subscription.stripe_customer_id)
        return jsonify(session)
        
    except Exception as e:
        current_app.logger.error(f'Error creating customer portal: {str(e)}')
        return jsonify({'error': 'Failed to create customer portal'}), 500

# ------------------------

@bp.route('/webhook', methods=['POST'])
def webhook_received():
    # Get the webhook payload and signature header
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        # Verify the webhook signature and handle the event
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv('STRIPE_WEBHOOK_SECRET')
        )
        
        # Handle the event
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            handle_checkout_session(session)
        elif event['type'] == 'invoice.payment_succeeded':
            invoice = event['data']['object']
            handle_successful_payment(invoice)
        elif event['type'] == 'customer.subscription.updated':
            subscription = event['data']['object']
            handle_subscription_updated(subscription)
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            handle_subscription_cancelled(subscription)
            
        return jsonify({'status': 'success'})
        
    except ValueError as e:
        # Invalid payload
        current_app.logger.error(f'Invalid payload: {str(e)}')
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        current_app.logger.error(f'Invalid signature: {str(e)}')
        return jsonify({'error': 'Invalid signature'}), 400
    except Exception as e:
        current_app.logger.error(f'Error processing webhook: {str(e)}')
        return jsonify({'error': str(e)}), 500
