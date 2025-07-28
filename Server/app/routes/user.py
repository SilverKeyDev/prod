from flask import Blueprint, jsonify, request, current_app
from datetime import datetime
import jwt
import requests
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
        current_app.logger.debug(f"User profile data being sent: {user_data}")
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
        
        # Get report usage
        reports_available = user.reports_available
        
        # Calculate reports used safely
        reports_limit = subscription.reports_limit if subscription else 0
        reports_used = max(0, reports_limit - reports_available) if reports_limit is not None else 0
        
        return jsonify({
            'success': True,
            'data': {
                'subscription': subscription_data,
                'usage': {
                    'reports_available': reports_available,
                    'reports_used': reports_used,
                    'reports_limit': reports_limit
                },
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

# Keep the old endpoint for backward compatibility
@user_bp.route('/report-usage', methods=['GET'])
def get_report_usage():
    """Get the current user's report usage and limit"""
    try:
        user = get_current_user()
        
        subscription = Subscription.query.filter_by(user_id=user.id).first()
        reports_available = user.reports_available
        reports_limit = subscription.reports_limit if subscription else 0
        reports_used = max(0, reports_limit - reports_available) if reports_limit is not None else 0
        
        return jsonify({
            'success': True,
            'data': {
                'reports_available': reports_available,
                'reports_used': reports_used,
                'reports_limit': reports_limit
            }
        })
    except Exception as e:
        current_app.logger.error(f'Error getting report usage: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'SERVER_ERROR',
            'message': 'Failed to retrieve report usage'
        }), 500