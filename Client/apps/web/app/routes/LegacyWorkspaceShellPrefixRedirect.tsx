import { Navigate, useLocation } from "react-router-dom";

import { stripWorkspaceShellPrefix } from "packages/utils/layout/dashboardLayoutConfig";

/**
 * Redirects legacy `/buyer/*` and `/brokerage/*` dashboard URLs to the unified
 * role-agnostic path space (workspace remains store-driven).
 */
export function LegacyWorkspaceShellPrefixRedirect() {
  const { pathname, search } = useLocation();
  const nextPath = stripWorkspaceShellPrefix(pathname);
  const to = `${nextPath}${search ?? ""}`;
  return <Navigate to={to} replace />;
}
