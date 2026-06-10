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
| `check-doc-placement.sh` | Doc placement gate (`make check-docs`) |
| `check-doc-links.sh` | Internal markdown link gate (`make check-docs`) |
| `check-macos-duplicate-files.sh` | iCloud duplicate filename check (first step of lint) |
| `sync-openapi.sh` | OpenAPI regen + drift check (`make openapi-verify`) |
| `githook-path-filters.sh` | Path patterns for scoped commit/push hooks |
| `pre-commit-openapi-drift.sh` | OpenAPI regen when spec/generated paths change (advisory on commit) |
| `pre-push-check.sh` | Scoped typecheck / contract tests; git push sets `PRE_PUSH_ADVISORY=1` |
| `run-pre-commit.sh` | Manual pre-commit runner (`make precommit`; advisory exit 0) |
| `pre-commit-prettier-client.sh` | Prettier hook for staged Client files |
| `pre-commit-eslint-client.sh` | ESLint hook for staged Client files |
