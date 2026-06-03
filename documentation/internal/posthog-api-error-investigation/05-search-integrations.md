# Search and integrations API error investigation

**Window:** last 7 days (`api_request` events)  
**Scope:** search, home-matching (except task-status deep-dive), Google Calendar/events (non-OAuth), transactions, search-display, property comps  
**Telemetry reference:** [posthog-api-error-semantics.md](../../server/ops/posthog-api-error-semantics.md), [posthog-capacity-queries.md](../../server/ops/posthog-capacity-queries.md)

## Scope and route inventory

| Family | Prefix / routes | Notes |
| ------ | ----------------- | ----- |
| Search | `GET/POST /api/v1/search/*` | Isochrone, polygon search, area tools, `propertyComps`, monthly-cost |
| Home matching | `POST /api/home-matching/find-matches` | Async Celery match scoring |
| Task status | `GET /api/home-matching/task-status/{task_id}` | **Brief:** same IDOR/403 pattern as research task-status — see [03-agent-research.md](./03-agent-research.md) |
| Google (integrations) | `/api/v1/google/*` **excluding** `oauth/*` | Calendar, events, freebusy, webhooks, connection-status |
| Google OAuth | `/api/v1/google/oauth/*` | Out of scope — [02-oauth.md](./02-oauth.md) |
| Transactions | `/api/v1/transactions/*` | Buyer checklist + tasks |
| Search display | `GET/PATCH /api/v1/search-display` | Map overlay prefs |

**HogQL domain filter** (used for all queries below):

```sql
AND (
  properties.endpoint LIKE '% /api/v1/search/%'
  OR properties.endpoint LIKE '% /api/home-matching/%'
  OR (properties.endpoint LIKE '% /api/v1/google/%' AND properties.endpoint NOT LIKE '%oauth%')
  OR properties.endpoint LIKE '% /api/v1/transactions/%'
  OR properties.endpoint LIKE '% /api/v1/search-display%'
)
```

## Methodology note: `error_kind` not in production yet

PostHog taxonomy reports **`error_kind`** and **`expected_client_error` are not present** on live `api_request` events (all values `NULL`). Queries that filter `error_kind = 'server'` return zero rows even where 5xx exists.

Until the branch with [`api_request_error_semantics.py`](../../../Server/app/services/analytics/api_request_error_semantics.py) ships:

| Metric | Use instead |
| ------ | ----------- |
| Incident / SLO | `properties.status_code >= 500` (or `is_server_error` if populated) |
| Legacy “error rate” | `properties.is_error = true` (any 4xx+) |
| Expected client noise | Infer from status + route (tables below) |

After deploy, re-run [incident vs legacy templates](../../server/ops/posthog-capacity-queries.md) and expect large drops on isochrone, home-matching validation, Google auth, and transaction access-denied rows.

## Domain summary (7 days)

| Metric | Value |
| ------ | ----- |
| Total requests | 2,270 |
| Legacy errors (`is_error`) | 573 (**25.2%**) |
| 5xx (proxy incident rate) | 167 (**7.4%**) |
| 429 at HTTP layer | **0** |
| `search-display` errors | 0 |

**Takeaway:** Legacy dashboards overstate reliability problems (~25% “errors”) while true server incidents are concentrated in **Google Calendar list/setup** and **Slipstream-backed comps** (~7% 5xx domain-wide).

## Incident rate (5xx by endpoint)

Sorted by 5xx count. “Legacy rate” included to show dashboard inflation.

