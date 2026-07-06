# Scripts Guide

Canonical reference for every script in the SilverKey monorepo. The **Makefile** (repo root) is the single authoritative entry point — run `make help` for the full list of targets. Files under `scripts/`, `Server/scripts/`, `Client/scripts/`, and `.github/scripts/` are implementation details that back those targets.

---

## Quick decision guide

| I want to… | Run |
|---|---|
| First-time machine setup | `make setup` (core) then `make setup-dev` (backend) |
| Refresh deps after `git pull` | `make refresh` |
| Reset/init the local dev database | `make dev-db-init` |
| Start full dev stack (web + backend) | `make dev` |
| Start backend only | `make dev-backend` |
| Run all linters (client + server) | `make lint` |
| Run client typecheck + lint + format + build | `make check-client` |
| Run server tests | `make test-be` |
| Run client tests | `make test-fe` |
| Regenerate OpenAPI types | `make openapi` |
| Verify OpenAPI drift (pre-PR) | `make openapi-verify` |
| Check docs placement | `make check-docs` |
| Regenerate log contracts | `make log-contracts` |
| Extract Flask route inventory | `make routes-extract` |
| Rotate AWS secrets → `.env` | `make secrets` |
| Run pre-commit hooks on all files | `make precommit` |
| Run pre-push hooks manually | `make pre-push-check` |
| Investigate auth logout incident | `./scripts/ops/correlate-auth-incident.sh <ID>` |
| Audit HTTP client call sites | `./scripts/ops/list-auth-http-entrypoints.sh` |

---

## Tree 1: `scripts/` (repo root)

Orchestration scripts called directly from the Makefile or used by git hooks.

### Top-level files

| Script | Purpose | Called by |
|--------|---------|-----------|
| `print-automation-memory.sh` | Print Cursor automation memory seeds for a persona | Manual; `.cursor` docs |

### `setup/` — onboarding and refresh

| Script | Purpose | Called by |
|--------|---------|-----------|
| `setup/setup-local.sh` | Core onboarding: deps, Client + Server env, verify | `make setup` |
| `setup/setup-dev.sh` | Backend onboarding: AWS SSO, secrets (prod DATABASE_URL), backend verify | `make setup-dev` |
| `setup/setup-mcp.sh` | Cursor MCP config install and verify only | `make setup-mcp` |
| `setup/refresh.sh` | Post-`git pull` refresh: clean caches, pnpm install, bootstrap-venv, optional secrets, optional DB reset | `make refresh` |
| `setup/check-deps.sh` | Scan local machine prerequisites | Manual |

### `ci/` — CI and quality gates

| Script | Purpose | Called by |
|--------|---------|-----------|
| `ci/run-all-linters.sh` | Unified lint entry point: fix phase then client + server gate | `make lint`; `.github/workflows/lint.yml` |
| `ci/sync-openapi.sh` | Bundle OpenAPI, regen types, drift check, contract tests, typecheck | `make openapi-verify`; pre-commit `openapi-drift` hook |
| `ci/githook-path-filters.sh` | Path patterns for scoped git hooks | `pre-push-check.sh` |
| `ci/pre-commit-openapi-drift.sh` | OpenAPI regen when spec/generated paths change (`--advisory`) | `.pre-commit-config.yaml` |
| `ci/pre-push-check.sh` | Scoped typecheck / contract tests; blocking via `make`, advisory on `git push` | `scripts/githooks/pre-push`; `make pre-push-check` |
| `ci/check-script-references.sh` | Fail on stale flat `scripts/*.sh` references after reorganization | `make check-docs` |
| `ci/test-secrets-database-url.sh` | Unit tests for DATABASE_URL helpers (`scripts/lib/secrets-database-url.sh`) | `make check-docs` |
| `ci/test-setup-verify-database.sh` | Tests `setup_verify_env_file` accepts local + remote `DATABASE_URL` | `make check-docs` |
| `ci/test-setup-verify-redis.sh` | Tests `setup_verify_redis` soft vs strict (`SETUP_REQUIRE_REDIS`) | `make check-docs` |
| `ci/test-secrets-retrieval.sh` | Mock-AWS integration tests for `secrets.sh` (prod default vs `USE_LOCAL_DATABASE=1`) | `make check-docs` |
| `ci/check-doc-placement.sh` | Fail if forbidden `docs/` paths or misplaced long markdown are detected | `make check-docs`; `.github/workflows/doc-check.yml` |
| `ci/check-doc-links.sh` | Check internal markdown links | `make check-docs`; `.github/workflows/doc-check.yml` |
| `ci/check-macos-duplicate-files.sh` | Fail on iCloud-style duplicate filenames | First step of `run-all-linters.sh` |
| `ci/run-pre-commit.sh` | Locate and invoke `pre-commit run --all-files`; never blocks | `make precommit` |
| `ci/pre-commit-prettier-client.sh` | Run Prettier on staged Client files via project Node toolchain | `.pre-commit-config.yaml` `prettier-client` hook |
| `ci/pre-commit-eslint-client.sh` | ESLint `--fix` on staged Client files (advisory) | `.pre-commit-config.yaml` `eslint-client` hook |

