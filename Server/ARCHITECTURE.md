# Server Architecture

## Overview

The SilverKey backend is a **Flask-based REST API** following a service-oriented architecture with clear separation between routing, business logic, and data access.

## Directory Structure

```
Server/
├── app/
│   ├── routes/                   # Flask blueprints (routing only)
│   │   ├── auth/                 # Authentication routes
│   │   ├── search/               # Property search routes
│   │   ├── user/                 # User profile routes
│   │   ├── documents/            # Document and DocuSign routes
│   │   ├── calendar/             # Calendar and scheduling routes
│   │   └── ...
│   ├── services/                 # Business logic and orchestration
│   │   ├── search/               # Search algorithms (polygon, isochrone)
│   │   ├── auth/                 # Auth services (Google OAuth, Cognito)
│   │   ├── calendar/             # Google Calendar integration
│   │   ├── docusign/             # DocuSign integration
│   │   ├── aggregation/          # User preferences write pipeline
│   │   └── ...
│   ├── models/                   # SQLAlchemy ORM models
│   │   ├── user/                 # User and related models
│   │   ├── property/             # Property and MLS models
│   │   ├── transaction/          # Transaction and checklist models
│   │   └── ...
│   ├── utils/                    # Shared utilities
│   │   ├── common_patterns.py    # Decorators (auth, validation)
│   │   ├── security/             # Security utilities
│   │   └── ...
│   └── __init__.py               # Flask app factory
├── config/                       # Configuration files
│   └── .env.example              # Environment variable template
├── migrations/                   # Alembic database migrations
│   └── versions/                 # Migration scripts (DO NOT EDIT)
├── requirements/                 # Pinned Python deps (runtime, ci, dev, test, codegen)
└── app.py                        # Application entry point
```

## Flask Application Factory

**Entry point:** `Server/app.py`

```python
from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
```

**Factory:** `Server/app/__init__.py`

```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    # Initialize extensions
    db.init_app(app)
    CORS(app)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.search import search_bp
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(search_bp, url_prefix='/api/v1/search')
    # ...

    return app
```

## Layered Architecture

```
┌─────────────────────────────────────┐
│  routes/ (Flask blueprints)         │  HTTP layer
│  - Route registration                │
│  - Auth decorators                   │
│  - JSON validation                   │
│  - Request/response marshaling       │
├─────────────────────────────────────┤
│  services/ (Business logic)         │  Logic layer
│  - Orchestration                     │
│  - API calls to config/api           │
│  - Complex calculations              │
│  - Multi-model operations            │
├─────────────────────────────────────┤
│  models/ (Data access)              │  Data layer
│  - SQLAlchemy ORM models             │
│  - Relationships                     │
│  - Queries                           │
└─────────────────────────────────────┘
```

## Routing Layer (Flask Blueprints)

### Blueprint Structure

Each feature gets a blueprint:

```python
# app/routes/user/handlers.py
from flask import Blueprint, request, jsonify
from app.utils.common_patterns import require_authenticated_user
from app.dtos.user import UserDTO

user_bp = Blueprint('user', __name__, url_prefix='/api/v1/user')

@user_bp.route('/profile', methods=['GET'])
@require_authenticated_user
def get_profile(user):
    """Get authenticated user's profile"""
    profile = UserDTO.to_response(user, include_roles=True)
    return jsonify({'success': True, 'data': profile})
```

### Auth Decorators

**Standard decorators** (from `app/utils/common_patterns.py`):

- `@require_authenticated_user`: Requires valid session, provides `user` parameter
- `@require_agent_access`: Requires user is an agent, provides `user` parameter
- `@validate_json_request(required_fields=[...])`: Validates JSON payload, provides `data` parameter
- `@handle_exceptions_with_logging`: Wraps route in error handler

**Usage pattern:**
```python
@my_bp.route('/resource', methods=['POST'])
@handle_exceptions_with_logging
@validate_json_request(required_fields=['name'])
@require_authenticated_user
def create_resource(user, data):
    # user and data automatically provided by decorators
    result = service.create(user.id, data)
    return jsonify({'success': True, 'data': result})
```