| Endpoint | Total | 5xx | 5xx rate | Legacy errors | Legacy rate |
| -------- | ----- | --- | -------- | ------------- | ----------- |
| `GET /api/v1/google/me/events` | 327 | 88 | 26.9% | 138 | 42.2% |
| `POST /api/v1/google/me/silverkey-calendar` | 188 | 53 | 28.2% | 68 | 36.2% |
| `GET /api/v1/search/propertyComps` | 66 | 11 | 16.7% | 33 | 50.0% |
| `GET /api/v1/search/isochrone` | 142 | 11 | 7.7% | 113 | 79.6% |
| `GET /api/v1/transactions/me` | 69 | 4 | 5.8% | 8 | 11.6% |
| `POST /api/v1/search/properties-by-polygon` | 272 | 0 | 0% | 44 | 16.2% |
| `GET /api/v1/search-display` | 49 | 0 | 0% | 0 | 0% |
| `PATCH /api/v1/search-display` | 11 | 0 | 0% | 0 | 0% |

No other scoped endpoint recorded 5xx in this window.

## Legacy `is_error` hotspots (≥15% legacy rate, ≥10 requests)

| Endpoint | Legacy rate | Dominant non-5xx statuses |
| -------- | ----------- | --------------------------- |
| `GET /api/v1/google/clients/{client_id}/events` | 100% (18/18) | 403 only |
| `GET /api/v1/search/isochrone` | 79.6% | **400** (91), 401 (11) |
| `POST /api/home-matching/find-matches` | 75.6% | 400 (23), 401 (11) |
| `GET /api/v1/search/monthly-cost-estimates` | 75.0% | 400 (22), 401 (11) |
| `GET /api/v1/search/area-boundary` | 61.1% | 401 (11) |
| `GET /api/v1/search/propertyComps` | 50.0% | 400/401/503 mix |
| `PUT /api/v1/transactions/{transaction_id}/tasks` | 43.5% | **403** (20) |
| `GET /api/v1/transactions/.../tasks/progress-summary` | 44.7% | **403** (17) |
| `GET /api/home-matching/task-status/{task_id}` | 33.3% | **403** (11) — reclassify when `error_kind` ships |

## 429 (rate limits)

| Observation | Detail |
| ----------- | ------ |
| PostHog `api_request` with `status_code = 429` | **0** in 7d for this domain |
| In-process Slipstream 429 | Handled inside [`search_loop_helpers.py`](../../../Server/app/services/search/helpers/search_loop_helpers.py) (retry up to 24/page); may not surface as HTTP 429 on polygon search |
| Google client retries | [`calendar/core/service.py`](../../../Server/app/services/calendar/core/service.py) `status_forcelist` includes 429 |
| Flask `@rate_limit` on calendar routes | Returns 429 per global semantics when tripped — no hits in window |

**Action:** When Slipstream or Google returns sustained 429, expect `error_kind=rate_limited` + `expected_client_error=true` after semantics deploy (already defined in code).

## Status breakdown (top error rows)

| Endpoint | Status | Requests | Likely cause |
| -------- | ------ | -------- | ------------ |
| `GET /api/v1/search/isochrone` | 400 | 91 | Missing/invalid important locations (`NO_LOCATIONS`, `NO_VALID_LOCATIONS`) |
| `GET /api/v1/google/me/events` | 503 | 88 | Google/upstream failure surfaced to client |
| `POST /api/v1/google/me/silverkey-calendar` | 503 | 50 | Calendar create/get failures |
| `GET /api/v1/google/me/events` | 404 | 26 | Calendar not found / restricted scope |
| `GET /api/v1/google/me/events` | 401 | 24 | Disconnected or expired Google token |
| `POST /api/home-matching/find-matches` | 400 | 23 | Validation / bad payload |
| `GET /api/v1/search/monthly-cost-estimates` | 400 | 22 | Missing/invalid zip |
| `PUT .../transactions/.../tasks` | 403 | 20 | `can_access_transaction` denial |
| `GET .../clients/{client_id}/events` | 403 | 18 | Agent lacks client connection or calendar permission |
| `POST /api/v1/search/properties-by-polygon` | 400 | 18 | Validation / prefs resolution |
| `GET /api/v1/search/isochrone` | 500 | 11 | Isochrone generation exception path |
| `GET /api/v1/search/propertyComps` | 503 | 11 | Slipstream via `handle_external_api_error` |

