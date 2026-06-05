import { Suspense, useEffect, useRef, useState } from "react";

import type { Location } from "react-router-dom";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";

import { authUtils } from "packages/config/auth/auth";
// Deep import (not via "packages/features/agent" barrel) so the eagerly-loaded
// app shell does not pay the cost of evaluating the entire agent feature
// (AgentDashboard, AgentMessaging, ClientMessaging, modals, …) on first load.
import { useResumePendingAgentPublicConnect } from "packages/features/agent/hooks/data/connections/useResumePendingAgentPublicConnect";
import { useDataInitialization } from "packages/hooks/data/polling/useDataInitialization";
import { useDataPolling } from "packages/hooks/data/polling/useDataPolling";
import { useGlobalOrganizationJsonLd, useShellSeo } from "packages/hooks/seo/useShellSeo.web";
import { log } from "packages/logger";
import { ROUTES } from "packages/navigation";
import { Box } from "packages/ui/components/structure/primitives";
import { getActiveDashboardKey } from "packages/utils/core/layout/dashboardLayoutConfig";
import { getDocument, getWindow } from "packages/utils/core/platform";

import RouteErrorBoundary from "@/app/error/RouteErrorBoundary";
import { useIdleAuthenticatedRouteChunkPrefetch } from "@/app/navigation/useIdleAuthenticatedRouteChunkPrefetch.web";
import type { UserProfile } from "@/features/homeauth/types";
import NotFoundPage from "@/pages/misc/NotFoundPage";

// Modular route components
import { DynamicRoutes } from "./routes/DynamicRoutes";
import { LocationOverrideContext, useLocationOverride } from "./routes/locationOverrideContext";
import { PublicRoutes } from "./routes/PublicRoutes";

const MAIN_CONTENT_ID = "main-content";

/** Full-height routes manage their own scroll/focus; skip global focus and scroll-to-top there. */
function isFullHeightRoute(pathname: string): boolean {
  const key = getActiveDashboardKey(pathname);
  return key === "search" || key === "messaging";
}

/**
 * Outlet remount key: keep one subtree instance for all nested admin URLs so the index
 * redirect (/admin → /admin/logging) does not remount AdminPage (which resets step-up
 * auth and can loop with profile loading).
 */
function appOutletRemountKey(pathname: string, search: string): string {
  const suffix = search ?? "";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return `/admin${suffix}`;
  }
  return `${pathname}${suffix}`;
}

/** Skip to main content link - first focusable element for keyboard/screen reader users (WCAG 2.4.1). */
function SkipToMainLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only z-skip rounded bg-background-surface p-4 font-medium text-text-primary shadow-lg focus:fixed focus:left-4 focus:top-4 focus:block focus:h-auto focus:w-auto focus:overflow-visible focus:outline-none focus:ring-2 focus:ring-primary"
    >
      Skip to main content
    </a>
  );
}

/**
 * Navigation and rerender (sidebar nav, e.g. Search <-> Dashboard):
 * - Routes must receive location explicitly so it re-matches on navigation; do not remove location={location}.
 * - Outlet must be keyed by pathname (or equivalent) so route content remounts when path changes.
 * - Protected route elements (RouteConfig) are keyed by path so React does not reuse the same layout instance.
 * - "Current route" for layout and features must come from the router (useLocation/useMatch in layout,
 *   useNavigation().getCurrentRoute() in features); the navigation adapter must not cache location across navigations.
 */

type AppRoutesProps = {
  user: UserProfile | null;
  handleLogout: () => void;
};

// Component that handles store integrations - must be inside Router context
// This component renders the Outlet (child routes) and initializes store integrations
// IMPORTANT: This component is imported synchronously (not lazy-loaded) to ensure
// Router context is always available when hooks execute, preventing timing issues
// in production builds with code splitting.
function AppLayout() {
  const routerLocation = useLocation();
  const locationOverride = useLocationOverride();
  const location = locationOverride ?? routerLocation;
  const isInitialMount = useRef(true);
  useGlobalOrganizationJsonLd();
  useShellSeo(location.pathname, location.search ?? "");
  // Google Maps initialization moved to SearchPage for better performance
  // Only load Maps API when user actually needs it (search/map UI)
  // Initialize data polling (including messages) for notifications
  useDataPolling();
  // Initialize data prefetch and background polling on login
  useDataInitialization();
  useIdleAuthenticatedRouteChunkPrefetch(location.pathname);
  useResumePendingAgentPublicConnect();
  // Focus main content on client-side navigation (skip initial load). Defer until after paint so
  // #main-content exists; skip on full-height routes (search, messaging) so we don't steal focus from map/reels.
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isFullHeightRoute(location.pathname)) return;
    const id = requestAnimationFrame(() => {
      getDocument()?.getElementById(MAIN_CONTENT_ID)?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [location.pathname, location.key]);
  // Scroll to top on route change. Defer until after paint; skip on full-height routes.
  useEffect(() => {
    if (isFullHeightRoute(location.pathname)) return;
    const id = requestAnimationFrame(() => {
      getWindow()?.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(id);
  }, [location.pathname, location.key]);
  // Key by pathname + search so outlet remounts on real URL changes, not on router-internal
  // location.key churn (reduces admin/step-up remount loops in dev; scroll/focus still use location.key).
  const outletKey = appOutletRemountKey(location.pathname, location.search ?? "");
  const prevOutletKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevOutletKeyRef.current === null) {
      prevOutletKeyRef.current = outletKey;
      return;
    }
    if (prevOutletKeyRef.current !== outletKey) {
      log.info("ROUTING", "[APP_LAYOUT] outlet remount key changed (full subtree remount)", {
        from: prevOutletKeyRef.current,
        to: outletKey,
        pathname: location.pathname,
        search: location.search ?? "",
        routerKey: location.key,
      });
      prevOutletKeyRef.current = outletKey;
    }
  }, [outletKey, location.pathname, location.search, location.key]);
  const isPublic = authUtils.isPublicRoute(location.pathname);
  const outlet = <Outlet key={outletKey} />;
  return (
    <>
      <SkipToMainLink />
      {isPublic ? (
        <main id={MAIN_CONTENT_ID} tabIndex={-1}>
          {outlet}
        </main>
      ) : (
        outlet
      )}
    </>
  );
}

