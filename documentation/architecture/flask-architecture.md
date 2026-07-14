# Flask Architecture

## App Factory Pattern

SilverKey uses the Flask application factory pattern for modularity and testability.

### Application Structure

```python
# Server/app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def create_app(config_name='default'):
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(f'config.{config_name.capitalize()}Config')

    # Initialize extensions
    db.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])

    # Register blueprints
    register_blueprints(app)

    # Register error handlers
    register_error_handlers(app)

    return app

def register_blueprints(app):
    from app.routes.auth.auth import auth_bp
    from app.routes.auth.user import user_bp
    from app.routes.search.search import search_bp
    # ... see Server/app/__init__.py for full list

    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(search_bp)
```

### Entry Point

```python
# Server/app.py
from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
```

## Blueprint Organization

### Blueprint Structure

Each feature area gets its own blueprint module:

```
app/routes/
├── auth/                     # Auth, preferences, saved homes; user_bp in user.py
│   ├── auth.py
│   ├── user.py
│   └── handlers/
├── search/
│   ├── __init__.py
│   ├── handlers/
│   │   ├── property_search.py
│   │   └── polygon_search.py
│   └── __init__.py
```

### Blueprint Registration

**Pattern 1: Simple blueprint** (single file):

```python
# app/routes/auth/user.py
from flask import Blueprint
from app.routes.auth.handlers import get_user_profile

user_bp = Blueprint("user", __name__, url_prefix="/api/v1/user")
user_bp.route("/profile", methods=["GET"])(get_user_profile)
```

**Pattern 2: Complex blueprint** (multiple handler files):

```python
# app/routes/documents/docusign/handlers/agreements.py
def register_agreement_routes(bp):
    @bp.route('/agreements', methods=['POST'])
    @require_authenticated_user
    def create_agreement(user):
        # ...
        return jsonify({'success': True})

    @bp.route('/agreements/<agreement_id>', methods=['GET'])
    @require_authenticated_user
    def get_agreement(user, agreement_id):
        # ...
        return jsonify({'success': True, 'data': agreement})

# app/routes/documents/docusign/__init__.py
from flask import Blueprint

docusign_bp = Blueprint('docusign', __name__)

from app.routes.documents.docusign.handlers.agreements import register_agreement_routes
register_agreement_routes(docusign_bp)
```

## Auth Pipeline

### Authentication Decorators

**`@require_authenticated_user`**: Validates session, provides `user` parameter

```python
from app.utils.common_patterns import require_authenticated_user

@user_bp.route('/profile', methods=['GET'])
@require_authenticated_user
def get_profile(user):
    """user is automatically provided by decorator"""
    profile = get_user_profile(user.id)
    return jsonify({'success': True, 'data': profile})
```

**`@require_agent_access`**: Requires user is an agent

```python
from app.utils.common_patterns import require_agent_access

@agent_bp.route('/clients', methods=['GET'])
@require_agent_access
def get_clients(user):
    """user is guaranteed to be an agent"""
    clients = get_agent_clients(user.id)
    return jsonify({'success': True, 'clients': clients})
```

### Session Management

**No Flask-Login**: SilverKey uses custom session management via database.

**Session validation:**
1. Extract token from `Authorization` header or cookies
2. Validate token signature and expiration
3. Load `User` from database
4. Attach `user` to request context
5. Pass `user` to route handler

**Session creation:**
- Cognito: After successful Cognito auth flow
- Google OAuth: After OAuth callback

See: `.cursor/rules/backend/backend-architecture.mdc`

## Request Validation

### JSON Validation Decorator

```python
from app.utils.common_patterns import validate_json_request

@user_bp.route('/update', methods=['PUT'])
@validate_json_request(required_fields=['name', 'email'])
@require_authenticated_user
def update_profile(user, data):
    """data is automatically validated and provided"""
    user.name = data['name']
    user.email = data['email']
    db.session.commit()
    return jsonify({'success': True})
```

### Combined Decorator Pattern

```python
from app.utils.common_patterns import api_route

@user_bp.route('/resource', methods=['POST'])
@api_route(require_auth=True, require_json=True, required_fields=['field1', 'field2'])
def create_resource(user, data):
    """user and data automatically provided"""
    resource = create_resource_for_user(user.id, data)
    return jsonify({'success': True, 'data': resource.to_dict()})
```

## Error Handling

### SecureErrorHandler

Consistent error responses with PII masking:

```python
from app.utils.security.secure_errors import SecureErrorHandler

try:
    result = perform_operation()
except ValueError as e:
    return SecureErrorHandler.handle_validation_error(
        e,
        field_errors={'field_name': 'Error message'},
        context={'function': 'function_name', 'user_id': str(user.id)}
    )
except Exception as e:
    return SecureErrorHandler.handle_database_error(
        e,
        context={'function': 'function_name', 'user_id': str(user.id)}
    )
```

**Error response format:**
```json
{
  "success": false,
  "error": "User-friendly error message",
  "field_errors": {
    "email": "Invalid email format"
  }
}
```

### Global Error Handlers

Register in app factory:

```python
def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
```

## Response Patterns

### Standard Success Response

```python
return jsonify({
    'success': True,
    'data': result
})
```

### List Response with Pagination

```python
return jsonify({
    'success': True,
    'data': items,
    'pagination': {
        'page': page,
        'per_page': per_page,
        'total': total_count,
        'pages': total_pages
    }
})
```

### Error Response

```python
return jsonify({
    'success': False,
    'error': 'User-friendly message',
    'field_errors': {'field': 'Field-specific error'}
}), 400
```

## CORS Configuration

```python
# config/config.py
class Config:
    CORS_ORIGINS = [
        'http://localhost:5173',  # Vite dev server
        'https://app.silverkey.com',  # Production
    ]

# app/__init__.py
CORS(app,
     origins=app.config['CORS_ORIGINS'],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'])
```

## Rate Limiting (Optional)

```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=lambda: request.headers.get('Authorization'))

@search_bp.route('/properties', methods=['POST'])
@limiter.limit("10 per minute")
@require_authenticated_user
def search_properties(user):
    # ...
```

## Best Practices

1. **Thin routes**: Keep route handlers simple; delegate to services
2. **Consistent decorators**: Always use `@handle_exceptions_with_logging` first
3. **Auth first**: Apply auth decorators before validation decorators
4. **Return JSON**: Use `jsonify()` for all responses
5. **Status codes**: Use appropriate HTTP status codes (200, 201, 400, 404, 500)
6. **Error handling**: Always use `SecureErrorHandler` for user-facing errors

## Testing

```python
import pytest
from app import create_app, db

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_get_profile(client, auth_headers):
    response = client.get('/api/v1/user/profile', headers=auth_headers)
    assert response.status_code == 200
    assert response.json['success'] is True
```

## Further Reading

- **Backend patterns:** `.cursor/rules/backend/backend-patterns.mdc`
- **Backend architecture:** `.cursor/rules/backend/backend-architecture.mdc`
- **Server overview:** `Server/ARCHITECTURE.md`
