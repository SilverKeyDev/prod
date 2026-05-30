# Deployment

> **Last verified:** 2026-05-29

## CI/CD pointers

| Area | Location |
|------|----------|
| Prod web deploy | `.github/workflows/ci_web.yml` |
| Lint (weekly) | `.github/workflows/lint.yml` |
| Tests on PR | `.github/workflows/test.yml` |
| API route inventory drift | `make routes-extract-verify` in `.github/workflows/test-callable.yml` (backend job) |
| PostHog endpoint inventory sync | `make endpoints-sync-posthog` in `.github/workflows/test-callable.yml` (main push only) |
| PostHog dead endpoints (weekly) | `.github/workflows/endpoints-check-dead.yml` — `make endpoints-check-dead` |
| OpenAPI drift | `.github/workflows/openapi-sync.yml` |
| Doc placement | `.github/workflows/doc-check.yml` |
| Deploy scripts | `scripts/deploy/` — see [scripts/deploy/README.md](../../scripts/deploy/README.md) |

## Prod web (EC2)

- Immutable image tags from git SHA.
- Pre-deploy rollback image captured on EC2 — see [infrastructure-reliability-gap-audit.md](./infrastructure-reliability-gap-audit.md).

## Environment promotion

- Secrets via AWS Secrets Manager / `Server/.env` (local).
- Client build-time env: `Client/.env.example`, GitHub secrets for prod maps/PostHog keys in `ci_web.yml` (`EXPO_PUBLIC_POSTHOG_KEY` is a repository **secret**, same value as `POSTHOG_PROJECT_TOKEN`).

## PostHog API route inventory

| Command | When to run | On prod deploy? |
| ------- | ----------- | --------------- |
| `make routes-extract` | After adding/changing Flask routes; commit `Server/endpoints.json` | **No** — inventory is code-derived and verified in CI |
| `make routes-extract-verify` | CI on every PR/push (`test.yml` backend job) | **No** |
| `make endpoints-sync-posthog` | CI on every push to `main`; manual with `POSTHOG_PROJECT_TOKEN` | **No** — posts `endpoint_inventory_sync` for dashboard LEFT JOIN |
| `make endpoints-check-dead` | Weekly GitHub Actions + manual `workflow_dispatch` | **No** — needs 7 days of `api_request` traffic; new routes are expected to look “dead” right after deploy |

**PostHog config (hardcoded):** Ingest host, app URL, and project id (`441667`) live in `Server/app/services/analytics/posthog_constants.py` and `Client/packages/services/analytics/posthogConstants.ts` — not `.env` keys. Only ingest tokens and the query API key (dead-endpoint CI) are configured per environment.

**GitHub secrets:**

| Secret | Used by |
| ------ | ------- |
| `POSTHOG_PROJECT_TOKEN` | `endpoints-sync-posthog` on merge to `main` (project ingest key `phc_…`; same value as `EXPO_PUBLIC_POSTHOG_KEY` repo secret) |
| `EXPO_PUBLIC_POSTHOG_KEY` | `ci_web.yml` prod web Docker build (project ingest key `phc_…`; same value as `POSTHOG_PROJECT_TOKEN`) |
| `POSTHOG_QUERY_API_KEY` | Weekly dead-endpoint HogQL check (`make endpoints-check-dead`; personal key with `query:read`) |

## Related

- [aws-resources.md](./aws-resources.md)
- [setup.md](../../setup.md)
