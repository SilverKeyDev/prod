import os
from dotenv import load_dotenv
from datetime import timedelta
from urllib.parse import quote_plus

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))

# Ensure instance directory exists
instance_dir = os.path.join(basedir, 'instance')
os.makedirs(instance_dir, exist_ok=True)

class Config:

    # Celery Configuration
    CELERY_URL = 'redis://localhost:6379/0'
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
    # Supported pieces (optional unless noted):
    #   DB_ENGINE (required if constructing, e.g. "postgresql")
    #   DB_HOST (required), DB_PORT (optional)
    #   DB_NAME (required)
    #   DB_USER (optional), DB_PASSWORD (optional; URL-encoded automatically)
    #   DB_SSLMODE (optional; e.g., "require", "prefer")
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        db_engine = os.getenv('DB_ENGINE', '').strip()
        db_host = os.getenv('DB_HOST', '').strip()
        db_port = os.getenv('DB_PORT', '').strip()
        db_name = os.getenv('DB_NAME', '').strip()
        db_user = os.getenv('DB_USER', '').strip()
        db_password = os.getenv('DB_PASSWORD', '').strip()
        db_sslmode = os.getenv('DB_SSLMODE', '').strip()  # e.g. require, prefer

        if db_engine and db_host and db_name:
            auth_part = ''
            if db_user:
                if db_password:
                    auth_part = f"{db_user}:{quote_plus(db_password)}@"
                else:
                    auth_part = f"{db_user}@"
            host_part = db_host
            if db_port:
                host_part = f"{host_part}:{db_port}"
            query_part = ''
            if db_sslmode:
                query_part = f"?sslmode={db_sslmode}"
            database_url = f"{db_engine}://{auth_part}{host_part}/{db_name}{query_part}"
        else:
            # Final fallback to local SQLite for development if nothing else provided
            database_url = f'sqlite:///{os.path.join(instance_dir, "silverkey.db")}'
    # Add SSL mode for PostgreSQL connections if not already present
    if database_url.startswith('postgresql://') or database_url.startswith('postgres://'):
        if '?sslmode=' not in database_url:
            separator = '&' if '?' in database_url else '?'
            database_url += f'{separator}sslmode=prefer'
    
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
    SESSION_COOKIE_SECURE = True     # Enable Secure for HTTPS
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
    S3_BUCKET_NAME_PDFS = os.getenv('S3_BUCKET_NAME_PDFS', 'pdf-storage-jkdsfiugew')
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
            # Production: use silverkeyestates.com
            return 'https://silverkeyestates.com/api/v1/google/oauth/callback'
        else:
            # Development: use localhost with port 5173 (Vite dev server)
            return 'http://localhost:5173/api/v1/google/oauth/callback'
    
    # Set the redirect URI using a function call
    def _get_google_redirect_uri():
        """Get Google OAuth redirect URI based on environment"""
        flask_env = os.getenv('FLASK_ENV', 'development')
        
        if flask_env == 'production':
            # Production: use silverkeyestates.com
            return 'https://silverkeyestates.com/api/v1/google/oauth/callback'
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
            # Production: use silverkeyestates.com
            return 'https://silverkeyestates.com'
        else:
            # Development: use localhost with port 5173 (Vite dev server)
            return 'http://localhost:5173'
    
    # Set the frontend URL using a function call
    def _get_frontend_url():
        """Get frontend URL based on environment"""
        flask_env = os.getenv('FLASK_ENV', 'development')
        
        if flask_env == 'production':
            # Production: use silverkeyestates.com
            return 'https://silverkeyestates.com'
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
                "https://silverkeyestates.com",
                "https://www.silverkeyestates.com"
            ]
        else:
            # Development: include localhost:5173 (Vite dev server)
            CORS_ORIGINS = [
                "http://localhost:5173",
                "http://localhost:3000",
                "https://silverkeyestates.com",
                "https://www.silverkeyestates.com"
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