See `scripts/ci/README.md` for the add-a-script policy.

### `log_contracts/` — log contract codegen

| File | Purpose |
|------|---------|
| `log_contracts/categories.yaml` | Source YAML for log categories and config keys |
| `log_contracts/schema.py` | YAML → contract schema dataclasses |
| `log_contracts/generate.py` | Emit Client + Server logger contracts | `make log-contracts` |
| `log_contracts/verify.sh` | Regen log contracts and fail on drift | `make log-contracts-verify` |
| `log_contracts/README.md` | Workflow and generated artifact map |

### `lib/` — sourced helpers (not run standalone)

| File | Purpose | Sourced by |
|------|---------|-----------|
| `deps.sh` | Prerequisite scan and install helpers | `setup/check-deps.sh`, `setup/setup-local.sh`, `setup/refresh.sh` |
| `aws-setup.sh` | AWS SSO setup and profile configuration | `setup/setup-dev.sh` |
| `aws-sso-env.sh` | AWS profile and region env helpers | `Server/scripts/secrets.sh` |
| `secrets-database-url.sh` | `DATABASE_URL` classification helpers (local vs remote, secret name patterns) | `Server/scripts/secrets.sh`, `setup-verify.sh`, `ci/test-secrets-database-url.sh` |
| `client-env-from-secrets.sh` | Split `EXPO_PUBLIC_*` keys into Client `.env` | `Server/scripts/secrets.sh` |
| `setup-verify.sh` | Post-setup verification checks (`SETUP_REQUIRE_REDIS=1` enforces Redis; default warns) | `setup/setup-local.sh`, `setup/setup-dev.sh` |
| `setup-mcp.sh` | MCP install and verify logic (lib version) | `setup/setup-mcp.sh` |
| `clean-caches.sh` | Remove regenerable dev caches | `make clean-caches`; `setup/refresh.sh` |

### `run/` — local dev orchestration

| File | Purpose | Called by |
|------|---------|-----------|
| `run-web.sh` | Full dev stack: backend + typecheck + Vite | `make dev` |
| `run-backend.sh` | Redis + Flask (or gunicorn) + Celery | `make dev-backend`; sourced by `run-web.sh` |
| `run-ios.sh` | Metro + iOS simulator; optional backend spawn | Manual / `run-all.sh` |
| `run-all.sh` | macOS: open Terminal windows for backend + web + Chrome | Manual |
| `dev_ports.sh` | Port kill and probe helpers | Sourced by `run-backend.sh`, `run-web.sh`, `run-all.sh` |
| `open-localhost-chrome.sh` | Open dev URL in Chrome | `run-all.sh` |

### `githooks/` — git hooks

| File | Purpose |
|------|---------|
| `pre-commit` | Advisory: format/lint autofix + OpenAPI regen; re-stages fixes; never blocks commit |
| `pre-push` | Advisory: scoped typecheck / contract tests; never blocks push. Strict: `PRE_PUSH_BLOCKING=1 make pre-push-check` |

