# Deployment

> **Last verified:** 2026-05-28

## CI/CD pointers

| Area | Location |
|------|----------|
| Prod web deploy | `.github/workflows/ci_web.yml` |
| Lint (weekly) | `.github/workflows/lint.yml` |
| Tests on PR | `.github/workflows/test.yml` |
| API route inventory drift | `make routes-extract-verify` in `.github/workflows/test-callable.yml` (backend job) |
| PostHog dead endpoints (weekly) | `.github/workflows/endpoints-check-dead.yml` — `make endpoints-check-dead` |
| OpenAPI drift | `.github/workflows/openapi-sync.yml` |
| Doc placement | `.github/workflows/doc-check.yml` |
| Deploy scripts | `scripts/deploy/` — see [scripts/deploy/README.md](../../scripts/deploy/README.md) |

## Prod web (EC2)

- Immutable image tags from git SHA.
- Pre-deploy rollback image captured on EC2 — see [infrastructure-reliability-gap-audit.md](./infrastructure-reliability-gap-audit.md).

## Environment promotion

- Secrets via AWS Secrets Manager / `Server/.env` (local).
- Client build-time env: `Client/.env.example`, GitHub secrets/variables for prod maps/PostHog keys in `ci_web.yml` (PostHog `phc_` key is a repository **variable**).

## PostHog API route inventory

| Command | When to run | On prod deploy? |
| ------- | ----------- | --------------- |
| `make routes-extract` | After adding/changing Flask routes; commit `Server/endpoints.json` | **No** — inventory is code-derived and verified in CI |
| `make routes-extract-verify` | CI on every PR/push (`test.yml` backend job) | **No** |
| `make endpoints-check-dead` | Weekly GitHub Actions + manual `workflow_dispatch` | **No** — needs 7 days of `api_request` traffic; new routes are expected to look “dead” right after deploy |

**GitHub secrets for dead-endpoint check:** `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`.

## Related

- [aws-resources.md](./aws-resources.md)
- [setup.md](../../setup.md)
