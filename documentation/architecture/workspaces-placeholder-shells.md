# Workspace placeholder shells

Seller, brokerage, and integration partner workspaces are **routing and identity shells only** for dashboard and nav. They exist so QA, admin dev persona, and role sync can exercise workspace switching without implying shipped product surfaces on those routes.

Buyer and agent are **implemented** workspaces. See [workspace-first-architecture.md](workspace-first-architecture.md) for full inventories.

**Seller onboarding exception:** Seller signup uses the full multi-step `seller_onboarding` flow ([SIL-192](https://linear.app/silverkey/issue/SIL-192/seller-seller-onboarding-profile-variation)) — property, address, timeline, motivation, pricing, demographics. Seller **dashboard and messaging** remain placeholder (`WorkspacePlaceholderPage`). See [profile-onboarding.md](../features/account/profile-onboarding.md).

## What “placeholder” means

| Allowed | Forbidden (until a workspace ships real UX) |
| ------- | --------------------------------------------- |
| `deriveAllowedWorkspaces` + `activeWorkspace` persistence | Product-specific nav labels (`My sale`, `Team chat`, etc.) |
| `WorkspaceSwitcher` / dev persona | Buyer search, library, messaging, or agent Client Hub in placeholder shells |
| `WorkspacePlaceholderPage` on dashboard and blocked routes | Dedicated dashboard/feature UX beyond placeholder for seller, brokerage, and integration partner |
| Generic i18n: `workspace.placeholder.*`, `workspace.nav.dashboard.placeholder` | Feature UI under `packages/features/brokerage|integrationPartner` beyond empty translation barrels; seller beyond onboarding + messaging copy |
| Thin app pages that delegate to `WorkspacePlaceholderPage` | Premature dashboard widgets or partner placement in placeholder shells |
| Onboarding steps documented per role (seller: full SIL-192 flow) | Undocumented product surfaces on placeholder dashboards |

## Code map

| Piece | Location |
| ----- | -------- |
| Placeholder detector | `Client/packages/utils/workspace/isPlaceholderWorkspace.ts` |
| Shared empty-state page | `Client/packages/features/workspace/components/WorkspacePlaceholderPage.tsx` |
| Nav (dashboard + messaging only) | `Client/packages/utils/workspace/workspaceNavConfig.ts` |
| Route guard (no buyer/agent pages) | `Client/apps/web/app/layouts/dashboard/DashboardContent.tsx` |
| Thin dashboard pages | `Client/apps/web/pages/workspace/SellerDashboardPage.tsx`, `BrokerageDashboardPage.tsx`, `IntegrationPartnerDashboardPage.tsx` |

## How to extend a placeholder workspace

1. Update this doc and the workspace section in [workspace-first-architecture.md](workspace-first-architecture.md).
2. Remove the workspace from `isPlaceholderWorkspace` when it graduates from shell-only.
3. Add nav tabs, labels, and routes incrementally in `workspaceNavConfig` and `DashboardContent`.
4. Add feature code under `packages/features/<workspace>/` following [package feature structure](../../.cursor/rules/shared/package-feature-structure.mdc).
5. Add onboarding steps via the [profile onboarding flow registry](../features/account/profile-onboarding.md) when the role has a public picker entry.

## Related

- Broker team dashboard: [SIL-158](https://linear.app/silverkey/issue/SIL-158/broker-team-dashboard-read-only-team-kpis-broker-persona-routes)
- Partner placement (brokerage admin): [rev-share-partners.md](../features/transaction-management/rev-share-partners.md)