Install with: `git config core.hooksPath scripts/githooks`

### `deploy/` — deployment helpers

| Path | Purpose | Called by |
|------|---------|-----------|
| `deploy/prod-parity/compose.sh` | Prod-parity compose wrapper; `build` passes all `Client/.env` keys as `--build-arg` | `make prod-parity-build` |
| `deploy/prod-parity/docker-compose.yml` | Local prod-parity stack: app, Redis, Celery worker, Beat | `make prod-parity` via `compose.sh` |
| `deploy/prod-parity/smoke.sh` | Build, boot, `/livez` + `/readyz`, tear down | `make prod-parity-smoke`; `ci/does-it-run-docker.sh` (CI overlay) |
| `deploy/prod-parity/docker-compose.ci.yml` | Ephemeral Postgres overlay for CI does-it-run | `does-it-run-docker.sh` |
| `ci/does-it-run.sh` | PR smoke gate (frontend + backend-light; docker when deploy paths change) | `make does-it-run`; `.github/workflows/does-it-run-callable.yml` |

Canonical production deploy lives in `.github/scripts/ec2-deploy.sh`, invoked by `.github/workflows/ci_web.yml` via SSH.

### `load/` — load testing (manual / staging only)

| File | Purpose |
|------|---------|
| `load/smoke.js` | k6 short smoke against `/livez` and health paths |
| `load/health-db.js` | k6 DB health load probe |
| `load/authenticated-read.js` | k6 authenticated read paths |

See `scripts/load/README.md` for usage.

### `ops/` — manual ops and audit helpers

Not wired to any Makefile target or CI workflow. Run directly when investigating production issues.

| Script | Purpose |
|--------|---------|
| `ops/correlate-auth-incident.sh <ID>` | Correlate client + server logs for an unexpected logout via X-Request-ID |
| `ops/list-auth-http-entrypoints.sh` | List `apiRequest` vs `httpClient`/`fetchJson` call sites for auth surface audit |

---

Backend-specific scripts. Activate `Server/.venv` before running Python scripts directly.

### Codegen and contract scripts

| Script | Purpose | Called by |
|--------|---------|-----------|
| `generate-pydantic-models.sh` | OpenAPI → `app/schemas/generated.py` | Root `openapi:generate`; `scripts/ci/sync-openapi.sh`; `.github/workflows/openapi-sync.yml` |
| `bootstrap-venv.sh` | Create or refresh `.venv`, install requirements | `scripts/setup/setup-local.sh`; `scripts/setup/refresh.sh` |
| `secrets.sh` | AWS Secrets Manager → `Server/.env` (prod `DATABASE_URL` by default; `USE_LOCAL_DATABASE=1` for local Docker); does not reset or migrate DBs | `make secrets`; `scripts/setup/refresh.sh --secrets` |
| `prod-db-secrets.sh` | Production DB secret → `Server/.env.prod-db`; requires prod/admin AWS access | `make prod-db-secrets` |
| `gunicorn-entrypoint.sh` | Env-driven Gunicorn launcher (workers, timeout, bind from env) | `Dockerfile.web` CMD; `run-backend.sh --production`; EC2 health checks |

### `lint/` — server linters (invoked by `run-all-linters.sh`)

Shell linters:

| Script | Purpose |
|--------|---------|
| `lint/lint_10_ruff.sh` | `ruff check --fix` + `ruff format --check` |
| `lint/lint_20_pyright.sh` | Pyright type check |
| `lint/lint_30_vulture.sh` | Dead code scan (advisory unless `VULTURE_STRICT=1`) |

Python linters:

