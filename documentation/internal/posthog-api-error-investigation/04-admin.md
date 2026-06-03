# Admin API error investigation

**Scope:** `/api/v1/admin/*` (core admin blueprint + rev-share admin routes registered under the same prefix)  
**Window:** Last 7 days (`api_request` events, PostHog project 441667)  
**Queried:** 2026-06-03 via PostHog MCP `execute-sql`  
**Semantics reference:** [posthog-api-error-semantics.md](../../server/ops/posthog-api-error-semantics.md)

---

## Executive summary

| Metric | Value |
| ------ | ----- |
| Admin `api_request` volume (7d) | **541** (~3.7% of all API traffic) |
| Legacy error rate (`is_error`, all 4xx+5xx) | **~33%** (178 / 541) |
| Incident rate (`is_server_error`, 5xx) | **~0.2%** (1 / 541) |

Admin routes look **red on legacy `is_error` dashboards** almost entirely because of **403 role gates**, **400 validation**, and **404 not-found** — not server incidents. The single 5xx in-window is `POST /api/v1/admin/logger-config` (1×500). **`error_kind` / `expected_client_error` are not yet in the PostHog project taxonomy** (only sparse recent events); after deploy, admin 403s should classify as **Reclassify** (`expected_client_error=true`).

**Client gates:** [`AdminGuard`](../../../Client/apps/web/app/guards/auth/AdminGuard.tsx) blocks the admin UI for non-`admin`/`super_admin` users; [`SuperAdminGuard`](../../../Client/apps/web/app/guards/auth/SuperAdminGuard.tsx) wraps partners/superadmin outlets. Stray API calls from sessions that lost admin role, dev tooling, or direct HTTP still produce expected 403s.

---

## Route inventory vs telemetry

**Registered** (from [`Server/endpoints.json`](../../../Server/endpoints.json)): 18 admin routes across logger config, dev persona, user gate roles, validation stats, partners/rev-share.

**With traffic (7d):** 10 endpoints (541 requests).

**Zero hits (7d)** — likely dead for prod telemetry or UI-not-shipped yet:

| Endpoint | Client hook / handler |
| -------- | --------------------- |
| `GET /api/v1/admin/users/gate-roles` | [`useAdminGateUsersList`](../../../Client/packages/hooks/data/admin/useAdminGateUsersList.ts) → superadmin UI |
| `GET /api/v1/admin/validation-stats` | [`useAdminValidationStats`](../../../Client/packages/hooks/data/admin/useAdminValidationStats.ts) |
| `GET /api/v1/admin/partners/{partner_id}` | Partners admin (detail fetch) |
| `PATCH /api/v1/admin/partners/{partner_id}` | Partners admin (update) |
| `POST /api/v1/admin/current-user-agent-status` | [`useSetCurrentUserAgentStatusMutation`](../../../Client/packages/hooks/data/admin/useSetCurrentUserAgentStatusMutation.ts) |
| `POST /api/v1/admin/partners/{partner_id}/provision-links` | Partners admin |
| `POST /api/v1/admin/users/delete` | [`adminApi.deleteUserById`](../../../Client/packages/features/admin/api/admin.ts) |
| `POST /api/v1/admin/users/roles` | [`useUpdateUserSystemRolesMutation`](../../../Client/packages/hooks/data/admin/useUpdateUserSystemRolesMutation.ts) |

---

## Top endpoints by incident rate (5xx)

Only one admin route recorded a server error in the window.

| Rank | Endpoint | 5xx | Total | Incident rate | Action |
| ---- | -------- | --- | ----- | ------------- | ------ |
| 1 | `POST /api/v1/admin/logger-config` | 1 | 179 | 0.56% | **Fix** — investigate `merge_and_persist` failure path ([`logger_config.py`](../../../Server/app/routes/admin/handlers/logger_config.py) returns generic 500 on exception) |
| — | All other admin routes | 0 | 540 | 0% | **Reclassify** — no 5xx; monitor after logger fix |

---

## Top endpoints by legacy error rate (`is_error`)

Sorted by legacy rate, then volume.

