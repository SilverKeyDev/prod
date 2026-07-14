# CI helper scripts

Shell helpers shared by **Makefile targets**, **GitHub Actions workflows**, and **pre-commit** hooks.

## When to add a script here

Add a new script under `scripts/ci/` when it is invoked from **two or more** of:

- A `make` target
- A `.github/workflows/*.yml` job
- `.pre-commit-config.yaml`
- Another CI script in this folder

One-off ops or manual investigation scripts belong in `scripts/ops/` instead.

Onboarding and machine setup scripts belong in `scripts/setup/`.

## Current inventory

| Script | Purpose |
|--------|---------|
| `run-all-linters.sh` | Unified lint entry (`make lint`) |
| `check-script-references.sh` | Stale flat `scripts/*.sh` path gate (`make check-docs`) |
| `test-secrets-database-url.sh` | DATABASE_URL helper unit tests (no AWS) |
| `test-setup-verify-database.sh` | Setup-verify DATABASE_URL acceptance tests |
| `test-setup-verify-redis.sh` | Setup-verify Redis soft vs strict (`SETUP_REQUIRE_REDIS`) tests |
| `test-secrets-retrieval.sh` | Mock-AWS `secrets.sh` integration tests |
| `check-doc-placement.sh` | Doc placement gate (`make check-docs`) |
| `check-doc-links.sh` | Internal markdown link gate (`make check-docs`) |
| `check-macos-duplicate-files.sh` | iCloud duplicate filename check (first step of lint) |
| `sync-openapi.sh` | OpenAPI regen + drift check (`make openapi-verify`) |
| `githook-path-filters.sh` | Path patterns for scoped commit/push hooks |
| `pre-commit-openapi-drift.sh` | OpenAPI regen when spec/generated paths change (advisory on commit) |
| `pre-push-check.sh` | Scoped typecheck / contract tests; git push sets `PRE_PUSH_ADVISORY=1` |
| `does-it-run.sh` | PR smoke gate entry (`frontend`, `backend-light`, `docker`, `all-light`); `make does-it-run`; `.github/workflows/does-it-run-callable.yml` |
| `does-it-run-frontend.sh` | Vite build + preview + HTTP 200 on `/` |
| `does-it-run-backend-light.sh` | Postgres+Redis + Gunicorn + `/livez` + `/readyz` |
| `does-it-run-docker.sh` | Full prod-parity Docker smoke with CI Postgres overlay |
| `generate-does-it-run-env.sh` | Stub server/client env for CI smoke (no AWS) |
| `does-it-run-path-filter.sh` | Detect deploy/Docker path changes for optional docker smoke |
| `check-dockerfile-web-backend-deps.sh` | Dockerfile.web backend COPY-order gate for `install-torch-cpu.sh` (always-on via backend-light) |
| `test-check-dockerfile-web-backend-deps.sh` | Fixture tests for the Dockerfile.web backend COPY-order gate |
| `does-it-run-health.sh` | Shared HTTP health assertions for backend-light |
| `does-it-run-services-compose.yml` | Ephemeral Postgres + Redis for backend-light |
| `run-pre-commit.sh` | Manual pre-commit runner (`make precommit`; advisory exit 0) |
| `pre-commit-prettier-client.sh` | Prettier hook for staged Client files |
| `pre-commit-eslint-client.sh` | ESLint hook for staged Client files |
