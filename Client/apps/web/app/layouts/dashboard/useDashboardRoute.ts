/**
 * Single source of truth for "which dashboard area am I on?" using React Router.
 * Use this instead of pathMatches(pathname) in layout components so the router
 * drives content and layout—no stale pathname or prefix bugs.
 *
 * Route patterns must match DynamicRoutes (packages/navigation + RouteConfig).
 */

import { useLocation, useMatch } from "react-router-dom";

import type { PathPrefix } from "packages/utils/layout/dashboardLayoutConfig";
import { getWidthPercent } from "packages/utils/layout/dashboardLayoutConfig";

export type DashboardRouteResult = {
  /** Current dashboard area from router match; null if not a dashboard route. */
  activeKey: PathPrefix | null;
  pathname: string;
  search: string;
  isSearch: boolean;
  isDashboard: boolean;
  isProfile: boolean;
  isSaved: boolean;
  isMessaging: boolean;
  isFullHeightRoute: boolean;
  widthPercent: number;
};

/**
 * Returns the current dashboard route and layout flags from React Router.
 * Use in DashboardLayout, DashboardContent, DashboardHeader for consistent behavior.
 */
export function useDashboardRoute(defaultWidthPercent = 85): DashboardRouteResult {
  const location = useLocation();
  const pathname = location.pathname;
  const search = location.search;

  const searchMatch = useMatch("/search/*");
  const messagingMatch = useMatch("/messaging");
  const dashboardMatch = useMatch("/dashboard/*");
  const savedMatch = useMatch("/saved/*");
  const profileMatch = useMatch("/profile/*");

  const activeKey: PathPrefix | null = searchMatch
    ? "search"
    : messagingMatch
      ? "messaging"
      : dashboardMatch
        ? "dashboard"
        : savedMatch
          ? "saved"
          : profileMatch
            ? "profile"
            : null;

  const isFullHeightRoute = activeKey === "search" || activeKey === "messaging";
  const widthPercent = getWidthPercent(pathname, defaultWidthPercent);

  return {
    activeKey,
    pathname,
    search,
    isSearch: activeKey === "search",
    isDashboard: activeKey === "dashboard",
    isProfile: activeKey === "profile",
    isSaved: activeKey === "saved",
    isMessaging: activeKey === "messaging",
    isFullHeightRoute,
    widthPercent,
  };
}
