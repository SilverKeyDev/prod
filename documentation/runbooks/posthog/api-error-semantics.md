# PostHog `api_request` error semantics

SilverKey centralizes HTTP telemetry in [`Server/app/http/api_telemetry.py`](../../../../Server/app/http/api_telemetry.py) and [`Server/app/services/analytics/posthog_events.py`](../../../../Server/app/services/analytics/posthog_events.py). Classification logic lives in [`Server/app/services/analytics/api_request_error_semantics.py`](../../../../Server/app/services/analytics/api_request_error_semantics.py).

## Why not `is_error` alone?

| Property | Definition | Use for SLO |
| -------- | ---------- | ----------- |
| `is_error` | `status_code >= 400` | Legacy; **overstates** incidents (401/403/404 count as errors) |
| `is_server_error` | `status_code >= 500` | Minimum bar for server incidents |
| `error_kind` | Semantic bucket (see below) | **Primary** incident vs noise split |
| `expected_client_error` | `true` for normal product outcomes | Filter dashboards and alerts |

## `error_kind` values

| `error_kind` | HTTP | Meaning |
| ------------ | ---- | ------- |
| `none` | &lt; 400 | Success / redirect |
| `server` | 5xx | **Incident** — investigate and fix |
| `auth` | 401 | Missing or expired credentials |
| `forbidden` | 403 | Role or resource access denied |
| `not_found` | 404 | Resource not found |
| `rate_limited` | 429 | Rate limit (app or upstream) |
| `client` | Other 4xx | Validation / bad request |

## `expected_client_error`

Set to `true` when the response is **normal product flow**, not a reliability defect:

| Route family | Status | Rationale |
| ------------ | ------ | --------- |
| `/api/v1/auth/*` | 401 | Expired session, missing refresh cookie, invalid login attempt |
| `/api/v1/agent/*` | 403 | Non-agent hit agent-only route |
| `/api/v1/admin/*` | 403 | Non-admin hit admin route ([`AdminGuard`](../../../../Client/apps/web/app/guards/auth/AdminGuard.tsx) blocks UI; stray API calls may still 403) |
| `*/task-status/*` | 403 | Celery task IDOR guard ([`research.py`](../../../../Server/app/routes/search/research.py)) |
| `/api/v1/public/*` | 404 | Unknown public profile slug |
| `/api/v1/webhooks/*` | 401 | Webhook signature / token verification failure (expected probe or misconfigured Connect) |
| Any | 429 | Rate limit enforcement |

**Not** marked expected: 5xx, most 404 on private APIs, 400 validation errors (`error_kind=client`).

## Route families (investigation hints)

### Auth and session

- `POST /api/v1/auth/refresh-token` — high 401 volume is often **logged-out users** or tab left open after session expiry.
- Client recovery: [`Client/packages/services/http/client/auth/authRecovery.ts`](../../../../Client/packages/services/http/client/auth/authRecovery.ts) (single-flight refresh via `verifyingPromise`).

### OAuth (Google, DocuSign)

- Callback routes may return 4xx on user cancel, stale `state`, or misconfigured redirect URIs — classify as **client/oauth**, not server SLO.

### Agent, research, home-matching

- `GET /api/v1/agent/chats/stream` is **excluded** from `api_request` (SSE). Chat failures won't appear in route tables; use Error Tracking or logs.
- Research compare/property flows use SSE; task polling uses `GET .../task-status/{task_id}`.

### Admin

- Prefer filtering admin insights by `user_role` when present on events.

### Search and integrations

- Google Calendar and listings calls may return 429 or upstream 5xx — split `error_kind` and check `is_slow`.

## Client auth recovery

After any 401 on a protected route, the HTTP client runs `recoverSessionAfter401()` once, then retries. Failed refresh broadcasts logout — those refresh 401s are **expected** for telemetry.

## Related docs

- HogQL templates: [posthog-capacity-queries.md](./capacity-queries.md)
- PostHog SLO migration (planned work): [SIL-160](https://linear.app/silverkey/issue/SIL-160/deploy-api-request-error-kind-and-migrate-posthog-slo-insights)
- API instrumentation rule: [`.cursor/rules/shared/api-instrumentation.mdc`](../../../.cursor/rules/shared/api-instrumentation.mdc)
