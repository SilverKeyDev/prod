from flask import Blueprint, request, jsonify, current_app, make_response, redirect, session
import time
import traceback
from ..services.auth.auth import AWS_COGNITO_service
from ..services.auth.google_oauth_service import google_oauth_service
from ..services.auth.auth_helpers import (
    generate_request_id,
    validate_required_fields,
    create_error_response,
    clear_auth_cookies,
    mask_email
)
from ..services.auth.auth_flows import (
    handle_signup,
    handle_verification,
    handle_login,
    handle_google_oauth_callback,
    handle_resend_code
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
    data = request.get_json()
    
    is_valid, error_msg = validate_required_fields(data, ['email'])
    if not is_valid:
        error_response, status_code = create_error_response('MISSING_EMAIL', 'Email is required')
        return jsonify(error_response), status_code
    
    result = AWS_COGNITO_service.forgot_password(data['email'])
    
    if not result['success']:
        error_response, status_code = create_error_response(
            result.get('error', 'FORGOT_PASSWORD_FAILED'),
            result.get('message', 'Failed to initiate password reset')
        )
        return jsonify(error_response), status_code
    
    return jsonify({
        'success': True,
        'message': 'Password reset code sent to your email',
        'code_delivery': result.get('code_delivery')
    })

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Confirm forgot password with code and set new password"""
    data = request.get_json()
    
    is_valid, error_msg = validate_required_fields(data, ['email', 'code', 'new_password'])
    if not is_valid:
        error_response, status_code = create_error_response('MISSING_FIELDS', 'Email, code, and new password are required')
        return jsonify(error_response), status_code
    
    result = AWS_COGNITO_service.confirm_forgot_password(
        username=data['email'],
        confirmation_code=data['code'],
        new_password=data['new_password']
    )
    
    if not result['success']:
        error_response, status_code = create_error_response(
            result.get('error', 'RESET_PASSWORD_FAILED'),
            result.get('message', 'Failed to reset password')
        )
        return jsonify(error_response), status_code
    
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
    request_id = generate_request_id('google_callback')
    
    try:
        current_app.logger.info(f"GOOGLE_OAUTH_CALLBACK", extra={
            'request_id': request_id,
            'has_code': bool(request.args.get('code')),
            'has_error': bool(request.args.get('error'))
        })
        
        resp = handle_google_oauth_callback(
            request_args=dict(request.args),
            session_data=dict(session),
            request_id=request_id
        )
        return resp
        
    except Exception as e:
        current_app.logger.error(f"GOOGLE_OAUTH_CALLBACK_ERROR", extra={
            'request_id': request_id,
            'error': str(e),
            'error_type': type(e).__name__,
            'traceback': traceback.format_exc()[:500]
        })
        from ..config import Config
        return redirect(f"{Config.FRONTEND_URL}/login?error=google_oauth_failed")
