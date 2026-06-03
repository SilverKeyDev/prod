# Agent and research API error investigation

Domain triage for agent messaging, research property flows, and Celery task polling. Parent index: [README](./README.md). Telemetry semantics: [posthog-api-error-semantics.md](../../server/ops/posthog-api-error-semantics.md).

## Scope

| Prefix | Notes |
| ------ | ----- |
| `/api/v1/agent/*` | Agent workspace APIs |
| `/api/v1/research/*` | Property research + compare + task status |
| `/api/home-matching/task-status/*` | Home-matching Celery polling |

**Excluded from `api_request`:** `GET /api/v1/agent/chats/stream` (SSE — same skip rule as all `text/event-stream` responses). Research property/compare **streaming** (`?stream=true`) is also excluded once the response mimetype is `text/event-stream`.

**Window:** 7 days ending 2026-06-03 (project timezone EDT).

## Data source

| Item | Value |
| ---- | ----- |
| Tool | PostHog MCP `execute-sql` (HogQL) |
| Table | `events` |
| Event | `api_request` |
| Filters | `endpoint` matches agent, research, or home-matching task-status; excludes `…/agent/chats/stream` |

### Headline metrics (7d)

| Metric | Count | Rate |
| ------ | ----- | ---- |
| Total requests | 5,037 | — |
| Legacy `is_error` (status ≥ 400) | 433 | **8.61%** |
| Reclassified **incidents** (5xx + 400 + 404) | 134 | **2.66%** |
| Expected **403** (agent gate + task IDOR) | 102 | 2.03% of traffic |
| **401** session/auth noise | 197 | 3.91% of traffic |

Legacy `is_error` **overstates** reliability problems by ~3.2× in this domain. Most inflation comes from expected 403s (role gates, task ownership) and 401s (expired sessions, background tabs).

### `error_kind` / `expected_client_error` in PostHog

Code in `Server/app/services/analytics/posthog_events.py` already emits `error_kind` and `expected_client_error` via `classify_api_request()`. **Production PostHog taxonomy (2026-06-03) does not yet list these properties** — sampled `api_request` events only show legacy fields (`is_error`, `status_code`, `route_pattern`, etc.). Until the server build with semantics ships, use HogQL status-code breakdowns below or deploy and re-run dashboards.

### Daily shape (legacy vs incidents)

| Day | Total | Legacy errors | Incidents (5xx+400+404) |
| --- | ----- | ------------- | ------------------------ |
| 2026-05-28 | 122 | 66 | 24 |
| 2026-05-29 | 785 | 273 | 109 |
| 2026-06-01 | 49 | 0 | 0 |
| 2026-06-02 | 3,408 | 92 | 1 |
| 2026-06-03 | 676 | 2 | 0 |

**2026-05-29** is an outlier (35% legacy error rate). Treat as a separate incident spike before blaming steady-state product flows. Recent days (Jun 2–3) show low incident volume relative to traffic.

## Endpoint table (7d, sorted by legacy error rate)

SSE stream route omitted. Rates use `legacy_errors / total_requests`.

