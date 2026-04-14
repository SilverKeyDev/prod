# SilverKey Backend Test Suite

Comprehensive test coverage for critical backend paths in the SilverKey Server.

## Overview

This test suite provides comprehensive coverage for:

1. **Authentication Flows** - Login, signup, token refresh, password reset, verification, OAuth
2. **DocuSign Integration** - Agreement lifecycle, envelope signing, webhooks, templates
3. **Calendar Management** - Events, calendar operations, sharing, availability
4. **API Endpoints** - Auth routes, DocuSign routes, Calendar routes
5. **Home Matching** - MCDA scoring algorithms, blend scores

## Setup

### Install Dependencies

```bash
cd Server
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### Test Dependencies

- `pytest` - Test framework
- `pytest-mock` - Mocking fixtures
- `pytest-cov` - Coverage reporting
- `pytest-flask` - Flask testing utilities
- `faker` - Generate test data
- `freezegun` - Time mocking
- `responses` - HTTP request mocking

## Running Tests

### Run All Tests

```bash
cd Server
pytest tests/
```

### Run Specific Test Files

```bash
# Authentication tests
pytest tests/unit/test_auth_login.py
pytest tests/unit/test_auth_signup.py
pytest tests/unit/test_auth_refresh.py

# DocuSign tests
pytest tests/unit/test_docusign_lifecycle.py
pytest tests/unit/test_docusign_signing.py
pytest tests/unit/test_docusign_webhooks.py

# Calendar tests
pytest tests/unit/test_calendar_events.py
pytest tests/unit/test_calendar_management.py

# Home matching tests
pytest tests/unit/test_home_matching_score.py
pytest tests/unit/test_home_matching_blend.py

# API routes tests
pytest tests/unit/test_routes_auth.py
pytest tests/unit/test_routes_docusign.py
pytest tests/unit/test_routes_calendar.py
```

### Run Tests with Coverage

```bash
pytest tests/ --cov=app --cov-report=html --cov-report=term
```

This generates:
- Terminal coverage summary
- HTML coverage report in `htmlcov/`

### Run Tests with Verbose Output

```bash
pytest tests/ -v
```

### Run Specific Test Classes or Methods

```bash
# Run specific test class
pytest tests/unit/test_auth_login.py::TestLoginFlow

