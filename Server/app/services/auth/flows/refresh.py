"""
Token refresh flow handlers.
"""
import time
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from flask import Response, request, current_app, make_response
from app import db
from app.models import User, GoogleOAuthToken
from ..core.cognito_service import AWS_COGNITO_service
from ..core.google_oauth_service import google_oauth_service
from ..user.lookup import find_or_create_user_by_cognito
from ..utils.token_creation import create_minimal_tokens, decode_cognito_token
from ..utils.responses import create_auth_response
from ..utils.cookies import set_auth_cookies, clear_auth_cookies


def handle_refresh_token(request_id: str) -> Tuple[Response, int]:
    """
    Handle refresh token flow for both Cognito and Google OAuth users.
    Detects user type and routes to appropriate refresh handler.
    Returns (response, status_code).
    """
    start_time = time.time()
    
    # Get access token from cookie to identify user
    access_token = request.cookies.get('session')
    if not access_token:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.warning(f"AUTH_REFRESH_MISSING_ACCESS_TOKEN", extra={
            'request_id': request_id,
            'duration_ms': duration_ms
        })
        return make_response({
            'success': False,
            'error': 'ACCESS_TOKEN_MISSING',
            'message': 'Access token not found. Please log in again.'
        }), 401
    
    # Decode access token to get user_id
    try:
        decoded = jwt.decode(access_token, options={"verify_signature": False})
        user_id = decoded.get('sub')
        email = decoded.get('email')
        
        if not user_id:
            duration_ms = int((time.time() - start_time) * 1000)
            current_app.logger.warning(f"AUTH_REFRESH_MISSING_USER_ID", extra={
                'request_id': request_id,
                'duration_ms': duration_ms
            })
            return make_response({
                'success': False,
                'error': 'INVALID_TOKEN',
                'message': 'Invalid access token. Please log in again.'
            }), 401
    except Exception as decode_error:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.error(f"AUTH_REFRESH_TOKEN_DECODE_ERROR", extra={
            'request_id': request_id,
            'error': str(decode_error),
            'duration_ms': duration_ms
        })
        return make_response({
            'success': False,
            'error': 'TOKEN_DECODE_ERROR',
            'message': 'Failed to decode access token. Please log in again.'
        }), 401
    
    # Look up user in database
    user = User.query.filter_by(id=user_id).first()
    if not user:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.warning(f"AUTH_REFRESH_USER_NOT_FOUND", extra={
            'request_id': request_id,
            'user_id': user_id,
            'duration_ms': duration_ms
        })
        return make_response({
            'success': False,
            'error': 'USER_NOT_FOUND',
            'message': 'User not found. Please log in again.'
        }), 401
    
    # Detect user type and route to appropriate handler
    if user.google_id:
        # Google OAuth user - use Google refresh
        return _handle_google_refresh(user, user_id, email, request_id, start_time)
    elif user.cognito_id:
        # Cognito user - use Cognito refresh
        return _handle_cognito_refresh(user, user_id, email, request_id, start_time)
    else:
        # Unknown user type
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.warning(f"AUTH_REFRESH_UNKNOWN_USER_TYPE", extra={
            'request_id': request_id,
            'user_id': user_id,
            'has_google_id': bool(user.google_id),
            'has_cognito_id': bool(user.cognito_id),
            'duration_ms': duration_ms
        })
        return make_response({
            'success': False,
            'error': 'UNKNOWN_USER_TYPE',
            'message': 'Unable to determine authentication method. Please log in again.'
        }), 401


