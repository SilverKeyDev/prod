# Brokerage analytics and Market inventory

> **Status:** Shipped (web, fixture-backed UI)  
> **Last verified:** 2026-07-24  
> **Code:** `Client/packages/features/brokerage/`, `Server/app/routes/brokerage_analytics/`

Brokerage workspace dashboard for team KPIs, leakage, agent detail, deal forensics, and Market inventory. Campaigns are **not** on main (archived on `archive/brokerage-campaigns`).

## Intent

Give brokerage admins a single `/dashboard` shell with period/office controls and deep links into per-agent analytics. The UI is **fixture-first** today so demos work without a live OpenAPI swap; server analytics routes exist and are scoped by brokerage membership.

## Routes (web)

| Path | Surface |
|------|---------|
| `/dashboard` | `BrokerageDashboardPage` → `BrokerageDashboardShell` → `BrokerageAnalyticsShell` |
| `/dashboard?tab=overview` | Overview (default; overview may omit `tab`) |
| `/dashboard?tab=leakage` | Leakage |
| `/dashboard?tab=agents` | Agents list + row actions |
| `/dashboard?tab=forensics` | Deal forensics |
| `/dashboard?tab=market` | Market inventory map/list |
| `/dashboard/agent/:agentSlug` | Per-agent analytics (`AgentAnalyticsPage`) |
| `/analytics` | Redirect → `/dashboard` |
| `/inventory` | Redirect → `/dashboard` |

Inventory is **not** a top-level sidebar item; it lives under the Market tab (`workspaceNavConfig` hides `inventory`).

## UI composition

```text
BrokerageDashboardPage (thin app)
  └─ BrokerageDashboardShell
       └─ BrokerageAnalyticsShell
            ├─ tabs: overview | leakage | agents | forensics | market
            ├─ ViewAllAgentsModal, AgentRowActions
            └─ AnalyticsMarketTab → BrokerageInventoryPanel
```

Agent row actions: public website (`/a/:slug` when slug exists) and analytics (`/dashboard/agent/:nameSlug`). Agent analytics route is wrapped in `ProtectedRoute` (auth) but is **not** separately gated to the brokerage workspace on the client.

## Data flow

| Layer | Behavior |
|-------|----------|
| Hooks (`useBrokerageAnalytics`, inventory, ancillary, retention, engagement, forensics) | TanStack Query with **local fixture** `queryFn` / `initialData` until SIL-207 live swap |
| `api/analytics.ts` | Typed client for `/api/v1/brokerage/analytics/*` — **ready but unused by hooks** |
| `useBrokerageOrgId` | Resolves org id for query keys / future API calls |
| Server routes | `require_brokerage_scope` on every analytics handler |

Do not assume the dashboard charts reflect live DB data until hooks call `api/analytics.ts`.

## Server API

Listed in `Server/endpoints.json` under `GET /api/v1/brokerage/analytics/`:

`overview`, `volume`, `price`, `location`, `type`, `timing`, `ancillary`, `funnel`, `agents`, `deal-failure`, `targeted-agent-engagement`, `agent-retention-risk`, `inventory`

**Query params (typical):**

- `brokerage_org_id` (required) — membership checked by `require_brokerage_scope`
- `timeline` ∈ `week|month|year|5years|all` (preferred), or `date_from` / `date_to`
- Inventory also accepts `status`

**Auth failures:** 401 unauthenticated; 403 when `user.brokerage_org_ids` is empty or org not allowed; 400 when `brokerage_org_id` missing.

These paths are **not** in the OpenAPI spec yet — regenerate types after the contract lands (SIL-207).

### SIL-208 ML

`Server/app/services/brokerage/ml/` and Celery `score_brokerage_ml_insights_task` exist. There is **no** dedicated ML HTTP route in `endpoints.json`. Timing/retention handlers may return stub notes rather than a live model score.

## Workspace placement

Brokerage is **not** a placeholder workspace (`isPlaceholderWorkspace` is an empty set). Nav shows Dashboard, Library, Messaging, Profile (Search hidden; Inventory via Market tab). Messaging uses the workspace stack (`BrokerageMessaging`). See [workspace-first-architecture.md](../../architecture/workspace-first-architecture.md).

## Local demo

1. Onboard as Brokerage, or set Admin → Dev persona to brokerage.
2. Open `/dashboard` — fixtures render without calling analytics APIs.
3. Optional server demo data: `Server/scripts/skyslope/generate_demo_dataset.py`, `load_demo_to_skyslope.py`, `generate_inventory_fixtures.py`, `generate_agent_analytics_fixtures.py` under `Server/data/skyslope-demo/`.

## Out of scope on main

- Email campaigns UI, learning loop, campaign Celery tasks, and campaign demo JSON (removed; see archive branch `archive/brokerage-campaigns`)
- Dedicated mobile brokerage analytics shell
- Partner placement / RESPA steering (documented under transaction-management, not this surface)

## Pitfalls

1. `/analytics` and `/inventory` redirect to `/dashboard` (query params on `/analytics` are dropped).
2. Client fixtures and server stubs can diverge — treat UI numbers as demo until SIL-207.
3. Agent detail pages are slug/fixture-driven and auth-only on the client; do not assume membership scoping there yet.
4. Keep new code under allowed feature folders (`api/`, `components/`, `hooks/`, `types/`, `utils/`, …) — package structure is lint-enforced.

## Related

- Hub index: [README.md](./README.md)
- Messaging: [messaging.md](../messaging/messaging.md)
- Ops scripts: [scripts-guide.md](../../runbooks/scripts-guide.md)