See: `.cursor/rules/backend/backend-patterns.mdc`

### Error Handling

Use `SecureErrorHandler` for consistent responses:

```python
from app.utils.security.secure_errors import SecureErrorHandler

try:
    result = perform_operation()
except ValueError as e:
    return SecureErrorHandler.handle_validation_error(
        e,
        field_errors={'field': 'Error message'},
        context={'function': 'function_name', 'user_id': str(user.id)}
    )
```

## Service Layer

### Service Organization

Services contain business logic and orchestration:

```python
# app/services/example/profile_service.py
from app import db
from app.models import User, UserDemographics, UserFinancials

class ProfileService:
    def get_profile(self, user_id: str) -> dict:
        """Get user profile with all related data"""
        user = User.query.get(user_id)
        if not user:
            raise ValueError("User not found")

        demographics = UserDemographics.query.filter_by(user_id=user_id).first()
        financials = UserFinancials.query.filter_by(user_id=user_id).first()

        return {
            'user': user.to_dict(),
            'demographics': demographics.to_dict() if demographics else None,
            'financials': financials.to_dict() if financials else None,
        }

profile_service = ProfileService()  # Singleton instance
```

### Service Patterns

- **Class-based singletons**: One instance exported per service module
- **Dependency injection**: Pass `db` session or other services as needed
- **Error handling**: Raise domain exceptions, let routes handle HTTP responses
- **Transaction management**: Use `db_transaction` context manager for atomic operations

See: `.cursor/rules/backend/backend-patterns.mdc`

## Data Layer (SQLAlchemy)

### Model Definition

```python
# app/models/user/user.py
from app import db
from datetime import datetime
import uuid

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    demographics = db.relationship('UserDemographics', back_populates='user', uselist=False)
    financials = db.relationship('UserFinancials', back_populates='user', uselist=False)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
```

### Relationships

Use `back_populates` (preferred) instead of `backref`:

```python
# Parent
class User(db.Model):
    demographics = db.relationship('UserDemographics', back_populates='user', uselist=False)

# Child
class UserDemographics(db.Model):
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), unique=True, nullable=False)
    user = db.relationship('User', back_populates='demographics')
```

### Query Patterns

```python
# Simple query
user = User.query.filter_by(email='user@example.com').first()

# Eager loading (avoid N+1)
from sqlalchemy.orm import joinedload
users = User.query.options(joinedload(User.demographics)).all()

# Filtering
properties = Property.query.filter(
    Property.price >= min_price,
    Property.price <= max_price,
    Property.bedrooms >= min_beds
).all()
```

See: `.cursor/rules/backend/sqlalchemy-patterns.mdc`

### Session Management

**Import:** Always use `from app import db`

**Commit pattern:**
```python
user.name = "New Name"
db.session.commit()
```

**Transaction pattern:**
```python
from app.utils.common_patterns import db_transaction

with db_transaction():
    user.name = "New Name"
    user.email = "new@example.com"
    # Auto-commits on success, auto-rolls back on exception
```

**Rollback on error:**
```python
try:
    user.name = "New Name"
    db.session.commit()
except Exception as e:
    db.session.rollback()
    raise
```

See: `.cursor/rules/backend/backend-patterns.mdc`

## Authentication Pipeline

### AWS Cognito

Primary auth method for production:

```python
AWS_COGNITO_USER_POOL_ID=us-east-2_XXXXX
AWS_COGNITO_CLIENT_ID=<client-id>
AWS_COGNITO_CLIENT_SECRET=<client-secret>
```

Session tokens stored client-side (sessionStorage); validated server-side via `@require_authenticated_user`.

### Google OAuth

Alternative auth for quick onboarding:

```python
GOOGLE_OAUTH_CLIENT_ID=<client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<client-secret>
```

User session created after OAuth flow; managed same as Cognito sessions.

### Session Management

- **No Flask-Login**: Custom session management via database `UserSession` model
- **Token validation**: Decorators validate token and load user for each request
- **Agent access**: `@require_agent_access` additionally checks `user.is_agent`

