import { Suspense, useEffect, useRef } from "react";

import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";

import { authUtils } from "packages/config/auth";
import { useDataInitialization } from "packages/hooks/data/useDataInitialization";
import { useDataPolling } from "packages/hooks/data/useDataPolling";
import { useGoogleMapsStoreIntegration } from "packages/hooks/store/map/useGoogleMapsStoreIntegration";
import { log, LOG_CATEGORIES } from "packages/logger";
import { getDocumentTitle, ROUTES } from "packages/navigation";

import RouteErrorBoundary from "@/app/error/RouteErrorBoundary";
import type { UserProfile } from "@/features/homeauth/types";
import NotFoundPage from "@/pages/NotFoundPage";

// Modular route components
import { DynamicRoutes } from "./routes/DynamicRoutes";
import { PublicRoutes } from "./routes/PublicRoutes";

const MAIN_CONTENT_ID = "main-content";

/** Full-height routes manage their own scroll/focus; skip global focus and scroll-to-top there. */
function isFullHeightRoute(pathname: string): boolean {
  return pathname.startsWith("/search") || pathname.startsWith("/messaging");
}

/** Skip to main content link - first focusable element for keyboard/screen reader users (WCAG 2.4.1). */
function SkipToMainLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only z-[9999] rounded bg-white p-4 font-medium text-brown shadow-lg focus:fixed focus:left-4 focus:top-4 focus:block focus:h-auto focus:w-auto focus:overflow-visible focus:outline-none focus:ring-2 focus:ring-olive"
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
  const location = useLocation();
  const isInitialMount = useRef(true);
  useGoogleMapsStoreIntegration();
  // Initialize data polling (including messages) for notifications
  useDataPolling();
  // Initialize data prefetch and background polling on login
  useDataInitialization();
  useEffect(() => {
    document.title = getDocumentTitle(location.pathname);
  }, [location.pathname]);
  // Focus main content on client-side navigation (skip initial load). Defer until after paint so
  // #main-content exists; skip on full-height routes (search, messaging) so we don't steal focus from map/reels.
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isFullHeightRoute(location.pathname)) return;
    const id = requestAnimationFrame(() => {
      document.getElementById(MAIN_CONTENT_ID)?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [location.pathname, location.key]);
  // Scroll to top on route change. Defer until after paint; skip on full-height routes.
  useEffect(() => {
    if (isFullHeightRoute(location.pathname)) return;
    const id = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(id);
  }, [location.pathname, location.key]);
  // Use location.key so every navigation remounts outlet content (React Router assigns a new key per location).
  const outletKey = location.key ?? location.pathname;
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

export function AppRoutes({ user, handleLogout }: AppRoutesProps) {
  const location = useLocation();
  useEffect(() => {
    log.debug(LOG_CATEGORIES.ROUTING, "[NAV] AppRoutes location changed (effect)", {
      pathname: location.pathname,
      search: location.search || undefined,
    });
    log.debug(LOG_CATEGORIES.ROUTING, "[ROUTING] AppRoutes location changed", {
      pathname: location.pathname,
      search: location.search || undefined,
    });
  }, [location.pathname, location.search]);
  // Pass location explicitly so Routes re-matches when pathname changes. Fixes stale
  // content when navigating from /search (or other full-height routes) via sidebar.
  return (
    <>
      <Suspense fallback={<div className="p-6 text-sm text-gray-600">Loading…</div>}>
        <Routes location={location}>
          {/* Layout route that wraps all routes to ensure Router context is available */}
          {/* This prevents React 18 concurrent rendering issues in production builds */}
          <Route element={<AppLayout />} errorElement={<RouteErrorBoundary />}>
            {/* Public Routes */}
            {PublicRoutes()}

            {/* Protected Routes */}
            {DynamicRoutes({ user, handleLogout })}

            {/* Legacy redirect */}
            <Route path={ROUTES.APP} element={<Navigate to={ROUTES.SEARCH} replace />} />

            {/* 404 catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
