# Input validation and sanitization

Server-side validation is authoritative. Client Zod schemas in `Client/packages/schemas/` provide early feedback only.

## Decorators

| Decorator | Scope | Module |
| --------- | ----- | ------ |
| `@validate_request(Schema)` | JSON body | `Server/app/utils/validation/decorators.py` |
| `@validate_form_request(Schema, ...)` | Multipart / form fields (not binary files) | Same |
| `@validate_query(Schema)` | Query string | Same |
| `@validate_response(Schema)` | Success responses (logs only) | Same |

Generated Pydantic models live in `Server/app/schemas/generated.py` (from `openapi/`). Edit OpenAPI, then `make openapi`.

## Validation modes

| Variable | Values | Behavior |
| -------- | ------ | -------- |
| `OPENAPI_VALIDATION_MODE` | `strict` (default), `gradual` (legacy env only) | Logged on failures; decorators always reject invalid bodies |
| `OPENAPI_VALIDATION_STRICT_DOMAINS` | Comma-separated path prefixes | Historical incremental rollout; redundant when decorators are strict-only |

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
- Form/metadata fields: `@validate_form_request` (e.g. DocuSign `metadata` JSON, upload `address`)
- Optional address on upload: validated form + `sanitize_optional_address()` in `Server/app/utils/validation/sanitize.py`
- Service-layer bounds: `Server/app/utils/validation/service_boundary.py`

## Coverage audit

```bash
python3 Server/scripts/validate-schema-coverage.py
python3 Server/scripts/validate-schema-coverage.py --strict
```

The script requires `@validate_request` or `@validate_form_request` on every POST/PUT/PATCH handler in a route file. GET-only route modules are excluded from the file-level check. CI runs strict mode via `Server/scripts/lint/lint_openapi_validation_coverage.py`.

Contract test: `Server/tests/contract/test_openapi_compliance.py` asserts all mutating routes (except documented path prefixes) have request validation decorators.

## Strict rollout order

Canonical OpenAPI workflow: [openapi-workflow.md](./openapi-workflow.md).

1. Auth (`/api/v1/auth`, `/api/v1/user`, `/api/v1/preferences`, `/api/v1/search-display`)
2. Agent (`/api/v1/agent`)
3. Calendar (`/api/v1/google`)
4. Documents (`/api/v1/docusign`, `/api/v1/webhooks/docusign`, `/api/v1/upload`, `/api/v1/report`)
5. Remainder (narrow prefixes — never bare `/api/v1`)

Production default: `OPENAPI_VALIDATION_MODE=strict`. Use `gradual` plus `OPENAPI_VALIDATION_STRICT_DOMAINS` only for incremental soak or rollback.

Route handlers must not use `if data is None` / `request.get_json()` fallbacks; CI checks via `Server/scripts/lint/lint_no_validation_fallbacks.py`.

## Related

- [documentation/policies/security.md](../policies/security.md) — Section 4
- [Server/app/utils/README_OPENAPI_VALIDATION.md](../../Server/app/utils/README_OPENAPI_VALIDATION.md)
