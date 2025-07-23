from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token
import os
import jwt
from .. import db
from ..models.user import User
from ..services.auth import cognito_service

# Blueprint setup
auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user"""
    data = request.get_json()

    required_fields = ['email', 'password', 'name']
    if not all(field in data for field in required_fields):
        return jsonify({
            'success': False,
            'error': 'MISSING_FIELDS',
            'message': 'Missing required fields'
        }), 400

    user_attributes = [
        {'Name': 'email', 'Value': data['email']},
        {'Name': 'name', 'Value': data['name']}
    ]

    if 'phone' in data:
        user_attributes.append({'Name': 'phone_number', 'Value': data['phone']})

    result = cognito_service.sign_up(
        username=data['email'],
        password=data['password'],
        user_attributes=user_attributes
    )

    if not result['success']:
        return jsonify({
            'success': False,
            'error': result.get('error', 'SIGNUP_FAILED'),
            'message': result.get('message', 'Failed to register user')
        }), 400

    try:
        # Create user in our database
        user = User(
            id=result['user_sub'],
            cognito_id=result['user_sub'],
            email=data['email'],
            name=data['name'],
            phone=data.get('phone'),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            is_active=True
        )
        db.session.add(user)
        db.session.commit()
        
        current_app.logger.info(f'Successfully created user in database: {user.id}')
        
    except Exception as e:
        current_app.logger.error(f'Error creating user in database: {str(e)}')
        # Don't fail the signup if database creation fails, just log it
        # The user can complete signup but might need to contact support

    return jsonify({
        'success': True,
        'message': 'User registered successfully. Please check your email for verification code.',
        'user_sub': result['user_sub']
    }), 201

@auth_bp.route('/verify', methods=['POST'])
def verify():
    """Verify user's email with code"""
    data = request.get_json()

    if not all(field in data for field in ['email', 'code']):
        return jsonify({
            'success': False,
            'error': 'MISSING_FIELDS',
            'message': 'Email and verification code are required'
        }), 400

    result = cognito_service.confirm_sign_up(
        username=data['email'],
        confirmation_code=data['code']
    )

    if not result['success']:
        return jsonify({
            'success': False,
            'error': result.get('error', 'VERIFICATION_FAILED'),
            'message': result.get('message', 'Failed to verify user')
        }), 400

    return jsonify({
        'success': True,
        'message': 'Email verified successfully. You can now log in.'
    })

@auth_bp.route('/resend-code', methods=['POST'])
def resend_code():
    """Resend verification code to user's email"""
    data = request.get_json()

    if 'email' not in data:
        return jsonify({
            'success': False,
            'error': 'MISSING_EMAIL',
            'message': 'Email is required to resend verification code'
        }), 400

    try:
        response = cognito_service.client.resend_confirmation_code(
            ClientId=os.getenv('COGNITO_CLIENT_ID'),
            SecretHash=cognito_service._get_secret_hash(data['email']),
            Username=data['email']
        )

        return jsonify({
            'success': True,
            'message': 'Verification code has been resent to your email',
            'code_delivery': response.get('CodeDeliveryDetails', {})
        })

    except cognito_service.client.exceptions.UserNotFoundException:
        return jsonify({
            'success': False,
            'error': 'USER_NOT_FOUND',
            'message': 'No user found with this email'
        }), 404

    except cognito_service.client.exceptions.InvalidParameterException as e:
        return jsonify({
            'success': False,
            'error': 'INVALID_PARAMETER',
            'message': str(e)
        }), 400

    except Exception as e:
        current_app.logger.error(f'Error resending verification code: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'RESEND_CODE_FAILED',
            'message': 'Failed to resend verification code. Please try again.'
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return Cognito JWT tokens directly"""
    data = request.get_json()

    
    if not data or not all(field in data for field in ['email', 'password']):
        current_app.logger.error(f"Missing required fields in login request: {data}")
        return jsonify({
            'success': False,
            'error': 'MISSING_FIELDS',
            'message': 'Email and password are required'
        }), 400

    try:
        result = cognito_service.sign_in(
            username=data['email'],
            password=data['password']
        )

        if not result['success']:
            error_message = 'Invalid email or password'
            if result.get('error') == 'NotAuthorizedException':
                error_message = 'Incorrect email or password. Please try again.'
            
            return jsonify({
                'success': False,
                'error': result.get('error', 'AUTHENTICATION_FAILED'),
                'message': result.get('message', error_message)
            }), 401

        # decode IdToken to get Cognito user_sub
        id_token = result['tokens']['IdToken']
        import jwt  # local decode only for sub
        decoded_id_token = jwt.decode(id_token, options={"verify_signature": False})
        user_sub = decoded_id_token['sub']

        return jsonify({
            'success': True,
            'access_token': result['tokens']['AccessToken'],
            'id_token': result['tokens']['IdToken'],
            'refresh_token': result['tokens']['RefreshToken'],
            'user': {
                'email': data['email'],
                'user_sub': user_sub
            }
        })

    except Exception as e:
        current_app.logger.error(f'Error logging in: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'LOGIN_FAILED',
            'message': 'Failed to authenticate user'
        }), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Initiate forgot password flow"""
    data = request.get_json()
    
    if 'email' not in data:
        return jsonify({
            'success': False,
            'error': 'MISSING_EMAIL',
            'message': 'Email is required'
        }), 400
    
    result = cognito_service.forgot_password(data['email'])
    
    if not result['success']:
        return jsonify({
            'success': False,
            'error': result.get('error', 'FORGOT_PASSWORD_FAILED'),
            'message': result.get('message', 'Failed to initiate password reset')
        }), 400
    
    return jsonify({
        'success': True,
        'message': 'Password reset code sent to your email',
        'code_delivery': result.get('code_delivery')
    })

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Confirm forgot password with code and set new password"""
    data = request.get_json()
    
    required_fields = ['email', 'code', 'new_password']
    if not all(field in data for field in required_fields):
        return jsonify({
            'success': False,
            'error': 'MISSING_FIELDS',
            'message': 'Email, code, and new password are required'
        }), 400
    
    result = cognito_service.confirm_forgot_password(
        username=data['email'],
        confirmation_code=data['code'],
        new_password=data['new_password']
    )
    
    if not result['success']:
        return jsonify({
            'success': False,
            'error': result.get('error', 'RESET_PASSWORD_FAILED'),
            'message': result.get('message', 'Failed to reset password')
        }), 400
    
    return jsonify({
        'success': True,
        'message': 'Password reset successfully'
    })
