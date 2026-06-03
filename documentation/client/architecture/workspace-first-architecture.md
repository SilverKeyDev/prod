# Workspace-first client architecture

SilverKey distinguishes **who the user is on the server** (identity: `user_roles`, brokerage membership) from **which product shell they are using in the UI** (workspace: `buyer` | `seller` | `agent` | `brokerage` | `integration_partner`). Navigation and many gates should follow **`useActiveWorkspace()`**, not `useIsAgent()`, when the question is “which shell or tab?” — keep **`useIsAgent()`** when the question is “does this session have the agent role?” (agent-only APIs and agent UX).

## Status legend

| Status | Meaning |
| ------ | ------- |
| **Implemented** | Full product shell: nav, onboarding, and primary routes as described below. |
| **Placeholder (shell only)** | Identity + routing + empty dashboard; no product-specific tabs or flows. See [workspaces-placeholder-shells.md](workspaces-placeholder-shells.md). |

## Concepts

| Concept | Purpose |
|--------|---------|
| **`Workspace`** | UX mode for routing, sidebar, and feature composition (`buyer` \| `seller` \| `agent` \| `brokerage` \| `integration_partner`). |
| **`allowedWorkspaces`** | Derived from identity (and optional `brokerage_org_ids` / roles); defines which workspace tabs the user may pick. |
| **`activeWorkspace`** | Persisted per browser session; canonical hook **`useActiveWorkspace()`** in `packages/hooks/store/`. |
| **`useIsAgent()`** | True when `roles` includes `"agent"`; use for API eligibility and agent UX, not primary nav shell selection. |
| **`isPlaceholderWorkspace()`** | `true` for seller, brokerage, integration_partner — barren nav and route guards. |
| **Admin dev persona** | Server-backed workspace QA via **`/admin/dev-persona`** (replaces session `devPreviewAllWorkspaces`). |

## Identity sync

**What it is:** A client-side reconciler that keeps **`allowedWorkspaces`** and **`activeWorkspace`** aligned with the signed-in user’s server identity (`user_roles`, `brokerage_org_ids`). It does **not** change the server — it reads auth/profile and updates the Zustand workspace store.

**How it works:**

1. **`useWorkspaceIdentitySync`** (`packages/hooks/store/integrations/useWorkspaceIdentitySync.ts`) mounts once under `AuthShellProviders`.
2. On auth user or profile role changes, it calls **`syncFromIdentity`** on the workspace store.
3. **`deriveAllowedWorkspaces`** computes which shells identity permits (e.g. agent-only account → `["agent"]`; buyer+seller roles → both).
4. **`pickInitialActive`** picks `activeWorkspace`: prefers session-persisted value when allowed; otherwise first allowed shell.
5. **Dev persona:** Use **`/admin/dev-persona`** for prod-like multi-workspace QA (server-backed identity).

Dashboard URLs are **role- and workspace-agnostic** (for example `/search`, `/messaging`, `/dashboard/...`). Which shell the user sees is driven by **`activeWorkspace`** and related store state, not by path prefixes.

## Key code paths (web)

| Area | Location |
|------|----------|
| Derive allowed workspaces | `Client/packages/utils/workspace/deriveAllowedWorkspaces.ts` |
| Placeholder workspace guard | `Client/packages/utils/workspace/isPlaceholderWorkspace.ts` |
| Workspace Zustand slice | `Client/packages/store/slices/workspace/workspace.slice.ts` |
| Sync from auth + profile | `Client/packages/hooks/store/integrations/useWorkspaceIdentitySync.ts` |
| Path normalization (`stripWorkspaceShellPrefix`) | `Client/packages/utils/layout/dashboardLayoutConfig.ts` (layout keys only; no shell-prefix redirects) |
| Dashboard area resolution | `Client/packages/utils/layout/dashboardLayoutConfig.ts`, `Client/apps/web/app/layouts/dashboard/useDashboardRoute.ts` |
| Transaction party config | `Client/packages/utils/workspace/transactionShell.ts` + `useTransactionShellConfig` in `packages/hooks/store/` |
| Per-workspace nav labels / visibility | `Client/packages/utils/workspace/workspaceNavConfig.ts` |
| Placeholder page | `Client/packages/features/workspace/components/WorkspacePlaceholderPage.tsx` |
| Workspace switcher UI | `Client/packages/features/workspace/components/WorkspaceSwitcher.web.tsx` |
| Admin reuse / brokerage | `Client/packages/features/admin/types/adminScope.ts` — sections accept `AdminScope` |