def _handle_google_refresh(user: User, user_id: str, email: Optional[str], request_id: str, start_time: float) -> Tuple[Response, int]:
    """
    Handle Google OAuth token refresh.
    """
    # Get Google refresh token from database
    google_token = GoogleOAuthToken.query.filter_by(user_id=user_id).first()
    
    if not google_token or not google_token.refresh_token:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.warning(f"AUTH_REFRESH_GOOGLE_TOKEN_MISSING", extra={
            'request_id': request_id,
            'user_id': user_id,
            'has_token_record': bool(google_token),
            'has_refresh_token': bool(google_token.refresh_token if google_token else False),
            'duration_ms': duration_ms
        })
        
        resp = make_response({
            'success': False,
            'error': 'GOOGLE_REFRESH_TOKEN_MISSING',
            'message': 'Google refresh token not found. Please log in again.'
        })
        resp = clear_auth_cookies(resp)
        return resp, 401
    
    # Call Google refresh
    result = google_oauth_service.refresh_access_token(google_token.refresh_token)
    
    if not result['success']:
        duration_ms = int((time.time() - start_time) * 1000)
        error_code = result.get('error', 'GOOGLE_REFRESH_FAILED')
        
        current_app.logger.warning(f"AUTH_REFRESH_GOOGLE_FAILED", extra={
            'request_id': request_id,
            'user_id': user_id,
            'error': error_code,
            'duration_ms': duration_ms
        })
        
        # Clear cookies on refresh failure
        resp = make_response({
            'success': False,
            'error': error_code,
            'message': result.get('message', 'Google token refresh failed. Please log in again.')
        })
        resp = clear_auth_cookies(resp)
        
        # If refresh token is expired/invalid, clear it from database
        if error_code in ['GOOGLE_REFRESH_TOKEN_EXPIRED', 'GOOGLE_REFRESH_TOKEN_INVALID']:
            try:
                google_token.refresh_token = None
                db.session.commit()
                current_app.logger.info(f"AUTH_REFRESH_GOOGLE_TOKEN_CLEARED", extra={
                    'request_id': request_id,
                    'user_id': user_id
                })
            except Exception as e:
                current_app.logger.error(f"AUTH_REFRESH_GOOGLE_TOKEN_CLEAR_ERROR", extra={
                    'request_id': request_id,
                    'user_id': user_id,
                    'error': str(e)
                })
        
        return resp, 401
    
    # Update GoogleOAuthToken record with new access token
    try:
        google_token.access_token = result['access_token']
        # Preserve refresh token (Google may not return new one)
        if result.get('refresh_token'):
            google_token.refresh_token = result['refresh_token']
        # Update expiry if provided
        if result.get('expires_in'):
            google_token.expiry = datetime.now(timezone.utc) + timedelta(seconds=result['expires_in'])
        db.session.commit()
        
        current_app.logger.info(f"AUTH_REFRESH_GOOGLE_TOKEN_UPDATED", extra={
            'request_id': request_id,
            'user_id': user_id,
            'has_new_refresh_token': bool(result.get('refresh_token'))
        })
    except Exception as e:
        current_app.logger.error(f"AUTH_REFRESH_GOOGLE_TOKEN_UPDATE_ERROR", extra={
            'request_id': request_id,
            'user_id': user_id,
            'error': str(e)
        })
        # Continue anyway - token refresh succeeded
    
    # Create new minimal tokens
    user_name = user.name if user else 'Unknown User'
    minimal_access_token, minimal_id_token = create_minimal_tokens(
        user_id=user_id,
        user_email=email or user.email or '',
        user_name=user_name,
        expires_in_hours=8,
        fallback_access_token=result['access_token'],
        fallback_id_token=None  # Google doesn't provide ID tokens in refresh response
    )
    
    # Create response
    resp = create_auth_response(
        user=user,
        user_sub=user_id,  # For Google users, user_id is the sub
        email=email or user.email or '',
        access_token=minimal_access_token,
        id_token=minimal_id_token,
        message='Token refreshed successfully'
    )
    
    # Set new cookies (preserve refresh token from database)
    refresh_token_for_cookie = google_token.refresh_token or request.cookies.get('refresh_token', '')
    resp = set_auth_cookies(
        resp,
        access_token=minimal_access_token,
        refresh_token=refresh_token_for_cookie,
        request_id=request_id
    )
    
    duration_ms = int((time.time() - start_time) * 1000)
    current_app.logger.info(f"AUTH_REFRESH_GOOGLE_SUCCESS", extra={
        'request_id': request_id,
        'user_id': user_id,
        'duration_ms': duration_ms
    })
    
    return resp, 200


