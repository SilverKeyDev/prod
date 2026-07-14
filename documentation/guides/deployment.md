# Deployment

> **Last verified:** 2026-05-29

## CI/CD pointers

| Area | Location |
|------|----------|
| Prod web deploy | `.github/workflows/ci_web.yml` |
| Lint (weekly) | `.github/workflows/lint.yml` |
| Tests on PR | `.github/workflows/test.yml` |
| API route inventory drift | `make routes-extract-verify` in `.github/workflows/test-callable.yml` (backend job) |
| PostHog endpoint inventory sync | `.github/workflows/endpoints-sync-posthog.yml` — after **Test & Coverage** succeeds on `main`, or `workflow_dispatch`; no DB (reads `Server/endpoints.json` only) |
| PostHog dead endpoints (weekly) | `.github/workflows/endpoints-check-dead.yml` — `make endpoints-check-dead` |
| OpenAPI drift | `.github/workflows/openapi-sync.yml` |
| Doc placement | `.github/workflows/doc-check.yml` |
| Deploy scripts | `scripts/deploy/` — EC2 reference scripts, [local prod-parity compose](../../scripts/deploy/prod-parity/docker-compose.yml); see [scripts/deploy/README.md](../../scripts/deploy/README.md) |

## Prod web (EC2)

- Scheduled deploys: Sunday and Wednesday 03:00 `America/New_York` via `ci_web.yml`; manual rollback via `workflow_dispatch` with a prior 12-char SHA tag.
- Immutable image tags from git SHA.
- Pre-deploy rollback image captured on EC2 — see [infrastructure-reliability-gap-audit.md](./deployment.md).

## Environment promotion

- Server runtime secrets: AWS Secrets Manager / `Server/.env` (local via `make secrets`).
- Client build-time env (`EXPO_PUBLIC_*`): AWS Secrets Manager only in `ci_web.yml` (`fetch-client-bundle-env.sh` → `assert-bundle-secrets.mjs`). Local: `make secrets` → `Client/.env`.

## PostHog API route inventory

| Command | When to run | On prod deploy? |
| ------- | ----------- | --------------- |
| `make routes-extract` | After adding/changing Flask routes; commit `Server/endpoints.json` | **No** — inventory is code-derived and verified in CI |
| `make routes-extract-verify` | CI on every PR/push (`.github/workflows/test-callable.yml` backend job, invoked via `test.yml`) | **No** |
| `make endpoints-sync-posthog` | CI after tests pass on `main`; weekly dead-route job; manual | **No** — posts `endpoint_inventory_sync` + `endpoint_dead_route` (dead = inventory minus 7d `api_request`); needs `POSTHOG_PROJECT_TOKEN` + `POSTHOG_QUERY_API_KEY` |
| `make endpoints-check-dead` | Local print-only diff (same HogQL logic, no PostHog capture) | **No** — needs 7 days of `api_request` traffic; new routes are expected to look “dead” right after deploy |

**PostHog config (hardcoded):** Ingest host, app URL, and project id (`441667`) live in `Server/app/services/analytics/posthog_constants.py` and `Client/packages/services/analytics/posthogConstants.ts` — not `.env` keys. Only ingest tokens and the query API key (dead-endpoint CI) are configured per environment.

**Prod runtime vs CI sync:** Production Flask emits `api_request` events when `POSTHOG_PROJECT_TOKEN` is set in `Server/.env` (AWS Secrets Manager / deploy). That is independent of the CI job that POSTs `endpoint_inventory_sync` + `endpoint_dead_route` from committed `Server/endpoints.json` (no database connection in either script).

**PostHog table for dead routes:** Use event `endpoint_dead_route` (one row per route), not `endpoint_inventory_sync` alone — see [runbooks/posthog/dead-routes-table.md](../runbooks/posthog/dead-routes-table.md).

**Sync workflow failures:** `endpoints-sync-posthog` and the weekly dead-route job exit non-zero when secrets are missing, HogQL returns no `api_request` data, capture/batch ingest errors, or PostHog does not show the sync for the deploy SHA within the verification window (~8–12 min; capture→HogQL lag). Tune with `POSTHOG_INGEST_VERIFY_MAX_ATTEMPTS` / `POSTHOG_INGEST_VERIFY_MAX_SLEEP_SECONDS` in the workflow env if needed.

**GitHub secrets:**

| Secret | Used by |
| ------ | ------- |
| `POSTHOG_PROJECT_TOKEN` | `endpoints-sync-posthog` + weekly dead-route sync (project ingest key `phc_…`) |
| `EXPO_PUBLIC_POSTHOG_KEY` | **Fallback only** for `ci_web.yml` Docker build when AWS SM omits the key (planned for removal; primary source is `posthog` SM secret) |
| `POSTHOG_QUERY_API_KEY` | HogQL observed-traffic query for sync/dead coverage (`make endpoints-sync-posthog`, `make endpoints-check-dead`; personal key with `query:read`) |

## Related

- [aws-resources.md](../reference/aws-resources.md)
- [ops/scaling-playbook.md](../runbooks/scaling-playbook.md)
- [runbooks/posthog/capacity-queries.md](../runbooks/posthog/capacity-queries.md)
- [setup.md](../../setup.md)
