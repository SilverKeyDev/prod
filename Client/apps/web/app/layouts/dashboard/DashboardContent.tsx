import type { ReactNode } from "react";

import { PropertyDetailsScreen } from "packages/features/propertyDetails";
import { useIsMobile } from "packages/hooks/ui";
import { Box } from "packages/ui/components/primitives";

import PageErrorBoundary from "@/app/error/PageErrorBoundary";
import AgentPage from "@/pages/AgentPage";
import DashboardPage from "@/pages/DashboardPage";
import ProfilePage from "@/pages/ProfilePage";
import SavedHomes from "@/pages/SavedPage";
import SearchPage from "@/pages/SearchPage";

import { useDashboardRoute } from "./useDashboardRoute";

type DashboardContentProps = {
  setMobileHeaderActions: React.Dispatch<React.SetStateAction<ReactNode | null>>;
  searchPageRef: React.RefObject<{
    triggerSearch: () => Promise<void>;
  }>;
  maxWidth?: number;
};

const MOBILE_SIDE_PX = "px-4";

export function DashboardContent({
  setMobileHeaderActions,
  searchPageRef,
  maxWidth = 85,
}: DashboardContentProps) {
  const route = useDashboardRoute(maxWidth);
  const isMobile = useIsMobile();

  const { activeKey, isSearch, isMessaging, widthPercent } = route;
  const contentTopMargin = route.isDashboard || route.isProfile;
  const contentBottomMargin = route.isDashboard || route.isProfile || route.isSaved;

  const searchHeightClass =
    isSearch && isMobile
      ? "flex-1 min-h-0 overflow-hidden md:h-[calc(100dvh-0px)] mx-0"
      : isSearch
        ? "h-[calc(100dvh-80px)] md:h-[calc(100dvh-0px)] mx-0"
        : "";

  const wrapperClass = isSearch
    ? searchHeightClass
    : isMessaging
      ? "relative mx-0 flex max-h-full min-h-0 w-full flex-1 flex-col overflow-hidden"
      : `mx-auto ${MOBILE_SIDE_PX} md:px-0 ${contentTopMargin ? "pt-4 md:pt-8" : ""} ${contentBottomMargin ? "pb-4 sm:pb-6 md:pb-8" : ""}`;

  const fullWidth = isSearch || isMessaging;
  const style = fullWidth
    ? ({ "--max-width-desktop": "100" } as React.CSSProperties & {
        "--max-width-desktop": string;
      })
    : ({
        "--max-width-desktop": `${widthPercent}`,
      } as React.CSSProperties & { "--max-width-desktop": string });

  const content =
    activeKey === "search" ? (
      <PageErrorBoundary key="search" pageLabel="Search">
        <SearchPage setMobileHeaderActions={setMobileHeaderActions} searchRef={searchPageRef} />
      </PageErrorBoundary>
    ) : activeKey === "profile" ? (
      <ProfilePage setMobileHeaderActions={setMobileHeaderActions} />
    ) : activeKey === "saved" ? (
      <PageErrorBoundary key="saved" pageLabel="Saved">
        <SavedHomes setMobileHeaderActions={setMobileHeaderActions} />
      </PageErrorBoundary>
    ) : activeKey === "messaging" ? (
      <AgentPage setMobileHeaderActions={setMobileHeaderActions} />
    ) : activeKey === "dashboard" ? (
      <DashboardPage setMobileHeaderActions={setMobileHeaderActions} />
    ) : null;

  // When activeKey is null (e.g. brief match lag), show placeholder so main area is never blank.
  const displayContent = content ?? (
    <Box className="flex min-h-[200px] items-center justify-center text-sm text-text-secondary">
      Loading…
    </Box>
  );

  // Key by pathname so content remounts when navigating (e.g. from search to saved), avoiding stale UI.
  return (
    <Box
      key={route.pathname}
      className={`dashboard-content max-md:pb-mobile-nav w-full ${wrapperClass}`}
      style={style}
    >
      {displayContent}
    </Box>
  );
}
