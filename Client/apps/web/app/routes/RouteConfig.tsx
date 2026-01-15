import type { ReactNode } from "react";

import type { UserProfile } from "../../../../packages/schemas/user";
import { ROUTES } from "../../../../packages/schemas/nav";
import { ProtectedRoute } from "../guards";
import DashboardLayout from "../layouts/DashboardLayout";
import { AuthShellProviders } from "../providers/auth/AuthShellProviders";

// Page-specific providers
import { DocsOnly } from "../providers/page/DocsOnly";
import { MapsOnly } from "../providers/page/MapsOnly";

// Route configuration types
export type RouteConfig = {
  path: string;
  providerType?: "maps" | "docs" | "billing";
};

export type RouteCategory = "lightweight" | "standard" | "specialized";

// Provider factory function
function createProviderWrapper(providerType: RouteConfig["providerType"]) {
  return (children: ReactNode): ReactNode => {
    switch (providerType) {
      case "maps":
        return <MapsOnly>{children}</MapsOnly>;
      case "docs":
        return <DocsOnly>{children}</DocsOnly>;
      default:
        return children;
    }
  };
}

// Unified protected route creator
export function createProtectedRoute(
  user?: UserProfile,
  onLogout?: () => void,
  providerType?: RouteConfig["providerType"]
) {
  const dashboard = (
    <DashboardLayout user={user} onLogout={onLogout ?? (() => {})} />
  );
  const wrappedDashboard = providerType
    ? createProviderWrapper(providerType)(dashboard)
    : dashboard;

  return (
    <ProtectedRoute>
      <AuthShellProviders>{wrappedDashboard}</AuthShellProviders>
    </ProtectedRoute>
  );
}

// Route configurations by category
export const ROUTE_CONFIGS = {
  lightweight: [ROUTES.SETTINGS],

  standard: [
    ROUTES.SAVED,
    ROUTES.DASHBOARD,
    ROUTES.BUYER_CHECKLISTS,
    ROUTES.MESSAGING,
  ],

  specialized: [{ path: ROUTES.SEARCH, providerType: "maps" as const }],
} as const;
