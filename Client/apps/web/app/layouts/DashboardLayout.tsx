// React imports
import React, { useState, useMemo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

// Layout components
import { DashboardHeader } from "./DashboardHeader";
import { DashboardContent } from "./DashboardContent";
import MobileBottomBar from "./MobileBottomBar";

// Hooks
import { useIsMobile } from "../../../../packages/hooks/ui";

// Sidebar
import MobileSidebar from "../../components/widgets/sidebar/MobileSidebar.tsx";
import Sidebar from "../../components/widgets/sidebar/Sidebar.tsx";
import type { UserProfile } from "../../../../packages/schemas/auth/user";

/** Height reserved for fixed MobileSidebar on mobile (4rem + safe area). */
const MOBILE_SIDEBAR_OFFSET = "calc(4rem + env(safe-area-inset-bottom))";

type HeaderConfig =
  | { type: "rheader"; title: string; subtitle?: string }
  | { type: "none"; title?: string; subtitle?: string };

type DashboardProps = {
  user?: UserProfile;
  onLogout: () => void;
  header?: HeaderConfig;
  mobileHeader?: React.ReactNode; // Allow passing a custom mobile header
  maxWidth?: number; // Percentage of viewport width (e.g., 85 => 85vw)
  /** When true, adds top margin to page content (mobile and desktop). Defaults to true for dashboard and profile. */
  contentTopMargin?: boolean;
  /** When true, adds bottom margin to page content (mobile and desktop). Defaults to true for dashboard, profile, and saved. */
  contentBottomMargin?: boolean;
};

// Page-specific width configuration
type PageWidthConfig = Record<string, number>;
const PAGE_WIDTH_CONFIG: PageWidthConfig = {
  "/search": 100,
  "/dashboard": 90,
  "/profile": 90,
  "/saved": 90,
  "/messaging": 100,
};

// Mobile-specific width configuration
const MOBILE_WIDTH_CONFIG: PageWidthConfig = {
  "/search": 100,
  "/dashboard": 90,
  "/profile": 90,
  "/saved": 90,
  "/messaging": 100,
};

export default function DashboardLayout({
  user,
  onLogout,
  header: _header,
  mobileHeader,
  maxWidth = 85, // Default to 85% if not specified
  contentTopMargin,
  contentBottomMargin,
}: DashboardProps) {
  const location = useLocation();
  const path = location.pathname;
  const isMobile = useIsMobile();

  // Route helpers
  const isSearch = path.startsWith("/search");
  const isDashboard = path.startsWith("/dashboard");
  const isPersonalization = path.startsWith("/profile");
  const isSaved = path.startsWith("/saved");
  const isMessagingRoute = path.startsWith("/messaging");

  // Mobile header actions
  const [mobileHeaderActions, setMobileHeaderActions] =
    useState<ReactNode | null>(null);
  const [mobileBottomActions, setMobileBottomActions] =
    useState<ReactNode | null>(null);
  const [mobileBottomBarHeight, setMobileBottomBarHeight] = useState(0);

  // Clear mobile header actions when navigating to pages that don't use them
  React.useEffect(() => {
    // Messaging sets its own mobile header while mounted; don't clear it here.
    if (isDashboard) {
      setMobileHeaderActions(null);
    }
  }, [isDashboard]);

  // Clear mobile bottom actions when leaving messaging routes (messaging manages these while mounted).
  React.useEffect(() => {
    if (!isMessagingRoute) {
      setMobileBottomActions(null);
      setMobileBottomBarHeight(0);
    }
  }, [isMessagingRoute]);

  // Search functionality
  const searchPageRef = React.useRef<{
    triggerSearch: () => Promise<void>;
  } | null>(null);

  // When true, adds top margin to content. Defaults to true for dashboard and profile.
  const effectiveContentTopMargin =
    contentTopMargin ?? (isDashboard || isPersonalization);

  // When true, adds bottom margin to content. Defaults to true for dashboard, profile, and saved.
  const effectiveContentBottomMargin =
    contentBottomMargin ?? (isDashboard || isPersonalization || isSaved);

  // Page width percentage (0-100) - CSS calc() accounts for sidebar on desktop
  const computedMaxWidthVW = useMemo(() => {
    const config = isMobile ? MOBILE_WIDTH_CONFIG : PAGE_WIDTH_CONFIG;
    const configPath = Object.keys(config).find((p) => path.startsWith(p));
    const width = configPath ? config[configPath] : (maxWidth ?? 85);
    return Math.max(0, Math.min(100, width)); // Clamp to [0,100]
  }, [path, maxWidth, isMobile]);

  // Desktop header content (rheader type uses default layout; no custom header component)
  const headerContent = useMemo(() => null, []);

  return (
    <div
      className={`flex min-w-0 ${
        isMessagingRoute
          ? isMobile
            ? "h-[calc(100dvh-4rem)] min-h-screen" // Account for MobileSidebar height (4rem = 64px) on mobile
            : "h-[100dvh] min-h-screen"
          : "min-h-screen"
      } bg-off-white`}
      style={
        isMobile && !isMessagingRoute
          ? ({ "--mobile-sidebar-offset": MOBILE_SIDEBAR_OFFSET } as React.CSSProperties & {
              "--mobile-sidebar-offset": string;
            })
          : undefined
      }
    >
      {/* Desktop Sidebar - Hidden only when mobile bottom nav appears (< 768px) */}
      <div className="hidden md:block">
        <Sidebar
          user={user}
          onLogout={onLogout}
          expanded={true}
          isMobile={false}
          onLinkClick={undefined}
        />
      </div>

      {/* Mobile Sidebar - Only on mobile (< 768px) */}
      <div className="block md:hidden">
        <MobileSidebar user={user} onLogout={onLogout} />
      </div>

      <MobileBottomBar onHeightChange={setMobileBottomBarHeight}>
        {mobileBottomActions}
      </MobileBottomBar>

      <main
        className={`ml-0 flex-1 min-w-0 transition-all duration-200 md:ml-52 ${isMessagingRoute ? "min-h-0 h-full flex flex-col overflow-hidden" : ""}`}
      >
        <DashboardHeader
          isMobile={isMobile}
          isSearch={isSearch}
          isSaved={isSaved}
          isMessagingRoute={isMessagingRoute}
          isDashboard={isDashboard}
          mobileHeaderActions={mobileHeaderActions}
          mobileHeader={mobileHeader}
          headerContent={headerContent}
          computedMaxWidthVW={computedMaxWidthVW}
        />

        <DashboardContent
          isSearch={isSearch}
          isPersonalization={isPersonalization}
          isSaved={isSaved}
          isMessagingRoute={isMessagingRoute}
          isDashboard={isDashboard}
          computedMaxWidthVW={computedMaxWidthVW}
          contentTopMargin={effectiveContentTopMargin}
          contentBottomMargin={effectiveContentBottomMargin}
          setMobileHeaderActions={setMobileHeaderActions}
          setMobileBottomActions={setMobileBottomActions}
          mobileBottomBarHeight={mobileBottomBarHeight}
          searchPageRef={searchPageRef}
        />

        {/* Spacer so content isn't hidden behind fixed MobileBottomBar */}
        {mobileBottomBarHeight > 0 ? (
          <div
            className="md:hidden"
            style={{ height: `${mobileBottomBarHeight}px` }}
          />
        ) : null}

        {/* Spacer so content isn't hidden behind fixed MobileSidebar (non-messaging only; messaging uses root height) */}
        {isMobile && !isMessagingRoute ? (
          <div
            className="md:hidden flex-shrink-0"
            style={{
              height: "var(--mobile-sidebar-offset, 5rem)",
            }}
          />
        ) : null}
      </main>
    </div>
  );
}
