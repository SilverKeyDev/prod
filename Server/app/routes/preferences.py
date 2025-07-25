from flask import Blueprint, request, jsonify, current_app
from app.models.user import User
from app.models.user_preferences import UserPreferences
from app import db
from jose import jwt
import json
import logging
import os
import requests

logger = logging.getLogger(__name__)
preferences_bp = Blueprint('preferences', __name__)

# JWT Configuration
COGNITO_REGION = os.getenv('COGNITO_REGION', 'us-east-1')
COGNITO_USER_POOL_ID = os.getenv('COGNITO_USER_POOL_ID')
COGNITO_CLIENT_ID = os.getenv('COGNITO_CLIENT_ID')

# Fetch JWKS
JWKS_URL = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
JWKS = requests.get(JWKS_URL).json()

def get_current_user():
    auth_header = request.headers.get('Authorization', None)
    if not auth_header:
        raise Exception("Authorization header missing")
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        current_app.logger.info("Decoding JWT with 30-second leeway for expiration.")
        claims = jwt.decode(
            token,
            JWKS,
            algorithms=["RS256"],
            audience=COGNITO_CLIENT_ID,
            options={
                "leeway": 30
            }
        )
        user = User.query.filter_by(cognito_id=claims['sub']).first()
        if not user:
            current_app.logger.warning(f"User not found for cognito_id: {claims['sub']}")
            raise Exception("User not found or not properly registered")
        return user
    except Exception as e:
        current_app.logger.error(f"Token validation failed: {str(e)}")
        raise

@preferences_bp.route('/api/v1/preferences', methods=['POST'])
def create_or_update_preferences():
    try:
        # Get current user from JWT token
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Unauthorized', 'success': False}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Check if user already has preferences
        existing_preferences = UserPreferences.query.filter_by(user_id=user.id).first()
        
        if existing_preferences:
            # Update existing preferences
            preferences = existing_preferences
        else:
            # Create new preferences
            preferences = UserPreferences(user_id=user.id)
            db.session.add(preferences)
        
        # Update all provided fields
        for field, value in data.items():
            if hasattr(preferences, field):
                # Handle JSON fields (arrays and objects)
                if field in ['children_ages', 'preferred_home_features', 'preferred_regions', 
                           'hobbies_interests', 'dining_preferences', 'fitness_activities',
                           'property_features_priority', 'deal_breakers', 'content_feedback_log',
                           'agent_interaction_history', 'personality_insights', 'quote_bubbles',
                           'deal_makers', 'concerns_or_fears', 'solo_reports_addresses',
                           'group_reports_addresses', 'chat_sessions', 'data_sources']:
                    if isinstance(value, (list, dict)):
                        setattr(preferences, field, json.dumps(value))
                    else:
                        setattr(preferences, field, value)
                else:
                    setattr(preferences, field, value)
        
        # Update user's has_preferences flag
        user.has_preferences = True
        
        db.session.commit()
        
        current_app.logger.info(f"User preferences {'updated' if existing_preferences else 'created'} for user {user.id}")
        
        return jsonify({
            'success': True,
            'message': 'Preferences saved successfully',
            'preferences': preferences.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error saving user preferences: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to save preferences'}), 500

@preferences_bp.route('/api/v1/preferences', methods=['GET'])
def get_preferences():
    try:
        # Get current user from JWT token
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Unauthorized', 'success': False}), 401
        
        preferences = UserPreferences.query.filter_by(user_id=user.id).first()
        
        if not preferences:
            return jsonify({
                'success': True,
                'preferences': None,
                'has_preferences': False
            })
        
        return jsonify({
            'success': True,
            'preferences': preferences.to_dict(),
            'has_preferences': True
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting user preferences: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get preferences'}), 500