## Server alignment

- **Agent role** in `user_roles` is the source for **`@require_agent_access`** (via `user_is_agent()`).
- **Brokerage scope** — parallel decorator **`require_brokerage_scope`** in `Server/app/utils/common_patterns.py`; OpenAPI **`User.brokerage_org_ids`** for future roster-backed membership. Regenerate types from `openapi/` after schema changes.

## Thin app note

Workspace **route shells** live in **`Client/apps/web/app/routes/`** and layouts as thin composition; business logic and hooks stay in **`Client/packages/`** (see [thin-app-architecture.md](thin-app-architecture.md) and `.cursor/rules/shared/thin-app-architecture.mdc`).

---

## Workspace inventories

Canonical routes are shared; **nav visibility**, **labels**, **onboarding**, and **dashboard content** differ by `activeWorkspace`.

### Buyer — **Implemented**

**Product goal:** Home search and transaction workflow for purchasers; AI-assisted discovery, saved homes, messaging, and closing tasks.

| Area | Detail |
| ---- | ------ |
| **Onboarding (web)** | `onboarding_role` → About (`demographics`) → housing essentials → size → location → search features → financial (mobile excludes financial). Investor uses the same step count as buyer. |
| **Nav (desktop)** | Dashboard, Search, Library, Messaging, Profile |
| **Nav (mobile)** | Dashboard, Search, Library, Messaging (profile via header) |
| **Dashboard (`/dashboard`)** | `DashboardPage` → `DashboardFeature`: calendar, checklists, transaction widgets |
| **Other routes** | `/search`, `/library` (saved), `/messaging`, `/profile` — full buyer/agent-shared features |
| **Post-onboarding** | `/search` |

### Agent — **Implemented**

**Product goal:** Licensed agents serving buyers on active transactions — client hub, messaging, and the same dashboard shell with agent-specific branches.

| Area | Detail |
| ---- | ------ |
| **Onboarding (web)** | `onboarding_role` → About → brokerage → licensing → territory |
| **Nav (desktop)** | Dashboard, Search, Library, Messaging (**Clients**), Profile |
| **Nav (mobile)** | Same tab keys as buyer; messaging label **Clients** |
| **Dashboard (`/dashboard`)** | `DashboardPage` → `DashboardFeature` with `activeWorkspace === "agent"` branches (client hub, agent calendar) |
| **Messaging** | `AgentPage` / Client Hub surfaces |
| **Post-onboarding** | `/search` |
| **API identity** | `useIsAgent()` — agent role in `user.roles` for agent-only endpoints |

### Seller — **Placeholder (shell only)**

**Product goal (future):** Listing and sale-side workflow for homeowners selling a property. **Not built yet.**

| Area | Detail |
| ---- | ------ |
| **Onboarding** | Public role picker only: selecting **Seller** → single `onboarding_role` step → submit. Sets `why_joining_silverkey` / `user_roles` via preferences sync; `activeWorkspace` → `seller`; lands on `/dashboard`. |
| **Nav** | **Dashboard**, **Messaging** (generic labels; icons: home, send). Same on mobile. |
| **Dashboard / Messaging** | `WorkspacePlaceholderPage` on both tabs until features ship |
| **Blocked routes** | `/search`, `/library`, `/profile` render placeholder (not buyer/agent product UI) |
| **Code** | `SellerDashboardPage.tsx`, empty `packages/features/seller/types/translations.ts` |

### Brokerage — **Placeholder (shell only)**

**Product goal (future):** Brokerage / office-lead oversight — team roster, aggregates, marketplace admin. See [to-implement-soon/broker-workspace/01-broker-team-dashboard.md](../../to-implement-soon/broker-workspace/01-broker-team-dashboard.md).