## Slow requests (`is_slow`, 7d)

| Endpoint | Slow count | p95 (ms) |
| -------- | ---------- | -------- |
| `GET /api/v1/google/me/events` | 42 | ~10,058 |
| `POST /api/v1/google/me/silverkey-calendar` | 17 | ~8,557 |
| `POST /api/v1/search/properties-by-polygon` | 7 | ~21,795 |
| `GET /api/v1/search/isochrone` | 6 | ~2,707 |

Calendar reads dominate slow + 5xx — aligns with external API latency and quota.

## Code map (error surfaces)

### Search routes — [`Server/app/routes/search/`](../../../Server/app/routes/search/)

| Route | Handler | Error patterns |
| ----- | ------- | ---------------- |
| `GET /propertyComps` | [`search.py`](../../../Server/app/routes/search/search.py) | 401 manual; 400 missing args; Slipstream errors → [`handle_external_api_error` → 503](../../../Server/app/utils/security/secure_errors.py); 500 catch-all |
| `GET /isochrone` | [`search_isochrone_routes.py`](../../../Server/app/routes/search/search_isochrone_routes.py) | **400** for incomplete prefs/locations (expected); **403** prefs user resolution; **500** isochrone union failure |
| `POST /properties-by-polygon` | [`search.py`](../../../Server/app/routes/search/search.py) | 401/403 prefs; pipeline errors via `run_polygon_search` status; Slipstream 429 internal |
| `GET /monthly-cost-estimates` | [`search.py`](../../../Server/app/routes/search/search.py) | 400 missing zip / `ValueError`; 401 auth |
| Area suggestions/boundary | [`search.py`](../../../Server/app/routes/search/search.py) | 401 on auth failure |

**Listings / comps data:** [`property_comps.py`](../../../Server/app/services/search/data/property/property_comps.py) — Slipstream inactive search; errors returned as dict then mapped to 503 at route.

### Home matching — [`home_matching.py`](../../../Server/app/routes/search/home_matching.py)

- `find-matches`: `@require_authenticated_user`, schema validation → **400**; Celery queue failures → **500** via `SecureErrorHandler`
- `task-status/{task_id}`: [`verify_task_owner`](../../../Server/app/utils/security/celery_task_ownership.py) → **403** (documented as expected in semantics doc)

### Google Calendar — [`error_handlers.py`](../../../Server/app/services/calendar/core/error_handlers.py)

- Maps `HttpError` **401/403/404** to structured JSON (quota → 403 `quota_exceeded`, reconnect hints)
- Unhandled Google statuses fall through to [`SecureErrorHandler.handle_error`](../../../Server/app/utils/security/secure_errors.py) (**500** in current code); PostHog still shows **503** on `me/events` — verify production build (possible older mapping or gateway) and align handler to return **503** only for retryable upstream outages with a stable `error` code
- [`operations_list_events.py`](../../../Server/app/services/calendar/events/operations_list_events.py) re-raises non-404/403 `HttpError` (e.g. Google 503 backend unavailable)
- Agent client events: [`events.py`](../../../Server/app/routes/calendar/handlers/events.py) — **403** when no `AgentConnections` row or permission helper fails

### Transactions — [`routes/transactions/__init__.py`](../../../Server/app/routes/transactions/__init__.py)

- **403** `"Access denied"` from [`can_access_transaction`](../../../Server/app/services/transactions/access.py) on tasks read/write/progress
- **400** invalid checklist payload
- `GET /me`: occasional **500** (4 in window) — investigate DB/ensure_transaction failures

### Search display — [`search_display.py`](../../../Server/app/routes/auth/search_display.py)

- Clean 7d window; low traffic, no action.

## Recommended actions

### Fix (real defects or poor UX)

