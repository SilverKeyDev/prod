# OpenAPI Validation Infrastructure

## Overview

This directory contains the core infrastructure for runtime OpenAPI contract validation in the SilverKey server. These utilities enable request and response validation against Pydantic schemas generated from `openapi.yaml`.

## Files

### `validation.py`

Core validation decorators for Flask routes.

**Decorators:**
- `@validate_request(schema)` - Validates JSON request body against Pydantic schema
- `@validate_form_request(schema, form_key=..., parse_json=...)` - Validates multipart/form fields (not binary files)
- `@validate_query(schema)` - Validates query string parameters
- `@validate_response(schema)` - Validates response matches schema (logs only)
- `has_request_validation_decorator(func)` - Checks for request validation decorators (contract tests)
- `has_validation_decorator(func)` - Legacy helper; includes response decorators

**Features:**
- Strict request/query/form validation (invalid bodies return 400)
- Integrates with `SecureErrorHandler` for consistent error responses
- Automatic PII scrubbing via centralized logger

**Example:**
```python
from app.schemas import LoginData
from app.utils.validation import validate_request

@validate_request(LoginData)
def login(data: LoginData):
    return handle_login(data.model_dump(mode="json"))
```

### `validation/helpers.py`

Helper utilities for working with Pydantic validation errors.

**Functions:**
- `format_validation_errors(errors)` - Convert Pydantic errors to user-friendly dict
- `validate_response_data(data, schema)` - Validate without raising exceptions
- `get_validation_summary(errors)` - Human-readable error summary
- `extract_required_fields(schema)` - Get required field names from schema
- `create_validation_error_response(e, path)` - Legacy dict builder; prefer `SecureErrorHandler.handle_validation_error` + `format_validation_errors` instead

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

### Route decorators (`app/utils/route/openapi_auth.py`)

OpenAPI validation-aware decorators; import via `app.utils.common_patterns` or `app.utils.route`.

**Decorators:**
- `@require_validated_user(schema)` - Auth + optional request validation
- `@require_validated_agent(schema)` - Agent auth + optional validation

**Example:**
```python
from app.schemas import CreateTodoRequest
from app.utils.common_patterns import require_validated_agent  # or app.utils.route

@agent_bp.route('/todos', methods=['POST'])
@require_validated_agent(CreateTodoRequest)
def create_todo(user, data: CreateTodoRequest):
    """Agent endpoint with validation."""
    return create_todo_handler(user, data)
```

## Validation mode

**Configuration**: `OPENAPI_VALIDATION_MODE=strict` (default when unset)

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
- All schema mismatches resolved (watch `ERRORS` logs during soak)

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
def login(data: LoginData):
    # ...
```

### Step 3: Use validated data in the handler

```python
def login(data: LoginData):
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

Invalid requests should return 400; check `ERRORS` logs if clients report failures.

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

### Issue: Route handler never runs (400 validation_error)

**Cause:** Request body does not match the OpenAPI schema

**Solution:**
1. Check logs for validation errors (`OpenAPI request validation failed`)
2. Fix schema in `openapi/` or align the client payload
3. Regenerate: `make openapi`

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

## Exceptions and special cases

### Request validation

| Case | Approach |
| ---- | -------- |
| **No JSON body** (cookie auth, path-only POST) | `@validate_request(EmptyRequest)` |
| **Multipart metadata** (e.g. DocuSign template create) | `@validate_form_request(Schema, form_key="metadata", parse_json=True)` |
| **Multipart form fields only** (e.g. upload `address`) | `@validate_form_request(SecureUploadDocumentForm)`; binary `file` via `file_security` |
| **Multipart file + notes** (agreement revision) | `@validate_request(EmptyRequest)` on route; PDF/notes validated in handler |
| **GET-only route modules** | No `@validate_request` required; coverage script skips files without POST/PUT/PATCH |

### Webhooks

| Endpoint | Body validation | Trust boundary |
| -------- | ---------------- | -------------- |
| DocuSign Connect | `@validate_request(DocusignWebhookPayload)` | HMAC `X-DocuSign-Signature-1` |
| Google Calendar push | `@validate_request(GoogleCalendarWebhookBody)` (optional JSON) | `X-Goog-Channel-Token` + channel headers |

### Response validation

`@validate_response` is **log-only**: invalid 2xx JSON is logged under `ERRORS` and the handler response is still returned unchanged. Use it on routes whose success body matches a generated Pydantic model from `openapi/openapi.yaml`.

#### Do not apply `@validate_response`

| Route / area | Response type | Notes |
| ------------ | ------------- | ----- |
| `GET /api/v1/agent/chats/stream` | `text/event-stream` (SSE) | Request body may still use `@validate_request`; stream chunks are not a single JSON envelope. Same telemetry exclusion as [api-instrumentation.mdc](../../../.cursor/rules/shared/api-instrumentation.mdc). |
| Research property streams (`/api/v1/search`, research routes) | SSE | e.g. `stream_with_context` + `mimetype="text/event-stream"` in `Server/app/routes/research/research.py`. |
| Google Calendar `GET /api/v1/google/oauth/start`, `.../oauth/enhance`, `.../oauth/callback` | `302` redirect or non-envelope JSON errors | No `{ success, ... }` JSON success body to validate. |
| DocuSign `GET /api/v1/docusign/oauth/callback` | HTTP redirect | OAuth completion redirect; not a typed JSON envelope. |
| Report `GET /api/v1/report/<id>/view` (and similar) | `application/pdf` inline | Binary body; only JSON URL/list endpoints use `@validate_response`. |
| Agreement/report file download via presigned URL | JSON URL wrapper only | Apply `@validate_response` on JSON endpoints (e.g. `GET .../agreements/{id}/download`, report `download-url` / `view-url`), not on following the presigned URL or raw PDF bytes. |

#### SSE pattern (reference)

- **Agent messaging stream:** `Server/app/routes/agent/handlers/chats_stream.py`
- **Property research stream:** `Server/app/routes/research/research.py`

For SSE routes, validate the **incoming JSON request** when applicable; skip response validation on the stream itself.

## Best Practices

1. **Always check schema exists** before migrating route
2. **Use required `data: Schema`** in handlers (no `request.get_json()` fallbacks)
3. **Log validation failures** for debugging
4. **Remove legacy validation** after migration
5. **Test both valid and invalid** requests
6. **Monitor failure rates** in staging before production deploy
7. **Update schemas first** if validation fails

## Resources

- **Migration / rollout:** [openapi-validation-rollout.md](../../../documentation/openapi-validation-rollout.md)
- **OpenAPI Spec**: [`openapi.yaml`](../../openapi.yaml)
- **Generated Schemas**: [`Server/app/schemas/generated.py`](../schemas/generated.py)
- **Contract Tests**: [`Server/tests/contract/`](../../tests/contract/)
- **Coverage Script**: [`Server/scripts/validate-schema-coverage.py`](../../scripts/validate-schema-coverage.py)
- **CI Workflow**: [`.github/workflows/openapi-sync.yml`](../../.github/workflows/openapi-sync.yml)

## See Also

- `.cursor/rules/shared/openapi-types.mdc` - OpenAPI type management rules
- `.cursor/rules/backend/backend-architecture.mdc` - Backend architecture standards
- `Server/app/schemas/README.md` - Pydantic schemas documentation