def _handle_cognito_refresh(user: User, user_id: str, email: Optional[str], request_id: str, start_time: float) -> Tuple[Response, int]:
    """
    Handle Cognito token refresh.
    """
    # Get refresh token from cookie
    refresh_token = request.cookies.get('refresh_token')
    if not refresh_token:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.warning(f"AUTH_REFRESH_COGNITO_MISSING_TOKEN", extra={
            'request_id': request_id,
            'user_id': user_id,
            'duration_ms': duration_ms
        })
        resp = make_response({
            'success': False,
            'error': 'REFRESH_TOKEN_MISSING',
            'message': 'Refresh token not found. Please log in again.'
        })
        resp = clear_auth_cookies(resp)
        return resp, 401
    
    # Get username for Cognito refresh
    username = email or user.email
    
    # Call Cognito refresh
    result = AWS_COGNITO_service.refresh_access_token(refresh_token, username)
    
    if not result['success']:
        duration_ms = int((time.time() - start_time) * 1000)
        error_code = result.get('error', 'REFRESH_FAILED')
        
        current_app.logger.warning(f"AUTH_REFRESH_COGNITO_FAILED", extra={
            'request_id': request_id,
            'user_id': user_id,
            'error': error_code,
            'duration_ms': duration_ms
        })
        
        # Clear cookies on refresh failure
        resp = make_response({
            'success': False,
            'error': error_code,
            'message': result.get('message', 'Token refresh failed. Please log in again.')
        })
        resp = clear_auth_cookies(resp)
        
        return resp, 401
    
    # Extract user info from new tokens
    try:
        id_token = result['tokens']['IdToken']
        decoded_id_token = decode_cognito_token(id_token)
        user_sub = decoded_id_token['sub']
        email_from_token = decoded_id_token.get('email')
    except Exception as token_error:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.error(f"AUTH_REFRESH_COGNITO_TOKEN_DECODE_ERROR", extra={
            'request_id': request_id,
            'error': str(token_error),
            'duration_ms': duration_ms
        })
        return make_response({
            'success': False,
            'error': 'TOKEN_DECODE_ERROR',
            'message': 'Failed to process refreshed token'
        }), 500
    
    # Find or update user
    user = find_or_create_user_by_cognito(user_sub, email_from_token or email or '')
    user_id = str(user.id) if user else user_sub
    user_name = user.name if user else 'Unknown User'
    
    # Create new minimal tokens
    minimal_access_token, minimal_id_token = create_minimal_tokens(
        user_id=user_id,
        user_email=email_from_token or email or '',
        user_name=user_name,
        expires_in_hours=8,
        fallback_access_token=result['tokens']['AccessToken'],
        fallback_id_token=result['tokens']['IdToken']
    )
    
    # Create response
    resp = create_auth_response(
        user=user,
        user_sub=user_sub,
        email=email_from_token or email or '',
        access_token=minimal_access_token,
        id_token=minimal_id_token,
        message='Token refreshed successfully'
    )
    
    # Set new cookies (refresh token doesn't change, but we update access token)
    resp = set_auth_cookies(
        resp,
        access_token=minimal_access_token,
        refresh_token=refresh_token,  # Refresh token stays the same
        request_id=request_id
    )
    
    duration_ms = int((time.time() - start_time) * 1000)
    current_app.logger.info(f"AUTH_REFRESH_COGNITO_SUCCESS", extra={
        'request_id': request_id,
        'user_id': user_id,
        'duration_ms': duration_ms
    })
    
    return resp, 200