| Endpoint | Total | Legacy err | Legacy rate | 5xx | 400 | 403 | 401 | 404 |
| -------- | ----- | ---------- | ----------- | --- | --- | --- | --- | --- |
| POST `/api/v1/agent/todos` | 37 | 26 | 70.3% | 0 | 22 | 0 | 4 | 0 |
| POST `/api/v1/agent/chats` | 37 | 26 | 70.3% | 0 | 22 | 0 | 4 | 0 |
| POST `/api/v1/agent/chats/message` | 60 | 36 | 60.0% | 0 | 18 | 9 | 9 | 0 |
| DELETE `/api/v1/agent/todos/{todo_id}` | 26 | 15 | 57.7% | 0 | 11 | 0 | 4 | 0 |
| PUT `/api/v1/agent/todos/{todo_id}` | 26 | 15 | 57.7% | 0 | 11 | 0 | 4 | 0 |
| POST `/api/v1/research/property` | 75 | 31 | 41.3% | **9** | 11 | 0 | 11 | 0 |
| GET `/api/v1/agent/chats/{conversation_id}/history` | 173 | 70 | 40.5% | 0 | 9 | 18 | 34 | 9 |
| POST `/api/v1/agent/chats/{conversation_id}/read` | 86 | 37 | 43.0% | 0 | 0 | 22 | 4 | 11 |
| GET `/api/v1/research/task-status/{task_id}` | 66 | 22 | 33.3% | 0 | 0 | 11 | 11 | 0 |
| GET `/api/home-matching/task-status/{task_id}` | 33 | 11 | 33.3% | 0 | 0 | 11 | 0 | 0 |
| GET `/api/v1/agent/search-agents` | 52 | 15 | 28.8% | 0 | 0 | 0 | 15 | 0 |
| GET `/api/v1/agent/recommended-agents` | 54 | 15 | 27.8% | 0 | 0 | 0 | 15 | 0 |
| GET `/api/v1/agent/clients` | 292 | 43 | 14.7% | 1 | 0 | **31** | 11 | 0 |
| GET `/api/v1/agent/chats` | 1,396 | 28 | 2.0% | 0 | 0 | 0 | 28 | 0 |
| GET `/api/v1/agent/notification-counter` | 1,455 | 16 | 1.1% | 0 | 0 | 0 | 16 | 0 |
| POST `/api/v1/research/compare` | 11 | 0 | 0% | 0 | 0 | 0 | 0 | 0 |

High-volume healthy routes: `GET /api/v1/agent/chats`, `GET /api/v1/agent/notification-counter` — errors are almost entirely **401**, consistent with session expiry on polling/background requests.

## Status breakdown (all domain errors)

Aggregated across scoped endpoints (`is_error = true`, 7d):

| Status | Top contributors | Interpretation |
| ------ | ---------------- | -------------- |
| **500** (10) | `POST /research/property` (9), `GET /agent/clients` (1) | **Fix** — true server incidents |
| **400** (104) | Agent todos/chats CRUD, chat message, research property bad input | **Fix** (client payload / OpenAPI validation) unless confirmed user error |
| **404** (20) | Chat history (9), mark-read (11) | **Fix** — stale conversation IDs or race after delete |
| **403** (102) | Agent clients (31), mark-read (22), chat history (18), task-status ×2 (11 each), chat message (9) | **Reclassify** — expected gates (see code) |
| **401** (197) | Widespread on agent list/poll routes | **Reclassify** for SLO (session noise); not auth-domain expected until semantics deploy |

## Code paths

### Task-status 403 — IDOR guard (expected)

Research and home-matching share the same Celery ownership check:

```31:38:Server/app/routes/search/research.py
def _forbidden_task_access():
    return jsonify(
        {
            "success": False,
            "error": "FORBIDDEN",
            "message": "Access denied to this task",
        }
    ), 403
```

```187:193:Server/app/routes/search/research.py
    if not verify_task_owner(task_id, str(user.id)):
        current_app.logger.warning(
            "[RESEARCH] Task status denied: user %s task %s",
            user.id,
            task_id,
        )
        return _forbidden_task_access()
```

Same pattern in `Server/app/routes/search/home_matching.py`. Per [error semantics](../../server/ops/posthog-api-error-semantics.md), `403` on `*/task-status/*` → `expected_client_error = true` once deployed.

Likely causes of 403 volume: polling a task UUID from another session/user, expired task IDs in client storage, or home-matching/research task ID mix-ups.

### Agent 403 — role and conversation access

- `@require_agent_access` returns **403** when `user_is_agent` is false (`Server/app/utils/route/auth_decorators.py`) — explains `GET /agent/clients` (31×403).
- Chat handlers return **403** `"Access denied"` when `user_may_access_conversation` fails (`Server/app/routes/agent/handlers/chats.py`).

These match `expected_client_error` for `/api/v1/agent/*` 403 in `api_request_error_semantics.py`.

### SSE telemetry gap

