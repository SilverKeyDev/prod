// React imports
import React, { type ReactNode, useEffect, useRef, useState } from "react";

import { useLocation } from "react-router-dom";

import { SearchRefreshProvider } from "packages/contexts";
// Hooks
import { useIsMobile } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";

// Sidebar
import MobileBottomNav from "@/app/layouts/mobile/MobileBottomNav";
import Sidebar from "@/app/layouts/sidebar/Sidebar.web";
import type { UserProfile } from "@/features/homeauth/types";

import { DashboardContent } from "./DashboardContent";
// Layout components
import { DashboardHeader } from "./DashboardHeader";
import { useDashboardRoute } from "./useDashboardRoute";

/** Height reserved for fixed MobileBottomNav on mobile (4rem + safe area). */
const MOBILE_BOTTOM_NAV_OFFSET = "calc(4rem + env(safe-area-inset-bottom))";

type HeaderConfig =
  | { type: "rheader"; title: string; subtitle?: string }
  | { type: "none"; title?: string; subtitle?: string };

type DashboardProps = {
  user?: UserProfile;
  onLogout: () => void;
  header?: HeaderConfig;
  mobileHeader?: React.ReactNode;
  maxWidth?: number;
};

export default function DashboardLayout({
  user,
  onLogout,
  header: _header,
  mobileHeader,
  maxWidth = 85,
}: DashboardProps) {
  const location = useLocation();
  const route = useDashboardRoute(maxWidth);
  const isMobile = useIsMobile();
  const { isFullHeightRoute, isDashboard } = route;
  const prevRef = useRef<{ pathname: string; activeKey: string | null }>({
    pathname: location.pathname,
    activeKey: route.activeKey,
  });

  useEffect(() => {
    const from = prevRef.current;
    const toPathname = location.pathname;
    const toActiveKey = route.activeKey;
    log.debug(LOG_CATEGORIES.ROUTING, "[NAV] DashboardLayout mounted or location changed", {
      from: from.pathname,
      to: toPathname,
      fromActiveKey: from.activeKey,
      toActiveKey: toActiveKey,
      isFullHeightRoute: route.isFullHeightRoute,
      isSearch: route.isSearch,
    });
    prevRef.current = { pathname: toPathname, activeKey: toActiveKey };
  }, [location.pathname, route.activeKey, route.isFullHeightRoute, route.isSearch]);

  // Mobile header slot (e.g. messaging header). Cleared when navigating to dashboard.
  const [mobileHeaderActions, setMobileHeaderActions] = useState<ReactNode | null>(null);
  React.useEffect(() => {
    if (isDashboard) setMobileHeaderActions(null);
  }, [isDashboard]);

  const searchPageRef = React.useRef<{
    triggerSearch: () => Promise<void>;
  } | null>(null);

  return (
    <SearchRefreshProvider>
      <div
        className={`flex min-w-0 ${
          isFullHeightRoute
            ? isMobile
              ? "h-[calc(100dvh-var(--mobile-bottom-nav-offset,5rem))] min-h-screen"
              : "h-dvh min-h-0"
            : "min-h-screen"
        } bg-off-white`}
        style={
          isMobile
            ? ({
                "--mobile-bottom-nav-offset": MOBILE_BOTTOM_NAV_OFFSET,
                "--mobile-bottom-reserved": "calc(4rem + env(safe-area-inset-bottom, 0))",
              } as React.CSSProperties & {
                "--mobile-bottom-nav-offset": string;
                "--mobile-bottom-reserved": string;
              })
            : undefined
        }
      >
        {/* Sidebar wrapper: reserve width on desktop so main does not extend under it; z-sidebar keeps nav above full-height content (e.g. search) */}
        <div className="relative z-sidebar hidden w-52 shrink-0 md:block">
          <Sidebar
            user={user}
            onLogout={onLogout}
            expanded={true}
            isMobile={false}
            onLinkClick={undefined}
          />
        </div>

        <div className="block md:hidden">
          <MobileBottomNav user={user} onLogout={onLogout} />
        </div>

        <main
          id="main-content"
          tabIndex={-1}
          className={`relative z-0 ml-0 min-w-0 flex-1 transition-all duration-200 md:ml-0 ${
            isFullHeightRoute ? "flex h-full min-h-0 flex-col overflow-hidden" : ""
          }`}
        >
          <DashboardHeader
            isMobile={isMobile}
            mobileHeaderActions={mobileHeaderActions}
            mobileHeader={mobileHeader}
          />

          <DashboardContent
            setMobileHeaderActions={setMobileHeaderActions}
            searchPageRef={searchPageRef}
            maxWidth={maxWidth}
          />
        </main>
      </div>
    </SearchRefreshProvider>
  );
}