# Run specific test method
pytest tests/unit/test_auth_login.py::TestLoginFlow::test_successful_login
```

## Test Structure

### Unit Tests (`tests/unit/`)

- **Authentication**: `test_auth_*.py`
  - `test_auth_login.py` - Login flow tests
  - `test_auth_signup.py` - Signup flow tests
  - `test_auth_refresh.py` - Token refresh tests
  - `test_auth_password_reset.py` - Password reset tests
  - `test_auth_verification.py` - Email verification tests
  - `test_auth_oauth.py` - OAuth callback tests

- **DocuSign**: `test_docusign_*.py`
  - `test_docusign_lifecycle.py` - Agreement lifecycle tests
  - `test_docusign_signing.py` - Envelope signing tests
  - `test_docusign_webhooks.py` - Webhook processing tests
  - `test_docusign_templates.py` - Template sync tests

- **Calendar**: `test_calendar_*.py`
  - `test_calendar_events.py` - Event operations tests
  - `test_calendar_management.py` - Calendar and sharing tests

- **Home Matching**: `test_home_matching_*.py`
  - `test_home_matching_score.py` - MCDA scoring tests
  - `test_home_matching_blend.py` - Blend score tests

- **API Routes**: `test_routes_*.py`
  - `test_routes_auth.py` - Auth endpoint tests
  - `test_routes_docusign.py` - DocuSign endpoint tests
  - `test_routes_calendar.py` - Calendar endpoint tests

### Fixtures (`tests/conftest.py`)

Shared test fixtures:
- `app` - Flask test application
- `client` - Test client for HTTP requests
- `db_session` - Database session
- `mock_cognito_service` - Mocked AWS Cognito
- `mock_docusign_client` - Mocked DocuSign client
- `mock_google_calendar` - Mocked Google Calendar API
- `sample_user` - Sample user data
- `sample_agreement` - Sample agreement data
- `sample_preferences` - Sample user preferences
- `sample_property` - Sample property data

## Test Coverage Areas

### 1. Authentication Flows (95 tests)

**Login Flow** (`test_auth_login.py`):
- Successful login
- Invalid credentials
- Unverified user (auto-resend code)
- Token decode errors
- Malformed Cognito responses

**Signup Flow** (`test_auth_signup.py`):
- Successful signup with/without phone
- Existing email errors
- Weak password validation
- Database user creation
- Graceful error handling

**Token Refresh** (`test_auth_refresh.py`):
- Successful token refresh
- Invalid/expired refresh tokens
- Cookie extraction
- Token format validation

**Password Reset** (`test_auth_password_reset.py`):
- Forgot password request
- Confirmation with code
- Invalid/expired codes
- Weak password validation

**Verification** (`test_auth_verification.py`):
- Email verification
- Code resending
- Invalid/expired codes
- Already verified handling

**OAuth** (`test_auth_oauth.py`):
- Google OAuth callback
- Code exchange
- State validation (CSRF)
- New user creation
- Token creation

### 2. DocuSign Integration (87 tests)

**Agreement Lifecycle** (`test_docusign_lifecycle.py`):
- Create agreement
- Get/retrieve agreement
- Add/remove participants
- Multi-signer support
- Routing order management
- Void agreements
- Get signing URLs
- Sender view URLs

**Envelope Signing** (`test_docusign_signing.py`):
- Embedded signing URLs
- Email signing
- Envelope creation
- Status tracking
- Return URL handling
- Missing envelope errors

**Webhooks** (`test_docusign_webhooks.py`):
- Envelope completed events
- Envelope voided events
- Recipient completed events
- Recipient declined events
- HMAC verification
- Idempotency
- Unknown envelope handling

**Templates** (`test_docusign_templates.py`):
- Template synchronization
- Database storage
- Update existing templates
- Get template by ID
- List available templates
- Error handling
- Template deactivation

### 3. Calendar Management (74 tests)

**Event Operations** (`test_calendar_events.py`):
- List events with time ranges
- Create events
- Update events
- Delete events
- Event validation
- Empty response handling
- API error handling

**Calendar Management** (`test_calendar_management.py`):
- List calendars
- Create calendar
- Update calendar settings
- Delete calendar
- Share calendar
- Agent-client sharing
- Revoke access
- ACL management

**Availability** (`test_calendar_management.py`):
- Get free/busy information
- Find available time slots
- Multi-calendar queries

### 4. Home Matching (52 tests)

**MCDA Scoring** (`test_home_matching_score.py`):
- Basic score calculation
- Perfect match scoring
- Over-budget penalties
- Hard constraint penalties
- Commute preferences
- Amenity scoring
- Custom configuration
- Soft signal calculations

**Blend Scores** (`test_home_matching_blend.py`):
- Score blending (MCDA + embeddings)
- Blend weight variations
- Multi-property scoring
- Score normalization
- Property ranking
- Batch scoring
- Score filtering
- Cohort assignment

### 5. API Endpoints (68 tests)

**Auth Routes** (`test_routes_auth.py`):
- POST `/api/v1/auth/login`
- POST `/api/v1/auth/signup`
- POST `/api/v1/auth/refresh`
- POST `/api/v1/auth/logout`
- POST `/api/v1/auth/verify`
- POST `/api/v1/auth/forgot-password`
- POST `/api/v1/auth/reset-password`
- GET `/api/v1/auth/google/callback`
- GET `/api/v1/auth/user`

**DocuSign Routes** (`test_routes_docusign.py`):
- GET `/api/v1/documents/docusign/templates`
- POST `/api/v1/documents/docusign/agreements`
- GET `/api/v1/documents/docusign/agreements/:id`
- POST `/api/v1/documents/docusign/agreements/:id/participants`
- POST `/api/v1/documents/docusign/agreements/:id/send`
- POST `/api/v1/documents/docusign/agreements/:id/void`
- GET `/api/v1/documents/docusign/agreements/:id/signing-url`
- POST `/api/v1/documents/docusign/webhook`
- GET `/api/v1/documents/docusign/oauth/connect`

**Calendar Routes** (`test_routes_calendar.py`):
- GET `/api/v1/calendar/events`
- POST `/api/v1/calendar/events`
- PUT `/api/v1/calendar/events/:event_id`
- DELETE `/api/v1/calendar/events/:event_id`
- GET `/api/v1/calendar/calendars`
- POST `/api/v1/calendar/calendars`
- POST `/api/v1/calendar/calendars/:calendar_id/share`
- GET `/api/v1/calendar/freebusy`
- GET `/api/v1/calendar/oauth/connect`
- GET `/api/v1/calendar/oauth/callback`
- GET `/api/v1/calendar/health`

## Mocking Strategy

### External Services

All external services are mocked to ensure:
- Tests run fast and reliably
- No external API calls
- No network dependencies
- Predictable test data

**Mocked Services**:
- AWS Cognito (authentication)
- DocuSign (e-signature)
- Google Calendar API
- Database operations (SQLAlchemy)
- Celery tasks (background jobs)
- JWT token operations

### Mock Fixtures

See `tests/conftest.py` for all available mock fixtures.

## Best Practices

### Writing Tests

1. **Use descriptive test names** that explain what is being tested
2. **Arrange-Act-Assert** pattern
3. **Mock external dependencies** (use fixtures)
4. **Test both success and failure cases**
5. **Test edge cases** (empty data, missing fields, invalid inputs)
6. **Use meaningful assertions** (not just `assert result`)

### Example Test

```python
def test_login_success(self, app, mock_cognito_service):
    """Test successful user login"""
    # Arrange
    data = {"email": "test@example.com", "password": "Password123!"}
    
    # Act
    response, status_code = handle_login(data, "req-123")
    
    # Assert
    assert status_code == 200
    assert response.get_json()["success"] is True
    mock_cognito_service.sign_in.assert_called_once()
