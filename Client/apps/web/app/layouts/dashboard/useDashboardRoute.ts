/**
 * Single source of truth for "which dashboard area am I on?" using React Router.
 * Use this instead of pathMatches(pathname) in layout components so the router
 * drives content and layout, no stale pathname or prefix bugs.
 *
 * Route patterns must match DynamicRoutes (packages/navigation + RouteConfig).
 * When LocationOverrideContext is set (router URL sync workaround), we derive
 * activeKey from pathname so the UI matches the browser URL.
 */

import { useLocation, useMatch } from "react-router-dom";

import { ROUTES } from "packages/navigation";
import type { PathPrefix } from "packages/utils/layout/dashboardLayoutConfig";
import { getWidthPercent } from "packages/utils/layout/dashboardLayoutConfig";

import { useLocationOverride } from "@/app/routes/locationOverrideContext";

/** Dashboard shell area; includes DocuSign return route outside /saved prefix. */
export type DashboardAreaKey = PathPrefix | "agreement_signing_complete";

function activeKeyFromPathname(pathname: string): DashboardAreaKey | null {
  if (/^\/agreements\/[^/]+\/complete\/?$/.test(pathname)) {
    return "agreement_signing_complete";
  }
  if (pathname.startsWith("/search")) return "search";
  if (pathname.startsWith("/messaging")) return "messaging";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/saved")) return "saved";
  if (pathname.startsWith("/profile")) return "profile";
  return null;
}

export type DashboardRouteResult = {
  /** Current dashboard area from router match; null if not a dashboard route. */
  activeKey: DashboardAreaKey | null;
  pathname: string;
  search: string;
  isSearch: boolean;
  isDashboard: boolean;
  isProfile: boolean;
  isSaved: boolean;
  isMessaging: boolean;
  isAgreementSigningComplete: boolean;
  isFullHeightRoute: boolean;
  widthPercent: number;
};

/**
 * Returns the current dashboard route and layout flags from React Router.
 * Use in DashboardLayout, DashboardContent, DashboardHeader for consistent behavior.
 */
export function useDashboardRoute(
  defaultWidthPercent = 85,
): DashboardRouteResult {
  const routerLocation = useLocation();
  const locationOverride = useLocationOverride();
  const location = locationOverride ?? routerLocation;
  const pathname = location.pathname;
  const search = location.search;

  // When override is set (browser URL diverged from router), derive activeKey from pathname.
  // Otherwise use useMatch so the router drives the result.
  const agreementSigningCompleteMatch = useMatch(
    ROUTES.AGREEMENT_SIGNING_COMPLETE,
  );
  const searchMatch = useMatch(ROUTES.SEARCH);
  const messagingMatch = useMatch(ROUTES.MESSAGING);
  const dashboardMatch = useMatch(ROUTES.DASHBOARD);
  const savedMatch = useMatch(ROUTES.SAVED);
  const profileMatch = useMatch(ROUTES.PROFILE);

  const activeKey: DashboardAreaKey | null = locationOverride
    ? activeKeyFromPathname(pathname)
    : agreementSigningCompleteMatch
      ? "agreement_signing_complete"
      : searchMatch
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
    isSaved: activeKey === "saved",
    isMessaging: activeKey === "messaging",
    isAgreementSigningComplete: activeKey === "agreement_signing_complete",
    isFullHeightRoute,
    widthPercent,
  };
}