| Rank | Endpoint | Legacy errors | Total | Legacy rate | Dominant status codes | Action |
| ---- | -------- | ------------- | ----- | ----------- | --------------------- | ------ |
| 1 | `POST /api/v1/admin/users/reset-dev-data` | 66 | 99 | **66.7%** | 403×33, 400×22, 404×11 | **Mixed** — 403 **Reclassify** (non-admin / env disabled / non-superadmin targeting another user); 400 **Fix or UX** (invalid scopes, missing `confirm`); 404 **Fix or UX** (unknown target user) |
| 2 | `POST /api/v1/admin/partners/{partner_id}/logo` | 32 | 48 | **66.7%** | 400×32 | **Fix or UX** — multipart validation ([`partner_logo.py`](../../../Server/app/routes/rev_share/handlers/partner_logo.py): missing `file`, MIME/size); improve client upload guardrails |
| 3 | `GET /api/v1/admin/partners` | 11 | 21 | **52.4%** | 403×11 | **Reclassify** — super_admin gate ([`admin_partners.py`](../../../Server/app/routes/rev_share/handlers/admin_partners.py)); AdminGuard allows `admin` but partners CRUD requires `super_admin` |
| 4 | `DELETE /api/v1/admin/partners/{partner_id}` | 11 | 22 | **50.0%** | 404×11 | **Fix or UX** — delete idempotent miss or stale UI list; not a server incident |
| 5 | `POST /api/v1/admin/current-user-dev-workspace` | 22 | 78 | **28.2%** | 403×11, 400×11 | **Mixed** — 403 **Reclassify**; 400 likely invalid `workspace` enum from dev persona UI |
| 6 | `GET /api/v1/admin/logger-config` | 13 | 64 | **20.3%** | 403×13 | **Reclassify** — expected for non-admin sessions hitting API directly |
| 7 | `POST /api/v1/admin/logger-config` | 24 | 179 | **13.4%** | 403×13, 400×10, 500×1 | **Mixed** — see incident row; 403/400 as above |
| 8 | `POST /api/v1/admin/partners` | 0 | 11 | 0% | 201×11 | — |
| 9 | `GET /api/v1/admin/partners/checklist-steps` | 0 | 10 | 0% | 200×10 | — |
| 10 | `GET /api/v1/admin/rev-share/analytics` | 0 | 9 | 0% | 200×9 | — (p95 **~1.8s** — watch latency, not errors) |

---

## Status breakdown (all admin routes, 7d)

| Endpoint | 200/201 | 400 | 403 | 404 | 500 |
| -------- | ------- | --- | --- | --- | --- |
| `POST /api/v1/admin/users/reset-dev-data` | 33 | 22 | 33 | 11 | 0 |
| `POST /api/v1/admin/partners/{partner_id}/logo` | 16 (201) | 32 | 0 | 0 | 0 |
| `GET /api/v1/admin/partners` | 10 | 0 | 11 | 0 | 0 |
| `DELETE /api/v1/admin/partners/{partner_id}` | 11 | 0 | 0 | 11 | 0 |
| `POST /api/v1/admin/current-user-dev-workspace` | 56 | 11 | 11 | 0 | 0 |
| `GET /api/v1/admin/logger-config` | 51 | 0 | 13 | 0 | 0 |
| `POST /api/v1/admin/logger-config` | 155 | 10 | 13 | 0 | 1 |
| `POST /api/v1/admin/partners` | 11 (201) | 0 | 0 | 0 | 0 |
| `GET /api/v1/admin/partners/checklist-steps` | 10 | 0 | 0 | 0 | 0 |
| `GET /api/v1/admin/rev-share/analytics` | 9 | 0 | 0 | 0 | 0 |

**403 summary (78 total):** Role gates — `user_has_admin_role` on core admin handlers; `user_has_super_admin_role` on partners and some user-management routes. These are **expected** when telemetry fires outside a gated UI session.

**400 summary (75 total):** OpenAPI/validation and business rules (logger payload, reset scopes, logo upload, dev workspace enum).

---

## Error Tracking (client-side, admin URLs, 7d)

Server 5xx count is low; client Error Tracking still surfaces admin **HttpError** throws from the HTTP layer (often dev/local):

| Issue | Occurrences | Notes | Action |
| ----- | ----------- | ----- | ------ |
| HttpError HTTP **500** `.../admin/partners` | 6 | Local dev session 2026-05-27 | **Fix** if reproducible on prod; else dev-only noise |
| HttpError HTTP **405** `.../admin/partners/{id}` | 4 | Wrong HTTP method from client | **Fix** — align client verb with OpenAPI (`PATCH` vs `POST`) |
| ReferenceError `useMemo is not defined` — `AdminPartnersManageTab.tsx` | 4 | Missing import | **Fix** (client) |
| HttpError HTTP **400** partner logo upload | 1 | Matches API 400 volume | **Fix or UX** — validate file before POST |

No Error Tracking issues tied to the single `logger-config` 500 in `api_request` (likely server-side response without client exception capture).

---

## Code map

### Server handlers

