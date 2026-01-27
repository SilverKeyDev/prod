"""
Cookie management utilities for authentication.
"""
import os
from typing import Optional
from flask import Response, current_app


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
