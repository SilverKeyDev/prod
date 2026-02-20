import type { ReactNode } from "react";

import { ROUTES } from "packages/schemas/app/nav";
import type { UserProfile } from "packages/schemas/user";

import { ProtectedRoute } from "@/app/guards";
import { DashboardLayout } from "@/app/layouts";
import { AuthShellProviders } from "@/app/providers/auth/AuthShellProviders";
// Page-specific providers
import { DocsOnly } from "@/app/providers/page/DocsOnly";
import { MapsOnly } from "@/app/providers/page/MapsOnly";

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
  providerType?: RouteConfig["providerType"],
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
  lightweight: [ROUTES.PROFILE],

  standard: [ROUTES.SAVED, ROUTES.DASHBOARD, ROUTES.MESSAGING],

  specialized: [{ path: ROUTES.SEARCH, providerType: "maps" as const }],
} as const;
