// React imports
import React, { type ReactNode, useEffect, useRef, useState } from "react";

import { useLocation } from "react-router-dom";

import { SearchRefreshProvider } from "packages/contexts";
// Hooks
import { useIsMobile } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Box } from "packages/ui/components/primitives";
import { screenUp } from "packages/ui/types/screens";
import {
  DASHBOARD_MODAL_INSET_LEFT_VAR,
  DASHBOARD_SIDEBAR_WIDTH_CSS,
} from "packages/utils/layout/dashboardModalInset";

// Sidebar
import MobileBottomNav from "@/app/layouts/mobile/MobileBottomNav";
import Sidebar from "@/app/layouts/sidebar/Sidebar.web";
import type { UserProfile } from "@/features/homeauth/types";

import { DashboardContent } from "./DashboardContent";
// Layout components
import { DashboardHeader } from "./DashboardHeader";
import { useDashboardRoute } from "./useDashboardRoute";

/** Matches MobileBottomNav: min-h-16 + vertical padding max(safe-area, 4px) each. */
const MOBILE_BOTTOM_RESERVED =
  "calc(4rem + max(env(safe-area-inset-bottom, 0), 4px) + max(env(safe-area-inset-bottom, 0), 4px))";
const MOBILE_BOTTOM_NAV_OFFSET = MOBILE_BOTTOM_RESERVED;

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

  useEffect(() => {
    const root = document.documentElement;
    if (route.isAgreementSigningComplete) {
      root.style.setProperty(DASHBOARD_MODAL_INSET_LEFT_VAR, "0px");
      return () => {
        root.style.removeProperty(DASHBOARD_MODAL_INSET_LEFT_VAR);
      };
    }
    const mq = window.matchMedia(screenUp("md"));
    const apply = () => {
      root.style.setProperty(
        DASHBOARD_MODAL_INSET_LEFT_VAR,
        mq.matches ? DASHBOARD_SIDEBAR_WIDTH_CSS : "0px"
      );
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      root.style.removeProperty(DASHBOARD_MODAL_INSET_LEFT_VAR);
    };
  }, [route.isAgreementSigningComplete]);

  const searchPageRef = React.useRef<{
    triggerSearch: () => Promise<void>;
  } | null>(null);

  /** DocuSign redirects the *signing iframe* here after finishing — must not mount full dashboard chrome or the entire app appears nested inside the modal iframe. */
  if (route.isAgreementSigningComplete) {
    return (
      <SearchRefreshProvider>
        <Box className="flex min-h-screen min-w-0 bg-background-base">
          <main
            id="main-content"
            tabIndex={-1}
            className="relative z-0 ml-0 flex min-h-screen min-w-0 flex-1 flex-col"
          >
            <DashboardContent
              setMobileHeaderActions={setMobileHeaderActions}
              searchPageRef={searchPageRef}
              maxWidth={maxWidth}
            />
          </main>
        </Box>
      </SearchRefreshProvider>
    );
  }

  return (
    <SearchRefreshProvider>
      <Box
        className={`flex min-w-0 ${
          isFullHeightRoute
            ? isMobile
              ? "h-[calc(100dvh-var(--mobile-bottom-nav-offset,5rem))] min-h-screen"
              : "h-dvh min-h-0"
            : "min-h-screen"
        } bg-background-base`}
        style={
          isMobile
            ? ({
                "--mobile-bottom-nav-offset": MOBILE_BOTTOM_NAV_OFFSET,
                "--mobile-bottom-reserved": MOBILE_BOTTOM_RESERVED,
              } as React.CSSProperties & {
                "--mobile-bottom-nav-offset": string;
                "--mobile-bottom-reserved": string;
              })
            : undefined
        }
      >
        {/* Sidebar wrapper: reserve width on desktop so main does not extend under it; z-sidebar keeps nav above full-height content (e.g. search) */}
        <Box className="relative z-sidebar hidden w-52 shrink-0 md:block">
          <Sidebar
            user={user}
            onLogout={onLogout}
            expanded={true}
            isMobile={false}
            onLinkClick={undefined}
          />
        </Box>

        <Box className="block md:hidden">
          <MobileBottomNav user={user} onLogout={onLogout} />
        </Box>

        <main
          id="main-content"
          tabIndex={-1}
          className={`relative z-0 ml-0 min-w-0 flex-1 transition-all duration-200 max-md:pb-mobile-nav md:ml-0 ${
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
      </Box>
    </SearchRefreshProvider>
  );
}