```

## Continuous Integration

These tests should be run:
- Before every commit (pre-commit hook)
- On every pull request (CI pipeline)
- Before deployment

### CI Configuration Example

```yaml
# .github/workflows/test.yml
name: Run Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      - name: Install dependencies
        run: |
          cd Server
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
      - name: Run tests
        run: |
          cd Server
          pytest tests/ --cov=app --cov-report=term
```

## Coverage Goals

Target coverage for each area:
- **Authentication**: 90%+
- **DocuSign**: 85%+
- **Calendar**: 85%+
- **Home Matching**: 90%+
- **API Routes**: 80%+

## Troubleshooting

### Common Issues

**Import Errors**:
```bash
# Make sure you're in the Server directory
cd Server
pytest tests/
```

**Database Errors**:
- Tests use in-memory SQLite database
- Database is created/destroyed for each test
- Check `conftest.py` fixtures

**Mock Issues**:
- Ensure mocks are properly configured in `conftest.py`
- Use `@patch` decorators for additional mocks
- Check mock call assertions

**Fixture Not Found**:
- Ensure fixture is defined in `conftest.py`
- Check fixture scope (function, class, module, session)

## Contributing

When adding new features:

1. **Add corresponding tests** before or with implementation
2. **Follow existing test patterns** (see examples above)
3. **Ensure tests pass** before committing
4. **Maintain high coverage** (aim for 85%+ on new code)
5. **Update this README** if adding new test categories

## Resources

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-flask Documentation](https://pytest-flask.readthedocs.io/)
- [unittest.mock Documentation](https://docs.python.org/3/library/unittest.mock.html)
