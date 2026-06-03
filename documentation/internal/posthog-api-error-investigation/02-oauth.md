# OAuth and webhook API error investigation

Domain triage for Google Calendar OAuth, DocuSign OAuth, and inbound webhooks. Parent index: [README](./README.md). Telemetry semantics: [posthog-api-error-semantics.md](../../server/ops/posthog-api-error-semantics.md).

**Window:** 7 days (HogQL `timestamp > now() - INTERVAL 7 DAY`, queried 2026-06-03 EDT).

**Scope (inventory):**

| Endpoint | Handler |
| -------- | ------- |
| `GET /api/v1/google/oauth/start` | [`Server/app/routes/calendar/handlers/oauth.py`](../../../Server/app/routes/calendar/handlers/oauth.py) |
| `GET /api/v1/google/oauth/enhance` | same |
| `GET /api/v1/google/oauth/callback` | same |
| `POST /api/v1/google/oauth/revoke` | same |
| `GET /api/v1/docusign/oauth/start` | [`Server/app/routes/documents/docusign/handlers/oauth.py`](../../../Server/app/routes/documents/docusign/handlers/oauth.py) |
| `GET /api/v1/docusign/oauth/callback` | same |
| `POST /api/v1/webhooks/docusign/connect` | [`Server/app/routes/documents/docusign/handlers/webhooks.py`](../../../Server/app/routes/documents/docusign/handlers/webhooks.py) |
| `POST /api/v1/google/calendar/webhook` | [`Server/app/routes/calendar/handlers/webhooks.py`](../../../Server/app/routes/calendar/handlers/webhooks.py) |

Out of scope (auth login OAuth): `GET /api/v1/auth/google/*` — covered in [01-auth.md](./01-auth.md).

---

## 1. Data source

| Source | Notes |
| ------ | ----- |
| PostHog HogQL via `user-posthog` MCP (`execute-sql`) | `events` where `event = 'api_request'`, endpoint filter on `oauth`, `webhooks/docusign`, `google/calendar/webhook` |
| PostHog Error Tracking (`query-error-tracking-issues-list`) | Searches `oauth`, `docusign webhook` — **no matching active issues** in 7d |
| Code | Route handlers + [`verify_webhook`](../../../Server/app/services/docusign/webhooks/verification.py), [`verify_calendar_webhook`](../../../Server/app/services/calendar/webhooks/verification.py) |

**Production telemetry gap:** `properties.error_kind` and `properties.expected_client_error` are **not present** in the live PostHog project taxonomy yet (queries return `None` / zero counts). Classification below uses `status_code` and code paths until the deploy that ships [`api_request_error_semantics.py`](../../../Server/app/services/analytics/api_request_error_semantics.py) properties lands in prod.

**Endpoints with zero `api_request` hits (7d):** `GET /api/v1/google/oauth/enhance`, `POST /api/v1/google/oauth/revoke`, `GET /api/v1/docusign/oauth/callback`, `POST /api/v1/google/calendar/webhook`.

---

## 2. Top endpoints table

Sorted by legacy `is_error` rate, then volume. Incident rate = share of requests with `status_code >= 500` (proxy for `error_kind = server` until properties ship).

| Endpoint | Total (7d) | Legacy errors (`is_error`) | 5xx | Legacy rate | Incident rate | Status breakdown |
| -------- | -----------: | -------------------------: | --: | ----------: | ------------: | ---------------- |
| `POST /api/v1/webhooks/docusign/connect` | 28 | 15 | 0 | **53.6%** | 0% | 401 ×15, 200 ×13 |
| `GET /api/v1/google/oauth/start` | 14 | 0 | 0 | 0% | 0% | 302 ×14 |
| `GET /api/v1/docusign/oauth/start` | 12 | 0 | 0 | 0% | 0% | 200 ×12 |
| `GET /api/v1/google/oauth/callback` | 12 | 0 | 0 | 0% | 0% | 302 ×12 |

No scoped endpoint had `status_code >= 500` in the window. Error Tracking returned **zero** `$exception` events tied to oauth/webhook search terms.

---

## 3. Fix | Reclassify | Suppress (per row)

