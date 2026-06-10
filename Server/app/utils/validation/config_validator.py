"""
Configuration validation utility for startup validation of required environment variables.
"""

import os
import re
from pathlib import Path

from logger import log

# Path to .env.example file (Server/.env.example)
ENV_EXAMPLE_PATH = Path(__file__).resolve().parents[3] / ".env.example"


def _load_env_example_keys() -> set[str]:
    """
    Load all environment variable keys from .env.example file.

    Returns:
        Set of environment variable names found in .env.example
    """
    env_keys = set()

    if not ENV_EXAMPLE_PATH.exists():
        log.warn(
            "API",
            ".env.example file not found; using fallback required variables",
            {"path": str(ENV_EXAMPLE_PATH)},
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
                    # Client bundle vars (Expo/Vite) live in Client/.env — skip if ever present here.
                    if key.startswith(("EXPO_PUBLIC_", "VITE_")):
                        continue
                    env_keys.add(key)

        if env_keys:
            log.info(
                "API",
                "Loaded required environment variables from .env.example",
                {"count": len(env_keys), "path": str(ENV_EXAMPLE_PATH)},
            )
        else:
            log.warn(
                "API",
                "No environment variables found in .env.example",
                {"path": str(ENV_EXAMPLE_PATH)},
            )
    except Exception as e:
        log.error("ERRORS", "Error reading .env.example file", {"error": str(e)})

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
        log.warn("API", "No required environment variables defined; check .env.example file")
        return True, []

    missing_vars = []

    for var_name in REQUIRED_ENV_VARS:
        value = os.getenv(var_name)
        if not value:
            missing_vars.append(var_name)
            log.error(
                "ERRORS",
                "Missing required environment variable",
                {"variable": var_name},
            )

    if missing_vars:
        log.error(
            "ERRORS",
            "Missing required environment variables from .env.example",
            {
                "missing_count": len(missing_vars),
                "total_required": len(REQUIRED_ENV_VARS),
            },
        )
        return False, missing_vars

    log.info(
        "API",
        "All required environment variables are set",
        {"count": len(REQUIRED_ENV_VARS)},
    )
    return True, []


def validate_and_raise() -> None:
    """
    Validate environment variables and raise RuntimeError if any are missing.
    Required variables are loaded from .env.example file.
    This should be called at application startup.
    """
    from app.utils.migrate_mode import is_migrate_only
    from app.utils.testing_mode import is_testing

    if is_migrate_only():
        log.info(
            "API",
            "Skipping .env.example validation (SILVERKEY_MIGRATE_ONLY)",
        )
        return

    if is_testing():
        log.info(
            "API",
            "Skipping .env.example validation (TESTING)",
        )
        return

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
