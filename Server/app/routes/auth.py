from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, make_response, redirect, session
import os
import jwt
import traceback
from .. import db
from ..models.user import User
from ..services.auth import AWS_COGNITO_service
from ..services.minimal_token import minimal_token_service
from ..services.google_oauth_service import google_oauth_service

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

    result = AWS_COGNITO_service.sign_up(
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
        now = datetime.utcnow()
        user = User(
            id=result['user_sub'],
            cognito_id=result['user_sub'],
            email=data['email'],
            name=data['name'],
            phone=data.get('phone'),
            created_at=now,
            updated_at=now,
            last_logged_in=now,
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
    import time
    start_time = time.time()
    request_id = f"verify_{int(time.time() * 1000)}_{os.urandom(4).hex()}"
    
    data = request.get_json()
    
    # Log only critical verification attempts
    current_app.logger.info(f"AUTH_VERIFY_START", extra={
        'request_id': request_id,
        'email': data.get('email')[:3] + '***' + data.get('email')[-3:] if data and data.get('email') else 'missing'
    })
    

    if not all(field in data for field in ['email', 'code', 'password']):
        current_app.logger.warning(f"❌ AUTH_VERIFY_MISSING_FIELDS", extra={
            'request_id': request_id,
            'has_email': 'email' in data if data else False,
            'has_code': 'code' in data if data else False,
            'has_password': 'password' in data if data else False
        })
        return jsonify({
            'success': False,
            'error': 'MISSING_FIELDS',
            'message': 'Email, verification code, and password are required'
        }), 400


    # First verify the email
    result = AWS_COGNITO_service.confirm_sign_up(
        username=data['email'],
        confirmation_code=data['code']
    )
    

    if not result['success']:
        current_app.logger.warning(f"❌ AUTH_VERIFY_COGNITO_CONFIRM_FAILED", extra={
            'request_id': request_id,
            'error': result.get('error'),
            'result_message': result.get('message'),
            'duration_ms': int((time.time() - start_time) * 1000)
        })
        return jsonify({
            'success': False,
            'error': result.get('error', 'VERIFICATION_FAILED'),
            'message': result.get('message', 'Failed to verify user')
        }), 400

    # After successful verification, automatically log the user in
    try:
        
        login_result = AWS_COGNITO_service.sign_in(
            username=data['email'],
            password=data['password']
        )
        

        if not login_result['success']:
            # Verification succeeded but login failed
            current_app.logger.warning(f"⚠️ AUTH_VERIFY_LOGIN_FAILED_AFTER_VERIFICATION", extra={
                'request_id': request_id,
                'email': data['email'][:3] + '***' + data['email'][-3:],
                'duration_ms': int((time.time() - start_time) * 1000)
            })
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

        # Get user data from database for minimal token creation
        try:
            from ..models.user import User
            user = User.query.filter_by(cognito_id=user_sub).first()
            if not user:
                # Fallback: try to find by email
                user = User.query.filter_by(email=data['email']).first()
                if user:
                    # Link cognito_id to existing user
                    user.cognito_id = user_sub
            # Update last_logged_in timestamp
            if user:
                user.last_logged_in = datetime.utcnow()
                db.session.commit()
        except Exception as db_error:
            current_app.logger.error(f'Error during user lookup in verification: {str(db_error)}')
            user = None
        
        # Create minimal tokens instead of using large Cognito tokens
        try:
            
            # Generate minimal access token
            minimal_access_token = minimal_token_service.create_minimal_access_token(
                user_id=str(user.id) if user else user_sub,
                user_email=data['email'],
                expires_in_hours=8
            )
            
            
            # Generate minimal ID token
            minimal_id_token = minimal_token_service.create_minimal_id_token(
                user_id=str(user.id) if user else user_sub,
                user_email=data['email'],
                user_name=user.name if user else 'Unknown User',
                expires_in_hours=8
            )
            
            
            # Log token size comparison
            AWS_COGNITO_access_size = len(login_result['tokens']['AccessToken'].encode('utf-8'))
            cognito_id_size = len(login_result['tokens']['IdToken'].encode('utf-8'))
            minimal_access_size = len(minimal_access_token.encode('utf-8'))
            minimal_id_size = len(minimal_id_token.encode('utf-8'))
            
            
        except Exception as token_error:
            current_app.logger.error(f"🔧 VERIFICATION_MINIMAL_TOKEN_ERROR", extra={
                'request_id': request_id,
                'user_id': str(user.id) if user else user_sub,
                'error': str(token_error),
                'error_type': type(token_error).__name__,
                'traceback': traceback.format_exc()[:500]
            })
            # Fallback to Cognito tokens if minimal token creation fails
            minimal_access_token = login_result['tokens']['AccessToken']
            minimal_id_token = login_result['tokens']['IdToken']
        
        # Create response with minimal tokens
        response_data = {
            'success': True,
            'message': 'Email verified and logged in successfully',
            'user': {
                'email': data['email'],
                'user_sub': user_sub,
                'name': user.name if user else 'Unknown User',
                'id': user.id if user else None
            }
        }
        
        # Create response object
        resp = make_response(response_data)
        
        
        # Set secure HttpOnly cookies with minimal tokens
        # Use host-only cookies (no domain) and Path=/ for proper scope
        resp.set_cookie(
            "session", 
            value=minimal_access_token,
            httponly=True, 
            secure=os.getenv('FLASK_ENV') == 'production',
            samesite="Lax", 
            path="/",  # Explicit path for all routes
            max_age=60*60*8  # 8 hours
        )
        
        resp.set_cookie(
            "refresh_token",
            value=login_result['tokens']['RefreshToken'],
            httponly=True,
            secure=os.getenv('FLASK_ENV') == 'production',
            samesite="Lax",
            path="/",  # Explicit path for all routes
            max_age=60*60*24*30  # 30 days
        )
        
        
        # Include minimal ID token in response body instead of cookie
        response_data['id_token'] = minimal_id_token
        
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.info(f"AUTH_VERIFY_SUCCESS", extra={
            'request_id': request_id,
            'email': data['email'][:3] + '***' + data['email'][-3:],
            'duration_ms': duration_ms
        })
        
        return resp

    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.error(f'❌ AUTH_VERIFY_EXCEPTION', extra={
            'request_id': request_id,
            'error': str(e),
            'error_type': type(e).__name__,
            'duration_ms': duration_ms,
            'traceback': traceback.format_exc()[:500]
        })
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
        response = AWS_COGNITO_service.client.resend_confirmation_code(
            ClientId=os.getenv('AWS_COGNITO_CLIENT_ID'),
            SecretHash=AWS_COGNITO_service._get_secret_hash(data['email']),
            Username=data['email']
        )

        return jsonify({
            'success': True,
            'message': 'Verification code has been resent to your email',
            'code_delivery': response.get('CodeDeliveryDetails', {})
        })

    except AWS_COGNITO_service.client.exceptions.UserNotFoundException:
        return jsonify({
            'success': False,
            'error': 'USER_NOT_FOUND',
            'message': 'No user found with this email'
        }), 404

    except AWS_COGNITO_service.client.exceptions.InvalidParameterException as e:
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
    import time
    import random
    from datetime import datetime
    
    request_id = f"login_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
    start_time = time.time()
    
    try:
        data = request.get_json()

        if not data or not all(field in data for field in ['email', 'password']):
            duration_ms = int((time.time() - start_time) * 1000)
            current_app.logger.error(f"AUTH_LOGIN_MISSING_FIELDS", extra={
                'request_id': request_id,
                'missing_fields': [field for field in ['email', 'password'] if field not in (data or {})],
                'provided_fields': list(data.keys()) if data else [],
                'duration_ms': duration_ms
            })
            return jsonify({
                'success': False,
                'error': 'MISSING_FIELDS',
                'message': 'Email and password are required'
            }), 400

        result = AWS_COGNITO_service.sign_in(
            username=data['email'],
            password=data['password']
        )
        

        try:
            success_value = result['success']

        except Exception as key_error:
            current_app.logger.error(f"AUTH_LOGIN_SUCCESS_KEY_ERROR", extra={
                'request_id': request_id,
                'error': str(key_error),
                'result_keys': list(result.keys()) if isinstance(result, dict) else 'not_dict'
            })
            return jsonify({
                'success': False,
                'error': 'INVALID_RESPONSE',
                'message': 'Invalid response from authentication service'
            }), 500


        if not success_value:
            # Check if user needs verification
            if result.get('needs_verification') or result.get('error') == 'UserNotConfirmedException':
                # Automatically send verification code
                try:
                    resend_response = AWS_COGNITO_service.client.resend_confirmation_code(
                        ClientId=os.getenv('AWS_COGNITO_CLIENT_ID'),
                        SecretHash=AWS_COGNITO_service._get_secret_hash(data['email']),
                        Username=data['email']
                    )
                    current_app.logger.info(f"AUTH_LOGIN_UNVERIFIED_CODE_SENT", extra={
                        'request_id': request_id,
                        'email': data['email'][:3] + '***' + data['email'][-3:]
                    })
                    return jsonify({
                        'success': False,
                        'error': 'USER_NOT_VERIFIED',
                        'message': 'Please verify your email address. A verification code has been sent to your email.',
                        'needs_verification': True,
                        'code_delivery': resend_response.get('CodeDeliveryDetails', {})
                    }), 401
                except Exception as resend_error:
                    current_app.logger.error(f"AUTH_LOGIN_RESEND_CODE_ERROR", extra={
                        'request_id': request_id,
                        'error': str(resend_error)
                    })
                    # Still return needs_verification even if resend fails
                    return jsonify({
                        'success': False,
                        'error': 'USER_NOT_VERIFIED',
                        'message': 'Please verify your email address to continue.',
                        'needs_verification': True
                    }), 401
            
            duration_ms = int((time.time() - start_time) * 1000)
            error_message = 'Invalid email or password'
            if result.get('error') == 'NotAuthorizedException':
                error_message = 'Incorrect email or password. Please try again.'
            
            current_app.logger.warning(f"AUTH_LOGIN_FAILED", extra={
                'request_id': request_id,
                'duration_ms': duration_ms
            })
            
            return jsonify({
                'success': False,
                'error': result.get('error', 'AUTHENTICATION_FAILED'),
                'message': result.get('message', error_message)
            }), 401


        
        try:
            id_token = result['tokens']['IdToken']
            decoded_id_token = jwt.decode(id_token, options={"verify_signature": False})
            user_sub = decoded_id_token['sub']
            
        except Exception as token_error:
            duration_ms = int((time.time() - start_time) * 1000)
            current_app.logger.error(f"AUTH_LOGIN_TOKEN_DECODE_ERROR", extra={
                'request_id': request_id,
                'error': str(token_error),
                'duration_ms': duration_ms
            })
            return jsonify({
                'success': False,
                'error': 'TOKEN_DECODE_ERROR',
                'message': 'Failed to process authentication token'
            }), 500

        
        try:
            from ..models.user import User
            user = User.query.filter_by(cognito_id=user_sub).first()
            if not user:
                # Fallback: try to find by email
                user = User.query.filter_by(email=data['email']).first()
                if user:
                    # Link cognito_id to existing user
                    user.cognito_id = user_sub
            
            # Update last_logged_in timestamp
            if user:
                user.last_logged_in = datetime.utcnow()
                db.session.commit()


        except Exception as db_error:
            duration_ms = int((time.time() - start_time) * 1000)
            current_app.logger.error(f"AUTH_LOGIN_DB_ERROR", extra={
                'request_id': request_id,
                'error': str(db_error),
                'duration_ms': duration_ms
            })
            # Continue with login even if DB lookup fails
            user = None


        try:
            # Generate minimal access token
            minimal_access_token = minimal_token_service.create_minimal_access_token(
                user_id=str(user.id) if user else user_sub,
                user_email=data['email'],
                expires_in_hours=8
            )

            
            # Generate minimal ID token
            minimal_id_token = minimal_token_service.create_minimal_id_token(
                user_id=str(user.id) if user else user_sub,
                user_email=data['email'],
                user_name=user.name if user else 'Unknown User',
                expires_in_hours=8
            )


            
        except Exception as token_error:

            # Fallback to Cognito tokens if minimal token creation fails
            minimal_access_token = result['tokens']['AccessToken']
            minimal_id_token = result['tokens']['IdToken']

        
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
        
        # Set secure HttpOnly cookies with minimal tokens
        # Use host-only cookies (no domain) and Path=/ for proper scope
        try:
            
            resp.set_cookie(
                "session", 
                value=minimal_access_token,
                httponly=True, 
                secure=os.getenv('FLASK_ENV') == 'production',  # Only secure in production
                samesite="Lax", 
                path="/",  # Explicit path for all routes
                max_age=60*60*8  # 8 hours
            )
            
            # Set refresh token cookie (longer expiry) - keep Cognito refresh token for now
            resp.set_cookie(
                "refresh_token",
                value=result['tokens']['RefreshToken'],
                httponly=True,
                secure=os.getenv('FLASK_ENV') == 'production',
                samesite="Lax",
                path="/",  # Explicit path for all routes
                max_age=60*60*24*30  # 30 days
            )

        except Exception as cookie_error:
            current_app.logger.error(f"❌ AUTH_LOGIN_COOKIE_ERROR", extra={
                'request_id': request_id,
                'error': str(cookie_error),
                'error_type': type(cookie_error).__name__
            })
            # Continue even if cookie setting fails
        
        # Include minimal ID token in response body instead of cookie
        response_data['id_token'] = minimal_id_token
        
        duration_ms = int((time.time() - start_time) * 1000)

        return resp

    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.error(f"AUTH_LOGIN_EXCEPTION", extra={
            'request_id': request_id,
            'error_type': type(e).__name__,
            'error_message': str(e),
            'duration_ms': duration_ms,
            'timestamp': datetime.utcnow().isoformat()
        })
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
    
    result = AWS_COGNITO_service.forgot_password(data['email'])
    
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
    
    result = AWS_COGNITO_service.confirm_forgot_password(
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
        # Use same path as login to ensure proper clearing
        resp.set_cookie(
            "session",
            value="",
            httponly=True,
            secure=os.getenv('FLASK_ENV') == 'production',
            samesite="Lax",
            path="/",  # Match login path
            max_age=0  # Expire immediately
        )
        
        resp.set_cookie(
            "refresh_token",
            value="",
            httponly=True,
            secure=os.getenv('FLASK_ENV') == 'production',
            samesite="Lax",
            path="/",  # Match login path
            max_age=0  # Expire immediately
        )
        
        # No need to clear id_token cookie since we don't set it anymore
        
        return resp
        
    except Exception as e:
        current_app.logger.error(f'Error during logout: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'LOGOUT_FAILED',
            'message': 'Failed to logout user'
        }), 500

@auth_bp.route('/google/start', methods=['GET'])
def google_oauth_start():
    """Start Google OAuth flow for authentication"""
    import time
    request_id = f"google_oauth_{int(time.time() * 1000)}_{os.urandom(4).hex()}"
    
    try:
        current_app.logger.info(f"GOOGLE_OAUTH_START", extra={
            'request_id': request_id
        })
        
        # Generate auth URL and state
        auth_url, state = google_oauth_service.build_auth_url()
        session['google_oauth_state'] = state
        
        
        return redirect(auth_url)
        
    except Exception as e:
        current_app.logger.error(f"GOOGLE_OAUTH_START_ERROR", extra={
            'request_id': request_id,
            'error': str(e),
            'traceback': traceback.format_exc()[:500]
        })
        return jsonify({
            'success': False,
            'error': 'GOOGLE_OAUTH_FAILED',
            'message': 'Failed to initiate Google OAuth'
        }), 500

@auth_bp.route('/google/callback', methods=['GET'])
def google_oauth_callback():
    """Handle Google OAuth callback and sign in/sign up user"""
    import time
    import uuid as uuid_lib
    request_id = f"google_callback_{int(time.time() * 1000)}_{os.urandom(4).hex()}"
    
    try:
        current_app.logger.info(f"GOOGLE_OAUTH_CALLBACK", extra={
            'request_id': request_id,
            'has_code': bool(request.args.get('code')),
            'has_error': bool(request.args.get('error'))
        })
        
        # Check for OAuth errors
        error = request.args.get('error')
        if error:
            current_app.logger.warning(f"GOOGLE_OAUTH_ERROR", extra={
                'request_id': request_id,
                'error': error
            })
            # Redirect to frontend with error
            from app.config import Config
            return redirect(f"{Config.FRONTEND_URL}/login?error=google_oauth_failed")
        
        # Get and validate state
        state = request.args.get('state')
        session_state = session.get('google_oauth_state')
        
        if not google_oauth_service.validate_state(state, session_state):
            current_app.logger.warning(f"GOOGLE_OAUTH_INVALID_STATE", extra={
                'request_id': request_id,
                'has_session_state': bool(session_state)
            })
            from app.config import Config
            return redirect(f"{Config.FRONTEND_URL}/login?error=invalid_state")
        
        # Exchange code for tokens
        code = request.args.get('code')
        tokens = google_oauth_service.exchange_code_for_tokens(code)
        
        # Get user info from Google
        user_info = google_oauth_service.get_user_info(tokens['access_token'])
        
        current_app.logger.info(f"GOOGLE_USERINFO_RECEIVED", extra={
            'request_id': request_id,
            'email': user_info.get('email', '')[:3] + '***',
            'verified': user_info.get('verified_email'),
            'has_name': bool(user_info.get('name'))
        })
        
        # Check if email is verified
        if not user_info.get('verified_email'):
            current_app.logger.warning(f"GOOGLE_EMAIL_NOT_VERIFIED", extra={
                'request_id': request_id,
                'email': user_info.get('email', '')[:3] + '***'
            })
            from app.config import Config
            return redirect(f"{Config.FRONTEND_URL}/login?error=email_not_verified")
        
        google_id = user_info['id']
        email = user_info['email']
        # Ensure name is not empty - use email prefix as fallback
        name = user_info.get('name', '').strip() if user_info.get('name') else email.split('@')[0]
        if not name or not name.strip():
            name = email.split('@')[0] if email and '@' in email else "User"

        # Track if this is a new signup to determine redirect destination
        is_new_signup = False
        
        # Check if user exists by google_id or email
        user = User.query.filter_by(google_id=google_id).first()
        
        if not user:
            # Check if user exists with same email (from Cognito signup)
            user = User.query.filter_by(email=email).first()
            
            if user:
                # Link Google account to existing user
                user.google_id = google_id
                user.updated_at = datetime.utcnow()
                user.last_logged_in = datetime.utcnow()
                db.session.commit()
                
                current_app.logger.info(f"GOOGLE_ACCOUNT_LINKED", extra={
                    'request_id': request_id,
                    'user_id': user.id,
                    'email': email[:3] + '***'
                })
            else:
                # Create new user
                now = datetime.utcnow()
                user = User(
                    id=str(uuid_lib.uuid4()),
                    google_id=google_id,
                    email=email,
                    name=name,
                    created_at=now,
                    updated_at=now,
                    last_logged_in=now,
                    is_active=True
                )
                db.session.add(user)
                db.session.commit()
                
                is_new_signup = True
                
                current_app.logger.info(f"GOOGLE_USER_CREATED", extra={
                    'request_id': request_id,
                    'user_id': user.id,
                    'email': email[:3] + '***'
                })
        else:
            # User exists, update last_logged_in
            user.last_logged_in = datetime.utcnow()
            db.session.commit()
        
        # Create minimal tokens for session
        try:

            
            # Generate minimal access token
            minimal_access_token = minimal_token_service.create_minimal_access_token(
                user_id=str(user.id),
                user_email=email,
                expires_in_hours=8
            )

            
            # Generate minimal ID token
            # Use email prefix as fallback if name is missing, with additional fallbacks
            user_name = user.name if user.name and user.name.strip() else email.split('@')[0]
            
            # Additional fallback: if email prefix is empty, use a default
            if not user_name or not user_name.strip():
                user_name = "User"
            
            # Ensure user_name is not None and not empty
            user_name = user_name.strip() if user_name else "User"

            
            # ID token creation - optional (don't block cookie issuance)
            minimal_id_token = None
            try:
                minimal_id_token = minimal_token_service.create_minimal_id_token(
                    user_id=str(user.id),
                    user_email=email,
                    user_name=user_name,
                    expires_in_hours=8
                )

            except Exception as id_token_error:
                # Log info (not warning/error) - ID token is optional, access token is sufficient
                current_app.logger.error(f"🔧 GOOGLE_ID_TOKEN_OPTIONAL_MISSING", extra={
                    'request_id': request_id,
                    'user_id': str(user.id),
                    'user_email': email[:3] + '***',
                    'user_name': user_name[:10] + '***' if user_name else 'missing',
                    'user_name_length': len(user_name) if user_name else 0,
                    'error': str(id_token_error),
                    'error_type': type(id_token_error).__name__,
                    'note': 'ID token creation skipped - access token is sufficient for authentication'
                })
                # Continue without ID token - access token is sufficient
            

        except Exception as token_error:
            current_app.logger.error(f"🔧 GOOGLE_TOKEN_CREATION_ERROR", extra={
                'request_id': request_id,
                'user_id': str(user.id) if user else 'unknown',
                'error': str(token_error),
                'error_type': type(token_error).__name__,
                'traceback': traceback.format_exc()[:500]
            })
            from app.config import Config
            return redirect(f"{Config.FRONTEND_URL}/login?error=token_creation_failed")
        
        # Determine redirect destination based on whether this is a new signup
        # New Google signups should go to onboarding, existing users to dashboard
        from app.config import Config
        redirect_path = "/onboarding" if is_new_signup else "/dashboard"
        
        current_app.logger.info(f"GOOGLE_AUTH_REDIRECT", extra={
            'request_id': request_id,
            'user_id': str(user.id),
            'is_new_signup': is_new_signup,
            'redirect_to': redirect_path
        })
        
        # Create redirect response FIRST, then attach cookies to it
        resp = redirect(f"{Config.FRONTEND_URL}{redirect_path}?google=success")
        
        # Small delay to ensure token has time to "age" before immediate verification
        import time
        time.sleep(0.1)  # 100ms delay

        
        # Set cookies on the redirect response (GOOD pattern)
        try:
            # Session cookie - consistent with login route
            resp.set_cookie(
                "session",
                value=minimal_access_token,
                httponly=True,
                secure=os.getenv('FLASK_ENV') == 'production',  # Only secure in production
                samesite="Lax",
                path="/",  # Explicit path for all routes
                max_age=60*60*8  # 8 hours
            )

            
        except Exception as session_cookie_error:
            current_app.logger.error(f"🔧 GOOGLE_SESSION_COOKIE_ERROR", extra={
                'request_id': request_id,
                'user_id': str(user.id),
                'error': str(session_cookie_error),
                'error_type': type(session_cookie_error).__name__
            })
        
        # Refresh token cookie - consistent with login route
        try:
            resp.set_cookie(
                "refresh_token",
                value=tokens.get('refresh_token', minimal_access_token),  # Use Google refresh token if available
                httponly=True,
                secure=os.getenv('FLASK_ENV') == 'production',
                samesite="Lax",
                path="/",  # Explicit path for all routes
                max_age=60*60*24*30  # 30 days (match Cognito)
            )
            

            
        except Exception as refresh_cookie_error:
            current_app.logger.error(f"🔧 GOOGLE_REFRESH_COOKIE_ERROR", extra={
                'request_id': request_id,
                'user_id': str(user.id),
                'error': str(refresh_cookie_error),
                'error_type': type(refresh_cookie_error).__name__
            })

        return resp
        
    except Exception as e:
        current_app.logger.error(f"GOOGLE_OAUTH_CALLBACK_ERROR", extra={
            'request_id': request_id,
            'error': str(e),
            'error_type': type(e).__name__,
            'traceback': traceback.format_exc()[:500]
        })
        from app.config import Config
        return redirect(f"{Config.FRONTEND_URL}/login?error=google_oauth_failed")
