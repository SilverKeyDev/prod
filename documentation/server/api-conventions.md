# API Conventions

## OpenAPI Schema

**All API types are defined in the modular spec under `openapi/` (OpenAPI 3.1.0).** Redocly bundles `openapi/openapi.yaml` to a repo-root `openapi.yaml` for validation and codegen (gitignored; produced locally and in CI).

- **Editable source:** `openapi/openapi.yaml` (paths and schema `$ref`s), `openapi/components/schemas/**`, optional `openapi/paths/*.yaml` fragments
- **Client types:** `Client/packages/types/api.generated.ts` — regenerate with `make openapi` or `cd Client && pnpm generate:api-types` (after bundle)
- **Server models:** `Server/app/schemas/generated.py` — same regeneration flow; never hand-edit generated files

**Workflow for adding or modifying endpoints:**
1. Add or change schemas under `openapi/components/schemas/` and register `$ref`s in `openapi/openapi.yaml`; add or update `paths` in that file (or a `openapi/paths/` fragment merged into the main spec).
2. Validate: `npm run openapi:validate` or `make openapi-verify` (bundle + drift + contract tests).
3. Regenerate both surfaces: `make openapi`.
4. Use generated types in TypeScript: `import type { components } from "packages/types/api.generated"`.
5. Implement the Flask handler with matching request/response shapes; add `@validate_request` / `@validate_response` per [input-validation.md](./input-validation.md).

**Canonical workflow:** [openapi-workflow.md](./openapi-workflow.md). Type usage: [`.cursor/rules/shared/openapi-types.mdc`](../../.cursor/rules/shared/openapi-types.mdc).

## URL Structure

### Base Pattern

```
/api/v1/<resource>/<action>
```

**Examples:**
- `/api/v1/auth/login`
- `/api/v1/user/profile`
- `/api/v1/search/properties`
- `/api/v1/documents/agreements`

### Versioning

Use `/api/v1/` prefix for all routes. Future versions use `/api/v2/`, etc.

