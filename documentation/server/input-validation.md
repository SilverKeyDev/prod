# Input validation and sanitization

Server-side validation is authoritative. Client Zod schemas in `Client/packages/schemas/` provide early feedback only.

## Decorators

| Decorator | Scope | Module |
| --------- | ----- | ------ |
| `@validate_request(Schema)` | JSON body | `Server/app/utils/validation/decorators.py` |
| `@validate_query(Schema)` | Query string | Same |
| `@validate_response(Schema)` | Success responses (logs only) | Same |

Generated Pydantic models live in `Server/app/schemas/generated.py` (from `openapi/`). Edit OpenAPI, then `make openapi`.

## Validation modes

| Variable | Values | Behavior |
| -------- | ------ | -------- |
| `OPENAPI_VALIDATION_MODE` | `gradual` (default), `strict` | Invalid bodies: log + accept vs reject |
| `OPENAPI_VALIDATION_STRICT_DOMAINS` | Comma-separated path prefixes | Per-prefix strict while global mode is gradual |

Example staging rollout:

```bash
OPENAPI_VALIDATION_MODE=gradual
OPENAPI_VALIDATION_STRICT_DOMAINS="/api/v1/auth,/api/v1/login,/api/v1/signup"
```

## Webhooks

| Endpoint | Verification |
| -------- | ------------- |
| DocuSign Connect | HMAC (`X-DocuSign-Signature-1`); fails closed in non-development when secret unset |
| Google Calendar push | `X-Goog-Channel-Token` vs `GOOGLE_CALENDAR_WEBHOOK_TOKEN`; required headers and allowed `X-Goog-Resource-State` |

## Multipart and sanitization

- File uploads: `Server/app/utils/security/file_security.py`
- Optional address on upload: `sanitize_optional_address()` in `Server/app/utils/validation/sanitize.py`
- Service-layer bounds: `Server/app/utils/validation/service_boundary.py`

## Coverage audit

```bash
python3 Server/scripts/validate-schema-coverage.py
python3 Server/scripts/validate-schema-coverage.py --strict
```

The script flags route files missing `@validate_request`, `@validate_query`, or schema imports, and POST/PUT/PATCH handlers without `@validate_request`.

## Strict rollout order

1. Auth (`/api/v1/auth`, `/api/v1/login`, `/api/v1/signup`)
2. Agent
3. Documents / DocuSign
4. Calendar
5. Search / maps
6. Admin / public reads

Remove `if data is None: request.get_json()` fallbacks in each domain before enabling strict for that prefix.

## Related

- [documentation/security/SECURITY.md](../security/SECURITY.md) — Section 4
- [Server/app/utils/README_OPENAPI_VALIDATION.md](../../Server/app/utils/README_OPENAPI_VALIDATION.md)