| Script | Purpose |
|--------|---------|
| `lint/lint_circular_imports.py` | Fail on circular imports via app factory import chain |
| `lint/lint_compile.py` | Compile-check all `.py` files for syntax |
| `lint/lint_file_length.py` | Warn >400 lines / error >500 lines per file |
| `lint/lint_folder_count.py` | Warn / error on crowded directories |
| `lint/lint_import_time_env.py` | Ban `os.environ` raises at import time in `app/` |
| `lint/lint_timezone_aware.py` | Detect naive `datetime.now()` calls |
| `misc/check_coverage_thresholds.py` | Enforce per-module coverage floors from `coverage.json` |

### `endpoints/` — route inventory and PostHog sync

| Script | Purpose | Called by |
|--------|---------|-----------|
| `endpoints/extract_routes.py` | Write `Server/endpoints.json` from Flask route registry | `make routes-extract`; `test-callable.yml` |
| `endpoints/check_dead_endpoints.py` | Diff route inventory vs PostHog `api_request` events | `make endpoints-check-dead`; `endpoints-check-dead.yml` |
| `endpoints/endpoint_coverage.py` | Shared inventory vs `api_request` diff (7d) | Imported by check/sync scripts |
| `endpoints/sync_inventory_posthog.py` | POST inventory + dead routes to PostHog | `make endpoints-sync-posthog`; `endpoints-sync-posthog.yml` |
| `endpoints/posthog_constants_loader.py` | Load PostHog constants without Flask app context | Imported by check/sync scripts |

### Operator / manual tools

| Script | Purpose |
|--------|---------|
| `validate-schema-coverage.py` | OpenAPI decorator coverage report (advisory) |
| `misc/seed_georgia_forms.py` | Seed Georgia form library data into DB |
| `skyslope/generate_demo_dataset.py` | Generate synthetic SkySlope brokerage analytics demo dataset (SIL-285) |
| `skyslope/load_demo_to_skyslope.py` | Load SIL-285 demo CSVs into `skyslope_transactions` via SIL-272 upsert |
| `misc/delete_user_by_id.py` | Delete a user and related data by UUID |
| `postgres/export_postgres_docs.py` | Export Postgres schema docs |
| `redis_healthcheck.py` | Redis PING connectivity check |
| `db_healthcheck.py` | DB connectivity check via `DATABASE_URL` |
| `celery_healthcheck.py` | Kombu broker connectivity check (uses `Config.CELERY_URL`) |

### SQL templates (DBA reference, not CI)

| File | Purpose |
|------|---------|
| `sql/pg_enable_pg_stat_statements.sql` | Enable `pg_stat_statements` extension |
| `sql/explain_analyze_template.sql` | EXPLAIN ANALYZE query template |

---

## Tree 3: `Client/scripts/`

Frontend-specific scripts. Run from the `Client/` directory with `pnpm` or `node`.

### Top-level scripts

| Script | Purpose | Called by |
|--------|---------|-----------|
| `run-client-linters.sh` | Run `lint.d/*.sh` then `pnpm check` | `scripts/ci/run-all-linters.sh` (client gate) |
| `generate-api-types.sh` | `openapi-typescript` → `packages/types/api.generated.ts` | `pnpm generate:api-types`; root `openapi:generate` |
| `npm-audit-critical.sh` | `npm audit` for critical vulnerabilities (pnpm audit workaround) | `pnpm audit`; `pnpm check` |
| `assert-bundle-secrets.mjs` | Fail CI build if required bundle env is absent/invalid | `.github/workflows/ci_web.yml` |
| `export-bundle-docker-build-args.mjs` | Emit Docker `--build-arg` flags from manifest | `.github/workflows/ci_web.yml` |
| `verify-web-posthog-config.mjs` | Verify PostHog key is inlined in web dist | `pnpm verify:web:posthog`; `Dockerfile.web` |
| `verify-web-bundle-env.mjs` | Validate required env vars are present in web dist | Manual / documented for Docker |
| `check-web-dist-no-native.mjs` | Fail if web dist contains React Native imports | `@silverkey/web` `postbuild` |
| `generate-bundler-path-manifest.mjs` | Generate / check Metro path manifest for alias drift | `lint.d/15`; `pnpm generate:bundler-path-manifest` |
| `audit-alias-tooling-drift.mjs` | Check tsconfig vs Metro alias alignment | `lint.d/15`; `pnpm audit:alias-drift` |
| `audit-button-icons.mjs` | Heuristic audit for Button icon usage | `pnpm audit:button-icons` |
| `lighthouse-audit.mjs` | Lighthouse audit on SPA paths | `@silverkey/web` `pnpm lighthouse:audit` |
| `prod-deploy-smoke.sh` | Curl `/livez`, `/healthz`, `/api/maps/script` on prod | Manual post-deploy verification |
| `audit-directory-file-counts.py` | Folder file-count structure audit | Manual |
| `migrate-ui-deep-imports.py` | One-off deep import → barrel migration helper | Manual refactor tool |

