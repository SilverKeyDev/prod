"""
User login flow handler.
"""
import time
import os
from typing import Dict, Any, Tuple
from flask import Response, current_app, make_response
from ..core.cognito_service import AWS_COGNITO_service
from ..user.lookup import find_or_create_user_by_cognito
from ..utils.token_creation import create_minimal_tokens, decode_cognito_token
from ..utils.responses import create_auth_response
from ..utils.cookies import set_auth_cookies
from ..utils.helpers import mask_email


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
                    'email': mask_email(data.get('email', ''))
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
