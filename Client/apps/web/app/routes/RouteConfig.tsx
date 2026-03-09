import type { UserProfile } from "@/features/homeauth/types";

import { ProtectedDashboardShell } from "./ProtectedDashboardShell";
import type { AppRouteConfig } from "./routeConfigExports";

/**
 * Creates the protected dashboard shell element. Use the same returned element
 * reference for all dashboard routes so the shell stays mounted (Meta-style).
 */
export function createProtectedRoute(
  user?: UserProfile,
  onLogout?: () => void,
  _providerType?: AppRouteConfig["providerType"],
  _routeKey?: string
) {
  return <ProtectedDashboardShell user={user} onLogout={onLogout ?? (() => {})} />;
}