### `duplication/`

| Script | Purpose | Called by |
|--------|---------|-----------|
| `duplication/audit-native-regular-dup.mjs` | Detect duplicate logic between native and web | `pnpm audit:native-duplication*` |
| `duplication/audit-cross-feature-imports.mjs` | Find cross-feature import violations | `pnpm audit:cross-feature-imports:json` |

### `visual-parity/`

| Script | Purpose | Called by |
|--------|---------|-----------|
| `visual-parity/record-web-storage.mjs` | Record Zustand storage state for parity comparison | `pnpm parity:web:record-storage` |
| `visual-parity/capture-web.mjs` | Playwright screenshots for visual parity | `pnpm parity:web:screenshots` |

### `a11y/`

| Script | Purpose | Called by |
|--------|---------|-----------|
| `a11y/critical-path-axe.mjs` | Playwright + axe-core on critical routes | `pnpm a11y:critical-path` |

### `lint.d/` — ordered Client lint hooks

| Script | Purpose | Called by |
|--------|---------|-----------|
| `lint.d/15_alias-drift.sh` | Alias drift check + bundler manifest verify | `run-client-linters.sh` |
| `lint.d/20_contrast-tokens.sh` | WCAG contrast token check | `run-client-linters.sh` |

### `lib/`

| File | Purpose |
|------|---------|
| `lib/bundle-env-manifest.mjs` | Shared manifest loader used by assert/verify bundle scripts |
| `lib/bundle-env-manifest.test.mjs` | Vitest tests for manifest loader |

---

## Tree 4: `.github/scripts/`

Scripts run exclusively inside GitHub Actions. Do not invoke locally unless debugging CI behavior.

| Script | Purpose | Called by |
|--------|---------|-----------|
| `ec2-deploy.sh` | Full EC2 deploy: ECR pull, Secrets Manager env merge, Docker stack (app/worker/beat/redis), static frontend sync | `.github/workflows/ci_web.yml` via SSH |
| `_secrets-env.sh` | AWS Secrets Manager merge + `.env.example` validation helpers | Sourced by `ec2-deploy.sh`, `fetch-client-bundle-env.sh` |
| `fetch-client-bundle-env.sh` | Fetch `EXPO_PUBLIC_*` from SM into `GITHUB_ENV` for ci_web Docker build | `.github/workflows/ci_web.yml` |
| `gh-db-upgrade.sh` | Build `Dockerfile.web --target migrate`, run `flask db upgrade` against prod DB secret | `.github/workflows/db-migrate-main.yml` |
| `summarize-openapi-sync-diff.sh` | Human-readable drift summary for generated OpenAPI artifacts | `.github/workflows/openapi-sync.yml` on failure |

---

## CI workflow → script mapping

