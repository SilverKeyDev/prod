"""
Google Calendar OAuth Security Utilities
"""

import re
from typing import Dict, Any, Optional
from ..utils.app_logging import get_logger

logger = get_logger()

# Sensitive keys that should be redacted from logs
SENSITIVE_KEYS = {
    'access_token',
    'refresh_token',
    'client_secret',
    'code',
    'state',
    'token',
}

# PII patterns for redaction
PII_PATTERNS = {
    'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    'phone': r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
    'ssn': r'\b\d{3}-\d{2}-\d{4}\b',
}


def redact_sensitive_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Redact sensitive data from dictionaries for safe logging.
    
    Args:
        data: Dictionary to redact
        
    Returns:
        Dictionary with sensitive values redacted
    """
    redacted = {}
    
    for key, value in data.items():
        if key.lower() in SENSITIVE_KEYS:
            redacted[key] = '[REDACTED]'
        elif isinstance(value, dict):
            redacted[key] = redact_sensitive_data(value)
        elif isinstance(value, str) and len(value) > 50:
            # Truncate long strings
            redacted[key] = value[:50] + '...'
        else:
            redacted[key] = value
    
    return redacted


def redact_pii(text: str) -> str:
    """
    Redact PII from text strings.
    
    Args:
        text: Text to redact
        
    Returns:
        Text with PII redacted
    """
    redacted_text = text
    
    for pii_type, pattern in PII_PATTERNS.items():
        redacted_text = re.sub(pattern, f'[{pii_type.upper()}_REDACTED]', redacted_text)
    
    return redacted_text


def validate_oauth_state(state: str, session_state: Optional[str]) -> bool:
    """
    Validate OAuth state parameter for CSRF protection.
    
    Args:
        state: State parameter from request
        session_state: State stored in session
        
    Returns:
        True if state is valid, False otherwise
    """
    if not state or not session_state:
        logger.warning("OAuth state validation failed: missing state")
        return False
    
    if state != session_state:
        logger.warning("OAuth state validation failed: state mismatch")
        return False
    
    return True


def sanitize_error_message(error: Exception) -> str:
    """
    Sanitize error messages to remove sensitive information.
    
    Args:
        error: Exception to sanitize
        
    Returns:
        Sanitized error message
    """
    error_msg = str(error)
    
    # Remove common sensitive patterns
    error_msg = re.sub(r'token=[^&\s]+', 'token=[REDACTED]', error_msg)
    error_msg = re.sub(r'client_secret=[^&\s]+', 'client_secret=[REDACTED]', error_msg)
    error_msg = re.sub(r'code=[^&\s]+', 'code=[REDACTED]', error_msg)
    
    # Redact PII
    error_msg = redact_pii(error_msg)
    
    return error_msg


def log_oauth_event(event_type: str, user_id: Optional[str] = None, **kwargs):
    """
    Log OAuth events with proper redaction.
    
    Args:
        event_type: Type of OAuth event
        user_id: User identifier (optional)
        **kwargs: Additional event data
    """
    log_data = {
        'event_type': event_type,
        'user_id': user_id,
        **redact_sensitive_data(kwargs)
    }
    
    logger.info(f"GOOGLE_OAUTH_{event_type.upper()}", extra=log_data)


def validate_event_data(event_data: Dict[str, Any]) -> bool:
    """
    Validate Google Calendar event data.
    
    Args:
        event_data: Event data to validate
        
    Returns:
        True if valid, False otherwise
    """
    required_fields = ['summary', 'start', 'end']
    
    for field in required_fields:
        if field not in event_data:
            logger.warning(f"Event validation failed: missing required field '{field}'")
            return False
    
    # Validate start/end structure
    if not isinstance(event_data['start'], dict) or 'dateTime' not in event_data['start']:
        logger.warning("Event validation failed: invalid start time structure")
        return False
    
    if not isinstance(event_data['end'], dict) or 'dateTime' not in event_data['end']:
        logger.warning("Event validation failed: invalid end time structure")
        return False
    
    # Validate datetime format (basic ISO 8601 check)
    datetime_pattern = r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}'
    if not re.match(datetime_pattern, event_data['start']['dateTime']):
        logger.warning("Event validation failed: invalid start datetime format")
        return False
    
    if not re.match(datetime_pattern, event_data['end']['dateTime']):
        logger.warning("Event validation failed: invalid end datetime format")
        return False
    
    return True
