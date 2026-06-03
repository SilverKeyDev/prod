# PostHog API error investigation — summary

Merged from domain reports ([01-auth](./01-auth.md) through [05-search-integrations](./05-search-integrations.md)). **Window:** 7 days ending 2026-06-03.

## Headline

| Finding | Detail |
| ------- | ------ |
| Legacy `is_error` is misleading | Many routes show 50–80% “error rate” with **0% 5xx** (auth refresh, webhooks, admin 403, isochrone 400). |
| True incidents are concentrated | Google Calendar (`me/events`, `silverkey-calendar`), `GET /search/propertyComps`, `GET /search/isochrone`, `POST /research/property`. |
| `error_kind` not in prod yet | PostHog taxonomy lacks `error_kind` / `expected_client_error` on live events; **code ships in this PR** — redeploy API, then rebuild dashboards. |

## Prioritized easy wins (do first)

1. **Deploy API with `error_kind` + `expected_client_error`** — [`posthog_events.py`](../../../Server/app/services/analytics/posthog_events.py) + [`api_request_error_semantics.py`](../../../Server/app/services/analytics/api_request_error_semantics.py). Re-run HogQL from [posthog-capacity-queries.md](../../server/ops/posthog-capacity-queries.md).

2. **Change PostHog SLO insights** — Red/green on `error_kind = 'server'` (or `is_server_error`), not `is_error`. Add a second chart for `expected_client_error = true` volume (context only).

3. **Reclassify `POST /api/v1/auth/refresh-token`** — ~53% legacy error rate; **356×401 / 686** requests. Session expiry, not incidents. See [01-auth](./01-auth.md).

4. **Reclassify `POST /api/v1/webhooks/docusign/connect`** — ~54% legacy rate; **all 401** (HMAC verification). Ops audit secrets if logs show valid envelopes failing verify. See [02-oauth](./02-oauth.md).

5. **Fix Google Calendar 5xx cluster** — `GET /api/v1/google/me/events` (~27% 5xx), `POST .../silverkey-calendar` (~28% 5xx). Token refresh / API error mapping. See [05-search-integrations](./05-search-integrations.md).

6. **Fix `POST /api/v1/research/property` 5xx** — 9×500 in 7d (top agent/research incident). See [03-agent-research](./03-agent-research.md).

7. **Fix `GET /api/v1/search/isochrone` validation** — 79.6% legacy rate; mostly **400** (91) + 11×5xx. Client params or upstream geocoding. See [05-search-integrations](./05-search-integrations.md).

8. **Investigate `GET /api/v1/agent/chats/stream` in `api_request`** — PostHog shows **97×5xx** despite SSE exclusion in [`api_telemetry.py`](../../../Server/app/http/api_telemetry.py). Confirm whether non-SSE responses are captured; fix telemetry or handler. See [03-agent-research](./03-agent-research.md).

9. **Admin: one real 5xx** — `POST /api/v1/admin/logger-config` (1×500). Fix `merge_and_persist` path; reclassify 403/400 on reset-dev-data and partners logo. See [04-admin](./04-admin.md).

10. **Agent todos/chats 400 spike** — `POST /agent/todos` and `POST /agent/chats` ~70% legacy rate (22×400 each). OpenAPI validation / client payload; not auth gates. See [03-agent-research](./03-agent-research.md).

## Deferred (unless volume spikes after deploy)

- Celery FAILURE → HTTP 502 on task-status (product decision).
- PostHog Error Tracking suppression rules (no major 5xx themes in auth/oauth).
- Client `getTaskStatus` polling cleanup (low usage in Client today).
- OAuth callback 400 family as `expected_client_error` (follow-up semantics pass).

## Dashboard migration checklist

- [ ] Incident insight: `countIf(error_kind = 'server') / count()` by `endpoint`
- [ ] Noise insight: `countIf(expected_client_error = true)` by `endpoint`
- [ ] Retire or annotate insights using `is_error` alone
- [ ] Annotate refresh-token and webhook rows in the admin workspace error table

## Code shipped in this remediation

| Change | Path |
| ------ | ---- |
| Classifier | `Server/app/services/analytics/api_request_error_semantics.py` |
| Event properties | `Server/app/services/analytics/posthog_events.py` |
| Tests | `Server/tests/unit/services/analytics/test_api_request_error_semantics.py`, `test_capture_api_request.py` |
| Ops docs | `documentation/server/ops/posthog-api-error-semantics.md`, updated `posthog-capacity-queries.md` |
| Rule | `.cursor/rules/shared/api-instrumentation.mdc` |
