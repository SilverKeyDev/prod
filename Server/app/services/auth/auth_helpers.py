"""
Authentication helper utilities for common patterns in auth routes.
Extracted to reduce duplication and improve maintainability.
"""
import os
import time
import uuid
import jwt
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
from flask import make_response, Response, current_app
from app import db
from app.models.user import User
from .minimal_token import minimal_token_service


def generate_request_id(prefix: str = "auth") -> str:
    """Generate a unique request ID for logging."""
    return f"{prefix}_{int(time.time() * 1000)}_{os.urandom(4).hex()}"


def validate_required_fields(data: dict, required_fields: list) -> Tuple[bool, Optional[str]]:
    """
    Validate that all required fields are present in data.
    Returns (is_valid, error_message).
    """
    if not data:
        return False, "No data provided"
    
    missing_fields = [field for field in required_fields if field not in data or not data.get(field)]
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    
    return True, None


def create_error_response(error: str, message: str, status_code: int = 400) -> tuple:
    """Create standardized error response."""
    return {
        'success': False,
        'error': error,
        'message': message
    }, status_code


def find_or_create_user_by_cognito(
    cognito_id: str,
    email: str,
    update_last_login: bool = True
) -> Optional[User]:
    """
    Find user by cognito_id, with fallback to email lookup.
    Updates last_logged_in if user is found.
    Returns User or None.
    """
    try:
        user = User.query.filter_by(cognito_id=cognito_id).first()
        if not user:
            # Fallback: try to find by email
            user = User.query.filter_by(email=email).first()
            if user:
                # Link cognito_id to existing user
                user.cognito_id = cognito_id
                db.session.commit()
        
        # Update last_logged_in timestamp
        if user and update_last_login:
            user.last_logged_in = datetime.utcnow()
            db.session.commit()
        
        return user
    except Exception as e:
        current_app.logger.error(f'Error during user lookup: {str(e)}')
        return None


def create_minimal_tokens(
    user_id: str,
    user_email: str,
    user_name: str = "Unknown User",
    expires_in_hours: int = 8,
    fallback_access_token: Optional[str] = None,
    fallback_id_token: Optional[str] = None
) -> Tuple[str, str]:
    """
    Create minimal access and ID tokens.
    Falls back to provided tokens if creation fails.
    Returns (access_token, id_token).
    """
    try:
        # Generate minimal access token
        minimal_access_token = minimal_token_service.create_minimal_access_token(
            user_id=user_id,
            user_email=user_email,
            expires_in_hours=expires_in_hours
        )
        
        # Generate minimal ID token
        minimal_id_token = minimal_token_service.create_minimal_id_token(
            user_id=user_id,
            user_email=user_email,
            user_name=user_name,
            expires_in_hours=expires_in_hours
        )
        
        return minimal_access_token, minimal_id_token
        
    except Exception as token_error:
        current_app.logger.error(f"Minimal token creation error: {str(token_error)}")
        # Fallback to provided tokens if available
        access_token = fallback_access_token or ""
        id_token = fallback_id_token or ""
        return access_token, id_token


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    request_id: Optional[str] = None
) -> Response:
    """
    Set authentication cookies on a response object.
    Handles errors gracefully and logs them.
    """
    is_production = os.getenv('FLASK_ENV') == 'production'
    
    try:
        # Session cookie (access token)
        response.set_cookie(
            "session",
            value=access_token,
            httponly=True,
            secure=is_production,
            samesite="Lax",
            path="/",
            max_age=60 * 60 * 8  # 8 hours
        )
        
        # Refresh token cookie
        response.set_cookie(
            "refresh_token",
            value=refresh_token,
            httponly=True,
            secure=is_production,
            samesite="Lax",
            path="/",
            max_age=60 * 60 * 24 * 30  # 30 days
        )
        
    except Exception as cookie_error:
        if request_id:
            current_app.logger.error(f"Cookie setting error", extra={
                'request_id': request_id,
                'error': str(cookie_error),
                'error_type': type(cookie_error).__name__
            })
        else:
            current_app.logger.error(f"Cookie setting error: {str(cookie_error)}")
        # Continue even if cookie setting fails
    
    return response


def clear_auth_cookies(response: Response) -> Response:
    """
    Clear authentication cookies by setting them to empty with max_age=0.
    """
    is_production = os.getenv('FLASK_ENV') == 'production'
    
    try:
        response.set_cookie(
            "session",
            value="",
            httponly=True,
            secure=is_production,
            samesite="Lax",
            path="/",
            max_age=0  # Expire immediately
        )
        
        response.set_cookie(
            "refresh_token",
            value="",
            httponly=True,
            secure=is_production,
            samesite="Lax",
            path="/",
            max_age=0  # Expire immediately
        )
    except Exception as e:
        current_app.logger.error(f'Error clearing cookies: {str(e)}')
    
    return response


def create_auth_response(
    user: Optional[User],
    user_sub: str,
    email: str,
    access_token: str,
    id_token: str,
    message: Optional[str] = None,
    include_id_token: bool = True
) -> Response:
    """
    Create a standardized authentication response with user data and cookies.
    """
    response_data = {
        'success': True,
        'user': {
            'email': email,
            'user_sub': user_sub,
            'name': user.name if user else 'Unknown User',
            'id': user.id if user else None
        }
    }
    
    if message:
        response_data['message'] = message
    
    if include_id_token:
        response_data['id_token'] = id_token
    
    resp = make_response(response_data)
    return resp


def decode_cognito_token(token: str) -> Dict[str, Any]:
    """
    Decode a Cognito JWT token without verification.
    Returns the decoded payload.
    """
    return jwt.decode(token, options={"verify_signature": False})


def mask_email(email: str) -> str:
    """Mask email for logging (shows first 3 and last 3 characters)."""
    if not email or len(email) < 7:
        return "***"
    return email[:3] + '***' + email[-3:]
