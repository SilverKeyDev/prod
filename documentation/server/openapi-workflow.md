# OpenAPI workflow

The OpenAPI spec under `openapi/` is the **single source of truth** for HTTP contracts. Client TypeScript and Server Pydantic types are generated — never hand-edit generated files.

## Quick commands

```bash
make openapi          # Bundle + regenerate Client TS + Server Pydantic
make openapi-verify   # Regenerate, fail on git drift, run contract checks
```

From `Client/`: `pnpm generate:api-types`  
From `Server/`: `bash scripts/generate-pydantic-models.sh`

## Edit workflow

1. Change schemas under `openapi/` (not `api.generated.ts` or `generated.py`).
2. Validate: `npm run openapi:validate` or `swagger-cli validate openapi/openapi.yaml`.
3. Regenerate both surfaces (`make openapi`).
4. Run `pnpm typecheck` (Client) and targeted pytest if routes changed.
5. Commit spec + generated files together.

## CI

- **`.github/workflows/openapi-sync.yml`** — validates spec and checks generated file drift on OpenAPI changes.
- **Contract tests:** `Server/tests/contract/` where applicable.

## Cursor rules

- [`.cursor/rules/shared/openapi-workflow.mdc`](../../.cursor/rules/shared/openapi-workflow.mdc) — full CI and local steps.
- [`.cursor/rules/shared/openapi-types.mdc`](../../.cursor/rules/shared/openapi-types.mdc) — type usage patterns.

## Current state

OpenAPI 3.1 adoption is complete for core routes. Historical adoption logs live under [documentation/dev/cursor-legacy/](../dev/cursor-legacy/) (read-only reference).

Runtime request validation: see [openapi-validation-rollout.md](./openapi-validation-rollout.md).

## Related

- [API conventions](./api-conventions.md)
- [Server ARCHITECTURE.md](../../Server/ARCHITECTURE.md)
