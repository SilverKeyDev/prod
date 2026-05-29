# OpenAPI validation rollout

Runtime validation of Flask request/response bodies against Pydantic schemas generated from OpenAPI. Implementation lives in `Server/app/utils/validation.py` and route decorators.

## Modes

| Mode | Behavior |
|------|----------|
| **gradual** | Validation errors logged; handlers may fall back to raw JSON |
| **strict** | Invalid requests rejected with standardized error responses |

Controlled via `OPENAPI_VALIDATION_MODE` in `Server/.env` (see `Server/.env.example`).

## Rollback

To disable strict validation quickly:

1. Set `OPENAPI_VALIDATION_MODE=gradual` (or unset strict) in environment.
2. Restart Flask workers / redeploy.
3. Monitor logs via `Server/logger` categories `API` and `ERRORS`.

No database migration required.

## Implementation pointers

- Decorators: `@validate_request`, `@validate_response` — `Server/app/utils/validation.py`
- Auth + validation: `@require_validated_user`, `@require_validated_agent` — `Server/app/utils/route/openapi_auth.py`
- Module README: [`Server/app/utils/README_OPENAPI_VALIDATION.md`](../../Server/app/utils/README_OPENAPI_VALIDATION.md)

## Related

- [OpenAPI workflow](./openapi-workflow.md)
- [API conventions](./api-conventions.md)