| Workflow | Scripts invoked |
|----------|----------------|
| `lint.yml` | `scripts/ci/run-all-linters.sh` |
| `test-callable.yml` | `pytest`; `pnpm test:coverage`; `Server/scripts/misc/check_coverage_thresholds.py`; `Server/scripts/endpoints/extract_routes.py` |
| `openapi-sync.yml` | `Server/scripts/generate-pydantic-models.sh`; `Client/scripts/generate-api-types.sh`; `.github/scripts/summarize-openapi-sync-diff.sh` |
| `doc-check.yml` | `scripts/ci/check-doc-placement.sh`; `scripts/ci/check-doc-links.sh` |
| `ci_web.yml` | `fetch-client-bundle-env.sh`; `assert-bundle-secrets.mjs`; `export-bundle-docker-build-args.mjs`; `.github/scripts/ec2-deploy.sh` |
| `db-migrate-main.yml` | `.github/scripts/gh-db-upgrade.sh` |
| `endpoints-check-dead.yml` | `Server/scripts/endpoints/check_dead_endpoints.py` |
| `endpoints-sync-posthog.yml` | `Server/scripts/endpoints/sync_inventory_posthog.py` |
| `sunday_newsletter.yml` | Inline `run:` steps (email orchestrator; inlined, not a script file) |

---

## Naming conventions

| Type | Convention | Example |
|------|-----------|---------|
| Shell scripts (runnable) | `verb-noun.sh` | `sync-openapi.sh`, `check-doc-links.sh` |
| Shell scripts (sourced lib) | `noun.sh` or `verb-noun.sh` inside `lib/` | `lib/deps.sh`, `lib/aws-setup.sh` |
| Python scripts (standalone) | `verb_noun.py` (snake_case) | `extract_routes.py`, `lint_file_length.py` |
| Node / ESM scripts | `verb-noun.mjs` | `audit-button-icons.mjs`, `verify-web-posthog-config.mjs` |
| CI-only scripts | `verb-noun.sh` in `.github/scripts/` | `ec2-deploy.sh`, `gh-db-upgrade.sh` |
| Operator / one-off tools | `verb_noun.py` in `Server/scripts/misc/` or `verb-noun.sh` in `scripts/ops/` | `delete_user_by_id.py` |

---

## Required header block for new scripts

Every new script must open with a `Purpose` and `Called by` comment block:

**Shell:**
```bash
#!/usr/bin/env bash
# Purpose:  One sentence describing what this script does.
# Called by: make <target>; <workflow>.yml; or "Manual — ops only"
```

**Python:**
```python
#!/usr/bin/env python3
"""
Purpose:  One sentence describing what this script does.
Called by: make <target>; <workflow>.yml; or "Manual — ops only"
"""
```

**Node/ESM:**
```js
// Purpose:  One sentence describing what this script does.
// Called by: pnpm <script>; <workflow>.yml; or "Manual"
```

---

## Where to put a new script

| Situation | Location |
|-----------|----------|
| Backs a `make` target used by all devs (onboarding) | `scripts/setup/` |
| Backs a `make` target (single-purpose, rare) | `scripts/` root |
| Shared helper sourced by multiple `scripts/` files | `scripts/lib/` |
| Local dev orchestration (start services, open browser) | `scripts/run/` |
| Called from two or more CI workflows | `scripts/ci/` |
| Backend lint / quality gate | `Server/scripts/lint/` |
| Backend route or data ops | `Server/scripts/endpoints/` or `Server/scripts/misc/` |
| Backend operator data backfill | `Server/scripts/ops/` |
| Frontend quality gate or audit | `Client/scripts/` |
| Frontend ordered lint hook | `Client/scripts/lint.d/` (prefix with two-digit order number) |
| CI-only; not needed locally | `.github/scripts/` |
| Manual incident investigation / ops audit | `scripts/ops/` |

---

## Deprecating and deleting a script

1. **Find all callers.** Search the Makefile, all `.github/workflows/*.yml`, all `package.json` `scripts` entries, and any `source`/`.` calls in other shell scripts.
2. **Remove the Makefile target** (or `package.json` script) that invokes it.
3. **Remove any CI workflow steps** that call it.
4. **Delete the file.**
5. **Update this guide** — remove the row from the relevant table.
6. If the script had a subsystem README row (e.g. `scripts/ci/README.md`), remove that row too.

Do not leave scripts on disk after removing their callers. Orphaned scripts create confusion and are flagged by `Server/scripts/lint/lint_folder_count.py` and `lint_30_vulture.sh`.
