from flask_login import LoginManager
from flask_wtf.csrf import CSRFProtect
from flask_marshmallow import Marshmallow
from flask import request, jsonify
from app import db

# Database

# Login manager
login_manager = LoginManager()

# CSRF protection
csrf = CSRFProtect()

# Schema validation
ma = Marshmallow()

# Request validation decorators
def validate_request(schema):
    def decorator(f):
        def wrapper(*args, **kwargs):
            errors = schema.validate(request.json)
            if errors:
                return jsonify({
                    'success': False,
                    'error': 'INVALID_REQUEST',
                    'message': 'Request validation failed',
                    'details': errors
                }), 400
            return f(*args, **kwargs)
        return wrapper
    return decorator