See: `.cursor/rules/backend/backend-architecture.mdc`

## User Preferences Architecture

### Normalized Storage

User preferences split across domain-specific tables:

| Table | Purpose |
|-------|---------|
| `user_demographics` | Age, household size, income, move-in timeline |
| `user_financials` | Budget, down payment, credit score, loan pre-approval |
| `user_search_intent` | Bedrooms, bathrooms, housing type, home age, sqft, must-haves, deal-breakers |
| `user_intent_attribute` | Feature importance ratings (pool, garage, etc.) |
| `user_important_location` | Commute destinations and tolerances |
| `user_communication_prefs` | Contact preferences, notification settings |

### Write Pipeline

**Entry point:** `app/services/aggregation/preferences_aggregation_write.py`

```python
def write_preferences_from_payload(user_id: str, payload: dict) -> User:
    """
    Parse flattened JSON payload from client, write to normalized tables.

    Example payload:
    {
        "home_budget_min": 300000,
        "home_budget_max": 500000,
        "preferred_bedrooms": 3,
        "must_have": ["pool", "garage"],
        "important_locations": [{"address": "123 Main St", "commute_tolerance": 30}]
    }
    """
    # Upsert domain models (financials, demographics, search_intent, locations)
    # Set user.has_preferences = True, user.preferences_version = "v1"
    # Commit transaction
```

See: `.cursor/rules/shared/user-preferences-schema.mdc`

## Database Migrations

### CRITICAL: No Manual Migrations

**DO NOT:**
- ❌ Create migration files
- ❌ Edit existing migrations in `Server/migrations/versions/`
- ❌ Run `flask db migrate` or `alembic upgrade`

**Why:** Migrations require separate process and coordination. Schema changes are not part of normal development workflow.

**Allowed:**
- ✅ Edit model definitions in `Server/app/models/` (when explicitly requested)
- ✅ Add new models (without migration)
- ✅ Change model methods (e.g., `to_dict()`)

See: `.cursor/rules/backend/database.mdc`

## AWS Integration

### S3 (Document Storage)

```python
# app/services/documents/s3_service.py
class S3Service:
    def upload_file(self, file_obj, bucket, key):
        """Upload file to S3, return URL"""
        # ...

    def generate_presigned_url(self, bucket, key, expiration=3600):
        """Generate presigned URL for client download"""
        # ...
```

**Buckets:**
- `prod-silverkey-documents`: DocuSign agreements, uploaded forms
- `dev-silverkey-documents`: Development/testing

### Secrets Manager

API keys stored in AWS Secrets Manager, referenced in environment:

```python
DOCUSIGN_CLIENT_SECRET=<from-secrets-manager>
GOOGLE_CALENDAR_SECRET=<from-secrets-manager>
PLAID_SECRET=<from-secrets-manager>
```

See: `.cursor/rules/shared/aws-resource-naming.mdc`

## External Integrations

### DocuSign

**Service:** `app/services/docusign/`

- Create agreements from templates
- Manage signers (add, remove, update routing)
- Send for signature, void agreements
- Generate signing URLs and sender views
- Webhook handling for status updates

### Google Calendar

**Service:** `app/services/calendar/`

- OAuth flow and token management
- Create, update, delete events
- Sync calendars
- Generate event requests

### Plaid

**Service:** `app/services/plaid/`

- Link bank accounts
- Verify financial information
- Fetch account balances and transactions

## Configuration

### Environment Variables

**Required** (see `Server/.env.example` and `Server/config/.env.example`):

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/silverkey

# AWS
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_COGNITO_USER_POOL_ID=<pool-id>
AWS_COGNITO_CLIENT_ID=<client-id>
AWS_COGNITO_CLIENT_SECRET=<secret>

# S3
S3_BUCKET_NAME=prod-silverkey-documents

# API Keys (from Secrets Manager)
DOCUSIGN_CLIENT_SECRET=<secret>
GOOGLE_CALENDAR_SECRET=<secret>
PLAID_SECRET=<secret>
```

### Flask Config

**Location:** `Server/config/config.py`

Loads environment variables and sets Flask/SQLAlchemy configuration.

## Logging

### Centralized Logger

**Location:** `Server/logger/`

```python
from logger import log, LOG_CATEGORIES

