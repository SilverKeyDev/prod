# OpenAPI Validation Infrastructure

## Overview

This directory contains the core infrastructure for runtime OpenAPI contract validation in the SilverKey server. These utilities enable request and response validation against Pydantic schemas generated from `openapi.yaml`.

## Files

### `validation.py`

Core validation decorators for Flask routes.

**Decorators:**
- `@validate_request(schema)` - Validates request body against Pydantic schema
- `@validate_response(schema)` - Validates response matches schema (logs only)
- `has_validation_decorator(func)` - Checks if function has validation

**Features:**
- Gradual and strict validation modes
- Integrates with `SecureErrorHandler` for consistent error responses
- Automatic PII scrubbing via centralized logger
- Zero-impact validation failures in gradual mode

**Example:**
```python
from app.schemas import LoginData
from app.utils.validation import validate_request

@validate_request(LoginData)
def login(data: LoginData | None = None):
    """Login with OpenAPI validation."""
    if data is None:
        # Gradual mode fallback
        data = request.get_json()
    else:
        # Validated Pydantic model
        data = data.model_dump()

    return handle_login(data)
```

### `validation/helpers.py`

Helper utilities for working with Pydantic validation errors.

**Functions:**
- `format_validation_errors(errors)` - Convert Pydantic errors to user-friendly dict
- `validate_response_data(data, schema)` - Validate without raising exceptions
- `get_validation_summary(errors)` - Human-readable error summary
- `extract_required_fields(schema)` - Get required field names from schema
- `create_validation_error_response(e, path)` - Standardized error response

**Example:**
```python
from app.utils.validation import format_validation_errors
from pydantic import ValidationError

try:
    data = LoginData(**request.json)
except ValidationError as e:
    field_errors = format_validation_errors(e.errors())
    # {"email": "This field is required", "password": "Invalid format"}
```

### `common_patterns.py` (Updated)

Enhanced with OpenAPI validation-aware decorators.

**New Decorators:**
- `@require_validated_user(schema)` - Auth + optional request validation
- `@require_validated_agent(schema)` - Agent auth + optional validation

**Example:**
```python
from app.schemas import CreateTodoRequest
from app.utils.common_patterns import require_validated_agent

@agent_bp.route('/todos', methods=['POST'])
@require_validated_agent(CreateTodoRequest)
def create_todo(user, data: CreateTodoRequest | None = None):
    """Agent endpoint with validation."""
    # user: authenticated agent
    # data: validated or None (gradual mode)
    return create_todo_handler(user, data)
```

## Validation Modes

### Gradual Mode (Default)

**Configuration**: `OPENAPI_VALIDATION_MODE=gradual`

**Behavior:**
- Log validation failures with detailed error info
- Accept requests even if validation fails
- Pass `data=None` to route handler on failure
- Route provides fallback handling

**Use Case:**
- Development and staging environments
- During migration period to identify schema issues
- Observation period before strict enforcement

**Example Log:**
```
[WARN] OpenAPI validation failed [abc123ef]
route: /api/v1/auth/login
schema: LoginData
errors: [{"loc": ["email"], "msg": "field required"}]
mode: gradual
```

### Strict Mode (Production)

**Configuration**: `OPENAPI_VALIDATION_MODE=strict`

**Behavior:**
- Reject invalid requests with 400 error
- Return structured field errors to client
- Never call route handler for invalid requests
- Enforce OpenAPI contract strictly

**Use Case:**
- Production after successful observation period
- When < 1% validation failure rate
- To prevent schema drift between client/server

**Prerequisites:**
- All routes migrated to use validation decorators
- < 1% failure rate in gradual mode for 1 week
- All schema mismatches resolved

## Migration Guide

### Step 1: Find Schema

Check if schema exists in `Server/app/schemas/generated.py`:

```bash
grep -n "class LoginData" Server/app/schemas/generated.py
```

If missing, add to `openapi.yaml` and regenerate:

```bash
cd Server && bash scripts/generate-pydantic-models.sh
```

### Step 2: Add Decorator

Add `@validate_request(SchemaName)` to route:

```python
from app.schemas import LoginData
from app.utils.validation import validate_request

@auth_bp.route('/login', methods=['POST'])
@validate_request(LoginData)
def login(data: LoginData | None = None):
    # ...
```

### Step 3: Handle Data

Support both validated data and fallback:

