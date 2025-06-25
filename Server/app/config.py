import os
from dotenv import load_dotenv

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))

# Ensure instance directory exists
instance_dir = os.path.join(basedir, 'instance')
os.makedirs(instance_dir, exist_ok=True)

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', f'sqlite:///{os.path.join(instance_dir, "silverkey.db")}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))
    ALLOWED_FILE_TYPES = {'application/pdf'}

    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
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
        'FILE_NOT_FOUND': ('FILE_NOT_FOUND', 'The requested file was not found.')
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