```25:36:Server/app/http/api_telemetry.py
def should_skip_api_telemetry(request: Request, response: Response) -> bool:
    if request.endpoint is None:
        return True
    if request.method == "OPTIONS":
        return True
    if _path_matches_skip_prefix(request.path):
        return True
    if request.endpoint == SPA_CATCH_ALL_ENDPOINT:
        return True
    if response.mimetype == "text/event-stream":
        return True
    return False
```

Primary property UX uses SSE, not instrumented `api_request`:

```50:54:Client/packages/features/search/api/research.ts
  streamProperty: async function* (
    data: PropertyRequest
  ): AsyncGenerator<{ type: string; data: unknown }, void, unknown> {
    const baseUrl = getEnv().apiBaseUrl;
    const url = `${baseUrl}/api/v1/research/property?stream=true`;
```

`usePropertyDetails` consumes `streamProperty` exclusively (`Client/packages/features/search/hooks/data/property/usePropertyDetails.ts`). Stream failures surface in client logs and SSE `error` events — **not** in PostHog route tables.

Non-stream `POST /research/property` (Celery queue, 202 response) **is** instrumented — explains the 75 requests and 9×500 in telemetry despite streaming being the main UI path.

`researchApi.getTaskStatus` exists but has **no call sites** in Client packages/apps (grep 2026-06-03). Task-status 403/401 may be from legacy callers, mobile, or direct API use — worth confirming before investing in client polling fixes.

### Agent 400 cluster

`POST /agent/todos` and `POST /agent/chats` at **22×400 each** strongly suggest **OpenAPI `@validate_request` failures** (identical counts). `@validate_request` / `@validate_response` on todo and chat create paths (`todos.py`, `chats.py`). Audit client payloads against `CreateTodoRequest` / `CreateConversationRequest` schemas.

## Fix / Reclassify / Suppress

### Reclassify (dashboards & SLO — no code change once deployed)

| Signal | Action |
| ------ | ------ |
| `403` on `/api/v1/agent/*` | Filter with `expected_client_error = true` |
| `403` on `*/task-status/*` | Same — IDOR guard is working as designed |
| `401` on agent poll routes | Exclude from incident SLO (session expiry); optional separate “auth health” insight |
| Legacy `is_error` | Replace with `error_kind = 'server'` OR `(is_error AND NOT expected_client_error)` |

**Prerequisite:** Ship server build that populates `error_kind` / `expected_client_error` in PostHog (already in repo; not in live taxonomy yet).

### Suppress (alerting noise)

| Pattern | Rationale |
| ------- | --------- |
| Alert on `is_error` for this domain | Suppress — use incident query below |
| `403` task-status + agent role gate | Suppress from pages; log volume only |
| Steady-state `401` on `GET /agent/chats`, notification-counter | Suppress unless rate jumps >2× baseline |

Suggested HogQL incident filter (works today without new properties):

```sql
SELECT
  properties.endpoint AS endpoint,
  count() AS incidents
FROM events
WHERE event = 'api_request'
  AND timestamp >= now() - INTERVAL 7 DAY
  AND (
    properties.endpoint LIKE '%/api/v1/agent/%'
    OR properties.endpoint LIKE '%/api/v1/research/%'
    OR properties.endpoint LIKE '%/api/home-matching/task-status/%'
  )
  AND properties.endpoint NOT LIKE '%/api/v1/agent/chats/stream%'
  AND toInt(properties.status_code) IN (400, 404)
   OR toInt(properties.status_code) >= 500
GROUP BY endpoint
ORDER BY incidents DESC
LIMIT 100
```

After semantics deploy, prefer: `error_kind = 'server' OR (error_kind = 'client' AND expected_client_error = false)`.

### Fix (engineering priority)

