import os
from datetime import timedelta
from urllib.parse import quote_plus
import logging

from ._constants_api import API_VERSION
from ._constants_cors import DEV_CORS_ORIGINS_DEFAULT, PROD_CORS_ORIGINS_DEFAULT
from ._constants_docusign import (
    DOCUSIGN_BASE_URL_DEFAULT,
    DOCUSIGN_IMPERSONATED_USER_ID_DEFAULT,
    DOCUSIGN_ACCOUNT_ID_DEFAULT,
)
from ._constants_google import GOOGLE_CLIENT_ID, GOOGLE_SCOPES
from ._constants_hosts import EC2_HOST
from ._constants_timeouts import (
    AWS_COGNITO_TIMEOUT,
    HTTP_TIMEOUT,
    REQUEST_TIMEOUT,
    SEND_FILE_MAX_AGE_DEFAULT,
)
from ._constants_uploads import (
    ALLOWED_FILE_TYPES_DEFAULT,
    MAX_CONTENT_LENGTH_DEFAULT,
    UPLOAD_FOLDER_DEFAULT,
)
from ._urls import get_frontend_url, get_google_redirect_uri, get_docusign_webhook_connect_url, get_docusign_oauth_redirect_uri
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
from .database import (
    SQLALCHEMY_DATABASE_URI,
    SQLALCHEMY_ENGINE_OPTIONS,
    SQLALCHEMY_TRACK_MODIFICATIONS,
    database_url,
)
from .error_codes import build_error_codes

logger = logging.getLogger(__name__)


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

    SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
    if not SECRET_KEY:
        raise RuntimeError("AWS_SECRET_ACCESS_KEY environment variable must be set")

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

    # Google Calendar Settings
    GOOGLE_CALENDAR_SECRET = os.getenv("GOOGLE_CALENDAR_SECRET")
    GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID
    # Use calendar.app.created (non-sensitive scope) - allows managing only calendars/events created by the app
    # This scope does NOT require OAuth verification
    # NOTE: This should match permissions['calendar_app_created']['scope_url'] from
    # app.services.calendar.permissions.constants. The service validates this at runtime.
    GOOGLE_SCOPES = GOOGLE_SCOPES

    # Google OAuth Redirect URI - set as class attribute
    GOOGLE_REDIRECT_URI = get_google_redirect_uri()

    # DocuSign Configuration
    # JWT Authentication (for system/service account operations)
    # Use either DOCUSIGN_PRIVATE_KEY (direct key content) or DOCUSIGN_PRIVATE_KEY_PATH (path to .pem file)
    DOCUSIGN_INTEGRATION_KEY = os.getenv('DOCUSIGN_INTEGRATION_KEY')  # For JWT auth
    DOCUSIGN_IMPERSONATED_USER_ID = os.getenv('DOCUSIGN_IMPERSONATED_USER_ID', DOCUSIGN_IMPERSONATED_USER_ID_DEFAULT)  # For JWT
    DOCUSIGN_PRIVATE_KEY = os.getenv('DOCUSIGN_PRIVATE_KEY')  # Private key content (preferred for Docker/cloud)
    DOCUSIGN_PRIVATE_KEY_PATH = os.getenv('DOCUSIGN_PRIVATE_KEY_PATH')  # Path to private key file (optional)
    
    # OAuth Authentication (for per-agent operations - agents connecting their DocuSign accounts)
    DOCUSIGN_CLIENT_ID = os.getenv('DOCUSIGN_CLIENT_ID')  # For OAuth (same as integration key)
    DOCUSIGN_CLIENT_SECRET = os.getenv('DOCUSIGN_CLIENT_SECRET')  # For OAuth
    DOCUSIGN_OAUTH_REDIRECT_URI = get_docusign_oauth_redirect_uri()
    
    # DocuSign Account
    DOCUSIGN_ACCOUNT_ID = os.getenv('DOCUSIGN_ACCOUNT_ID', DOCUSIGN_ACCOUNT_ID_DEFAULT)
    DOCUSIGN_BASE_URL = os.getenv('DOCUSIGN_BASE_URL', DOCUSIGN_BASE_URL_DEFAULT)
    
    # Determine OAuth URLs based on environment (demo vs production)
    from ._constants_docusign import (
        DOCUSIGN_OAUTH_AUTHORIZATION_URL_DEMO,
        DOCUSIGN_OAUTH_TOKEN_URL_DEMO,
        DOCUSIGN_OAUTH_AUTHORIZATION_URL_PROD,
        DOCUSIGN_OAUTH_TOKEN_URL_PROD
    )
    is_production = os.getenv('FLASK_ENV') == 'production' and 'demo' not in DOCUSIGN_BASE_URL.lower()
    DOCUSIGN_OAUTH_AUTHORIZATION_URL = DOCUSIGN_OAUTH_AUTHORIZATION_URL_PROD if is_production else DOCUSIGN_OAUTH_AUTHORIZATION_URL_DEMO
    DOCUSIGN_OAUTH_TOKEN_URL = DOCUSIGN_OAUTH_TOKEN_URL_PROD if is_production else DOCUSIGN_OAUTH_TOKEN_URL_DEMO
    
    # Webhook Configuration
    # Connect Configuration ID 22035309 is managed in DocuSign UI
    DOCUSIGN_WEBHOOK_CONNECT_URL = get_docusign_webhook_connect_url()
    
    # HMAC Secrets (for webhook signature verification)
    DOCUSIGN_USER_CONNECT_HMAC_SECRET = os.getenv('DOCUSIGN_USER_CONNECT_HMAC_SECRET')  # Account-level Connect
    DOCUSIGN_ORG_CONNECT_HMAC_SECRET = os.getenv('DOCUSIGN_ORG_CONNECT_HMAC_SECRET')  # Org-level Connect
    
    # OAuth for Connect (Webhook Authentication - Optional)
    # This is for DocuSign to authenticate TO YOUR webhook endpoint using OAuth Client Credentials
    # Requires setting up YOUR OWN OAuth 2.0 authorization server (Azure AD, Okta, Auth0, custom)
    # Leave blank to use HMAC-only authentication (recommended for v1)
    DOCUSIGN_CONNECT_OAUTH_ENABLED = os.getenv('DOCUSIGN_CONNECT_OAUTH_ENABLED', 'false').lower() == 'true'
    DOCUSIGN_CONNECT_OAUTH_ISSUER = os.getenv('DOCUSIGN_CONNECT_OAUTH_ISSUER')  # e.g., https://login.microsoftonline.com/{tenant-id}/v2.0
    DOCUSIGN_CONNECT_OAUTH_AUDIENCE = os.getenv('DOCUSIGN_CONNECT_OAUTH_AUDIENCE')  # e.g., api://your-api-id or https://usesilverkey.com

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
            # Development: include localhost:5173 (Vite dev server)
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

