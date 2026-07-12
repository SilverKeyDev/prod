# OpenAPI workflow

The modular spec under `openapi/` is the **single source of truth** for HTTP contracts. Client TypeScript and Server Pydantic types are generated — never hand-edit `Client/packages/types/api.generated.ts` or `Server/app/schemas/generated.py`.

## Repository layout

| Path | Role |
| ---- | ---- |
| `openapi/openapi.yaml` | Main spec: `paths` (mostly inline) and `components.schemas` `$ref`s |
| `openapi/components/schemas/` | Domain-organized schema YAML (see `.cursor/rules/shared/openapi-schema-organization.mdc`) |
| `openapi/paths/` | Optional path fragments (e.g. `rev-share.yaml`) when splitting large path blocks |
| `openapi.yaml` (repo root) | **Bundled artifact** from `npm run openapi:bundle` — used by swagger-cli and codegen; gitignored locally |

Paths for most routes live in `openapi/openapi.yaml` under `paths:`. New route documentation should match actual Flask blueprints; audit coverage with `python3 openapi/compare_routes.py`.

## Quick commands

```bash
make openapi                 # Bundle + regenerate Server Pydantic + Client TS
make openapi-verify          # Bundle, validate, regen, drift check, contract tests, typecheck
make openapi-verify-pre-push # Same as verify but skips contract tests (drift-only pre-push)
```

Repo root npm scripts (same bundle step CI uses):

```bash
npm run openapi:validate     # bundle openapi/openapi.yaml → openapi.yaml, then swagger-cli validate
npm run openapi:generate     # bundle + Server generate-pydantic-models.sh + Client pnpm generate:api-types
```

Per-surface only (after bundle):

```bash
cd Client && pnpm generate:api-types
cd Server && bash scripts/generate-pydantic-models.sh
```

## Edit workflow

1. Change `openapi/` — schemas under `openapi/components/schemas/`, paths in `openapi/openapi.yaml` (or merge from `openapi/paths/`).
2. Validate: `npm run openapi:validate` (preferred — bundles first) or, after bundling manually, `npx swagger-cli validate openapi.yaml`.
3. Regenerate: `make openapi`.
4. Verify before PR: `make openapi-verify` (or `make openapi-verify-pre-push` when you only need drift + typecheck).
5. Run `pnpm typecheck` in `Client/` and targeted `pytest` if route behavior changed.
6. Commit `openapi/**` plus regenerated `api.generated.ts` and `generated.py` together.

## CI

- **`.github/workflows/openapi-sync.yml`** — bundles `openapi/openapi.yaml`, validates, checks drift on generated files when `openapi/**` or generated outputs change.
- **Local mirror:** `scripts/ci/sync-openapi.sh` (invoked by `make openapi-verify`).
- **Contract tests:** `Server/tests/contract/test_openapi_contracts.py` (and `test_openapi_compliance.py` for decorator coverage).

## Cursor rules

- [`.cursor/rules/shared/openapi-workflow.mdc`](../../.cursor/rules/shared/openapi-workflow.mdc) — CI jobs and troubleshooting.
- [`.cursor/rules/shared/openapi-types.mdc`](../../.cursor/rules/shared/openapi-types.mdc) — type usage and shim patterns.
- [`.cursor/rules/shared/openapi-schema-organization.mdc`](../../.cursor/rules/shared/openapi-schema-organization.mdc) — folder layout for new schemas.

## Current state

OpenAPI 3.1 adoption is complete for core routes. Historical adoption notes are in git history only (legacy `documentation/dev/cursor-legacy/` was removed).

Runtime request validation modes are documented in this guide and `Server/app/utils/README_OPENAPI_VALIDATION.md`.

## Related

- [API conventions](../reference/api-conventions.md)
- [Input validation](./input-validation.md)
- [Server ARCHITECTURE.md](../../Server/ARCHITECTURE.md)
