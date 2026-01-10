"""
Configuration validation utility for startup validation of required environment variables.
"""
import os
import logging
from typing import List, Tuple

logger = logging.getLogger(__name__)

# Required environment variables for the application
REQUIRED_ENV_VARS = [
    'DATABASE_URL',
    'AWS_COGNITO_USER_POOL_ID',
    'AWS_COGNITO_CLIENT_ID',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'GOOGLE_CLIENT_ID',
]

# Optional but recommended environment variables
OPTIONAL_ENV_VARS = [
    'FLASK_ENV',
    'AWS_REGION',
    'AWS_COGNITO_CLIENT_SECRET',
    'GOOGLE_CALENDAR_SECRET',
    'CORS_ORIGINS',
    'CELERY_URL',
    'S3_PRESIGNED_URL_EXPIRATION',
    'UPLOAD_FOLDER',
    'MAX_CONTENT_LENGTH',
]


def validate_environment() -> Tuple[bool, List[str]]:
    """
    Validate that all required environment variables are set.
    
    Returns:
        Tuple of (is_valid, missing_vars) where:
        - is_valid: True if all required vars are set, False otherwise
        - missing_vars: List of missing required environment variable names
    """
    missing_vars = []
    
    for var_name in REQUIRED_ENV_VARS:
        value = os.getenv(var_name)
        if not value:
            missing_vars.append(var_name)
            logger.error(f"Missing required environment variable: {var_name}")
    
    if missing_vars:
        logger.error(f"Missing {len(missing_vars)} required environment variable(s)")
        return False, missing_vars
    
    logger.info("All required environment variables are set")
    return True, []



def validate_and_raise() -> None:
    """
    Validate environment variables and raise RuntimeError if any are missing.
    This should be called at application startup.
    """
    is_valid, missing_vars = validate_environment()
    
    if not is_valid:
        error_msg = (
            f"Missing required environment variables: {', '.join(missing_vars)}. "
            "Please set these variables before starting the application."
        )
        raise RuntimeError(error_msg)


def get_environment_summary() -> dict:
    """
    Get a summary of environment variable status.
    
    Returns:
        Dictionary with 'required' and 'optional' keys containing status info
    """
    is_valid, missing_vars = validate_environment()
    
    return {
        'required': {
            'valid': is_valid,
            'missing': missing_vars,
            'total': len(REQUIRED_ENV_VARS),
            'set': len(REQUIRED_ENV_VARS) - len(missing_vars)
        },
        'optional': {
            'total': len(OPTIONAL_ENV_VARS),
            'set': len(OPTIONAL_ENV_VARS) - len(missing_vars)
        }
    }
