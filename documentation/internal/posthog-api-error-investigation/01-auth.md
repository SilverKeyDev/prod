# Auth domain — PostHog API error investigation

Parent index: [README.md](./README.md). Telemetry contract: [posthog-api-error-semantics.md](../../server/ops/posthog-api-error-semantics.md).

## 1. Data source note

| Source | Detail |
| ------ | ------ |
| **PostHog** | `user-posthog` MCP `execute-sql` (HogQL), **7-day window** ending **2026-06-03** (project timezone EDT). Filter: `event = 'api_request'` and `properties.endpoint LIKE '%/api/v1/auth/%'`. |
| **Error Tracking** | `query-error-tracking-issues-list` with `searchQuery` `auth refresh login` and `refresh-token AUTH_REFRESH`, `url` `/api/v1/auth`, last 7 days — **no active issues** returned. |
| **Code** | `Server/app/services/auth/flows/refresh.py`, `Server/app/routes/auth/handlers/session.py`, `Client/packages/services/http/client/auth/authRecovery.ts`, `refreshTokenRetry.ts`, `Server/app/services/analytics/api_request_error_semantics.py`. |

**Ingest gap (important):** In the 7-day auth sample (**984** `api_request` events), **`error_kind` and `expected_client_error` are never set** (`has_error_kind = 0`, `expected_flagged = 0`). PostHog taxonomy also does not yet list those properties. The repo **does** emit them from `posthog_events.py` + `classify_api_request()`; production appears to be on a build **before** that deploy (or properties are not reaching the project). Until they land:

- **Incident rate (requested):** `countIf(error_kind = 'server') / count()` → **0% on all auth endpoints** (property absent; not evidence of health).
- **Incident rate (proxy):** `countIf(status_code >= 500) / count()` → **0%** on all auth endpoints (no 5xx in window).
- **Legacy rate:** `countIf(is_error = true) / count()` — reliable today; **overstates** auth noise (401 counts as error).

---

## 2. Top endpoints (7 days)

| Endpoint | Requests | Incident rate (`error_kind=server`) | Incident rate (5xx proxy) | Legacy `is_error` rate | Top status codes (count) |
| -------- | --------: | -----------------------------------: | -------------------------: | ---------------------: | ------------------------- |
| `POST /api/v1/auth/refresh-token` | 686 | 0.0% | 0.0% | **53.1%** | 401 (356), 200 (322), 400 (8) |
| `POST /api/v1/auth/login` | 135 | 0.0% | 0.0% | **34.8%** | 200 (88), 401 (34), 400 (13) |
| `POST /api/v1/auth/signup` | 22 | 0.0% | 0.0% | **31.8%** | 201 (15), 400 (7) |
| `POST /api/v1/auth/logout` | 41 | 0.0% | 0.0% | 0.0% | 200 (41) |
| `GET /api/v1/auth/google/callback` | 37 | 0.0% | 0.0% | 0.0% | 302 (37) |
| `GET /api/v1/auth/google/start` | 25 | 0.0% | 0.0% | 0.0% | 302 (25) |
| `POST /api/v1/auth/verify` | 15 | 0.0% | 0.0% | 0.0% | 200 (15) |
| `POST /api/v1/auth/reset-password` | 11 | 0.0% | 0.0% | 0.0% | 200 (11) |
| `POST /api/v1/auth/forgot-password` | 11 | 0.0% | 0.0% | 0.0% | 200 (11) |
| `POST /api/v1/auth/resend-code` | 1 | 0.0% | 0.0% | 0.0% | 200 (1) |

Legacy error counts align with 4xx: e.g. refresh-token `364` legacy errors ≈ `356`×401 + `8`×400.

---

## 3. Per top endpoint — Fix | Reclassify | Suppress

### `POST /api/v1/auth/refresh-token`

| Action | Recommendation |
| ------ | -------------- |
| **Reclassify** | **Primary.** ~52% of traffic is **401** (expired/missing session cookie, logged-out tabs, failed recovery). Code marks `/api/v1/auth/*` + 401 as `expected_client_error` once `error_kind` is in ingest. Do not treat legacy `is_error` as an incident. |
| **Fix** | **Low priority.** Eight **400** responses (~1.2%) — likely OpenAPI/validation (`EmptyRequest`) or malformed clients; sample `X-Request-ID` in logs (`AUTH_REFRESH_*`) to see if a specific client version sends a body. Unhandled exceptions map to **500** via `session.refresh_token` — none observed in 7d. |
| **Suppress** | No Error Tracking suppression needed (no 5xx). For **dashboards**, filter `expected_client_error = false` OR `error_kind = 'server'` after deploy. |

