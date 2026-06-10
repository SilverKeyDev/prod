# HTTP error codes (Flask routes)

Canonical status and JSON envelope rules for `Server/app/routes/`. Telemetry classification: [`../ops/posthog-api-error-semantics.md`](../ops/posthog-api-error-semantics.md).

## Status code matrix

| Situation | HTTP | PostHog `error_kind` | Handler |
| --------- | ---- | -------------------- | ------- |
| Success | 2xx | `none` | `standardize_success_response` or domain payload |
| Bad input / validation | **400** | `client` | `SecureErrorHandler.handle_validation_error`, `http_errors.validation`, `@validate_request` (strict) |
| Missing / invalid credentials | **401** | `auth` | `security_error_response(SecurityError.UNAUTHORIZED)`, `@require_authenticated_user` |
| Role / IDOR / scope denied | **403** | `forbidden` | `SecurityError.FORBIDDEN`, `@require_agent_access`, `http_errors.forbidden` |
| Resource not found | **404** | `not_found` | `SecurityError.RESOURCE_NOT_FOUND`, `http_errors.not_found` |
| State conflict | **409** | `client` | `http_errors.conflict` |
| DB integrity (global) | **422** | `client` | Flask `@app.errorhandler(IntegrityError)` |
| Rate limit | **429** | `rate_limited` | `@rate_limit` → `SecurityError.RATE_LIMIT_EXCEEDED` |
| Unexpected bug | **500** | `server` | `SecureErrorHandler.handle_database_error` (incident) |
| Upstream / dependency down | **502–504** | `server` | Prefer **503** via `handle_external_api_error` |
| Misconfiguration / missing env | **503** | `server` | `handle_configuration_error`, `http_errors.configuration_unavailable` |

## JSON envelope (`ErrorResponse`)

Required shape for JSON API errors (see `openapi/components/schemas/shared/core/ErrorResponse.yaml`):

```json
{
  "success": false,
  "error": "RESOURCE_NOT_FOUND",
  "message": "Resource not found",
  "error_id": "a1b2c3d4"
}
```

Optional: `field_errors`, `retry_after`, `retryable`.

## Rules

1. **Never** put `str(e)` or stack traces in client responses.
2. **Prefer** [`Server/app/utils/route/http_errors.py`](../../../Server/app/utils/route/http_errors.py), `SecureErrorHandler`, or `security_error_response` over ad-hoc `jsonify` for errors.
3. **Do not** duplicate auth checks when `@require_authenticated_user` / `@require_agent_access` already wrap the handler.
4. **500** is only for unexpected server faults after logging — not for “not found”, validation, or missing config.
5. When changing a route’s status code, update the matching `openapi/paths/*.yaml` `responses` and regenerate types (`make openapi`).

## Examples

```python
# Not found
return http_errors.not_found()

# Validation (missing field)
return http_errors.validation("homeId is required", field_errors={"homeId": "Required"})

# Missing API key at deploy time — not a user fault
return http_errors.configuration_unavailable(context={"feature": "maps"})

# Wrong — leaks internals
return jsonify({"success": False, "error": str(e)}), 500
```

## Related

- Backend rules: `.cursor/rules/backend/backend-architecture.mdc`, `backend-patterns.mdc`
- Global handlers: `Server/app/http/error_handlers.py`
- `SecurityError` tuples: `Server/app/utils/security/security.py`