| Priority | Endpoint / issue | Evidence | Suggested fix |
| -------- | ---------------- | -------- | ------------- |
| **P0** | `POST /research/property` **500** (9/75) | Only research route with meaningful 5xx | Trace Celery `research_property_task` failures; check upstream property APIs |
| **P1** | Agent todo/chat **400** (22+22+11+11+18) | Validation cluster | Align client forms with OpenAPI; add structured 400 logging with `error_id` |
| **P1** | Chat **404** on history/read (20 total) | Stale `conversation_id` | Guard client navigation; return 404 only after explicit delete; consider soft-delete UX |
| **P2** | `GET /agent/clients` **500** (1) | Single event | Monitor; correlate with deploy if recurs |
| **P2** | Task-status **403** (22 total) | Expected but frequent | If unintended: stop polling foreign task IDs; clear task storage on logout |
| **P3** | SSE research errors invisible | Telemetry skip | Add client `$exception` or structured product event on `streamProperty` failure; use server logs for stream generator errors |

## Easy wins

1. **Deploy `error_kind` + `expected_client_error`** — code is merged locally; updates PostHog taxonomy and drops scoped legacy rate from ~8.6% to ~2.7% for incident dashboards with one filter.
2. **Switch dashboards off `is_error`** for agent/research — use incident HogQL above until new properties land.
3. **Document SSE blind spot** in on-call runbook — chat stream + research stream failures require Error Tracking / logs, not `api_request`.
4. **Audit agent todo/chat POST bodies** — identical 400 counts on create endpoints imply a systematic schema mismatch (quick client fix if one field renamed).
5. **Mark task-status 403 as expected** in alerts — no pager for `_forbidden_task_access`; optionally metric-only.
6. **Investigate 2026-05-29 spike** — 109 incidents in one day; likely deploy/test burst, not steady product defect.
7. **Confirm `getTaskStatus` usage** — API client exists but unused in web packages; remove dead polling or wire correctly to avoid orphan 403s.

## Reference queries (7d)

**Per-endpoint legacy rate:**

```sql
SELECT
  properties.endpoint AS endpoint,
  count() AS total_requests,
  countIf(properties.is_error = true) AS legacy_errors,
  round(100.0 * countIf(properties.is_error = true) / count(), 2) AS legacy_error_rate_pct
FROM events
WHERE event = 'api_request'
  AND timestamp >= now() - INTERVAL 7 DAY
  AND (
    properties.endpoint LIKE '%/api/v1/agent/%'
    OR properties.endpoint LIKE '%/api/v1/research/%'
    OR properties.endpoint LIKE '%/api/home-matching/task-status/%'
  )
  AND properties.endpoint NOT LIKE '%/api/v1/agent/chats/stream%'
GROUP BY endpoint
ORDER BY legacy_error_rate_pct DESC
LIMIT 100
```

**Status × endpoint for errors:**

```sql
SELECT
  properties.endpoint AS endpoint,
  toInt(properties.status_code) AS status_code,
  count() AS cnt
FROM events
WHERE event = 'api_request'
  AND timestamp >= now() - INTERVAL 7 DAY
  AND (
    properties.endpoint LIKE '%/api/v1/agent/%'
    OR properties.endpoint LIKE '%/api/v1/research/%'
    OR properties.endpoint LIKE '%/api/home-matching/task-status/%'
  )
  AND properties.endpoint NOT LIKE '%/api/v1/agent/chats/stream%'
  AND properties.is_error = true
GROUP BY endpoint, status_code
ORDER BY cnt DESC
LIMIT 100
```

**Domain incident numerator:**

```sql
SELECT
  count() AS total,
  countIf(
    toInt(properties.status_code) >= 500
    OR toInt(properties.status_code) = 400
    OR toInt(properties.status_code) = 404
  ) AS incidents,
  round(100.0 * countIf(
    toInt(properties.status_code) >= 500
    OR toInt(properties.status_code) = 400
    OR toInt(properties.status_code) = 404
  ) / count(), 2) AS incident_rate_pct
FROM events
WHERE event = 'api_request'
  AND timestamp >= now() - INTERVAL 7 DAY
  AND (
    properties.endpoint LIKE '%/api/v1/agent/%'
    OR properties.endpoint LIKE '%/api/v1/research/%'
    OR properties.endpoint LIKE '%/api/home-matching/task-status/%'
  )
  AND properties.endpoint NOT LIKE '%/api/v1/agent/chats/stream%'
LIMIT 100
```