| Endpoint | Finding | Action | Rationale |
| -------- | ------- | ------ | --------- |
| `POST /api/v1/webhooks/docusign/connect` | 54% legacy error rate; **all errors are 401**, half of traffic succeeds (200) | **Reclassify** (primary) + **Fix** (conditional) | 401 is returned when [`verify_webhook`](../../../Server/app/services/docusign/webhooks/verification.py) fails (HMAC mismatch, missing `X-DocuSign-Signature-1`, or OAuth-for-Connect token check). That is **security enforcement**, not a server incident. After `error_kind` ships, mark webhook 401 as `expected_client_error` (new route-family rule for `/api/v1/webhooks/*`). **Fix** only if logs show failed HMAC on payloads that should verify: confirm `DOCUSIGN_USER_CONNECT_HMAC_SECRET` / `DOCUSIGN_ORG_CONNECT_HMAC_SECRET` match DocuSign Connect config and that `use_org_hmac` branch matches org-level vs account-level Connect. |
| `GET /api/v1/google/oauth/start` | Clean | — | Redirect to Google; requires authenticated user; 401 only when session missing (expected). |
| `GET /api/v1/google/oauth/callback` | Clean in PostHog (all 302) | **Reclassify** (when 4xx appear) | Handler returns 400 for missing state/code, invalid state, user cancel (`error` query param), and 5xx only via `SecureErrorHandler` on token exchange failure. User-cancel and stale-state 400s should not page SLOs — extend semantics doc family “OAuth callbacks → client/oauth”. |
| `GET /api/v1/docusign/oauth/start` | Clean | — | Agent-only; 403 for non-agent is product gate (same pattern as agent routes). |
| `GET /api/v1/docusign/oauth/callback` | No traffic | **Monitor** | On failure, code **redirects** to frontend with `?error=true` (302), not 4xx — legacy `is_error` stays low. Invalid state returns 400. |
| `GET /api/v1/google/oauth/enhance` | No traffic | — | Validation 400s for bad `permissions` param are expected client errors. |
| `POST /api/v1/google/oauth/revoke` | No traffic | — | |
| `POST /api/v1/google/calendar/webhook` | No traffic | **Reclassify** (when live) | [`verify_calendar_webhook`](../../../Server/app/services/calendar/webhooks/verification.py) returns 401 on channel-token mismatch; rate-limited (120/min/IP). Probe 401s should not incident-page. |

**Suppress:** Do **not** suppress webhook 401 in Error Tracking (none observed). Optional: exclude `/api/v1/webhooks/*` from legacy `is_error` dashboards until `expected_client_error` is in prod.

---

## 4. Domain easy wins

1. **Ship `error_kind` / `expected_client_error` to prod** — Already implemented in [`posthog_events.py`](../../../Server/app/services/analytics/posthog_events.py); prod project lacks properties. Unblocks incident vs legacy dashboards from [posthog-capacity-queries.md](../../server/ops/posthog-capacity-queries.md).

2. **Add webhook 401 to expected-client semantics** — Extend [`api_request_error_semantics.py`](../../../Server/app/services/analytics/api_request_error_semantics.py) with a prefix rule for `/api/v1/webhooks/` + 401 (and optionally calendar webhook 401). Stops DocuSign Connect from dominating oauth-domain error charts.

3. **DocuSign Connect HMAC audit (one-time ops)** — If any 401 rows correlate with real envelope events in app logs (`Webhook verification failed` + valid envelope metadata), rotate secrets in AWS Secrets Manager and DocuSign Connect admin to match account vs org scope used in [`webhooks.py`](../../../Server/app/routes/documents/docusign/handlers/webhooks.py) (`use_org_hmac` from payload `organizationId` / `accountId`).

4. **OAuth callback 400 family** — Document and classify calendar/DocuSign callback 400s (invalid state, user denied consent) as `error_kind=client`, `expected_client_error=true` in a follow-up semantics pass — aligns with [posthog-api-error-semantics.md § OAuth](../../server/ops/posthog-api-error-semantics.md).

5. **Calendar webhook readiness** — Before watches go live, set `GOOGLE_CALENDAR_WEBHOOK_TOKEN` in prod; strict env rejects unauthenticated pushes ([`verification.py`](../../../Server/app/services/calendar/webhooks/verification.py) `_is_strict_webhook_env`).

6. **Keep auth vs calendar OAuth separate in dashboards** — `/api/v1/auth/google/*` (login) vs `/api/v1/google/oauth/*` (calendar) are different flows; mixing them hides calendar-only regressions.

---

## Code reference (callbacks and signature validation)

**Google Calendar OAuth** — [`Server/app/routes/calendar/handlers/oauth.py`](../../../Server/app/routes/calendar/handlers/oauth.py): session state `google_calendar_oauth_state`, rate limits 10–20/min; callback validates state via `google_calendar_service.validate_state`, exchanges code, redirects to SPA (302 on success).

**DocuSign OAuth** — [`Server/app/routes/documents/docusign/handlers/oauth.py`](../../../Server/app/routes/documents/docusign/handlers/oauth.py): `@require_authenticated_user` + agent check on start; callback compares `docusign_oauth_state` in session, exchanges tokens, redirects to `/profile/docusign`.

**DocuSign Connect webhook** — [`register_webhook_routes`](../../../Server/app/routes/documents/docusign/handlers/webhooks.py): raw body + `X-DocuSign-Signature-1` + optional `Authorization` → `verify_webhook()` → 401 on failure, 400 on invalid payload, 200 on success/duplicate.

**Google Calendar push webhook** — [`calendar_webhook`](../../../Server/app/routes/calendar/handlers/webhooks.py): `X-Goog-*` headers → `verify_calendar_webhook()` (channel token, resource state/id format) → 401 on failure, 200 `{"ok": true}` on accept.
