import type { ReactNode } from "react";

import type { UserProfile } from "../../core/schemas/user";
import { ProtectedRoute } from "../guards";
import DashboardLayout from "../layouts/DashboardLayout";
// Page-specific providers (now using Zustand stores)

// Route configuration types
export type RouteConfig = {
  path: string;
};

export type RouteCategory = "lightweight" | "standard" | "specialized";
export type ProviderLevel = "minimal" | "full";

// Provider factory function - simplified since providers migrated to Zustand stores
function createProviderWrapper() {
  return (children: ReactNode): ReactNode => {
    return children;
  };
}

// Unified protected route creator
export function createProtectedRoute(
  user?: UserProfile,
  onLogout?: () => void
) {
  const dashboard = (
    <DashboardLayout user={user} onLogout={onLogout ?? (() => {})} />
  );
  const wrappedDashboard = createProviderWrapper()(dashboard);

  return <ProtectedRoute>{wrappedDashboard}</ProtectedRoute>;
}

// Route configurations by category
export const ROUTE_CONFIGS = {
  lightweight: [
    "/personalization/*",
    "/agent-connection/*",
    "/client-information/*",
    "/proof-of-funds/*",
  ],

  standard: [
    "/saved/*",
    "/reports/*",
    "/generate-report/*",
    "/compare-reports/*",
    "/dashboard/*",
    "/ai-assistant/*",
    "/calendar/*",
  ],

  specialized: [
    { path: "/search/*" }, // Maps functionality now handled by Zustand store
    { path: "/negotiation-strategy/*" }, // Negotiation functionality now handled by Zustand store
    { path: "/close/escrow-legal-logistics/*" }, // Documents functionality now handled by Zustand store
    { path: "/close/inspections-due-diligence/*" }, // Documents functionality now handled by Zustand store
    { path: "/close/financing-insurance/*" }, // Billing functionality now handled by Zustand store
    { path: "/close/closing-moving-in/*" }, // Documents functionality now handled by Zustand store
    { path: "/subscription/*" }, // Billing functionality now handled by Zustand store
  ],
} as const;
