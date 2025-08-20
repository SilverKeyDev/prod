from flask import request, current_app
import os
import requests
from jose import jwk, jwt as jose_jwt
from jose.exceptions import JWTError, JWTClaimsError, ExpiredSignatureError
from ..models.user import User
from .. import db
from .security import SecurityError, log_security_event, safe_user_lookup_error, security_error_response

class SecurityException(Exception):
    """Exception class for SecurityError tuples"""
    def __init__(self, security_error_tuple):
        self.error_tuple = security_error_tuple
        super().__init__(security_error_tuple[1])

# Cognito Configuration
COGNITO_REGION = os.getenv("S3_REGION", "us-east-2")
COGNITO_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")

if not COGNITO_POOL_ID or not COGNITO_CLIENT_ID:
    raise RuntimeError("COGNITO_POOL_ID and COGNITO_CLIENT_ID must be set in environment variables.")

COGNITO_ISSUER = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_POOL_ID}"
COGNITO_KEYS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"

# Cache the JWKS
JWKS = requests.get(COGNITO_KEYS_URL).json()

def get_signing_key(token):
    try:
        headers = jose_jwt.get_unverified_header(token)
        key_id = headers.get('kid')
        
        # Find the key with matching kid
        key = None
        for k in JWKS['keys']:
            if k['kid'] == key_id:
                key = k
                break
        
        if not key:
            raise JWTError('Public key not found in jwks')
            
        return jwk.construct(key)
    except Exception as e:
        current_app.logger.error(f"Error getting signing key: {str(e)}")
        raise JWTError('Invalid token header')

def get_current_user():
    """Get current user from Cognito JWT token with comprehensive validation and fallback"""
    auth_header = request.headers.get('Authorization', None)
    
    if not auth_header:
        log_security_event('auth_missing_header')
        raise SecurityException(SecurityError.UNAUTHORIZED)
    
    # Check if header starts with 'Bearer '
    if not auth_header.startswith('Bearer '):
        log_security_event('auth_invalid_header_format')
        raise SecurityException(SecurityError.INVALID_TOKEN)
    
    token = auth_header.replace("Bearer ", "")
    
    # Check if token has the expected JWT format (3 parts separated by dots)
    token_parts = token.split('.')
    if len(token_parts) != 3:
        log_security_event('auth_invalid_jwt_format', {'parts_count': len(token_parts)})
        raise SecurityException(SecurityError.INVALID_TOKEN)
    
    try:
        # Get the proper signing key for this token
        key = get_signing_key(token)
        claims = jose_jwt.decode(
            token,
            key=key,
            algorithms=["RS256"],
            audience=COGNITO_CLIENT_ID,
            issuer=COGNITO_ISSUER,
            options={
                "leeway": 30,
                "verify_aud": True,
                "verify_iss": True,
                "verify_signature": True
            }
        )
        user = User.query.filter_by(cognito_id=claims['sub']).first()
        if not user:
            # Try to find user by email as fallback
            user_email = claims.get('email')
            if user_email:
                user = User.query.filter_by(email=user_email).first()
                if user:
                    # Update the user's cognito_id to match the JWT
                    user.cognito_id = claims['sub']
                    db.session.commit()
            
            if not user:
                log_security_event('auth_user_not_found', {'cognito_id': claims['sub'][:8] + '...'})
                raise SecurityException(SecurityError.UNAUTHORIZED)
        return user
    except ExpiredSignatureError:
        log_security_event('auth_token_expired')
        raise SecurityException(SecurityError.TOKEN_EXPIRED)
    except JWTClaimsError as e:
        log_security_event('auth_invalid_claims', {'error_type': type(e).__name__})
        raise SecurityException(SecurityError.INVALID_TOKEN)
    except JWTError as e:
        log_security_event('auth_jwt_validation_failed', {'error_type': type(e).__name__})
        raise SecurityException(SecurityError.INVALID_TOKEN)
    except Exception as e:
        log_security_event('auth_unexpected_error', {'error_type': type(e).__name__})
        raise SecurityException(SecurityError.UNAUTHORIZED)

def require_auth(f):
    """
    Decorator to require authentication and handle errors consistently
    """
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            user = get_current_user()
            return f(user, *args, **kwargs)
        except tuple as error_tuple:
            # Handle SecurityError tuples
            if len(error_tuple) == 3:
                return security_error_response(error_tuple)
            else:
                return security_error_response(SecurityError.UNAUTHORIZED)
        except Exception as e:
            log_security_event('auth_decorator_error', {'error': str(e)})
            return security_error_response(SecurityError.UNAUTHORIZED)
    
    return decorated_function