### RESTful Patterns

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/users` | List resources |
| GET | `/api/v1/users/<id>` | Get single resource |
| POST | `/api/v1/users` | Create resource |
| PUT | `/api/v1/users/<id>` | Update resource (full) |
| PATCH | `/api/v1/users/<id>` | Update resource (partial) |
| DELETE | `/api/v1/users/<id>` | Delete resource |

## Request Format

### Headers

**Required:**
```
Content-Type: application/json
```

**Auth (when required):**
```
Authorization: Bearer <token>
```

### JSON Body

```json
{
  "field": "value",
  "nested": {
    "field": "value"
  }
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Example"
  }
}
```

### List Response

```json
{
  "success": true,
  "data": [
    {"id": "1", "name": "Item 1"},
    {"id": "2", "name": "Item 2"}
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "User-friendly error message",
  "field_errors": {
    "email": "Invalid email format",
    "password": "Password too short"
  }
}
```

## Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid request (validation error) |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Valid auth, insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

## Authentication

### Login

**POST** `/api/v1/auth/login`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "<session-token>",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Protected Routes

Include `Authorization` header:

```
Authorization: Bearer <session-token>
```

## Validation

### Field Validation

Use `@validate_json_request` decorator:

```python
@user_bp.route('/update', methods=['PUT'])
@validate_json_request(required_fields=['name', 'email'])
@require_authenticated_user
def update_profile(user, data):
    # data is validated; required fields guaranteed present
    pass
```

### Error Response

```json
{
  "success": false,
  "error": "Missing required fields",
  "field_errors": {
    "name": "This field is required",
    "email": "This field is required"
  }
}
```

## Pagination

### Query Parameters

```
GET /api/v1/properties?page=2&per_page=20
```

### Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "per_page": 20,
    "total": 100,
    "pages": 5
  }
}
```

## Filtering

### Query Parameters

```
GET /api/v1/properties?min_price=300000&max_price=500000&bedrooms=3
```

### Implementation

```python
@search_bp.route('/properties', methods=['GET'])
@require_authenticated_user
def search_properties(user):
    min_price = request.args.get('min_price', type=int)
    max_price = request.args.get('max_price', type=int)
    bedrooms = request.args.get('bedrooms', type=int)

    properties = Property.query.filter(
        Property.price >= min_price,
        Property.price <= max_price,
        Property.bedrooms >= bedrooms
    ).all()

    return jsonify({
        'success': True,
        'data': [p.to_dict() for p in properties]
    })
```

## Sorting

### Query Parameters

```
GET /api/v1/properties?sort=price&order=desc
```

### Implementation

```python
sort_field = request.args.get('sort', 'created_at')
sort_order = request.args.get('order', 'asc')

query = Property.query
if sort_order == 'desc':
    query = query.order_by(getattr(Property, sort_field).desc())
else:
    query = query.order_by(getattr(Property, sort_field).asc())
```

## File Uploads

### Multipart Form Data

```python
@documents_bp.route('/upload', methods=['POST'])
@require_authenticated_user
def upload_document(user):
    file = request.files.get('file')
    if not file:
        return jsonify({'success': False, 'error': 'No file provided'}), 400

    # Validate file type
    allowed_extensions = {'pdf', 'jpg', 'png'}
    if not file.filename.split('.')[-1].lower() in allowed_extensions:
        return jsonify({'success': False, 'error': 'Invalid file type'}), 400

    # Upload to S3
    url = s3_service.upload_file(file, bucket='documents', key=f'user/{user.id}/{file.filename}')

    return jsonify({'success': True, 'url': url}), 201
```

## Presigned URLs

For large files, use presigned URLs:

```python
@documents_bp.route('/upload-url', methods=['POST'])
@validate_json_request(required_fields=['filename', 'content_type'])
@require_authenticated_user
def get_upload_url(user, data):
    filename = data['filename']
    content_type = data['content_type']

    key = f'user/{user.id}/{filename}'
    presigned_url = s3_service.generate_presigned_url(
        bucket='documents',
        key=key,
        content_type=content_type,
        expiration=3600
    )

    return jsonify({
        'success': True,
        'upload_url': presigned_url,
        'key': key
    })
```

Client uploads directly to S3 using the presigned URL.

## Webhooks

### DocuSign Connect webhook

**POST** `/api/v1/webhooks/docusign/connect`

DocuSign Connect must use this exact path (blueprint prefix `/api/v1/webhooks/docusign` plus route `/connect`). Implementation: [`Server/app/routes/documents/docusign/handlers/webhooks.py`](../../Server/app/routes/documents/docusign/handlers/webhooks.py) (`methods=['POST']`), registered in [`Server/app/__init__.py`](../../Server/app/__init__.py).

The handler verifies HMAC (`X-DocuSign-Signature-1` and related headers), persists a [`DocusignConnectEvent`](../../Server/app/models/documents/docusign_connect_event.py), and enqueues `process_webhook_task` for async processing. See [`Server/app/services/docusign/docs/TESTING.md`](../../Server/app/services/docusign/docs/TESTING.md) for curl checks and 405 troubleshooting.

```text
POST /api/v1/webhooks/docusign/connect
Content-Type: application/json
X-DocuSign-Signature-1: <HMAC>
```

## Rate Limiting

**Implementation:**
```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=lambda: request.headers.get('Authorization'))

@search_bp.route('/properties', methods=['POST'])
@limiter.limit("10 per minute")
@require_authenticated_user
def search_properties(user):
    # ...
```

**Response (when rate limit exceeded):**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again later."
}
```

## CORS

Allowed origins configured in `config.py`:

```python
CORS_ORIGINS = [
    'http://localhost:5173',  # Dev
    'https://app.silverkey.com',  # Prod
]
```

Supports credentials (cookies, auth headers):

```python
CORS(app, origins=CORS_ORIGINS, supports_credentials=True)
```

## Best Practices

1. **Always return JSON**: Use `jsonify()` for all responses
2. **Consistent format**: `{ "success": boolean, "data": ... }` or `{ "success": false, "error": ... }`
3. **Appropriate status codes**: 200 for success, 400 for validation, 401 for auth, 500 for server errors
4. **Validate input**: Use `@validate_json_request` decorator
5. **Auth first**: Apply `@require_authenticated_user` before other decorators
6. **Error handling**: Use `SecureErrorHandler` for user-facing errors
7. **Pagination**: For list endpoints with potentially large results
8. **Versioning**: Use `/api/v1/` prefix

## Testing API Routes

```python
def test_get_profile(client, auth_headers):
    response = client.get('/api/v1/user/profile', headers=auth_headers)
    assert response.status_code == 200
    assert response.json['success'] is True
    assert 'data' in response.json

def test_create_resource(client, auth_headers):
    data = {'name': 'Test', 'value': 123}
    response = client.post('/api/v1/resource', json=data, headers=auth_headers)
    assert response.status_code == 201
    assert response.json['success'] is True
```

## Further Reading

- **Flask architecture:** `documentation/server/flask-architecture.md`
- **Backend patterns:** `.cursor/rules/backend/backend-patterns.mdc`
- **Server overview:** `Server/ARCHITECTURE.md`
