from flask import Blueprint, request, jsonify, current_app, make_response, redirect, session
import time
import traceback
import secrets
import string
from ...services.auth.core import AWS_COGNITO_service, google_oauth_service
from ...services.auth.utils import (
    generate_request_id,
    validate_required_fields,
    create_error_response,
    clear_auth_cookies,
    mask_email
)
from ...services.auth.flows import (
    handle_signup,
    handle_verification,
    handle_login,
    handle_google_oauth_callback,
    handle_resend_code,
    handle_refresh_token,
    ensure_cognito_account_for_user
)

# Blueprint setup
auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user"""
    data = request.get_json()

    is_valid, error_msg = validate_required_fields(data, ['email', 'password', 'name'])
    if not is_valid:
        error_response, status_code = create_error_response('MISSING_FIELDS', error_msg or 'Missing required fields')
        return jsonify(error_response), status_code

    response_data, status_code = handle_signup(data)
    return jsonify(response_data), status_code

@auth_bp.route('/verify', methods=['POST'])
def verify():
    """Verify user's email with code and automatically log them in"""
    request_id = generate_request_id('verify')
    data = request.get_json()
    
    # Log only critical verification attempts
    current_app.logger.info(f"AUTH_VERIFY_START", extra={
        'request_id': request_id,
        'email': mask_email(data.get('email')) if data and data.get('email') else 'missing'
    })
    
    is_valid, error_msg = validate_required_fields(data, ['email', 'code', 'password'])
    if not is_valid:
        current_app.logger.warning(f"❌ AUTH_VERIFY_MISSING_FIELDS", extra={
            'request_id': request_id,
            'has_email': 'email' in data if data else False,
            'has_code': 'code' in data if data else False,
            'has_password': 'password' in data if data else False
        })
        error_response, status_code = create_error_response('MISSING_FIELDS', 'Email, verification code, and password are required')
        return jsonify(error_response), status_code

    resp, status_code = handle_verification(data, request_id)
    return resp

