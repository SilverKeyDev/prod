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
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,  # Verify connections before use
        'pool_recycle': 500,    # Recycle connections every 5 minutes
        'pool_timeout': 500,     # Timeout for getting connection from pool
        'max_overflow': 0,      # Don't allow overflow connections
    }

    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', f'sqlite:///{os.path.join(instance_dir, "silverkey.db")}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Settings
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
    
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
    CORS_ORIGINS = [FRONTEND_URL]

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