```python
def login(data: LoginData | None = None):
    if data is None:
        # Gradual mode: validation failed, use fallback
        request_data = request.get_json()
        # Manual validation if needed
    else:
        # Validated Pydantic model
        request_data = data.model_dump()

    return handle_login(request_data)
```

### Step 4: Remove Legacy Validation

Remove manual validation code:

```python
# BEFORE (manual validation)
is_valid, error_msg = validate_required_fields(data, ["email", "password"])
if not is_valid:
    return jsonify({"error": "Missing fields"}), 400

# AFTER (OpenAPI validation)
# Handled by @validate_request decorator
```

### Step 5: Test

Test endpoint with valid and invalid data:

```bash
# Valid request
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "secret"}'

# Invalid request (missing password)
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Check logs for validation messages in gradual mode.

## Checking Migration Progress

**Run coverage report:**

```bash
python Server/scripts/validate-schema-coverage.py
```

**Output:**
```
📊 Analyzing OpenAPI validation coverage...

Total route files: 66
Files with validation: 1
Files without validation: 65
Coverage: 1.5%

⚠️  Routes files without OpenAPI validation:
  - Server/app/routes/auth/handlers/signup_verify.py
  - Server/app/routes/auth/handlers/password.py
  ...
```

**Run contract tests:**

```bash
cd Server
pytest tests/contract/test_openapi_compliance.py -v
```

## Monitoring

### View Validation Stats (Admin Only)

**Endpoint:** `GET /api/v1/admin/validation-stats?days=7`

**Response:**
```json
{
  "success": true,
  "summary": {
    "total_requests": 10000,
    "validation_failures": 45,
    "failure_rate": 0.45
  },
  "by_route": [
    {
      "route": "/api/v1/auth/login",
      "schema": "LoginData",
      "failures": 12,
      "common_errors": [
        {"field": "email", "error": "field required", "count": 8}
      ]
    }
  ]
}
```

### Log Monitoring

**Gradual mode validation failures:**
```bash
# Search logs for validation failures
grep "OpenAPI validation failed" app.log
```

**Look for patterns:**
- Specific routes with high failure rates
- Common field errors across routes
- Increasing or decreasing trends

## Troubleshooting

### Issue: Validation always fails

**Cause:** Schema mismatch between `openapi.yaml` and actual requests

**Solution:**
1. Check what the client is sending:
   ```python
   print(f"Request data: {request.get_json()}")
   ```
2. Compare with schema in `Server/app/schemas/generated.py`
3. Update `openapi.yaml` to match actual contract
4. Regenerate schemas: `bash scripts/generate-pydantic-models.sh`

### Issue: Route handler gets None data

**Cause:** Running in gradual mode with validation failures

**Solution:**
1. Check logs for validation errors
2. Fix schema in `openapi.yaml`
3. Or add fallback handling:
   ```python
   def handler(data: Schema | None = None):
       if data is None:
           # Fallback for gradual mode
           data = request.get_json()
   ```

### Issue: Validation decorator not found

**Cause:** Import path incorrect

**Solution:**
```python
# ✅ CORRECT
from app.schemas import LoginData
from app.utils.validation import validate_request

# ❌ WRONG
from Server.app.schemas import LoginData
from validation import validate_request
```

## Best Practices

1. **Always check schema exists** before migrating route
2. **Support gradual mode** with fallback handling
3. **Log validation failures** for debugging
4. **Remove legacy validation** after migration
5. **Test both valid and invalid** requests
6. **Monitor failure rates** before strict mode
7. **Update schemas first** if validation fails

## Resources

- **Migration Status**: [`OPENAPI_MIGRATION_STATUS.md`](../../OPENAPI_MIGRATION_STATUS.md)
- **OpenAPI Spec**: [`openapi.yaml`](../../openapi.yaml)
- **Generated Schemas**: [`Server/app/schemas/generated.py`](../schemas/generated.py)
- **Contract Tests**: [`Server/tests/contract/`](../../tests/contract/)
- **Coverage Script**: [`Server/scripts/validate-schema-coverage.py`](../../scripts/validate-schema-coverage.py)
- **CI Workflow**: [`.github/workflows/openapi-sync.yml`](../../.github/workflows/openapi-sync.yml)

## See Also

- `.cursor/rules/shared/openapi-types.mdc` - OpenAPI type management rules
- `.cursor/rules/backend/backend-architecture.mdc` - Backend architecture standards
- `Server/app/schemas/README.md` - Pydantic schemas documentation
