from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, make_response
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
    """Verify user's email with code and automatically log them in"""
    data = request.get_json()

    if not all(field in data for field in ['email', 'code', 'password']):
        return jsonify({
            'success': False,
            'error': 'MISSING_FIELDS',
            'message': 'Email, verification code, and password are required'
        }), 400

    # First verify the email
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

    # After successful verification, automatically log the user in
    try:
        login_result = cognito_service.sign_in(
            username=data['email'],
            password=data['password']
        )

        if not login_result['success']:
            # Verification succeeded but login failed
            return jsonify({
                'success': True,
                'message': 'Email verified successfully. Please log in manually.',
                'verification_complete': True,
                'login_failed': True
            })

        # Decode IdToken to get Cognito user_sub
        id_token = login_result['tokens']['IdToken']
        decoded_id_token = jwt.decode(id_token, options={"verify_signature": False})
        user_sub = decoded_id_token['sub']

        # Create response with HttpOnly cookies
        response_data = {
            'success': True,
            'message': 'Email verified and logged in successfully',
            'user': {
                'email': data['email'],
                'user_sub': user_sub
            }
        }
        
        # Create response object
        resp = make_response(response_data)
        
        # Set secure HttpOnly cookies
        resp.set_cookie(
            "session", 
            value=login_result['tokens']['AccessToken'],
            httponly=True, 
            secure=os.getenv('FLASK_ENV') == 'production',
            samesite="Lax", 
            max_age=60*60*8  # 8 hours
        )
        
        resp.set_cookie(
            "refresh_token",
            value=login_result['tokens']['RefreshToken'],
            httponly=True,
            secure=os.getenv('FLASK_ENV') == 'production',
            samesite="Lax",
            max_age=60*60*24*30  # 30 days
        )
        
        resp.set_cookie(
            "id_token",
            value=login_result['tokens']['IdToken'],
            httponly=True,
            secure=os.getenv('FLASK_ENV') == 'production',
            samesite="Lax",
            max_age=60*60*8  # 8 hours
        )
        
        return resp

    except Exception as e:
        current_app.logger.error(f'Error during auto-login after verification: {str(e)}')
        # Verification succeeded but auto-login failed
        return jsonify({
            'success': True,
            'message': 'Email verified successfully. Please log in manually.',
            'verification_complete': True,
            'auto_login_failed': True
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
        decoded_id_token = jwt.decode(id_token, options={"verify_signature": False})
        user_sub = decoded_id_token['sub']

        # Get user data from database to include name
        from ..models.user import User
        user = User.query.filter_by(cognito_id=user_sub).first()
        if not user:
            # Fallback: try to find by email
            user = User.query.filter_by(email=data['email']).first()
            if user:
                # Link cognito_id to existing user
                user.cognito_id = user_sub
                db.session.commit()

        # Create response with HttpOnly cookies
        response_data = {
            'success': True,
            'user': {
                'email': data['email'],
                'user_sub': user_sub,
                'name': user.name if user else 'Unknown User',
                'id': user.id if user else None
            }
        }
        
        # Create response object
        resp = make_response(response_data)
        
        # Set secure HttpOnly cookies
        resp.set_cookie(
            "session", 
            value=result['tokens']['AccessToken'],
            httponly=True, 
            secure=os.getenv('FLASK_ENV') == 'production',  # Only secure in production
            samesite="Lax", 
            max_age=60*60*8  # 8 hours
        )
        
        # Set refresh token cookie (longer expiry)
        resp.set_cookie(
            "refresh_token",
            value=result['tokens']['RefreshToken'],
            httponly=True,
            secure=os.getenv('FLASK_ENV') == 'production',
            samesite="Lax",
            max_age=60*60*24*30  # 30 days
        )
        
        # Set ID token cookie for client-side use (if needed)
        resp.set_cookie(
            "id_token",
            value=result['tokens']['IdToken'],
            httponly=True,
            secure=os.getenv('FLASK_ENV') == 'production',
            samesite="Lax",
            max_age=60*60*8  # 8 hours
        )
        
        return resp

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

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout user and clear HttpOnly cookies"""
    try:
        # Create response object
        resp = make_response({
            'success': True,
            'message': 'Logged out successfully'
        })
        
        # Clear all authentication cookies
        resp.set_cookie(
            "session",
            value="",
            httponly=True,
            secure=os.getenv('FLASK_ENV') == 'production',
            samesite="Lax",
            max_age=0  # Expire immediately
        )
        
        resp.set_cookie(
            "refresh_token",
            value="",
            httponly=True,
            secure=os.getenv('FLASK_ENV') == 'production',
            samesite="Lax",
            max_age=0  # Expire immediately
        )
        
        resp.set_cookie(
            "id_token",
            value="",
            httponly=True,
            secure=os.getenv('FLASK_ENV') == 'production',
            samesite="Lax",
            max_age=0  # Expire immediately
        )
        
        return resp
        
    except Exception as e:
        current_app.logger.error(f'Error during logout: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'LOGOUT_FAILED',
            'message': 'Failed to logout user'
        }), 500
