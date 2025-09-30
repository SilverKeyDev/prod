import type { ReactNode } from "react";

import type { UserProfile } from "../../../../packages/schemas/user";
import { ProtectedRoute } from "../guards";
import DashboardLayout from "../layouts/DashboardLayout";
import { AuthShellProviders } from "../providers/auth/AuthShellProviders";
import { MinimalAuthProviders } from "../providers/auth/MinimalAuthProviders";
// Page-specific providers
import { BillingOnly } from "../providers/page/BillingOnly";
import { DocsOnly } from "../providers/page/DocsOnly";
import { MapsOnly } from "../providers/page/MapsOnly";
import { NegotiationOnly } from "../providers/page/NegotiationOnly";

// Route configuration types
export type RouteConfig = {
  path: string;
  providerType?: "maps" | "negotiation" | "docs" | "billing";
};

export type RouteCategory = "lightweight" | "standard" | "specialized";
export type ProviderLevel = "minimal" | "full";

// Provider factory function
function createProviderWrapper(providerType: RouteConfig["providerType"]) {
  return (children: ReactNode): ReactNode => {
    switch (providerType) {
      case "maps":
        return <MapsOnly>{children}</MapsOnly>;
      case "negotiation":
        return <NegotiationOnly>{children}</NegotiationOnly>;
      case "docs":
        return <DocsOnly>{children}</DocsOnly>;
      case "billing":
        return <BillingOnly>{children}</BillingOnly>;
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
  providerLevel: ProviderLevel = "full"
) {
  const dashboard = (
    <DashboardLayout user={user} onLogout={onLogout ?? (() => {})} />
  );
  const wrappedDashboard = providerType
    ? createProviderWrapper(providerType)(dashboard)
    : dashboard;

  const AuthProviders =
    providerLevel === "minimal" ? MinimalAuthProviders : AuthShellProviders;

  return (
    <ProtectedRoute>
      <AuthProviders>{wrappedDashboard}</AuthProviders>
    </ProtectedRoute>
  );
}

// Route configurations by category
export const ROUTE_CONFIGS = {
  lightweight: [
    "/personalization/*",
    "/agent-connection/*",
    "/client-information/*",
  ],

  standard: [
    "/saved/*",
    "/reports/*",
    "/generate-report/*",
    "/compare-reports/*",
    "/dashboard",
    "/dashboard/*",
    "/ai-assistant/*",
  ],

  specialized: [
    { path: "/search/*", providerType: "maps" as const },
    { path: "/negotiation-strategy/*", providerType: "negotiation" as const },
    { path: "/buyer-checklists/*", providerType: "docs" as const },
    { path: "/close/escrow-legal-logistics/*", providerType: "docs" as const },
    {
      path: "/close/inspections-due-diligence/*",
      providerType: "docs" as const,
    },
    { path: "/close/financing-insurance/*", providerType: "billing" as const },
    { path: "/close/closing-moving-in/*", providerType: "docs" as const },
    { path: "/subscription/*", providerType: "billing" as const },
  ],
} as const;
