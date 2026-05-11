"""
Configuration validation utility for startup validation of required environment variables.
"""

import logging
import os
import re
from pathlib import Path

logger = logging.getLogger(__name__)

# Path to .env.example file (relative to Server directory)
ENV_EXAMPLE_PATH = Path(__file__).resolve().parents[3] / "config" / ".env.example"


def _load_env_example_keys() -> set[str]:
    """
    Load all environment variable keys from .env.example file.

    Returns:
        Set of environment variable names found in .env.example
    """
    env_keys = set()

    if not ENV_EXAMPLE_PATH.exists():
        logger.warning(
            f".env.example file not found at {ENV_EXAMPLE_PATH}. Using fallback required variables."
        )
        return env_keys

    try:
        with open(ENV_EXAMPLE_PATH, encoding="utf-8") as f:
            for line in f:
                # Strip whitespace and comments
                line = line.strip()
                if not line or line.startswith("#"):
                    continue

                # Match KEY= or KEY=VALUE patterns
                # This regex matches: optional whitespace, key name, optional =value
                match = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s*=", line)
                if match:
                    key = match.group(1)
                    env_keys.add(key)

        if env_keys:
            logger.info(
                f"Loaded {len(env_keys)} required environment variables from {ENV_EXAMPLE_PATH}"
            )
        else:
            logger.warning(f"No environment variables found in {ENV_EXAMPLE_PATH}")
    except Exception as e:
        logger.error(f"Error reading .env.example file: {e}")

    return env_keys


# Load required environment variables from .env.example
REQUIRED_ENV_VARS = sorted(_load_env_example_keys())

# Optional but recommended environment variables (not in .env.example but useful)
OPTIONAL_ENV_VARS = [
    "FLASK_ENV",
    "AWS_REGION",
    "CORS_ORIGINS",
    "CELERY_URL",
    "S3_PRESIGNED_URL_EXPIRATION",
    "UPLOAD_FOLDER",
    "MAX_CONTENT_LENGTH",
    # Viewing itinerary routes (route_builder); only needed when that feature runs.
    "GOOGLE_MAPS_SERVER_KEY",
]


def validate_environment() -> tuple[bool, list[str]]:
    """
    Validate that all required environment variables are set.
    Required variables are loaded from .env.example file.

    Returns:
        Tuple of (is_valid, missing_vars) where:
        - is_valid: True if all required vars are set, False otherwise
        - missing_vars: List of missing required environment variable names
    """
    if not REQUIRED_ENV_VARS:
        logger.warning("No required environment variables defined. Check .env.example file.")
        return True, []

    missing_vars = []

    for var_name in REQUIRED_ENV_VARS:
        value = os.getenv(var_name)
        if not value:
            missing_vars.append(var_name)
            logger.error(f"Missing required environment variable: {var_name}")

    if missing_vars:
        logger.error(
            f"Missing {len(missing_vars)} required environment variable(s) "
            f"(out of {len(REQUIRED_ENV_VARS)} total from .env.example)"
        )
        return False, missing_vars

    logger.info(
        f"All {len(REQUIRED_ENV_VARS)} required environment variables are set (validated against .env.example)"
    )
    return True, []


def validate_and_raise() -> None:
    """
    Validate environment variables and raise RuntimeError if any are missing.
    Required variables are loaded from .env.example file.
    This should be called at application startup.
    """
    is_valid, missing_vars = validate_environment()

    if not is_valid:
        error_msg = (
            f"Missing required environment variables (from .env.example): {', '.join(missing_vars)}. "
            f"Please set these variables before starting the application. "
            f"Reference: {ENV_EXAMPLE_PATH}"
        )
        raise RuntimeError(error_msg)


def get_environment_summary() -> dict:
    """
    Get a summary of environment variable status.

    Returns:
        Dictionary with 'required' and 'optional' keys containing status info
    """
    is_valid, missing_vars = validate_environment()

    # Count how many optional vars are set
    optional_set = sum(1 for var in OPTIONAL_ENV_VARS if os.getenv(var))

    return {
        "required": {
            "valid": is_valid,
            "missing": missing_vars,
            "total": len(REQUIRED_ENV_VARS),
            "set": len(REQUIRED_ENV_VARS) - len(missing_vars),
        },
        "optional": {"total": len(OPTIONAL_ENV_VARS), "set": optional_set},
        "env_example_path": str(ENV_EXAMPLE_PATH),
    }