**Code context:** `handle_refresh_token()` returns 401 for missing access token, invalid JWT, user not found, unknown user type, and failed Cognito/Google refresh paths. Client `recoverSessionAfter401()` single-flights `postRefreshTokenWithRetry(3)`; failed refresh broadcasts logout — those 401s are **product-normal**.

### `POST /api/v1/auth/login`

| Action | Recommendation |
| ------ | -------------- |
| **Reclassify** | **34×401** (~25%) — wrong password, unconfirmed user, Cognito `NotAuthorizedException` / `UserNotFoundException` (`handle_login`). Expected credential failure, not a server defect. Will be `error_kind=auth` + `expected_client_error` on auth routes after ingest fix. |
| **Fix** | **13×400** (~10%) — review validation failures (`@validate_request(LoginData)`) vs signup-style business 400s; improve client-side validation copy if one field drives most 400s. **0×5xx** in window; exception path in `login()` handler can emit 500 — monitor via `error_kind=server` after deploy. |
| **Suppress** | Dashboard-only: stop alerting on `is_error` for this route. |

### `POST /api/v1/auth/signup`

| Action | Recommendation |
| ------ | -------------- |
| **Reclassify** | **7×400** drive legacy error rate; validation / duplicate email style responses from signup flow — client error, not incident. |
| **Fix** | If 400s cluster on one error code, tighten signup UX or server message (reduce retry loops). Volume is low (22 req / 7d). |
| **Suppress** | None for Error Tracking. |

### Remaining auth routes (logout, Google OAuth start/callback, verify, password flows, resend-code)

| Action | Recommendation |
| ------ | -------------- |
| **Reclassify** | OAuth **302** redirects are success paths — correctly **0%** legacy error rate. |
| **Fix** | None indicated in 7d telemetry. |
| **Suppress** | N/A. |

---

## 4. Easy wins (auth domain only)

- **Ship `error_kind` + `expected_client_error` to production** so HogQL incident queries match [api_request_error_semantics.py](../../../Server/app/services/analytics/api_request_error_semantics.py). Re-run the templates in [posthog-capacity-queries.md](../../server/ops/posthog-capacity-queries.md) after deploy.
- **Retire legacy auth SLOs** that use `is_error` alone; use `error_kind = 'server'` (or `status_code >= 500` until properties exist). Expect **refresh-token** legacy rate to drop from ~53% to ~**1%** incident-relevant (400 only) once 401s are excluded.
- **Dashboard annotation:** Document that **refresh-token 401 ≈ session expiry / logout**, aligned with `authRecovery.ts` + `refreshTokenRetry.ts` (retry 503 only; do not retry 401).
- **Optional log drill:** For refresh **400** and login **400**, grep `AUTH_REFRESH_*` / `AUTH_LOGIN_*` with `request_id` from a sample event — confirm validation vs abuse.
- **No auth Error Tracking action** this week — zero 5xx on `api_request` and empty issue search for auth/login/refresh in 7 days.

---

## 5. Client ↔ server alignment (code-only corroboration)

| Behavior | Location |
| -------- | -------- |
| Single-flight 401 recovery | `recoverSessionAfter401()` dedupes via `verifyingPromise`; calls `postRefreshTokenWithRetry(3)` then profile GET. |
| Refresh retries | Backoff on **503** / `body.retryable` only; **401 is not retried** (`refreshTokenRetry.ts`). |
| Auth endpoint bypass | `isAuthEndpoint()` skips recovery loop on verify/login/logout/refresh/profile paths. |
| Server refresh failures | Structured 401 responses; catch-all in `refresh_token` handler logs `AUTH_REFRESH_EXCEPTION` → **500** (none in PostHog 7d). |

This domain’s **reliability story is good** (no 5xx); the **metrics story is misleading** until semantic properties are live and dashboards migrate off `is_error`.
