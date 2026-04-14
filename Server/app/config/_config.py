import logging
import os
from datetime import timedelta

from ._urls import (
    get_docusign_oauth_redirect_uri,
    get_docusign_webhook_connect_url,
    get_frontend_url,
    get_google_redirect_uri,
)
from .aws import (
    AWS_ACCESS_KEY_ID,
    AWS_COGNITO_CLIENT_ID,
    AWS_COGNITO_CLIENT_SECRET,
    AWS_COGNITO_USER_POOL_ID,
    AWS_REGION,
    AWS_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME_PDFS,
    S3_PRESIGNED_URL_EXPIRATION,
)
from .constants import (
    ALLOWED_FILE_TYPES_DEFAULT,
    API_VERSION,
    AWS_COGNITO_TIMEOUT,
    DEV_CORS_ORIGINS_DEFAULT,
    DOCUSIGN_ACCOUNT_ID_DEFAULT,
    DOCUSIGN_BASE_URL_DEFAULT,
    DOCUSIGN_IMPERSONATED_USER_ID_DEFAULT,
    DOCUSIGN_OAUTH_AUTHORIZATION_URL_DEMO,
    DOCUSIGN_OAUTH_AUTHORIZATION_URL_PROD,
    DOCUSIGN_OAUTH_TOKEN_URL_DEMO,
    DOCUSIGN_OAUTH_TOKEN_URL_PROD,
    DOCUSIGN_REST_BASE_URL_DEMO,
    EC2_HOST,
    GOOGLE_CLIENT_ID,
    GOOGLE_SCOPES,
    HTTP_TIMEOUT,
    MAX_CONTENT_LENGTH_DEFAULT,
    PROD_CORS_ORIGINS_DEFAULT,
    REQUEST_TIMEOUT,
    SEND_FILE_MAX_AGE_DEFAULT,
    UPLOAD_FOLDER_DEFAULT,
)
from .database import (
    SQLALCHEMY_DATABASE_URI,
    SQLALCHEMY_ENGINE_OPTIONS,
    SQLALCHEMY_TRACK_MODIFICATIONS,
    database_url,
)
from .error_codes import build_error_codes

logger = logging.getLogger(__name__)


def _optional_stripped_env(var_name: str) -> str | None:
    """Return stripped env value, or None if unset or whitespace-only."""
    raw = os.getenv(var_name)
    if raw is None:
        return None
    stripped = raw.strip()
    return stripped if stripped else None


def _is_testing_env() -> bool:
    return os.getenv("TESTING", "").lower() in ("true", "1", "yes")


