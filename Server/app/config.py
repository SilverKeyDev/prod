import os
from dotenv import load_dotenv
from datetime import timedelta
from urllib.parse import quote_plus
import logging

logger = logging.getLogger(__name__)

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))

# Ensure instance directory exists
instance_dir = os.path.join(basedir, 'instance')
os.makedirs(instance_dir, exist_ok=True)

class Config:

    # Celery Configuration
    # Use environment variable or detect based on FLASK_ENV
    # In development (local), use localhost; in production (Docker), use redis
    flask_env = os.getenv('FLASK_ENV', 'development')
    redis_host = 'localhost' if flask_env == 'development' else 'redis'
    CELERY_URL = os.getenv('CELERY_URL', f'redis://{redis_host}:6379/0')
    CELERY_TRANSPORT_OPTIONS = {
        'visibility_timeout': 900
    }
    
    # Request timeout configuration for long-running AI operations
    REQUEST_TIMEOUT = 300  # 5 minutes for AI strategy generation
    SEND_FILE_MAX_AGE_DEFAULT = 300
    
    # HTTP request timeout configuration
    HTTP_TIMEOUT = 300  # 5 minutes for HTTP requests
    AWS_COGNITO_TIMEOUT = 300  # 5 minutes for Cognito operations
    

    SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
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
    database_url = os.getenv('DATABASE_URL')    
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configure engine options based on database type
    if database_url.startswith('sqlite://'):
        # SQLite-specific configuration
        SQLALCHEMY_ENGINE_OPTIONS = {
            'pool_pre_ping': True,
            'pool_recycle': 300,
            'pool_timeout': 300,
            'pool_size': 10,
            'max_overflow': 20,
        }
    else:
        # PostgreSQL/other database configuration with connection args
        SQLALCHEMY_ENGINE_OPTIONS = {
            'pool_pre_ping': True,
            'pool_recycle': 300,
            'pool_timeout': 300,
            'pool_size': 10,
            'max_overflow': 20,
            'connect_args': {
                'connect_timeout': 300,
                'keepalives_idle': 600,
                'keepalives_interval': 30,
                'keepalives_count': 3,
            }
        }
    
    # Flask session cookies for OAuth flow
    SESSION_COOKIE_HTTPONLY = True   # Enable HttpOnly for security
    SESSION_COOKIE_SECURE = os.getenv('FLASK_ENV') == 'production'  # Only secure in production
    SESSION_COOKIE_SAMESITE = 'Lax' # Enable SameSite for OAuth redirects
    PERMANENT_SESSION_LIFETIME = timedelta(days=1)  # Set to 1 day
    SESSION_COOKIE_NAME = 'silverkey_session'  # Custom session cookie name
    
    # AWS Cognito Settings
    AWS_REGION = os.getenv('AWS_REGION', 'us-east-2')
    AWS_COGNITO_USER_POOL_ID = os.getenv('AWS_COGNITO_USER_POOL_ID')
    AWS_COGNITO_CLIENT_ID = os.getenv('AWS_COGNITO_CLIENT_ID')
    AWS_COGNITO_CLIENT_SECRET = os.getenv('AWS_COGNITO_CLIENT_SECRET')

    # AWS S3 Settings
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    # Centralize default bucket name here; avoid hardcoding elsewhere
    S3_BUCKET_NAME_PDFS = 'pdf-storage-jkdsfiugew'
    S3_PRESIGNED_URL_EXPIRATION = int(os.getenv('S3_PRESIGNED_URL_EXPIRATION', 3600))  # 1 hour default

    

    # EC2 Host Configuration
    EC2_HOST = '3.146.37.166'

    # Google Calendar Settings
    GOOGLE_CALENDAR_SECRET = os.getenv('GOOGLE_CALENDAR_SECRET')
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar'
    
    # Google OAuth Redirect URI - set as class attribute
    GOOGLE_REDIRECT_URI = None  # Will be set below
    
    # Environment-based redirect URI
    @classmethod
    def get_google_redirect_uri(cls):
        """Get Google OAuth redirect URI based on environment"""
        # Check if we're in development (localhost) or production
        flask_env = os.getenv('FLASK_ENV', 'development')
        
        if flask_env == 'production':
            return 'https://usesilverkey.com/api/v1/google/oauth/callback'
        else:
            # Development: use localhost with port 5173 (Vite dev server)
            return 'http://localhost:5173/api/v1/google/oauth/callback'
    
    # Set the redirect URI using a function call
    def _get_google_redirect_uri():
        """Get Google OAuth redirect URI based on environment"""
        flask_env = os.getenv('FLASK_ENV', 'development')
        
        if flask_env == 'production':
            return 'https://usesilverkey.com/api/v1/google/oauth/callback'
        else:
            # Development: use localhost with port 5173 (Vite dev server)
            return 'http://localhost:5173/api/v1/google/oauth/callback'
    
    GOOGLE_REDIRECT_URI = _get_google_redirect_uri()

    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))
    ALLOWED_FILE_TYPES = {'application/pdf'}

    # Environment-based frontend URL
    @classmethod
    def get_frontend_url(cls):
        """Get frontend URL based on environment"""
        flask_env = os.getenv('FLASK_ENV', 'development')
        
        if flask_env == 'production':
            return 'https://usesilverkey.com'
        else:
            # Development: use localhost with port 5173 (Vite dev server)
            return 'http://localhost:5173'
    
    # Set the frontend URL using a function call
    def _get_frontend_url():
        """Get frontend URL based on environment"""
        flask_env = os.getenv('FLASK_ENV', 'development')
        
        if flask_env == 'production':
            return 'https://usesilverkey.com'
        else:
            # Development: use localhost with port 5173 (Vite dev server)
            return 'http://localhost:5173'
    
    FRONTEND_URL = _get_frontend_url()
    
    # CORS Origins Configuration
    # Support comma-separated CORS_ORIGINS environment variable
    cors_origins_env = os.getenv('CORS_ORIGINS')
    if cors_origins_env:
        CORS_ORIGINS = [origin.strip() for origin in cors_origins_env.split(',')]
    else:
        # Default origins based on environment
        flask_env = os.getenv('FLASK_ENV', 'development')
        if flask_env == 'production':
            CORS_ORIGINS = [
                "https://usesilverkey.com",
                "https://www.usesilverkey.com"
            ]
        else:
            # Development: include localhost:5173 (Vite dev server)
            CORS_ORIGINS = [
                "http://localhost:5173",
                "http://localhost:3000",
                "https://usesilverkey.com",
                "https://www.usesilverkey.com"
            ]

    API_VERSION = 'v1'
    API_BASE_URL = f'/api/{API_VERSION}'

    ERROR_CODES = {
        'FILE_TYPE_INVALID': ('INVALID_FILE_TYPE', 'Invalid file type. Only PDF files are allowed.'),
        'FILE_SIZE_TOO_LARGE': ('FILE_SIZE_EXCEEDED', f'File size exceeds maximum limit of {MAX_CONTENT_LENGTH // (1024*1024)}MB.'),
        'FILE_SAVE_ERROR': ('FILE_SAVE_FAILED', 'Failed to save file.'),
        'PDF_PROCESS_ERROR': ('PDF_PROCESS_FAILED', 'Failed to process PDF file.'),
        'AUTH_ERROR': ('AUTHENTICATION_FAILED', 'Authentication failed.'),
        'NOT_FOUND': ('RESOURCE_NOT_FOUND', 'Resource not found.'),
        'INVALID_REQUEST': ('INVALID_REQUEST', 'Invalid request data.'),
        'SERVER_ERROR': ('SERVER_ERROR', 'Internal server error.'),
        'FILE_NOT_FOUND': ('FILE_NOT_FOUND', 'The requested file was not found.'),
        'S3_UPLOAD_ERROR': ('S3_UPLOAD_FAILED', 'Failed to upload file to S3.'),
        'S3_DOWNLOAD_ERROR': ('S3_DOWNLOAD_FAILED', 'Failed to generate download URL from S3.')
    }

    @classmethod
    def get_error_code(cls, code_name):
        return cls.ERROR_CODES.get(code_name, cls.ERROR_CODES['SERVER_ERROR'])


    def __getattr__(self, name):
        # Allow accessing config values as attributes
        return getattr(self, name)

    def __getitem__(self, name):
        # Allow accessing config values as dictionary keys
        return getattr(self, name)
