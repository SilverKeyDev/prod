# Workspace-first client architecture

SilverKey distinguishes **who the user is on the server** (identity: `is_agent`, roles, future brokerage membership) from **which product shell they are using in the UI** (workspace: `buyer` | `seller` | `agent` | `brokerage`). Navigation and many gates should follow **`useActiveWorkspace()`**, not `useIsAgent()`, when the question is “which shell or tab?” — keep **`useIsAgent()`** / `user.is_agent` when the question is “can this session call agent-only APIs?”.

## Concepts

| Concept | Purpose |
|--------|---------|
| **`Workspace`** | UX mode for routing, sidebar, and feature composition. |
| **`allowedWorkspaces`** | Derived from identity (and optional `brokerage_org_ids` / roles); defines which workspace tabs the user may pick. |
| **`activeWorkspace`** | Persisted per browser session; canonical hook **`useActiveWorkspace()`** in `packages/hooks/store/`. |
| **`useIsAgent()`** | Server identity flag; use for API eligibility and demographics, not primary nav shell selection. |

Dashboard URLs are **role- and workspace-agnostic** (for example `/search`, `/messaging`, `/dashboard/...`). Which shell the user sees is driven by **`activeWorkspace`** and related store state, not by path prefixes. Legacy **`/buyer/*`** and **`/brokerage/*`** URLs still resolve: they redirect to the equivalent canonical path so bookmarks continue to work.

## Key code paths (web)

| Area | Location |
|------|----------|
| Derive allowed workspaces | `Client/packages/utils/workspace/deriveAllowedWorkspaces.ts` |
| Workspace Zustand slice | `Client/packages/store/slices/workspace/workspace.slice.ts` |
| Sync from auth + profile | `Client/packages/hooks/store/useWorkspaceIdentitySync.ts` |
| Legacy `/buyer/*`, `/brokerage/*` → canonical URLs | `Client/apps/web/app/routes/LegacyWorkspaceShellPrefixRedirect.tsx`, `stripWorkspaceShellPrefix` in `Client/packages/utils/layout/dashboardLayoutConfig.ts`, `Client/apps/web/app/routes/ShellCanonicalPathRedirect.tsx` |
| Dashboard area resolution | `Client/packages/utils/layout/dashboardLayoutConfig.ts`, `Client/apps/web/app/layouts/dashboard/useDashboardRoute.ts` |
| Transaction party config | `Client/packages/utils/workspace/transactionShell.ts` + `useTransactionShellConfig` in `packages/hooks/store/` |
| Admin reuse / brokerage | `Client/packages/features/admin/types/adminScope.ts` — sections accept `AdminScope` |

## Server alignment

- **`user.is_agent`** remains the source for **`@require_agent_access`** (and similar agent APIs).
- **Brokerage scope** — parallel decorator **`require_brokerage_scope`** in `Server/app/utils/common_patterns.py`; OpenAPI **`User.brokerage_org_ids`** for future roster-backed membership. Regenerate types from `openapi/` after schema changes.

## Thin app note

Workspace **route shells** live in **`Client/apps/web/app/routes/`** and layouts as thin composition; business logic and hooks stay in **`Client/packages/`** (see [thin-app-architecture.md](./thin-app-architecture.md) and `.cursor/rules/shared/thin-app-architecture.mdc`).

## Related

- [layered-architecture-imports.md](./layered-architecture-imports.md) — import layers and features.
- [Post–major change checklist](../internal/post-major-change-checklist.md) — update docs and Cursor config when architecture shifts.
- Scoped Cursor rule: `.cursor/rules/shared/post-major-change-sync.mdc`.