/**
 * Workaround for React Router v6 + React 18 bug where useLocation() can lag behind
 * the actual browser URL (remix-run/react-router#11473). When the URL changes (e.g.
 * after clicking a sidebar Link from /search) but the router context hasn't updated,
 * we pass the browser's location to Routes so the UI matches the address bar.
 */
function useBrowserLocationOverride(routerLocation: Location) {
  const [override, setOverride] = useState<Pick<Location, "pathname" | "search" | "key"> | null>(
    null
  );

  // When on a full-height route, poll; if browser URL !== router, set override so Routes uses browser URL (set once per browser location).
  useEffect(() => {
    if (!isFullHeightRoute(routerLocation.pathname)) return;
    const interval = setInterval(() => {
      const win = getWindow();
      if (!win) return;
      const winPath = win.location.pathname;
      const winSearch = win.location.search;
      const routerPath = routerLocation.pathname;
      const routerSearch = routerLocation.search ?? "";
      if (winPath !== routerPath || winSearch !== routerSearch) {
        setOverride((prev) => {
          if (prev && prev.pathname === winPath && prev.search === winSearch) return prev;
          log.debug("ROUTING", "[NAV] Router URL sync: using browser location", {
            routerPath,
            browserPath: winPath,
          });
          return {
            pathname: winPath,
            search: winSearch,
            key: `sync-${winPath}${winSearch}`,
          };
        });
      }
    }, 100);
    return () => clearInterval(interval);
  }, [routerLocation.pathname, routerLocation.search]);

  // Clear override when router context catches up to the browser.
  useEffect(() => {
    const win = getWindow();
    if (
      override &&
      win &&
      routerLocation.pathname === win.location.pathname &&
      (routerLocation.search ?? "") === win.location.search
    ) {
      setOverride(null);
    }
  }, [override, routerLocation.pathname, routerLocation.search]);

  return override;
}

export function AppRoutes({ user, handleLogout }: AppRoutesProps) {
  const location = useLocation();
  const locationOverride = useBrowserLocationOverride(location);
  const effectiveLocation: Location = locationOverride
    ? {
        ...location,
        pathname: locationOverride.pathname,
        search: locationOverride.search,
        key: locationOverride.key,
      }
    : location;

  useEffect(() => {
    log.debug("ROUTING", "[NAV] AppRoutes location changed", {
      pathname: effectiveLocation.pathname,
      search: effectiveLocation.search || undefined,
      isFullHeightRoute: isFullHeightRoute(effectiveLocation.pathname),
    });
  }, [effectiveLocation.pathname, effectiveLocation.search]);
  // Pass location explicitly so Routes re-matches when pathname changes. Use
  // effectiveLocation (browser override when router is stale) to fix search->other nav.
  // Provide effectiveLocation in context so useDashboardRoute/AppLayout see the real URL.
  return (
    <>
      <Suspense fallback={<Box className="p-6 text-sm text-text-secondary">Loading…</Box>}>
        <LocationOverrideContext.Provider value={locationOverride ? effectiveLocation : null}>
          <Routes location={effectiveLocation}>
            {/* Layout route that wraps all routes to ensure Router context is available */}
            {/* This prevents React 18 concurrent rendering issues in production builds */}
            <Route element={<AppLayout />} errorElement={<RouteErrorBoundary />}>
              {/* Public Routes */}
              {PublicRoutes()}

              {/* Protected Routes */}
              {DynamicRoutes({ user, handleLogout })}

              {/* Canonical shortcut: /app → buyer search */}
              <Route path={ROUTES.APP} element={<Navigate to={ROUTES.SEARCH} replace />} />

              {/* 404 catch-all */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </LocationOverrideContext.Provider>
      </Suspense>
    </>
  );
}
