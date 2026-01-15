"""
Common code patterns and utilities to reduce repetition across the application.
"""
import json
from functools import wraps
from flask import jsonify, request
from app.services.auth.current_user import get_current_user
from app.utils.security.app_logging import get_logger
from app.utils.security.secure_errors import SecureErrorHandler

logger = get_logger()


def safe_json_loads(value, default=None):
    """
    Safely parse JSON string or return default value.
    Handles string parsing, type checking, and error cases.
    
    Args:
        value: Value to parse (string, dict, list, or None)
        default: Default value to return if parsing fails or value is None/empty
        
    Returns:
        Parsed JSON value or default
    """
    if not value:
        return default
    
    # If already a dict or list, return as-is
    if isinstance(value, (dict, list)):
        return value
    
    # If not a string, return default
    if not isinstance(value, str):
        return default
    
    # Try to parse JSON string
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError, ValueError):
        return default

def require_authenticated_user(f):
    """
    Decorator that handles user authentication and returns standardized error responses.
    Eliminates the repeated pattern of get_current_user() + error handling.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            user = get_current_user()
            if not user:
                logger.warning(f"🚫 Unauthorized request to {f.__name__}: user not found in token")
                return jsonify({'error': 'Unauthorized', 'success': False}), 401
            
            # Pass user as first argument to the decorated function
            return f(user, *args, **kwargs)
            
        except Exception as e:
            logger.error(f"❌ Authentication error in {f.__name__}: {str(e)}")
            return SecureErrorHandler.handle_database_error(e, {
                'function': f.__name__,
                'endpoint': request.endpoint
            })
    
    return decorated_function

def validate_json_request(required_fields=None):
    """
    Decorator that validates JSON request data and required fields.
    Eliminates repeated JSON validation patterns.
    
    Args:
        required_fields: List of required field names
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check if request has JSON data
            if not request.is_json:
                logger.warning(f"🚫 Non-JSON request to {f.__name__}")
                return jsonify({'error': 'Content-Type must be application/json', 'success': False}), 400
            
            data = request.get_json()
            if not data:
                logger.warning(f"🚫 Empty JSON data in request to {f.__name__}")
                return jsonify({'error': 'No data provided', 'success': False}), 400
            
            # Validate required fields
            if required_fields:
                missing_fields = [field for field in required_fields if not data.get(field)]
                if missing_fields:
                    logger.warning(f"🚫 Missing required fields in {f.__name__}: {missing_fields}")
                    return jsonify({
                        'error': f'Missing required fields: {", ".join(missing_fields)}',
                        'success': False
                    }), 400
            
            # Pass data as first argument to the decorated function
            return f(data, *args, **kwargs)
        
        return decorated_function
    return decorator

def handle_exceptions_with_logging(f):
    """
    Decorator that provides consistent exception handling and logging.
    Eliminates repeated try/except patterns.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            logger.warning(f"⚠️ Validation error in {f.__name__}: {str(e)}")
            return jsonify({'error': str(e), 'success': False}), 400
        except Exception as e:
            logger.error(f"❌ Unexpected error in {f.__name__}: {str(e)}")
            return SecureErrorHandler.handle_database_error(e, {
                'function': f.__name__,
                'endpoint': request.endpoint
            })
    
    return decorated_function

def require_agent_access(f):
    """
    Decorator that ensures the user is an agent and has access to the specified client.
    Eliminates repeated agent authorization patterns.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Get the current authenticated user
            user = get_current_user()
            if not user:
                logger.warning(f"🚫 Unauthorized request to {f.__name__}: user not found in token")
                return jsonify({'error': 'Unauthorized', 'success': False}), 401
            
            # Check if user is an agent
            if not user.is_agent:
                logger.warning(f"🚫 Non-agent user {user.id} attempted to access agent endpoint {f.__name__}")
                return jsonify({'error': 'Only agents can access this endpoint', 'success': False}), 403
            
            # If there's a target_user_id in the request, validate agent has access
            # Use silent=True to avoid raising exceptions on empty/invalid JSON
            data = request.get_json(silent=True) or {}
            # Also check query parameters for GET requests
            target_user_id = (
                data.get('user_id') or 
                data.get('target_user_id') or 
                request.args.get('user_id') or 
                request.args.get('target_user_id')
            )
            
            if target_user_id:
                try:
                    client_ids = safe_json_loads(user.client_ids, default=[])
                    
                    if target_user_id not in client_ids:
                        logger.warning(f"🚫 Agent {user.id} attempted to access client {target_user_id} not in their list")
                        return jsonify({'error': 'Access denied: User is not your client', 'success': False}), 403
                                    
                except (json.JSONDecodeError, TypeError) as e:
                    logger.error(f"❌ Failed to parse agent's client_ids: {str(e)}")
                    return jsonify({'error': 'Invalid agent client configuration', 'success': False}), 500
            
            # Pass user as first argument to the decorated function
            return f(user, *args, **kwargs)
            
        except Exception as e:
            logger.error(f"❌ Authentication/authorization error in {f.__name__}: {str(e)}")
            return SecureErrorHandler.handle_database_error(e, {
                'function': f.__name__,
                'endpoint': request.endpoint
            })
    
    return decorated_function

def standardize_success_response(data=None, message="Success", status_code=200):
    """
    Create standardized success response format.
    Eliminates repeated success response patterns.
    """
    response = {
        'success': True,
        'message': message
    }
    
    if data is not None:
        if isinstance(data, dict):
            response.update(data)
        else:
            response['data'] = data
    
    return jsonify(response), status_code

def standardize_error_response(error_message, status_code=400, error_code=None):
    """
    Create standardized error response format.
    Eliminates repeated error response patterns.
    """
    response = {
        'success': False,
        'error': error_message
    }
    
    if error_code:
        response['error_code'] = error_code
    
    return jsonify(response), status_code

# Combined decorator for common route patterns
def api_route(require_auth=True, require_json=False, required_fields=None, require_agent=False):
    """
    Combined decorator that handles the most common route patterns.
    
    Args:
        require_auth: Whether to require user authentication
        require_json: Whether to require JSON request data
        required_fields: List of required JSON fields
        require_agent: Whether to require agent authorization
    """
    def decorator(f):
        # Apply decorators in reverse order (innermost first)
        decorated = f
        
        # Exception handling (outermost)
        decorated = handle_exceptions_with_logging(decorated)
        
        # Agent access check
        if require_agent:
            decorated = require_agent_access(decorated)
        
        # JSON validation
        if require_json:
            decorated = validate_json_request(required_fields)(decorated)
        
        # Authentication (innermost for routes that need it)
        if require_auth:
            decorated = require_authenticated_user(decorated)
        
        return decorated
    
    return decorator
