"""
Response creation utilities for authentication.
"""
from typing import Optional
from flask import make_response, Response
from app.models import User


def create_error_response(error: str, message: str, status_code: int = 400) -> tuple:
    """Create standardized error response."""
    return {
        'success': False,
        'error': error,
        'message': message
    }, status_code


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
    # Determine auth_method based on user's authentication setup
    auth_method = 'unknown'
    if user:
        has_cognito = bool(user.cognito_id)
        has_google = bool(user.google_id)
        if has_cognito and has_google:
            auth_method = 'both'
        elif has_google:
            auth_method = 'google'
        elif has_cognito:
            auth_method = 'cognito'
    
    response_data = {
        'success': True,
        'user': {
            'email': email,
            'user_sub': user_sub,
            'name': user.name if user else 'Unknown User',
            'id': str(user.id) if user else None,
            'phone': user.phone if user else None,
            'is_agent': user.is_agent if user else False,
            'auth_method': auth_method
        }
    }
    
    if message:
        response_data['message'] = message
    
    if include_id_token:
        response_data['id_token'] = id_token
    
    resp = make_response(response_data)
    return resp
