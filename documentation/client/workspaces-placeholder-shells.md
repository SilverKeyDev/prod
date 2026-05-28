# Workspace placeholder shells

Seller, brokerage, and integration partner workspaces are **routing and identity shells only**. They exist so QA, admin dev persona, and role sync can exercise workspace switching without implying shipped product surfaces.

Buyer and agent are **implemented** workspaces. See [workspace-first-architecture.md](./workspace-first-architecture.md) for full inventories.

## What “placeholder” means

| Allowed | Forbidden (until a workspace ships real UX) |
| ------- | --------------------------------------------- |
| `deriveAllowedWorkspaces` + `activeWorkspace` persistence | Product-specific nav labels (`My sale`, `Team chat`, etc.) |
| `WorkspaceSwitcher` / dev persona | Buyer search, library, messaging, or agent Client Hub in placeholder shells |
| `WorkspacePlaceholderPage` on dashboard and blocked routes | Dedicated onboarding flows beyond what is documented per workspace |
| Generic i18n: `workspace.placeholder.*`, `workspace.nav.dashboard.placeholder` | Feature UI under `packages/features/seller|brokerage|integrationPartner` beyond empty translation barrels |
| Thin app pages that delegate to `WorkspacePlaceholderPage` | Premature dashboard widgets or partner placement in placeholder shells |

## Code map

| Piece | Location |
| ----- | -------- |
| Placeholder detector | `Client/packages/utils/workspace/isPlaceholderWorkspace.ts` |
| Shared empty-state page | `Client/packages/features/workspace/components/WorkspacePlaceholderPage.tsx` |
| Nav (dashboard + messaging only) | `Client/packages/utils/workspace/workspaceNavConfig.ts` |
| Route guard (no buyer/agent pages) | `Client/apps/web/app/layouts/dashboard/DashboardContent.tsx` |
| Thin dashboard pages | `Client/apps/web/pages/workspace/SellerDashboardPage.tsx`, `BrokerageDashboardPage.tsx`, `IntegrationPartnerDashboardPage.tsx` |

## How to extend a placeholder workspace

1. Update this doc and the workspace section in [workspace-first-architecture.md](./workspace-first-architecture.md).
2. Remove the workspace from `isPlaceholderWorkspace` when it graduates from shell-only.
3. Add nav tabs, labels, and routes incrementally in `workspaceNavConfig` and `DashboardContent`.
4. Add feature code under `packages/features/<workspace>/` following [package feature structure](../../.cursor/rules/shared/package-feature-structure.mdc).
5. Add onboarding steps via the [profile onboarding flow registry](./profile-onboarding-flow.md) when the role has a public picker entry.

## Related future specs

- Brokerage team dashboard: [documentation/to-implement-soon/broker-workspace/01-broker-team-dashboard.md](../to-implement-soon/broker-workspace/01-broker-team-dashboard.md)
- Partner placement (brokerage admin): [rev-share-partners.md](./rev-share-partners.md)
