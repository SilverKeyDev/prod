"""
Authentication flow services - handles complete authentication workflows.
Extracted from routes to improve separation of concerns and reduce route file size.
"""
import os
import time
import uuid as uuid_lib
import traceback
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from flask import Response, current_app, redirect, session
from flask import make_response
from app import db
from app.models.user import User
from .auth import AWS_COGNITO_service
from .google_oauth_service import google_oauth_service
from .auth_helpers import (
    find_or_create_user_by_cognito,
    create_minimal_tokens,
    set_auth_cookies,
    create_auth_response,
    decode_cognito_token,
    mask_email
)
from .minimal_token import minimal_token_service


def handle_signup(data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
    """
    Handle user signup flow.
    Returns (response_dict, status_code).
    """
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
        return {
            'success': False,
            'error': result.get('error', 'SIGNUP_FAILED'),
            'message': result.get('message', 'Failed to register user')
        }, 400
    
    # Create user in database (non-blocking)
    try:
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
        # Don't fail signup if DB creation fails
    
    return {
        'success': True,
        'message': 'User registered successfully. Please check your email for verification code.',
        'user_sub': result['user_sub']
    }, 201


def handle_verification(data: Dict[str, Any], request_id: str) -> Tuple[Response, int]:
    """
    Handle email verification and auto-login flow.
    Returns (response, status_code).
    """
    start_time = time.time()
    
    # Verify email with code
    result = AWS_COGNITO_service.confirm_sign_up(
        username=data['email'],
        confirmation_code=data['code']
    )
    
    if not result['success']:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.warning(f"❌ AUTH_VERIFY_COGNITO_CONFIRM_FAILED", extra={
            'request_id': request_id,
            'error': result.get('error'),
            'result_message': result.get('message'),
            'duration_ms': duration_ms
        })
        return make_response({
            'success': False,
            'error': result.get('error', 'VERIFICATION_FAILED'),
            'message': result.get('message', 'Failed to verify user')
        }), 400
    
    # Auto-login after verification
    try:
        login_result = AWS_COGNITO_service.sign_in(
            username=data['email'],
            password=data['password']
        )
        
        if not login_result['success']:
            duration_ms = int((time.time() - start_time) * 1000)
            current_app.logger.warning(f"⚠️ AUTH_VERIFY_LOGIN_FAILED_AFTER_VERIFICATION", extra={
                'request_id': request_id,
                'email': mask_email(data['email']),
                'duration_ms': duration_ms
            })
            return make_response({
                'success': True,
                'message': 'Email verified successfully. Please log in manually.',
                'verification_complete': True,
                'login_failed': True
            }), 200
        
        # Extract user info and create tokens
        id_token = login_result['tokens']['IdToken']
        decoded_id_token = decode_cognito_token(id_token)
        user_sub = decoded_id_token['sub']
        
        user = find_or_create_user_by_cognito(user_sub, data['email'])
        user_id = str(user.id) if user else user_sub
        user_name = user.name if user else 'Unknown User'
        
        minimal_access_token, minimal_id_token = create_minimal_tokens(
            user_id=user_id,
            user_email=data['email'],
            user_name=user_name,
            expires_in_hours=8,
            fallback_access_token=login_result['tokens']['AccessToken'],
            fallback_id_token=login_result['tokens']['IdToken']
        )
        
        resp = create_auth_response(
            user=user,
            user_sub=user_sub,
            email=data['email'],
            access_token=minimal_access_token,
            id_token=minimal_id_token,
            message='Email verified and logged in successfully'
        )
        
        resp = set_auth_cookies(
            resp,
            access_token=minimal_access_token,
            refresh_token=login_result['tokens']['RefreshToken'],
            request_id=request_id
        )
        
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.info(f"AUTH_VERIFY_SUCCESS", extra={
            'request_id': request_id,
            'email': mask_email(data['email']),
            'duration_ms': duration_ms
        })
        
        return resp, 200
        
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.error(f'❌ AUTH_VERIFY_EXCEPTION', extra={
            'request_id': request_id,
            'error': str(e),
            'error_type': type(e).__name__,
            'duration_ms': duration_ms,
            'traceback': traceback.format_exc()[:500]
        })
        return make_response({
            'success': True,
            'message': 'Email verified successfully. Please log in manually.',
            'verification_complete': True,
            'auto_login_failed': True
        }), 200


def handle_login(data: Dict[str, Any], request_id: str) -> Tuple[Response, int]:
    """
    Handle user login flow.
    Returns (response, status_code).
    """
    start_time = time.time()
    
    result = AWS_COGNITO_service.sign_in(
        username=data['email'],
        password=data['password']
    )
    
    # Check for success key
    try:
        success_value = result['success']
    except KeyError as key_error:
        current_app.logger.error(f"AUTH_LOGIN_SUCCESS_KEY_ERROR", extra={
            'request_id': request_id,
            'error': str(key_error),
            'result_keys': list(result.keys()) if isinstance(result, dict) else 'not_dict'
        })
        return make_response({
            'success': False,
            'error': 'INVALID_RESPONSE',
            'message': 'Invalid response from authentication service'
        }), 500
    
    if not success_value:
        # Handle unverified user
        if result.get('needs_verification') or result.get('error') == 'UserNotConfirmedException':
            try:
                resend_response = AWS_COGNITO_service.client.resend_confirmation_code(
                    ClientId=os.getenv('AWS_COGNITO_CLIENT_ID'),
                    SecretHash=AWS_COGNITO_service._get_secret_hash(data['email']),
                    Username=data['email']
                )
                current_app.logger.info(f"AUTH_LOGIN_UNVERIFIED_CODE_SENT", extra={
                    'request_id': request_id,
                    'email': mask_email(data['email'])
                })
                return make_response({
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
                return make_response({
                    'success': False,
                    'error': 'USER_NOT_VERIFIED',
                    'message': 'Please verify your email address to continue.',
                    'needs_verification': True
                }), 401
        
        # Handle login failure
        duration_ms = int((time.time() - start_time) * 1000)
        error_message = 'Invalid email or password'
        if result.get('error') == 'NotAuthorizedException':
            error_message = 'Incorrect email or password. Please try again.'
        
        current_app.logger.warning(f"AUTH_LOGIN_FAILED", extra={
            'request_id': request_id,
            'duration_ms': duration_ms
        })
        
        return make_response({
            'success': False,
            'error': result.get('error', 'AUTHENTICATION_FAILED'),
            'message': result.get('message', error_message)
        }), 401
    
    # Extract user info and create tokens
    try:
        id_token = result['tokens']['IdToken']
        decoded_id_token = decode_cognito_token(id_token)
        user_sub = decoded_id_token['sub']
    except Exception as token_error:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.error(f"AUTH_LOGIN_TOKEN_DECODE_ERROR", extra={
            'request_id': request_id,
            'error': str(token_error),
            'duration_ms': duration_ms
        })
        return make_response({
            'success': False,
            'error': 'TOKEN_DECODE_ERROR',
            'message': 'Failed to process authentication token'
        }), 500
    
    user = find_or_create_user_by_cognito(user_sub, data['email'])
    user_id = str(user.id) if user else user_sub
    user_name = user.name if user else 'Unknown User'
    
    minimal_access_token, minimal_id_token = create_minimal_tokens(
        user_id=user_id,
        user_email=data['email'],
        user_name=user_name,
        expires_in_hours=8,
        fallback_access_token=result['tokens']['AccessToken'],
        fallback_id_token=result['tokens']['IdToken']
    )
    
    resp = create_auth_response(
        user=user,
        user_sub=user_sub,
        email=data['email'],
        access_token=minimal_access_token,
        id_token=minimal_id_token
    )
    
    resp = set_auth_cookies(
        resp,
        access_token=minimal_access_token,
        refresh_token=result['tokens']['RefreshToken'],
        request_id=request_id
    )
    
    return resp, 200


def handle_google_oauth_callback(request_args: Dict[str, Any], session_data: Dict[str, Any], request_id: str) -> Response:
    """
    Handle Google OAuth callback flow.
    Returns redirect response.
    """
    from app.config import Config
    
    # Check for OAuth errors
    error = request_args.get('error')
    if error:
        current_app.logger.warning(f"GOOGLE_OAUTH_ERROR", extra={
            'request_id': request_id,
            'error': error
        })
        return redirect(f"{Config.FRONTEND_URL}/login?error=google_oauth_failed")
    
    # Validate state - use DB-based validation (works even if cookies/sessions fail)
    state = request_args.get('state')
    # Try DB first, fall back to session for backward compatibility
    session_state = session_data.get('google_auth_oauth_state') if session_data else None
    if not session_state:
        # Access Flask session directly as fallback
        session_state = session.get('google_auth_oauth_state')
    
    if not google_oauth_service.validate_state(state, session_state):
        current_app.logger.warning(f"GOOGLE_OAUTH_INVALID_STATE", extra={
            'request_id': request_id,
            'has_state': bool(state),
            'has_session_state': bool(session_state),
            'state_match': state == session_state if state and session_state else False,
            'note': 'State validation failed - could be expired, already used, or mismatch'
        })
        return redirect(f"{Config.FRONTEND_URL}/login?error=invalid_state")
    
    # Exchange code for tokens
    code = request_args.get('code')
    if not code:
        current_app.logger.error(f"GOOGLE_OAUTH_MISSING_CODE", extra={
            'request_id': request_id,
            'request_args_keys': list(request_args.keys())
        })
        return redirect(f"{Config.FRONTEND_URL}/login?error=missing_code")
    
    try:
        tokens = google_oauth_service.exchange_code_for_tokens(code)
    except Exception as token_exchange_error:
        current_app.logger.error(f"GOOGLE_TOKEN_EXCHANGE_ERROR_IN_FLOW", extra={
            'request_id': request_id,
            'error': str(token_exchange_error),
            'error_type': type(token_exchange_error).__name__,
            'traceback': traceback.format_exc()[:500]
        })
        return redirect(f"{Config.FRONTEND_URL}/login?error=token_exchange_failed")
    
    # Validate tokens response
    if not tokens or 'access_token' not in tokens:
        current_app.logger.error(f"GOOGLE_TOKEN_MISSING_ACCESS_TOKEN", extra={
            'request_id': request_id,
            'tokens_keys': list(tokens.keys()) if tokens else None
        })
        return redirect(f"{Config.FRONTEND_URL}/login?error=invalid_tokens")
    
    # Log refresh_token presence for debugging
    has_refresh_token = bool(tokens.get('refresh_token'))
    current_app.logger.info(f"GOOGLE_TOKENS_RECEIVED", extra={
        'request_id': request_id,
        'has_refresh_token': has_refresh_token,
        'has_access_token': bool(tokens.get('access_token')),
        'expires_in': tokens.get('expires_in')
    })
    
    # Get user info from Google
    try:
        user_info = google_oauth_service.get_user_info(tokens['access_token'])
    except Exception as userinfo_error:
        current_app.logger.error(f"GOOGLE_USERINFO_ERROR_IN_FLOW", extra={
            'request_id': request_id,
            'error': str(userinfo_error),
            'error_type': type(userinfo_error).__name__,
            'traceback': traceback.format_exc()[:500]
        })
        return redirect(f"{Config.FRONTEND_URL}/login?error=userinfo_failed")
    
    current_app.logger.info(f"GOOGLE_USERINFO_RECEIVED", extra={
        'request_id': request_id,
        'email': mask_email(user_info.get('email', '')),
        'verified': user_info.get('verified_email'),
        'has_name': bool(user_info.get('name'))
    })
    
    # Check if email is verified
    if not user_info.get('verified_email'):
        current_app.logger.warning(f"GOOGLE_EMAIL_NOT_VERIFIED", extra={
            'request_id': request_id,
            'email': mask_email(user_info.get('email', ''))
        })
        return redirect(f"{Config.FRONTEND_URL}/login?error=email_not_verified")
    
    # Extract user info - validate required fields
    if 'id' not in user_info or 'email' not in user_info:
        current_app.logger.error(f"GOOGLE_USERINFO_MISSING_FIELDS", extra={
            'request_id': request_id,
            'user_info_keys': list(user_info.keys()) if user_info else None
        })
        return redirect(f"{Config.FRONTEND_URL}/login?error=invalid_userinfo")
    
    google_id = user_info['id']
    email = user_info['email']
    name = user_info.get('name', '').strip() if user_info.get('name') else email.split('@')[0]
    if not name or not name.strip():
        name = email.split('@')[0] if email and '@' in email else "User"
    
    # Find or create user
    is_new_signup = False
    user = User.query.filter_by(google_id=google_id).first()
    
    if not user:
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
                'email': mask_email(email)
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
                'email': mask_email(email)
            })
    else:
        # User exists, update last_logged_in
        user.last_logged_in = datetime.utcnow()
        db.session.commit()
    
    # Create tokens - match old approach: create access token directly, ID token is optional
    try:
        # Generate minimal access token (required)
        minimal_access_token = minimal_token_service.create_minimal_access_token(
            user_id=str(user.id),
            user_email=email,
            expires_in_hours=8
        )
        
        # Generate minimal ID token (optional - don't block if it fails)
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
                'user_email': mask_email(email),
                'user_name': user_name[:10] + '***' if user_name else 'missing',
                'user_name_length': len(user_name) if user_name else 0,
                'error': str(id_token_error),
                'error_type': type(id_token_error).__name__,
                'note': 'ID token creation skipped - access token is sufficient for authentication'
            })
            # Continue without ID token - access token is sufficient
        
        current_app.logger.info(f"GOOGLE_TOKENS_CREATED_SUCCESSFULLY", extra={
            'request_id': request_id,
            'user_id': str(user.id),
            'has_id_token': bool(minimal_id_token)
        })
        
    except Exception as token_error:
        current_app.logger.error(f"🔧 GOOGLE_TOKEN_CREATION_ERROR", extra={
            'request_id': request_id,
            'user_id': str(user.id) if user else 'unknown',
            'error': str(token_error),
            'error_type': type(token_error).__name__,
            'traceback': traceback.format_exc()[:500]
        })
        return redirect(f"{Config.FRONTEND_URL}/login?error=token_creation_failed")
    
    # Determine redirect destination
    # New signups go to onboarding, existing agents go to dashboard, non-agents go to search
    if is_new_signup:
        redirect_path = "/onboarding"
    elif user.is_agent:
        redirect_path = "/dashboard"
    else:
        redirect_path = "/search"
    
    current_app.logger.info(f"GOOGLE_AUTH_REDIRECT", extra={
        'request_id': request_id,
        'user_id': str(user.id),
        'is_new_signup': is_new_signup,
        'is_agent': user.is_agent,
        'redirect_to': redirect_path
    })
    
    # Create redirect response with cookies
    resp = redirect(f"{Config.FRONTEND_URL}{redirect_path}?google=success")
    
    # Small delay to ensure token has time to "age" before immediate verification
    time.sleep(0.1)  # 100ms delay
    
    refresh_token_value = tokens.get('refresh_token', minimal_access_token)
    resp = set_auth_cookies(
        resp,
        access_token=minimal_access_token,
        refresh_token=refresh_token_value,
        request_id=request_id
    )
    
    return resp


def handle_resend_code(data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
    """
    Handle resend verification code flow.
    Returns (response_dict, status_code).
    """
    try:
        response = AWS_COGNITO_service.client.resend_confirmation_code(
            ClientId=os.getenv('AWS_COGNITO_CLIENT_ID'),
            SecretHash=AWS_COGNITO_service._get_secret_hash(data['email']),
            Username=data['email']
        )
        
        return {
            'success': True,
            'message': 'Verification code has been resent to your email',
            'code_delivery': response.get('CodeDeliveryDetails', {})
        }, 200
        
    except AWS_COGNITO_service.client.exceptions.UserNotFoundException:
        return {
            'success': False,
            'error': 'USER_NOT_FOUND',
            'message': 'No user found with this email'
        }, 404
        
    except AWS_COGNITO_service.client.exceptions.InvalidParameterException as e:
        return {
            'success': False,
            'error': 'INVALID_PARAMETER',
            'message': str(e)
        }, 400
        
    except Exception as e:
        current_app.logger.error(f'Error resending verification code: {str(e)}')
        return {
            'success': False,
            'error': 'RESEND_CODE_FAILED',
            'message': 'Failed to resend verification code. Please try again.'
        }, 500