| Area | Detail |
| ---- | ------ |
| **Onboarding** | Not in public role picker. Provisioned via `brokerage_admin*` roles, `brokerage_org_ids`, or **Admin → Dev persona**. |
| **Nav** | **Dashboard**, **Messaging** (generic labels). |
| **Dashboard / Messaging** | `WorkspacePlaceholderPage` |
| **Blocked routes** | Same placeholder guard as seller |
| **Code** | `BrokerageDashboardPage.tsx`, empty `packages/features/brokerage/types/translations.ts` |

### Integration partner — **Placeholder (shell only)**

**Product goal (future):** Operator UX for ancillary partners (e.g. fintech, concierge) — placement analytics and checklist integrations at the **brokerage/workflow** level, not buyer steering. RESPA: partner-operator shell, not personalized buyer recommendations.

| Area | Detail |
| ---- | ------ |
| **Onboarding** | Not in public role picker. Provisioned via `integration_partner*` roles or dev persona. |
| **Nav** | **Dashboard**, **Messaging** (generic labels). |
| **Dashboard / Messaging** | `WorkspacePlaceholderPage` |
| **Related (brokerage-side)** | Partner placement admin: [rev-share-partners.md](../features/rev-share-partners.md) |
| **Code** | `IntegrationPartnerDashboardPage.tsx`, empty `packages/features/integrationPartner/types/translations.ts` |

---

## Identity → workspace

- POST `/api/v1/preferences` syncs **`user_roles`** from `why_joining_silverkey` via `Server/app/services/auth/user_roles_sync.py` (buyer / seller / investor tags); agent role is granted from `primary_onboarding_role: "agent"` on first write (immutable after grant).
- `deriveAllowedWorkspaces` reads `user.roles` from profile bootstrap (including `integration_partner` when provisioned).
- **`WorkspaceSwitcher`** — admin only at **`/admin/dev-persona`** (`AdminDevPersonaSection`): sets exclusive server-backed persona via `POST /api/v1/admin/current-user-dev-workspace`. Workspace UX follows identity like production; not mounted in the main dashboard.
- Seller onboarding success sets `activeWorkspace` to `seller` and navigates to `/dashboard` (see `postOnboardingPathForForm`).

## How to verify locally

1. Complete onboarding as **Seller** (role only) → lands on placeholder dashboard; profile `roles` includes `seller` when tags sync.
2. Open **Admin → Dev preview** (`/admin/dev-persona`) and choose brokerage or integration partner → barren nav and placeholder dashboard.
3. As buyer or agent, confirm full tabs and flows unchanged.
4. Run tests:

```bash
cd Client && pnpm test:run -- packages/utils/workspace packages/features/workspace packages/features/profile/utils/onboarding apps/web/app/layouts/dashboard/DashboardContent.workspace.test.tsx
cd Server && .venv/bin/python -m pytest tests/unit/services/test_user_roles_sync.py tests/unit/routes/auth/test_routes_user_preferences.py::TestPreferences::test_create_preferences_syncs_seller_roles_to_profile -q --no-cov
```

| Layer | Test files |
|-------|------------|
| Client | `deriveAllowedWorkspaces.test.ts`, `isPlaceholderWorkspace.test.ts`, `workspaceNavConfig.test.ts`, `steps.test.ts`, `onboardingToWorkspace.test.ts`, `WorkspaceSwitcher.web.test.tsx`, `DashboardContent.workspace.test.tsx` |
| Server | `test_user_roles_sync.py`, `routes/auth/test_routes_user_preferences.py` (seller roles) |

## Related

- [workspaces-placeholder-shells.md](workspaces-placeholder-shells.md) — placeholder contract and extension checklist.
- [layered-architecture-imports.md](layered-architecture-imports.md) — import layers and features.
- [Post–major change checklist](../../internal/post-major-change-checklist.md) — update docs and Cursor config when architecture shifts.
- Scoped Cursor rule: `.cursor/rules/shared/post-major-change-sync.mdc`.
