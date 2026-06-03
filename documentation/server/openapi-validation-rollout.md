# OpenAPI validation rollout

Runtime validation of Flask request bodies against Pydantic schemas generated from OpenAPI. Implementation: [`Server/app/utils/validation/decorators.py`](../../Server/app/utils/validation/decorators.py), per-prefix overrides in [`domain_strict.py`](../../Server/app/utils/validation/domain_strict.py).

## Modes

| Variable | Values | Behavior |
| -------- | ------ | -------- |
| `OPENAPI_VALIDATION_MODE` | `strict` (default in code and production) | Logged on failures; invalid bodies always return 400 |
| `OPENAPI_VALIDATION_STRICT_DOMAINS` | Comma-separated path prefixes | Historical incremental soak only; decorators are strict-only after rollout |

Configure in deployment environment (not required in `Server/.env.example`). Defaults in code: global `strict`; empty strict domains list.

## Prefix rollout order

Enable prefixes **cumulatively** in staging, soak, then remove handler fallbacks for that phase before production.

| Step | Prefixes to append | Route areas |
| ---- | ------------------ | ----------- |
| 1 Auth | `/api/v1/auth`, `/api/v1/user`, `/api/v1/preferences`, `/api/v1/search-display` | Login, signup, profile, preferences, saved homes |
| 2 Agent | `/api/v1/agent` | Todos, chats, connection requests |
| 3 Calendar | `/api/v1/google` | Calendar CRUD, availability, webhook |
| 4 Documents | `/api/v1/docusign`, `/api/v1/webhooks/docusign`, `/api/v1/upload`, `/api/v1/report` | DocuSign, uploads, reports |
| 5 Remainder | Narrow prefixes only (see below) | Search, transactions, admin, feed, tasks, viewings, chat, client errors, offer, rev-share |

**Never** use bare `/api/v1` as a strict prefix (matches rev-share and everything else).

Example cumulative env (staging step 3):

```bash
OPENAPI_VALIDATION_MODE=gradual
OPENAPI_VALIDATION_STRICT_DOMAINS="/api/v1/auth,/api/v1/user,/api/v1/preferences,/api/v1/search-display,/api/v1/agent,/api/v1/google"
```

Remainder sub-prefixes (add in separate soak steps):

- `/api/v1/search`, `/api/v1/research`
- `/api/v1/transactions`
- `/api/v1/admin`
- `/api/v1/feed`, `/api/v1/tasks`, `/api/v1/viewings`, `/api/v1/chat`, `/api/v1/client`, `/api/v1/offer`
- `/api/v1/rev-share`, `/api/v1/partners`, `/api/v1/admin/partners`

## Per-phase done checklist

1. Triage validation failures in logs for routes under the new prefixes (&lt;1% failure rate for ~1 week, or zero failures in staging soak).
2. Fix `openapi/` / handler mismatches; run `make openapi-verify`.
3. Append prefixes to `OPENAPI_VALIDATION_STRICT_DOMAINS` (or rely on global `strict` after final phase).
4. Remove `data=None` / `request.get_json()` fallbacks in handlers for that phase.
5. Run `pytest Server/tests/contract/test_openapi_compliance.py` and `python3 Server/scripts/validate-schema-coverage.py --strict`.

## Rollback

Decorators no longer accept invalid bodies in any mode. To relax validation you must **redeploy a prior release** that still had handler fallbacks and gradual decorator behavior, or reintroduce those code paths in a hotfix.

For env-only triage without code rollback:

1. Monitor `ERRORS` logs (`OpenAPI request validation failed`).
2. Fix `openapi/` or client payloads for hot routes.

No database migration required.

## Audit commands

Re-run from repo root after each phase:

```bash
# Classic gradual fallbacks
rg 'if data is None' Server/app/routes

# Query gradual fallbacks
rg 'if query is None' Server/app/routes

# Handlers that bypass validated data
rg 'request\.get_json' Server/app/routes

# Decorator coverage (CI)
python3 Server/scripts/validate-schema-coverage.py --strict
```

**False positive:** `Server/app/routes/tasks.py` GET handler `if data is None` refers to service return value, not OpenAPI validation.

## Triage logs

```bash
rg 'OpenAPI (request|form|query) validation failed' <log-dir>
rg 'Gradual mode: accepting request despite' <log-dir>
```

Admin endpoint `GET /api/v1/admin/validation-stats` is a placeholder until log aggregation is implemented; use structured `ERRORS` logs for failure rates.

## Known pitfalls

- Calendar `create_event` / `update_event` must use validated `data`, not raw `request.get_json()`.
- DocuSign webhooks: body validation plus HMAC / header verification.
- `validation-stats` does not yet reflect live failure counts.

## Implementation pointers

- Decorators: `@validate_request`, `@validate_form_request`, `@validate_query` — `Server/app/utils/validation/`
- Module README: [`Server/app/utils/README_OPENAPI_VALIDATION.md`](../../Server/app/utils/README_OPENAPI_VALIDATION.md)
- Input validation overview: [input-validation.md](./input-validation.md)

## Related

- [OpenAPI workflow](./openapi-workflow.md)
- [API conventions](./api-conventions.md)
