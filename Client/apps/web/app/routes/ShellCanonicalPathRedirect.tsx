import { useEffect } from "react";

import { useLocation } from "react-router-dom";

import { useNavigation } from "packages/navigation";
import { stripWorkspaceShellPrefix } from "packages/utils/layout/dashboardLayoutConfig";

/**
 * Belt-and-suspenders: if something navigates to a legacy `/buyer/*` or `/brokerage/*`
 * path inside the dashboard shell, normalize to the unified URL space.
 */
export function ShellCanonicalPathRedirect() {
  const { pathname, search } = useLocation();
  const { navigateToPath } = useNavigation();

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/property")) return;
    if (pathname.startsWith("/a/") || pathname.startsWith("/agent-profile")) return;
    if (pathname.startsWith("/agreements/")) return;
    if (!pathname.startsWith("/buyer") && !pathname.startsWith("/brokerage")) return;
    const next = stripWorkspaceShellPrefix(pathname);
    if (next === pathname) return;
    navigateToPath(`${next}${search ?? ""}`, { replace: true });
  }, [pathname, search, navigateToPath]);

  return null;
}