@auth_bp.route('/resend-code', methods=['POST'])
def resend_code():
    """Resend verification code to user's email"""
    data = request.get_json()

    is_valid, error_msg = validate_required_fields(data, ['email'])
    if not is_valid:
        error_response, status_code = create_error_response('MISSING_EMAIL', 'Email is required to resend verification code')
        return jsonify(error_response), status_code

    response_data, status_code = handle_resend_code(data)
    return jsonify(response_data), status_code

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return Cognito JWT tokens directly"""
    request_id = generate_request_id('login')
    
    try:
        data = request.get_json()

        is_valid, error_msg = validate_required_fields(data, ['email', 'password'])
        if not is_valid:
            current_app.logger.error(f"AUTH_LOGIN_MISSING_FIELDS", extra={
                'request_id': request_id,
                'missing_fields': [field for field in ['email', 'password'] if field not in (data or {})],
                'provided_fields': list(data.keys()) if data else []
            })
            error_response, status_code = create_error_response('MISSING_FIELDS', 'Email and password are required')
            return jsonify(error_response), status_code

        resp, status_code = handle_login(data, request_id)
        return resp

    except Exception as e:
        current_app.logger.error(f"AUTH_LOGIN_EXCEPTION", extra={
            'request_id': request_id,
            'error_type': type(e).__name__,
            'error_message': str(e),
            'traceback': traceback.format_exc()[:500]
        })
        error_response, status_code = create_error_response('LOGIN_FAILED', 'Failed to authenticate user')
        return jsonify(error_response), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Initiate forgot password flow"""
    request_id = generate_request_id('forgot_password')
    data = request.get_json()
    
    is_valid, error_msg = validate_required_fields(data, ['email'])
    if not is_valid:
        error_response, status_code = create_error_response('MISSING_EMAIL', 'Email is required')
        return jsonify(error_response), status_code
    
    email = data['email']
    masked_email = mask_email(email)
    
    current_app.logger.info(f"FORGOT_PASSWORD_START", extra={
        'request_id': request_id,
        'email': masked_email
    })
    
    # Ensure user has Cognito account (creates one for Google OAuth users)
    cognito_id, error, was_just_created = ensure_cognito_account_for_user(email)
    if error:
        current_app.logger.warning(f"FORGOT_PASSWORD_COGNITO_ACCOUNT_ERROR", extra={
            'request_id': request_id,
            'email': masked_email,
            'error': error
        })
        
        # Determine appropriate error code and status
        if 'not found' in error.lower():
            error_code = 'USER_NOT_FOUND'
            status_code = 404
        else:
            error_code = 'COGNITO_ACCOUNT_CREATION_FAILED'
            status_code = 500
        
        error_response, status_code = create_error_response(error_code, error)
        return jsonify(error_response), status_code
    
    current_app.logger.info(f"FORGOT_PASSWORD_COGNITO_ACCOUNT_ENSURED: was_just_created={was_just_created}", extra={
        'request_id': request_id,
        'email': masked_email,
        'cognito_id': cognito_id[:8] + '...' if cognito_id else None,
        'was_just_created': was_just_created
    })
    
    # Check user status before proceeding (for debugging and validation)
    # This is optional and non-blocking - if it fails due to permissions, we continue
    user_status_result = {'success': False, 'user_status': 'UNKNOWN', 'email_verified': None}
    try:
        user_status_result = AWS_COGNITO_service.admin_get_user_status(email)
        if user_status_result['success']:
            current_app.logger.info(f"FORGOT_PASSWORD_USER_STATUS_CHECK: status={user_status_result.get('user_status')}, email_verified={user_status_result.get('email_verified')}", extra={
                'request_id': request_id,
                'email': masked_email,
                'user_status': user_status_result.get('user_status'),
                'email_verified': user_status_result.get('email_verified'),
                'has_email': bool(user_status_result.get('email'))
            })
            
            # Warn if email is not verified (this could prevent email delivery)
            if not user_status_result.get('email_verified', False):
                current_app.logger.warning(f"FORGOT_PASSWORD_EMAIL_NOT_VERIFIED", extra={
                    'request_id': request_id,
                    'email': masked_email,
                    'user_status': user_status_result.get('user_status'),
                    'warning': 'Email may not be verified in Cognito, which could prevent email delivery'
                })
        else:
            current_app.logger.warning(f"FORGOT_PASSWORD_STATUS_CHECK_FAILED", extra={
                'request_id': request_id,
                'email': masked_email,
                'error': user_status_result.get('error'),
                'error_message': user_status_result.get('message'),
                'note': 'Could not verify user status, proceeding anyway'
            })
    except Exception as status_check_error:
        # Non-blocking: if status check fails (e.g., permissions), continue anyway
        current_app.logger.warning(f"FORGOT_PASSWORD_STATUS_CHECK_EXCEPTION", extra={
            'request_id': request_id,
            'email': masked_email,
            'error_type': type(status_check_error).__name__,
            'error_message': str(status_check_error),
            'note': 'Status check failed but proceeding anyway (non-blocking)'
        })
    
    # Newly created accounts are now immediately converted to CONFIRMED status
    # in ensure_cognito_account_for_user, so they don't need special handling here.
    # However, we still check for edge cases where existing accounts might be in FORCE_CHANGE_PASSWORD.
    # In some Cognito configurations this status can interfere with email delivery for forgot_password.
    if user_status_result.get('success') and user_status_result.get('user_status') == 'FORCE_CHANGE_PASSWORD':
        if was_just_created:
            # This shouldn't happen if ensure_cognito_account_for_user worked correctly,
            # but log it as a warning in case there was a race condition or error
            current_app.logger.warning("FORGOT_PASSWORD_NEW_ACCOUNT_STILL_FORCE_CHANGE", extra={
                'request_id': request_id,
                'email': masked_email,
                'user_status': user_status_result.get('user_status'),
                'email_verified': user_status_result.get('email_verified'),
                'note': 'Newly created account is still in FORCE_CHANGE_PASSWORD - this should have been converted to CONFIRMED'
            })
        else:
            # Existing account in FORCE_CHANGE_PASSWORD - try to convert it
            current_app.logger.warning("FORGOT_PASSWORD_FORCE_CHANGE_STATUS_FOR_EXISTING_ACCOUNT", extra={
                'request_id': request_id,
                'email': masked_email,
                'user_status': user_status_result.get('user_status'),
                'email_verified': user_status_result.get('email_verified'),
                'note': 'Existing account is in FORCE_CHANGE_PASSWORD status; attempting to convert to CONFIRMED'
            })
            
            # Generate a secure temporary password
            alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
            temp_password = ''.join(secrets.choice(alphabet) for _ in range(16))
            # Ensure it meets Cognito requirements
            if not any(c.isupper() for c in temp_password):
                temp_password = temp_password[0].upper() + temp_password[1:]
            if not any(c.islower() for c in temp_password):
                temp_password = temp_password[0].lower() + temp_password[1:]
            if not any(c.isdigit() for c in temp_password):
                temp_password = temp_password[:-1] + secrets.choice(string.digits)
            if not any(c in "!@#$%^&*" for c in temp_password):
                temp_password = temp_password[:-1] + secrets.choice("!@#$%^&*")
            
            # Set password to change status from FORCE_CHANGE_PASSWORD to CONFIRMED
            set_password_result = AWS_COGNITO_service.admin_set_user_password(
                username=email,
                password=temp_password,
                permanent=True
            )
            
            if not set_password_result['success']:
                current_app.logger.error(f"FORGOT_PASSWORD_SET_PASSWORD_FAILED", extra={
                    'request_id': request_id,
                    'email': masked_email,
                    'error': set_password_result.get('error'),
                    'error_message': set_password_result.get('message'),
                    'note': 'Failed to convert FORCE_CHANGE_PASSWORD to CONFIRMED - proceeding anyway but email may not send'
                })
                # Continue anyway - Cognito might still send the email
            else:
                # Verify status changed after setting password (optional, non-blocking)
                try:
                    status_after_set = AWS_COGNITO_service.admin_get_user_status(email)
                    if status_after_set['success']:
                        current_app.logger.info(f"FORGOT_PASSWORD_STATUS_AFTER_SET_PASSWORD", extra={
                            'request_id': request_id,
                            'email': masked_email,
                            'previous_status': user_status_result.get('user_status'),
                            'new_status': status_after_set.get('user_status'),
                            'email_verified': status_after_set.get('email_verified')
                        })
                        # Update user_status_result for logging below
                        user_status_result = status_after_set
                except Exception as status_check_error:
                    # Non-blocking: if status check fails, log and continue
                    current_app.logger.debug(f"FORGOT_PASSWORD_STATUS_AFTER_SET_CHECK_FAILED", extra={
                        'request_id': request_id,
                        'email': masked_email,
                        'error_type': type(status_check_error).__name__,
                        'error_message': str(status_check_error),
                        'note': 'Status check after set password failed (non-blocking)'
                    })
    
    # Log if account was just created (should already be CONFIRMED)
    if was_just_created:
        current_app.logger.info(f"FORGOT_PASSWORD_NEW_ACCOUNT", extra={
            'request_id': request_id,
            'email': masked_email,
            'user_status': user_status_result.get('user_status') if user_status_result.get('success') else 'UNKNOWN',
            'note': 'Account was just created and should already be CONFIRMED'
        })
    
    # Proceed with password reset flow (works for both new and existing accounts)
    result = AWS_COGNITO_service.forgot_password(
        email,
        request_id=request_id,
        user_status=user_status_result.get('user_status') if user_status_result.get('success') else None
    )
    
    if not result['success']:
        error_code = result.get('error', 'UNKNOWN')
        error_message = result.get('message', 'Unknown error')
        current_app.logger.error(f"FORGOT_PASSWORD_FAILED: {error_code} - {error_message} (was_just_created={was_just_created})", extra={
            'request_id': request_id,
            'email': masked_email,
            'error': error_code,
            'error_message': error_message,
            'was_just_created': was_just_created
        })
        error_response, status_code = create_error_response(
            result.get('error', 'FORGOT_PASSWORD_FAILED'),
            result.get('message', 'Failed to initiate password reset')
        )
        return jsonify(error_response), status_code
    
    # Extract and log detailed email delivery information
    code_delivery = result.get('code_delivery', {})
    delivery_medium = result.get('delivery_medium', 'UNKNOWN')
    destination = result.get('destination', 'UNKNOWN')
    attribute_name = result.get('attribute_name', 'UNKNOWN')
    aws_request_id = result.get('aws_request_id')
    aws_http_status = result.get('aws_http_status')
    
    # Log success with detailed email delivery information
    current_app.logger.info(f"FORGOT_PASSWORD_SUCCESS", extra={
        'request_id': request_id,
        'email': masked_email,
        'was_just_created': was_just_created,
        'delivery_medium': delivery_medium,
        'destination': destination[:3] + '***' + destination[-3:] if destination and destination != 'UNKNOWN' and len(destination) > 6 else destination,
        'attribute_name': attribute_name,
        'has_code_delivery': bool(code_delivery),
        'email_will_be_sent': delivery_medium == 'EMAIL' and destination != 'UNKNOWN',
        'aws_request_id': aws_request_id,
        'aws_http_status': aws_http_status
    })
    
    # Warn if email delivery information looks suspicious
    if delivery_medium != 'EMAIL':
        current_app.logger.warning(f"FORGOT_PASSWORD_UNEXPECTED_DELIVERY_MEDIUM", extra={
            'request_id': request_id,
            'email': masked_email,
            'delivery_medium': delivery_medium,
            'expected': 'EMAIL',
            'warning': 'Email may not be sent via expected method'
        })
    
    if destination == 'UNKNOWN' or not destination:
        current_app.logger.warning(f"FORGOT_PASSWORD_NO_DESTINATION", extra={
            'request_id': request_id,
            'email': masked_email,
            'code_delivery': code_delivery,
            'warning': 'No destination email address found in code delivery details'
        })
    
    return jsonify({
        'success': True,
        'message': 'Password reset code sent to your email',
        'code_delivery': code_delivery
    })

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Confirm forgot password with code, set new password, and auto-login"""
    request_id = generate_request_id('reset_password')
    data = request.get_json()
    start_time = time.time()
    
    is_valid, error_msg = validate_required_fields(data, ['email', 'code', 'new_password'])
    if not is_valid:
        error_response, status_code = create_error_response('MISSING_FIELDS', 'Email, code, and new password are required')
        return jsonify(error_response), status_code
    
    email = data['email']
    masked_email = mask_email(email)
    
    current_app.logger.info(f"RESET_PASSWORD_START", extra={
        'request_id': request_id,
        'email': masked_email
    })
    
    # Confirm forgot password with code and new password
    result = AWS_COGNITO_service.confirm_forgot_password(
        username=email,
        confirmation_code=data['code'],
        new_password=data['new_password']
    )
    
    if not result['success']:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.warning(f"RESET_PASSWORD_CONFIRM_FAILED", extra={
            'request_id': request_id,
            'email': masked_email,
            'error': result.get('error'),
            'message': result.get('message'),
            'duration_ms': duration_ms
        })
        error_response, status_code = create_error_response(
            result.get('error', 'RESET_PASSWORD_FAILED'),
            result.get('message', 'Failed to reset password')
        )
        return jsonify(error_response), status_code
    
    # Auto-login after password reset
    try:
        from ...services.auth.user.lookup import find_or_create_user_by_cognito
        from ...services.auth.utils.token_creation import create_minimal_tokens, decode_cognito_token
        from ...services.auth.utils.responses import create_auth_response
        from ...services.auth.utils.cookies import set_auth_cookies
        
        login_result = AWS_COGNITO_service.sign_in(
            username=email,
            password=data['new_password']
        )
        
        if not login_result['success']:
            duration_ms = int((time.time() - start_time) * 1000)
            current_app.logger.warning(f"RESET_PASSWORD_LOGIN_FAILED", extra={
                'request_id': request_id,
                'email': masked_email,
                'duration_ms': duration_ms
            })
            # Password reset succeeded but login failed - return success but indicate login issue
            return jsonify({
                'success': True,
                'message': 'Password reset successfully. Please log in manually.',
                'login_failed': True
            }), 200
        
        # Extract user info and create tokens
        id_token = login_result['tokens']['IdToken']
        decoded_id_token = decode_cognito_token(id_token)
        user_sub = decoded_id_token['sub']
        
        user = find_or_create_user_by_cognito(user_sub, email)
        user_id = str(user.id) if user else user_sub
        user_name = user.name if user else 'Unknown User'
        
        minimal_access_token, minimal_id_token = create_minimal_tokens(
            user_id=user_id,
            user_email=email,
            user_name=user_name,
            expires_in_hours=8,
            fallback_access_token=login_result['tokens']['AccessToken'],
            fallback_id_token=login_result['tokens']['IdToken']
        )
        
        resp = create_auth_response(
            user=user,
            user_sub=user_sub,
            email=email,
            access_token=minimal_access_token,
            id_token=minimal_id_token,
            message='Password reset and logged in successfully'
        )
        
        resp = set_auth_cookies(
            resp,
            access_token=minimal_access_token,
            refresh_token=login_result['tokens']['RefreshToken'],
            request_id=request_id
        )
        
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.info(f"RESET_PASSWORD_SUCCESS", extra={
            'request_id': request_id,
            'email': masked_email,
            'duration_ms': duration_ms
        })
        
        return resp, 200
        
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.error(f'RESET_PASSWORD_EXCEPTION', extra={
            'request_id': request_id,
            'email': masked_email,
            'error': str(e),
            'error_type': type(e).__name__,
            'duration_ms': duration_ms,
            'traceback': traceback.format_exc()[:500]
        })
        # Password reset succeeded but auto-login failed
        return jsonify({
            'success': True,
            'message': 'Password reset successfully. Please log in manually.',
            'auto_login_failed': True
        }), 200

@auth_bp.route('/refresh-token', methods=['POST'])
def refresh_token():
    """Refresh access token using refresh token from HttpOnly cookie"""
    request_id = generate_request_id('refresh_token')
    
    try:
        resp, status_code = handle_refresh_token(request_id)
        return resp
    except Exception as e:
        current_app.logger.error(f"AUTH_REFRESH_EXCEPTION", extra={
            'request_id': request_id,
            'error_type': type(e).__name__,
            'error_message': str(e),
            'traceback': traceback.format_exc()[:500]
        })
        error_response, status_code = create_error_response('REFRESH_FAILED', 'Failed to refresh token')
        return jsonify(error_response), status_code

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
        resp = clear_auth_cookies(resp)
        
        return resp
        
    except Exception as e:
        current_app.logger.error(f'Error during logout: {str(e)}')
        error_response, status_code = create_error_response('LOGOUT_FAILED', 'Failed to logout user')
        return jsonify(error_response), status_code

@auth_bp.route('/google/start', methods=['GET'])
def google_oauth_start():
    """Start Google OAuth flow for authentication"""
    request_id = generate_request_id('google_oauth')
    
    try:
        current_app.logger.info(f"GOOGLE_OAUTH_START", extra={
            'request_id': request_id
        })
        
        # Generate auth URL and state
        # State is stored in DB by build_auth_url() for reliable validation
        # Session storage kept as fallback for backward compatibility
        auth_url, state = google_oauth_service.build_auth_url()
        session['google_auth_oauth_state'] = state  # Fallback if DB fails
        session.permanent = True
        
        # Log state storage for debugging
        current_app.logger.info(f"GOOGLE_OAUTH_START_STATE_STORED", extra={
            'request_id': request_id,
            'has_state': bool(state),
            'storage_method': 'DB (with session fallback)',
            'session_permanent': session.permanent
        })
        
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
    request_id = generate_request_id('google_callback')
    
    try:
        current_app.logger.info(f"GOOGLE_OAUTH_CALLBACK", extra={
            'request_id': request_id,
            'has_code': bool(request.args.get('code')),
            'has_error': bool(request.args.get('error')),
            'has_state': bool(request.args.get('state')),
            'session_keys': list(session.keys()) if session else [],
            'has_session_state': 'google_auth_oauth_state' in session if session else False
        })
        
        # Pass session as dict but handler will also check Flask session directly if needed
        resp = handle_google_oauth_callback(
            request_args=dict(request.args),
            session_data=dict(session),  # Pass snapshot, but handler accesses session directly as fallback
            request_id=request_id
        )
        return resp
        
    except Exception as e:
        # Log full traceback for debugging
        full_traceback = traceback.format_exc()
        current_app.logger.error(f"GOOGLE_OAUTH_CALLBACK_ERROR", extra={
            'request_id': request_id,
            'error': str(e),
            'error_type': type(e).__name__,
            'traceback': full_traceback[:1000],  # Increased from 500 to 1000
            'has_code': bool(request.args.get('code')),
            'has_state': bool(request.args.get('state')),
            'has_error_param': bool(request.args.get('error')),
            'session_keys': list(session.keys()) if session else []
        })
        # Also log full traceback to console for immediate visibility
        current_app.logger.error(f"Full traceback: {full_traceback}")
        from ...config import Config
        return redirect(f"{Config.FRONTEND_URL}/login?error=google_oauth_failed")