# Debug logging
log.debug(LOG_CATEGORIES["API"], "API request started", {"endpoint": "/api/users"})

# Error logging
log.error(LOG_CATEGORIES["ERRORS"], "Failed to fetch data", exception)

# Security logging (always logs)
log.security(LOG_CATEGORIES["SECURITY"], "Unauthorized access attempt", {"ip": "1.2.3.4"})
```

**Features:**
- Category-based filtering (enable/disable per category)
- Automatic PII scrubbing (masks emails, phones, SSN, tokens)
- Configuration via `Server/logger/logger_config.json`

See: `.cursor/rules/shared/logging.mdc`

## Testing

### Unit Tests (pytest)

**Location:** `Server/tests/`

```python
# tests/test_user_dto.py
import pytest
from app.dtos.user import UserDTO

def test_user_dto_response(test_user):
    profile = UserDTO.to_response(test_user, include_roles=True)
    assert profile['email'] == test_user.email
```

**Run:** `pytest`

### Integration Tests

Test API routes with test client:

```python
def test_get_profile_endpoint(client, auth_headers):
    response = client.get('/api/v1/user/profile', headers=auth_headers)
    assert response.status_code == 200
    assert 'data' in response.json
```

## Code Organization

### File Size Guidelines

- **Target:** <400 lines per file
- **When to split:** Complexity (cyclomatic) > Line count
- **Split by domain:** Extract to cohesive modules (e.g., `participant_operations.py`, `agreement_crud.py`)

### Naming Conventions

- **Descriptive names:** `google_calendar_oauth.py` > `helpers.py`
- **Snake_case:** Python convention for files and functions
- **Module docstrings:** Document purpose, boundaries, dependencies

See: `.cursor/rules/shared/code-organization.mdc`

## Security

### Input Validation

- **All user input validated** server-side
- **Parameterized queries** to prevent SQL injection
- **JSON validation** via `@validate_json_request`

### PII Protection

- **Logging:** Automatic PII scrubbing via `Server/logger/pii.py`
- **Error responses:** Use `SecureErrorHandler` to avoid leaking sensitive data
- **Database:** Mask sensitive fields in `to_dict()` methods where appropriate

### Access Control

- **Authentication:** `@require_authenticated_user` on all protected routes
- **Authorization:** `@require_agent_access` for agent-only routes
- **Row-level:** Check `user_id` matches authenticated user for user-specific data

See: `.cursor/rules/shared/security.mdc`

## Development Workflow

### Local Setup

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # or `.venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements/runtime.txt

# Set up environment
cp config/.env.example .env
# Edit .env with your configuration

# Run development server
flask run
# Or: python app.py
```

### Common Commands

```bash
# Run server
flask run

# Run tests
pytest

# Check linting
python -m ruff check .

# Format code
python -m black .
```

## Documentation

- **This file:** Server architecture overview
- **Backend patterns:** `.cursor/rules/backend/backend-patterns.mdc`
- **SQLAlchemy patterns:** `.cursor/rules/backend/sqlalchemy-patterns.mdc`
- **Database rules:** `.cursor/rules/backend/database.mdc`
- **User preferences:** `.cursor/rules/shared/user-preferences-schema.mdc`
- **AWS naming:** `.cursor/rules/shared/aws-resource-naming.mdc`

## Contributing

1. **Follow layered architecture:** Routes → Services → Models
2. **Use auth decorators:** `@require_authenticated_user`, `@require_agent_access`
3. **Session management:** Use `db_transaction` for atomic operations
4. **Error handling:** Use `SecureErrorHandler` for consistent responses
5. **No migrations:** Schema changes require separate process
6. **Test locally:** Run pytest and linters before committing

## Further Reading

- **Root Architecture:** `/ARCHITECTURE.md`
- **Client Architecture:** `/Client/ARCHITECTURE.md`
- **Documentation Index:** `documentation/README.md`
- **Backend Rules:** `.cursor/rules/backend/`
