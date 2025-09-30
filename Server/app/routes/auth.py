from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, make_response
import os
import jwt
from .. import db
from ..models.user import User
from ..services.auth import AWS_COGNITO_service
from ..services.minimal_token import minimal_token_service

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
    result = AWS_COGNITO_service.confirm_sign_up(
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
        login_result = AWS_COGNITO_service.sign_in(
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
            
            current_app.logger.info(f"VERIFICATION_TOKEN_SIZE_COMPARISON", extra={
                'AWS_COGNITO_access_size_bytes': AWS_COGNITO_access_size,
                'cognito_id_size_bytes': cognito_id_size,
                'minimal_access_size_bytes': minimal_access_size,
                'minimal_id_size_bytes': minimal_id_size,
                'access_token_size_reduction_percent': round(((AWS_COGNITO_access_size - minimal_access_size) / AWS_COGNITO_access_size) * 100, 2),
                'id_token_size_reduction_percent': round(((cognito_id_size - minimal_id_size) / cognito_id_size) * 100, 2),
                'total_size_reduction_bytes': (AWS_COGNITO_access_size + cognito_id_size) - (minimal_access_size + minimal_id_size)
            })
            
        except Exception as token_error:
            current_app.logger.error(f"VERIFICATION_MINIMAL_TOKEN_ERROR", extra={
                'error': str(token_error)
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
        
        # Log detailed request information BEFORE setting cookies
        current_app.logger.info(f"🔵 AUTH_VERIFY_SETTING_COOKIES", extra={
            'request_origin': request.headers.get('Origin'),
            'request_host': request.headers.get('Host'),
            'request_referer': request.headers.get('Referer'),
            'flask_env': os.getenv('FLASK_ENV', 'development'),
            'secure_flag': os.getenv('FLASK_ENV') == 'production',
            'session_token_length': len(minimal_access_token),
            'refresh_token_length': len(login_result['tokens']['RefreshToken'])
        })
        
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
        
        # Log cookie headers that will be sent
        current_app.logger.info(f"✅ AUTH_VERIFY_COOKIES_SET", extra={
            'session_cookie_set': True,
            'refresh_cookie_set': True,
            'secure_cookies': os.getenv('FLASK_ENV') == 'production',
            'cookie_config': {
                'httponly': True,
                'secure': os.getenv('FLASK_ENV') == 'production',
                'samesite': 'Lax',
                'path': '/',
                'domain': 'none (host-only)',
                'session_max_age': '8h',
                'refresh_max_age': '30d'
            },
            'set_cookie_headers': [h for h in resp.headers.getlist('Set-Cookie')]
        })
        
        # Include minimal ID token in response body instead of cookie
        response_data['id_token'] = minimal_id_token
        
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
    
    # Log request details
    current_app.logger.info(f"AUTH_LOGIN_REQUEST_START", extra={
        'request_id': request_id,
        'method': request.method,
        'endpoint': request.endpoint,
        'remote_addr': request.remote_addr,
        'user_agent': request.headers.get('User-Agent', 'unknown'),
        'content_type': request.content_type,
        'content_length': request.content_length,
        'has_json': request.is_json,
        'timestamp': datetime.utcnow().isoformat()
    })
    
    try:
        data = request.get_json()
        
        # Log request data (sanitized)
        if data:
            current_app.logger.info(f"AUTH_LOGIN_REQUEST_DATA", extra={
                'request_id': request_id,
                'has_email': 'email' in data,
                'email_preview': data.get('email', '')[:3] + '***' + data.get('email', '')[-3:] if data.get('email') else 'missing',
                'has_password': 'password' in data,
                'password_length': len(data.get('password', '')) if data.get('password') else 0,
                'data_keys': list(data.keys()) if data else []
            })
        else:
            current_app.logger.warning(f"AUTH_LOGIN_NO_JSON_DATA", extra={
                'request_id': request_id,
                'content_type': request.content_type,
                'raw_data': str(request.get_data())[:200] if request.get_data() else 'empty'
            })

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

        # Call Cognito service
        current_app.logger.info(f"AUTH_LOGIN_PHASE_START", extra={
            'request_id': request_id,
            'email': data['email'][:3] + '***' + data['email'][-3:] if data['email'] else 'missing'
        })
        
        current_app.logger.info(f"AUTH_LOGIN_PHASE_AWS_COGNITO_CALL", extra={
            'request_id': request_id,
            'username': data['email'][:3] + '***' + data['email'][-3:] if data['email'] else 'missing'
        })
        
        result = AWS_COGNITO_service.sign_in(
            username=data['email'],
            password=data['password']
        )
        
        current_app.logger.info(f"AUTH_LOGIN_PHASE_AWS_COGNITO_RESULT", extra={
            'request_id': request_id,
            'success': result.get('success', False),
            'error': result.get('error', 'none'),
            'login_failed': result.get('login_failed', False)
        })

        current_app.logger.info(f"AUTH_LOGIN_CHECKING_SUCCESS", extra={
            'request_id': request_id,
            'result_success': result.get('success', 'missing'),
            'result_type': type(result.get('success', 'missing')).__name__
        })

        try:
            success_value = result['success']
            current_app.logger.info(f"AUTH_LOGIN_SUCCESS_VALUE", extra={
                'request_id': request_id,
                'success_value': success_value,
                'success_type': type(success_value).__name__
            })
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

        current_app.logger.info(f"AUTH_LOGIN_EVALUATING_SUCCESS", extra={
            'request_id': request_id,
            'success_value': success_value,
            'not_success_value': not success_value
        })

        if not success_value:
            current_app.logger.info(f"AUTH_LOGIN_ENTERING_FAILURE_BRANCH", extra={
                'request_id': request_id
            })
            
            try:
                duration_ms = int((time.time() - start_time) * 1000)
                current_app.logger.info(f"AUTH_LOGIN_DURATION_CALCULATED", extra={
                    'request_id': request_id,
                    'duration_ms': duration_ms
                })
            except Exception as duration_error:
                current_app.logger.error(f"AUTH_LOGIN_DURATION_ERROR", extra={
                    'request_id': request_id,
                    'error': str(duration_error)
                })
                duration_ms = 0
            
            try:
                error_message = 'Invalid email or password'
                if result.get('error') == 'NotAuthorizedException':
                    error_message = 'Incorrect email or password. Please try again.'
                current_app.logger.info(f"AUTH_LOGIN_ERROR_MESSAGE_SET", extra={
                    'request_id': request_id,
                    'error_message': error_message
                })
            except Exception as error_msg_error:
                current_app.logger.error(f"AUTH_LOGIN_ERROR_MESSAGE_ERROR", extra={
                    'request_id': request_id,
                    'error': str(error_msg_error)
                })
                error_message = 'Authentication failed'
            
            # Simple logging to avoid any serialization issues
            current_app.logger.warning(f"AUTH_LOGIN_AWS_COGNITO_FAILED - request_id: {request_id}, duration_ms: {duration_ms}")
            current_app.logger.info(f"AUTH_LOGIN_AWS_COGNITO_FAILED_LOGGED - request_id: {request_id}")
            
            current_app.logger.info(f"AUTH_LOGIN_RETURNING_401 - request_id: {request_id}")
            
            return jsonify({
                'success': False,
                'error': result.get('error', 'AUTHENTICATION_FAILED'),
                'message': result.get('message', error_message)
            }), 401

        # Log successful Cognito authentication
        current_app.logger.info(f"AUTH_LOGIN_AWS_COGNITO_SUCCESS", extra={
            'request_id': request_id,
            'has_access_token': 'AccessToken' in result['tokens'],
            'has_id_token': 'IdToken' in result['tokens'],
            'has_refresh_token': 'RefreshToken' in result['tokens'],
            'token_type': result['tokens'].get('TokenType', 'unknown'),
            'expires_in': result['tokens'].get('ExpiresIn', 'unknown')
        })

        # Decode IdToken to get Cognito user_sub
        current_app.logger.info(f"AUTH_LOGIN_PHASE_TOKEN_DECODE", extra={
            'request_id': request_id
        })
        
        try:
            id_token = result['tokens']['IdToken']
            decoded_id_token = jwt.decode(id_token, options={"verify_signature": False})
            user_sub = decoded_id_token['sub']
            
            current_app.logger.info(f"AUTH_LOGIN_TOKEN_DECODED", extra={
                'request_id': request_id,
                'user_sub': user_sub[:10] + '***' if user_sub else 'missing',
                'token_issuer': decoded_id_token.get('iss', 'unknown'),
                'token_audience': decoded_id_token.get('aud', 'unknown'),
                'token_exp': decoded_id_token.get('exp', 'unknown')
            })
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

        # Get user data from database
        current_app.logger.info(f"AUTH_LOGIN_PHASE_USER_LOOKUP", extra={
            'request_id': request_id
        })
        
        try:
            from ..models.user import User
            user = User.query.filter_by(cognito_id=user_sub).first()
            if not user:
                # Fallback: try to find by email
                user = User.query.filter_by(email=data['email']).first()
                if user:
                    # Link cognito_id to existing user
                    user.cognito_id = user_sub
                    db.session.commit()
                    current_app.logger.info(f"AUTH_LOGIN_USER_LINKED", extra={
                        'request_id': request_id,
                        'user_id': user.id,
                        'email': data['email'][:3] + '***' + data['email'][-3:]
                    })
            
            current_app.logger.info(f"AUTH_LOGIN_USER_LOOKUP", extra={
                'request_id': request_id,
                'user_found': user is not None,
                'user_id': user.id if user else None,
                'user_name': user.name if user else 'Unknown User'
            })
        except Exception as db_error:
            duration_ms = int((time.time() - start_time) * 1000)
            current_app.logger.error(f"AUTH_LOGIN_DB_ERROR", extra={
                'request_id': request_id,
                'error': str(db_error),
                'duration_ms': duration_ms
            })
            # Continue with login even if DB lookup fails
            user = None

        # Create minimal tokens instead of using large Cognito tokens
        current_app.logger.info(f"AUTH_LOGIN_PHASE_MINIMAL_TOKEN_CREATION", extra={
            'request_id': request_id
        })
        
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
            AWS_COGNITO_access_size = len(result['tokens']['AccessToken'].encode('utf-8'))
            cognito_id_size = len(result['tokens']['IdToken'].encode('utf-8'))
            minimal_access_size = len(minimal_access_token.encode('utf-8'))
            minimal_id_size = len(minimal_id_token.encode('utf-8'))
            
            current_app.logger.info(f"AUTH_LOGIN_TOKEN_SIZE_COMPARISON", extra={
                'request_id': request_id,
                'AWS_COGNITO_access_size_bytes': AWS_COGNITO_access_size,
                'cognito_id_size_bytes': cognito_id_size,
                'minimal_access_size_bytes': minimal_access_size,
                'minimal_id_size_bytes': minimal_id_size,
                'access_token_size_reduction_percent': round(((AWS_COGNITO_access_size - minimal_access_size) / AWS_COGNITO_access_size) * 100, 2),
                'id_token_size_reduction_percent': round(((cognito_id_size - minimal_id_size) / cognito_id_size) * 100, 2),
                'total_size_reduction_bytes': (AWS_COGNITO_access_size + cognito_id_size) - (minimal_access_size + minimal_id_size)
            })
            
        except Exception as token_error:
            current_app.logger.error(f"AUTH_LOGIN_MINIMAL_TOKEN_ERROR", extra={
                'request_id': request_id,
                'error': str(token_error)
            })
            # Fallback to Cognito tokens if minimal token creation fails
            minimal_access_token = result['tokens']['AccessToken']
            minimal_id_token = result['tokens']['IdToken']
        
        # Create response with minimal tokens
        current_app.logger.info(f"AUTH_LOGIN_PHASE_RESPONSE_CREATION", extra={
            'request_id': request_id
        })
        
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
            # Log detailed request information BEFORE setting cookies
            current_app.logger.info(f"🔵 AUTH_LOGIN_SETTING_COOKIES", extra={
                'request_id': request_id,
                'request_origin': request.headers.get('Origin'),
                'request_host': request.headers.get('Host'),
                'request_referer': request.headers.get('Referer'),
                'flask_env': os.getenv('FLASK_ENV', 'development'),
                'secure_flag': os.getenv('FLASK_ENV') == 'production',
                'session_token_length': len(minimal_access_token),
                'refresh_token_length': len(result['tokens']['RefreshToken'])
            })
            
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
            
            # Log cookie headers that will be sent
            current_app.logger.info(f"✅ AUTH_LOGIN_COOKIES_SET", extra={
                'request_id': request_id,
                'session_cookie_set': True,
                'refresh_cookie_set': True,
                'secure_cookies': os.getenv('FLASK_ENV') == 'production',
                'using_minimal_tokens': True,
                'cookie_config': {
                    'httponly': True,
                    'secure': os.getenv('FLASK_ENV') == 'production',
                    'samesite': 'Lax',
                    'path': '/',
                    'domain': 'none (host-only)',
                    'session_max_age': '8h',
                    'refresh_max_age': '30d'
                },
                'set_cookie_headers': [h for h in resp.headers.getlist('Set-Cookie')]
            })
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
        current_app.logger.info(f"AUTH_LOGIN_SUCCESS", extra={
            'request_id': request_id,
            'user_email': data['email'][:3] + '***' + data['email'][-3:],
            'user_sub': user_sub[:10] + '***' if user_sub else 'missing',
            'duration_ms': duration_ms,
            'timestamp': datetime.utcnow().isoformat()
        })
        
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
