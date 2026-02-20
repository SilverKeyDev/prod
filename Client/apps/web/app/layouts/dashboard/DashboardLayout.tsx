// React imports
import React, { type ReactNode, useState } from "react";

import { useLocation } from "react-router-dom";

import { SearchRefreshProvider } from "packages/contexts";
// Hooks
import { useIsMobile } from "packages/hooks/ui";
import type { UserProfile } from "packages/schemas/app/auth/user";
import { pathMatches } from "packages/utils/domain/layout/dashboardLayoutConfig";

// Sidebar
import MobileBottomNav from "@/app/layouts/mobile/MobileBottomNav";
import Sidebar from "@/app/layouts/sidebar/Sidebar.web";

import { DashboardContent } from "./DashboardContent";
// Layout components
import { DashboardHeader } from "./DashboardHeader";

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
  const path = location.pathname;
  const isMobile = useIsMobile();
  const { isFullHeightRoute, isDashboard } = pathMatches(path);

  // Mobile header slot (e.g. messaging header). Cleared when navigating to dashboard.
  const [mobileHeaderActions, setMobileHeaderActions] =
    useState<ReactNode | null>(null);
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
                "--mobile-bottom-reserved":
                  "calc(4rem + env(safe-area-inset-bottom, 0))",
              } as React.CSSProperties & {
                "--mobile-bottom-nav-offset": string;
                "--mobile-bottom-reserved": string;
              })
            : undefined
        }
      >
        <div className="hidden md:block">
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
          className={`ml-0 flex-1 min-w-0 transition-all duration-200 md:ml-52 ${
            isFullHeightRoute
              ? "min-h-0 h-full flex flex-col overflow-hidden"
              : ""
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
