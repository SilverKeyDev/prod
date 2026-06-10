/**
 * Single source of truth for "which dashboard area am I on?" using React Router.
 * Use this instead of pathMatches(pathname) in layout components so the router
 * drives content and layout, no stale pathname or prefix bugs.
 *
 * Route patterns must match DynamicRoutes (packages/navigation + RouteConfig).
 * When LocationOverrideContext is set (router URL sync workaround), we derive
 * activeKey from pathname so the UI matches the browser URL.
 */

import { useLocation } from "react-router-dom";

import type { PathPrefix } from "packages/utils/core/layout/dashboardLayoutConfig";
import {
  getActiveDashboardKey,
  getWidthPercent,
} from "packages/utils/core/layout/dashboardLayoutConfig";

import { useLocationOverride } from "@/app/routes/locationOverrideContext";

/** Dashboard shell area; includes DocuSign return route outside /library prefix. */
export type DashboardAreaKey = PathPrefix | "agreement_signing_complete";

function activeKeyFromPathname(pathname: string): DashboardAreaKey | null {
  if (/^\/agreements\/[^/]+\/complete\/?$/.test(pathname)) {
    return "agreement_signing_complete";
  }
  return getActiveDashboardKey(pathname);
}

export type DashboardRouteResult = {
  /** Current dashboard area from router match; null if not a dashboard route. */
  activeKey: DashboardAreaKey | null;
  pathname: string;
  search: string;
  isSearch: boolean;
  isDashboard: boolean;
  isProfile: boolean;
  isLibrary: boolean;
  isMessaging: boolean;
  isAnalytics: boolean;
  isFindAgents: boolean;
  isAgreementSigningComplete: boolean;
  isFullHeightRoute: boolean;
  widthPercent: number;
};

/**
 * Returns the current dashboard route and layout flags from React Router.
 * Use in DashboardLayout, DashboardContent, DashboardHeader for consistent behavior.
 */
export function useDashboardRoute(defaultWidthPercent = 85): DashboardRouteResult {
  const routerLocation = useLocation();
  const locationOverride = useLocationOverride();
  const location = locationOverride ?? routerLocation;
  const pathname = location.pathname;
  const search = location.search;

  const activeKey: DashboardAreaKey | null = activeKeyFromPathname(pathname);

  const isFullHeightRoute = activeKey === "search" || activeKey === "messaging";
  const widthPercent =
    activeKey === "agreement_signing_complete"
      ? 90
      : getWidthPercent(pathname, defaultWidthPercent);

  return {
    activeKey,
    pathname,
    search,
    isSearch: activeKey === "search",
    isDashboard: activeKey === "dashboard",
    isProfile: activeKey === "profile",
    isLibrary: activeKey === "library",
    isMessaging: activeKey === "messaging",
    isAnalytics: activeKey === "analytics",
    isFindAgents: activeKey === "find_agents",
    isAgreementSigningComplete: activeKey === "agreement_signing_complete",
    isFullHeightRoute,
    widthPercent,
  };
}