class Config:
    # Celery Configuration
    # Use environment variable or detect based on FLASK_ENV
    # In development (local), use localhost; in production (Docker), use redis
    flask_env = os.getenv("FLASK_ENV", "development")
    redis_host = "localhost" if flask_env == "development" else "redis"
    CELERY_URL = os.getenv("CELERY_URL", f"redis://{redis_host}:6379/0")
    CELERY_TRANSPORT_OPTIONS = {"visibility_timeout": 900}

    # Request timeout configuration for long-running AI operations
    REQUEST_TIMEOUT = REQUEST_TIMEOUT
    SEND_FILE_MAX_AGE_DEFAULT = SEND_FILE_MAX_AGE_DEFAULT

    # HTTP request timeout configuration
    HTTP_TIMEOUT = HTTP_TIMEOUT
    AWS_COGNITO_TIMEOUT = AWS_COGNITO_TIMEOUT

    # Flask session signing: production uses AWS secret from env; tests set TESTING=true
    # (see tests/conftest.py) and may run in CI without a .env file.
    _secret_key = _optional_stripped_env("AWS_SECRET_ACCESS_KEY") or _optional_stripped_env(
        "SECRET_KEY"
    )
    if not _secret_key:
        if _is_testing_env():
            _secret_key = "test-secret-key-not-for-production"
        else:
            raise RuntimeError(
                "SECRET_KEY or AWS_SECRET_ACCESS_KEY environment variable must be set"
            )
    SECRET_KEY = _secret_key

    # Database Configuration with SSL support
    # Preferred: set `DATABASE_URL` directly.
    # Fallback: construct from individual env vars if `DATABASE_URL` is not set.
    # Supported environment variables (all optional unless noted):
    #   engine (required if constructing, e.g. "postgres", "postgresql", "mysql")
    #   username (required for remote DB)
    #   password (required for remote DB)
    #   host (required for remote DB, e.g. RDS endpoint)
    #   port (optional, defaults: PostgreSQL=5432, MySQL=3306)
    #   dbInstanceIdentifier (required, database name)
    #   sslmode (optional; e.g., "require", "prefer", "disable")
    database_url = database_url
    SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI
    SQLALCHEMY_TRACK_MODIFICATIONS = SQLALCHEMY_TRACK_MODIFICATIONS
    SQLALCHEMY_ENGINE_OPTIONS = SQLALCHEMY_ENGINE_OPTIONS

    # Flask session cookies for OAuth flow
    SESSION_COOKIE_HTTPONLY = True  # Enable HttpOnly for security
    SESSION_COOKIE_SECURE = os.getenv("FLASK_ENV") == "production"  # Only secure in production
    SESSION_COOKIE_SAMESITE = "Lax"  # Enable SameSite for OAuth redirects
    PERMANENT_SESSION_LIFETIME = timedelta(days=1)  # Set to 1 day
    SESSION_COOKIE_NAME = "silverkey_session"  # Custom session cookie name

    # AWS Cognito Settings
    AWS_REGION = AWS_REGION
    AWS_COGNITO_USER_POOL_ID = AWS_COGNITO_USER_POOL_ID
    AWS_COGNITO_CLIENT_ID = AWS_COGNITO_CLIENT_ID
    AWS_COGNITO_CLIENT_SECRET = AWS_COGNITO_CLIENT_SECRET

    # AWS S3 Settings
    AWS_ACCESS_KEY_ID = AWS_ACCESS_KEY_ID
    AWS_SECRET_ACCESS_KEY = AWS_SECRET_ACCESS_KEY
    # Centralize default bucket name here; avoid hardcoding elsewhere
    S3_BUCKET_NAME_PDFS = S3_BUCKET_NAME_PDFS
    S3_PRESIGNED_URL_EXPIRATION = S3_PRESIGNED_URL_EXPIRATION

    # EC2 Host Configuration
    EC2_HOST = EC2_HOST

    # Google Calendar Settings (OAuth client secret shared with Google sign-in)
    _google_calendar_secret = _optional_stripped_env("GOOGLE_CALENDAR_SECRET")
    if not _google_calendar_secret and _is_testing_env():
        _google_calendar_secret = "test-google-calendar-secret-not-for-production"
    GOOGLE_CALENDAR_SECRET = _google_calendar_secret
    GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID
    # Full Calendar scope (see permissions.constants); required for ACL and sharing flows.
    GOOGLE_SCOPES = GOOGLE_SCOPES

    # Google OAuth Redirect URI - set as class attribute
    GOOGLE_REDIRECT_URI = get_google_redirect_uri()

    # DocuSign (JWT + per-agent OAuth + Connect webhooks)
    DOCUSIGN_INTEGRATION_KEY = os.getenv("DOCUSIGN_INTEGRATION_KEY")
    # DocuSign Apps & Keys → User ID (API account impersonation). Not your app's DB user id.
    DOCUSIGN_IMPERSONATED_USER_ID = os.getenv(
        "DOCUSIGN_IMPERSONATED_USER_ID", DOCUSIGN_IMPERSONATED_USER_ID_DEFAULT
    )
    # JWT: private key PEM or file path. DOCUSIGN_RSA_* names match common secrets-manager layouts.
    DOCUSIGN_PRIVATE_KEY = _optional_stripped_env("DOCUSIGN_PRIVATE_KEY") or _optional_stripped_env(
        "DOCUSIGN_RSA_SECRET"
    )
    # Public key PEM is registered with DocuSign; stored for parity with secrets layouts (JWT uses private only).
    DOCUSIGN_RSA_PUBLIC = _optional_stripped_env("DOCUSIGN_RSA_PUBLIC")
    # RSA keypair id from Apps & Keys (JWT header ``kid``). Required when multiple keys are registered.
    DOCUSIGN_RSA_ID = _optional_stripped_env("DOCUSIGN_RSA_ID")

    # Per-user OAuth: prefer explicit names; fall back to keys used in AWS Secrets Manager JSON
    # (docusign-integration) so oauth_start works without duplicating integration key / secret.
    DOCUSIGN_CLIENT_ID = os.getenv("DOCUSIGN_CLIENT_ID") or os.getenv("DOCUSIGN_INTEGRATION_KEY")
    DOCUSIGN_CLIENT_SECRET = (
        os.getenv("DOCUSIGN_CLIENT_SECRET")
        or os.getenv("DOCUSIGN_USER_CLIENT_SECRET")
        or os.getenv("DOCUSIGN_ORG_CLIENT_SECRET")
    )
    DOCUSIGN_OAUTH_REDIRECT_URI = (
        os.getenv("DOCUSIGN_OAUTH_REDIRECT_URI", "").strip() or get_docusign_oauth_redirect_uri()
    )

    DOCUSIGN_ACCOUNT_ID = os.getenv("DOCUSIGN_ACCOUNT_ID", DOCUSIGN_ACCOUNT_ID_DEFAULT)
    _raw_docusign_base_url = os.getenv("DOCUSIGN_BASE_URL", DOCUSIGN_BASE_URL_DEFAULT)

    _docusign_is_production = (
        os.getenv("FLASK_ENV") == "production" and "demo" not in _raw_docusign_base_url.lower()
    )
    # Demo OAuth (account-d) issues tokens that prod REST (*.docusign.net except demo) rejects.
    if not _docusign_is_production and "demo.docusign.net" not in _raw_docusign_base_url.lower():
        logger.warning(
            "DOCUSIGN_BASE_URL %s does not match demo OAuth; using %s (set DOCUSIGN_BASE_URL in "
            "production with FLASK_ENV=production for regional prod REST).",
            _raw_docusign_base_url,
            DOCUSIGN_REST_BASE_URL_DEMO,
        )
        DOCUSIGN_BASE_URL = DOCUSIGN_REST_BASE_URL_DEMO
    else:
        DOCUSIGN_BASE_URL = _raw_docusign_base_url
    DOCUSIGN_OAUTH_AUTHORIZATION_URL = (
        DOCUSIGN_OAUTH_AUTHORIZATION_URL_PROD
        if _docusign_is_production
        else DOCUSIGN_OAUTH_AUTHORIZATION_URL_DEMO
    )
    DOCUSIGN_OAUTH_TOKEN_URL = (
        DOCUSIGN_OAUTH_TOKEN_URL_PROD if _docusign_is_production else DOCUSIGN_OAUTH_TOKEN_URL_DEMO
    )

    DOCUSIGN_WEBHOOK_CONNECT_URL = get_docusign_webhook_connect_url()

    # Shared Connect HMAC secret fallback:
    # allows a single env var to back both user/account and org webhook verification.
    DOCUSIGN_CONNECT_HMAC_SECRET = os.getenv("DOCUSIGN_CONNECT_HMAC_SECRET")
    DOCUSIGN_USER_CONNECT_HMAC_SECRET = (
        os.getenv("DOCUSIGN_USER_CONNECT_HMAC_SECRET") or DOCUSIGN_CONNECT_HMAC_SECRET
    )
    DOCUSIGN_ORG_CONNECT_HMAC_SECRET = (
        os.getenv("DOCUSIGN_ORG_CONNECT_HMAC_SECRET") or DOCUSIGN_CONNECT_HMAC_SECRET
    )

    DOCUSIGN_CONNECT_OAUTH_ENABLED = (
        os.getenv("DOCUSIGN_CONNECT_OAUTH_ENABLED", "false").lower() == "true"
    )
    DOCUSIGN_CONNECT_OAUTH_ISSUER = os.getenv("DOCUSIGN_CONNECT_OAUTH_ISSUER")
    DOCUSIGN_CONNECT_OAUTH_AUDIENCE = os.getenv("DOCUSIGN_CONNECT_OAUTH_AUDIENCE")

    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", UPLOAD_FOLDER_DEFAULT)
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", MAX_CONTENT_LENGTH_DEFAULT))
    ALLOWED_FILE_TYPES = ALLOWED_FILE_TYPES_DEFAULT

    # Set the frontend URL
    FRONTEND_URL = get_frontend_url()

    # CORS Origins Configuration
    # Support comma-separated CORS_ORIGINS environment variable
    cors_origins_env = os.getenv("CORS_ORIGINS")
    if cors_origins_env:
        CORS_ORIGINS = [origin.strip() for origin in cors_origins_env.split(",")]
    else:
        # Default origins based on environment
        flask_env = os.getenv("FLASK_ENV", "development")
        if flask_env == "production":
            CORS_ORIGINS = PROD_CORS_ORIGINS_DEFAULT
        else:
            # Development: localhost:5173. For DocuSign embedded signing via an HTTPS tunnel,
            # set CORS_ORIGINS to include it, e.g. https://….ngrok-free.app,http://localhost:5173
            CORS_ORIGINS = DEV_CORS_ORIGINS_DEFAULT

    API_BASE_URL = f"/api/{API_VERSION}"

    ERROR_CODES = build_error_codes(MAX_CONTENT_LENGTH)

    @classmethod
    def get_error_code(cls, code_name):
        return cls.ERROR_CODES.get(code_name, cls.ERROR_CODES["SERVER_ERROR"])

    def __getattr__(self, name):
        # Allow accessing config values as attributes
        return getattr(self, name)

    def __getitem__(self, name):
        # Allow accessing config values as dictionary keys
        return getattr(self, name)
