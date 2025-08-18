from flask import jsonify, current_app
from functools import wraps
import time
from collections import defaultdict, deque
import threading

# Thread-safe rate limiting storage
rate_limit_storage = defaultdict(lambda: deque())
storage_lock = threading.Lock()

class SecurityError:
    """Standardized security error codes and messages"""
    
    # Authentication errors
    UNAUTHORIZED = ("UNAUTHORIZED", "Authentication required", 401)
    INVALID_TOKEN = ("INVALID_TOKEN", "Authentication required", 401)
    TOKEN_EXPIRED = ("TOKEN_EXPIRED", "Authentication required", 401)
    
    # Authorization errors
    FORBIDDEN = ("FORBIDDEN", "Access denied", 403)
    INSUFFICIENT_PERMISSIONS = ("INSUFFICIENT_PERMISSIONS", "Access denied", 403)
    
    # Rate limiting
    RATE_LIMIT_EXCEEDED = ("RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later.", 429)
    
    # General errors
    INVALID_REQUEST = ("INVALID_REQUEST", "Invalid request format", 400)
    RESOURCE_NOT_FOUND = ("RESOURCE_NOT_FOUND", "Resource not found", 404)
    SERVER_ERROR = ("SERVER_ERROR", "Internal server error", 500)
    
    # Validation errors
    MISSING_FIELDS = ("MISSING_FIELDS", "Required fields are missing", 400)
    INVALID_INPUT = ("INVALID_INPUT", "Invalid input provided", 400)

def security_error_response(error_type, additional_info=None):
    """
    Create standardized security error response that doesn't leak sensitive information
    
    Args:
        error_type: Tuple of (error_code, user_message, http_status)
        additional_info: Optional dict with non-sensitive additional info
    """
    error_code, user_message, status_code = error_type
    
    response = {
        'success': False,
        'error': error_code,
        'message': user_message
    }
    
    if additional_info and isinstance(additional_info, dict):
        # Only include non-sensitive additional info
        safe_keys = ['field_errors', 'validation_errors', 'retry_after']
        for key, value in additional_info.items():
            if key in safe_keys:
                response[key] = value
    
    return jsonify(response), status_code

def auth_error_response(message="Authentication required"):
    """Standardized authentication error response"""
    return security_error_response(SecurityError.UNAUTHORIZED)

def rate_limit(max_requests=10, window_seconds=60, per='ip'):
    """
    Rate limiting decorator
    
    Args:
        max_requests: Maximum requests allowed in the time window
        window_seconds: Time window in seconds
        per: Rate limit per 'ip' or 'user' (default: 'ip')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import request
            
            # Determine the key for rate limiting
            if per == 'ip':
                key = f"rate_limit:{request.remote_addr}:{request.endpoint}"
            elif per == 'user':
                # Try to get user from auth header for user-based limiting
                auth_header = request.headers.get('Authorization', '')
                if auth_header.startswith('Bearer '):
                    # Use a hash of the token for privacy
                    import hashlib
                    token_hash = hashlib.sha256(auth_header.encode()).hexdigest()[:16]
                    key = f"rate_limit:user:{token_hash}:{request.endpoint}"
                else:
                    # Fall back to IP if no auth
                    key = f"rate_limit:{request.remote_addr}:{request.endpoint}"
            else:
                key = f"rate_limit:{request.remote_addr}:{request.endpoint}"
            
            current_time = time.time()
            
            with storage_lock:
                # Get the request times for this key
                request_times = rate_limit_storage[key]
                
                # Remove old requests outside the window
                while request_times and request_times[0] < current_time - window_seconds:
                    request_times.popleft()
                
                # Check if we've exceeded the limit
                if len(request_times) >= max_requests:
                    current_app.logger.warning(f"Rate limit exceeded for {key}")
                    return security_error_response(
                        SecurityError.RATE_LIMIT_EXCEEDED,
                        {'retry_after': window_seconds}
                    )
                
                # Add current request time
                request_times.append(current_time)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def log_security_event(event_type, details=None, user_id=None):
    """
    Log security events for monitoring
    
    Args:
        event_type: Type of security event (e.g., 'auth_failure', 'rate_limit_exceeded')
        details: Additional details (non-sensitive)
        user_id: User ID if available
    """
    from flask import request
    
    log_data = {
        'event_type': event_type,
        'ip': request.remote_addr,
        'user_agent': request.headers.get('User-Agent', 'Unknown'),
        'endpoint': request.endpoint,
        'method': request.method,
        'timestamp': time.time()
    }
    
    if user_id:
        log_data['user_id'] = user_id
    
    if details:
        log_data['details'] = details
    
    current_app.logger.warning(f"🔒 SECURITY EVENT: {event_type} - {log_data}")

def safe_user_lookup_error():
    """
    Return a safe error response for user lookup failures
    This prevents user enumeration attacks
    """
    return security_error_response(SecurityError.UNAUTHORIZED)

def validate_required_fields(data, required_fields):
    """
    Validate required fields and return standardized error response
    
    Args:
        data: Request data dict
        required_fields: List of required field names
    
    Returns:
        None if valid, or error response tuple if invalid
    """
    if not data:
        return security_error_response(SecurityError.INVALID_REQUEST)
    
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    
    if missing_fields:
        return security_error_response(
            SecurityError.MISSING_FIELDS,
            {'field_errors': missing_fields}
        )
    
    return None