| Priority | Item | Evidence | Suggested change |
| -------- | ---- | -------- | ---------------- |
| P0 | Google `me/events` 5xx/503 + slow p95 | 88×503, 42 slow | Add explicit handling for Google **503/500** in `handle_google_api_error` (retryable flag, distinct `error` code); alert on rate; check token refresh and quota |
| P0 | `silverkey-calendar` 5xx | 53×503 | Same as above; ensure restricted-scope users always resolve SK calendar before event list |
| P1 | `propertyComps` Slipstream 503 | 11×503 | Retry/backoff in [`slipstream_get`](../../../Server/app/services/search/data/client.py); return 502 vs 503 by upstream status; log `SLIPSTREAM_ERROR` status_code |
| P1 | Isochrone **500** | 11×500 | Harden `isochrone_union_for_addresses` errors; avoid leaking exception strings in JSON |
| P2 | `transactions/me` 500 | 4×500 | Trace `ensure_transaction` / DB errors |
| P2 | Polygon search 16% legacy (400/401/403) | 44 errors / 272 req | Improve client validation before `forceSearch`; clearer 403 copy for agent viewing client prefs |

### Reclassify (after `error_kind` / `expected_client_error` deploy)

| Endpoint / status | Rationale |
| ----------------- | --------- |
| `GET /api/v1/search/isochrone` **400** (`NO_LOCATIONS`, etc.) | Incomplete buyer profile — product state, not incident |
| `GET /api/v1/search/monthly-cost-estimates` **400** | Missing zip — client validation |
| `POST /api/home-matching/find-matches` **400** | Bad request body |
| `GET /api/home-matching/task-status/*` **403** | Task IDOR guard (already in semantics doc) |
| `GET /api/v1/google/me/events` **401** / reconnect | Expected disconnected calendar |
| `GET /api/v1/google/me/events` **404** | Calendar not found for scope |
| `GET /api/v1/google/clients/{client_id}/events` **403** | Agent–client gate (extend semantics: forbidden on agent calendar routes) |
| `PUT/GET .../transactions/.../tasks*` **403** | Transaction access control |
| `POST /api/v1/search/properties-by-polygon` **403** | Research prefs subject resolution |
| Any **429** | Already `expected_client_error=true` in code |

### Suppress (dashboard / alert noise only)

| Item | Notes |
| ---- | ----- |
| Do **not** alert on legacy `is_error` for this domain until `error_kind` is live | Would page on isochrone 400s and calendar 401s |
| `GET /api/v1/google/connection-status` sporadic 401 (9) | Poll while logged out — filter by authenticated cohort in insights |
| `search-display` | No errors — exclude from error SLO boards |

## Easy wins

1. **Ship `error_kind` telemetry** — largest immediate drop in apparent error rate without code path changes (reclassify ~400+ expected 4xx rows in this domain).
2. **Extend `expected_client_error` for calendar agent routes** — add prefix `/api/v1/google/clients/` 403 (and optionally calendar permission 403s) in [`api_request_error_semantics.py`](../../../Server/app/services/analytics/api_request_error_semantics.py).
3. **Document isochrone 400 in client** — treat `NO_LOCATIONS` as empty state, not toast/error tracking incident.
4. **Property comps** — map Slipstream non-OK to structured 4xx when subject missing (`NO_COORDINATES`) vs 503 only for true upstream outage (already partially in service layer).
5. **PostHog board filter** — domain insight: `status_code >= 500` OR (`is_error` AND NOT isochrone/monthly-cost 400) until semantics ship.
6. **Home-matching task-status** — do not duplicate investigation; link [03-agent-research.md](./03-agent-research.md) for Celery IDOR 403 pattern and reclassify there.

## Related investigations

- [02-oauth.md](./02-oauth.md) — Google OAuth start/callback/revoke
- [03-agent-research.md](./03-agent-research.md) — research task-status, SSE exclusions
- [SUMMARY.md](./SUMMARY.md) — merged prioritization across domains
