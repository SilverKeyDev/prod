import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))

# Ensure instance directory exists
instance_dir = os.path.join(basedir, 'instance')
os.makedirs(instance_dir, exist_ok=True)

class Config:

    # Celery Configuration
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
    CELERY_TRANSPORT_OPTIONS = {
        'visibility_timeout': 900
    }
    
    # Request timeout configuration for long-running AI operations
    REQUEST_TIMEOUT = 300  # 5 minutes for AI strategy generation
    SEND_FILE_MAX_AGE_DEFAULT = 300
    
    # HTTP request timeout configuration
    HTTP_TIMEOUT = 300  # 5 minutes for HTTP requests
    COGNITO_TIMEOUT = 300  # 5 minutes for Cognito operations
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,          # Verify connections before use
        'pool_recycle': 300,            # Recycle connections every 5 minutes (300 seconds)
        'pool_timeout': 300,             # Timeout for getting connection from pool
        'pool_size': 10,                # Number of connections to maintain in pool
        'max_overflow': 20,             # Allow overflow connections for high load
        'connect_args': {
            'connect_timeout': 300,      # Connection timeout in seconds
            'keepalives_idle': 600,     # TCP keepalive idle time (10 minutes)
            'keepalives_interval': 30,  # TCP keepalive interval
            'keepalives_count': 3,      # TCP keepalive probe count
        }
    }
    

    SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    if not SECRET_KEY:
        raise RuntimeError("AWS_SECRET_ACCESS_KEY environment variable must be set")
    
    # Database Configuration with SSL support
    database_url = os.getenv('DATABASE_URL', f'sqlite:///{os.path.join(instance_dir, "silverkey.db")}')
    # Add SSL mode for PostgreSQL connections if not already present
    if database_url.startswith('postgresql://') or database_url.startswith('postgres://'):
        if '?sslmode=' not in database_url:
            separator = '&' if '?' in database_url else '?'
            database_url += f'{separator}sslmode=prefer'
    
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Disable Flask session cookies - we use custom HttpOnly cookies instead
    SESSION_COOKIE_HTTPONLY = False  # Disable Flask's session cookie
    SESSION_COOKIE_SECURE = False    # Disable Flask's session cookie
    SESSION_COOKIE_SAMESITE = None   # Disable Flask's session cookie
    PERMANENT_SESSION_LIFETIME = timedelta(days=1)  # Set to 1 day to avoid NoneType errors
    SESSION_COOKIE_NAME = 'silverkey_session'  # Custom session cookie name
    
    # AWS Cognito Settings
    AWS_REGION = os.getenv('AWS_REGION', 'us-east-2')
    COGNITO_USER_POOL_ID = os.getenv('COGNITO_USER_POOL_ID')
    COGNITO_CLIENT_ID = os.getenv('COGNITO_CLIENT_ID')
    COGNITO_CLIENT_SECRET = os.getenv('COGNITO_CLIENT_SECRET')

    # AWS S3 Settings
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    S3_BUCKET_NAME_PDFS = os.getenv('S3_BUCKET_NAME_PDFS')
    S3_REGION = os.getenv('S3_REGION', AWS_REGION)
    S3_PRESIGNED_URL_EXPIRATION = int(os.getenv('S3_PRESIGNED_URL_EXPIRATION', 3600))  # 1 hour default

    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))
    ALLOWED_FILE_TYPES = {'application/pdf'}

    FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://silverkeyestates.com/')
    
    # CORS Origins Configuration
    # Support comma-separated CORS_ORIGINS environment variable
    cors_origins_env = os.getenv('CORS_ORIGINS')
    if cors_origins_env:
        CORS_ORIGINS = [origin.strip() for origin in cors_origins_env.split(',')]
    else:
        # Default to production origins
        CORS_ORIGINS = [
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