| Route | Handler | Auth |
| ----- | ------- | ---- |
| Logger config GET/POST | [`logger_config.py`](../../../Server/app/routes/admin/handlers/logger_config.py) | `admin` |
| Dev workspace / agent status | [`current_user_dev_workspace.py`](../../../Server/app/routes/admin/handlers/current_user_dev_workspace.py), [`current_user_agent.py`](../../../Server/app/routes/admin/handlers/current_user_agent.py) | `admin` |
| Reset dev data | [`reset_dev_user_data.py`](../../../Server/app/routes/admin/handlers/reset_dev_user_data.py) | `admin`; super_admin to target another user |
| Gate users / roles / delete | [`list_admin_gate_users.py`](../../../Server/app/routes/admin/handlers/list_admin_gate_users.py), [`update_user_system_roles.py`](../../../Server/app/routes/admin/handlers/update_user_system_roles.py), [`delete_user.py`](../../../Server/app/routes/admin/handlers/delete_user.py) | `super_admin` |
| Validation stats | [`validation_stats.py`](../../../Server/app/routes/admin/handlers/validation_stats.py) | `admin` |
| Partners / logo / analytics | [`admin_partners.py`](../../../Server/app/routes/rev_share/handlers/admin_partners.py), [`partner_logo.py`](../../../Server/app/routes/rev_share/handlers/partner_logo.py), rev-share analytics | `super_admin` (partners) |

Blueprint registration: [`Server/app/routes/admin/__init__.py`](../../../Server/app/routes/admin/__init__.py).

### Client data layer

| Hook | API |
| ---- | --- |
| [`useAdminLoggerConfig`](../../../Client/packages/hooks/data/admin/useAdminLoggerConfig.ts) | `GET/POST .../logger-config` |
| [`useResetDevUserDataMutation`](../../../Client/packages/hooks/data/admin/useResetDevUserDataMutation.ts) | `POST .../users/reset-dev-data` |
| [`useSetCurrentUserDevWorkspaceMutation`](../../../Client/packages/hooks/data/admin/useSetCurrentUserDevWorkspaceMutation.ts) | `POST .../current-user-dev-workspace` |
| [`useAdminGateUsersList`](../../../Client/packages/hooks/data/admin/useAdminGateUsersList.ts) | `GET .../users/gate-roles` (no 7d traffic) |

All calls go through [`adminApi`](../../../Client/packages/features/admin/api/admin.ts) → shared HTTP client (401 refresh, HttpError on non-2xx).

### UI gates

- [`AdminPage`](../../../Client/apps/web/pages/workspace/AdminPage.tsx) → `AdminGuard` (`admin` or `super_admin` + `MANAGE_SYSTEM`).
- Partners / superadmin sections → `SuperAdminGuard` (`super_admin` only).

**Gap:** `AdminGuard` allows `admin`, but several high-error routes require **`super_admin`**. That explains 403 on partners/list/delete/logo despite reaching admin workspace — **product/telemetry mismatch**, not a server bug. Consider gating partners nav with `SuperAdminGuard` only (already on outlet) and avoiding prefetch for non-super-admins.

---

## Recommendations (prioritized)

1. **Dashboard — Reclassify:** Filter admin SLOs with `error_kind != 'server'` or `expected_client_error = false` once telemetry deploys; never use raw `is_error` for admin paging.
2. **Fix — Logger 500:** Add structured error logging around `merge_and_persist`; return 400 for validation failures instead of broad `except` → 500 in [`update_logger_config`](../../../Server/app/routes/admin/handlers/logger_config.py).
3. **Fix or UX — Reset dev data 400/404:** Ensure admin UI always sends `confirm: true` and valid scopes; disable cross-user reset unless super_admin (server already enforces).
4. **Fix or UX — Partner logo 400:** Client-side file type/size check before multipart POST; surface server message from [`partner_logo.py`](../../../Server/app/routes/rev_share/handlers/partner_logo.py).
5. **Fix — Partners client errors:** Resolve HttpError 405 (wrong method) and `useMemo` ReferenceError in partners admin tab (Error Tracking).
6. **Reclassify — Admin 403 volume:** Treat as expected unless 403 rate spikes for users with confirmed `admin`/`super_admin` roles (check `user_role` on events when present).
7. **Monitor — Latency:** `GET /api/v1/admin/rev-share/analytics` p95 ~1.8s (9 requests); not error-related.

---

## HogQL used

```sql
-- Legacy vs incident by endpoint (admin)
SELECT
  properties.endpoint AS endpoint,
  countIf(properties.is_error = true) AS errors_legacy,
  countIf(properties.is_server_error = true) AS errors_server,
  count() AS total,
  round(errors_legacy / total, 4) AS legacy_error_rate,
  round(errors_server / total, 4) AS incident_rate
FROM events
WHERE event = 'api_request'
  AND timestamp > now() - INTERVAL 7 DAY
  AND properties.endpoint LIKE '%/admin/%'
GROUP BY endpoint
ORDER BY legacy_error_rate DESC, total DESC
LIMIT 50;
```

```sql
-- Status histogram (errors only)
SELECT
  properties.endpoint AS endpoint,
  properties.status_code AS status_code,
  count() AS requests
FROM events
WHERE event = 'api_request'
  AND timestamp > now() - INTERVAL 7 DAY
  AND properties.endpoint LIKE '%/admin/%'
  AND properties.is_error = true
GROUP BY endpoint, status_code
ORDER BY requests DESC
LIMIT 50;
```
