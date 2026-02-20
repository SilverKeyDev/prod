import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { useIsMobile } from "packages/hooks/ui";
import {
  getWidthPercent,
  pathMatches,
} from "packages/utils/domain/layout/dashboardLayoutConfig";

import AgentPage from "@/pages/AgentPage";
import DashboardPage from "@/pages/DashboardPage";
import ProfilePage from "@/pages/ProfilePage";
import SavedHomes from "@/pages/SavedPage";
import SearchPage from "@/pages/SearchPage";

type DashboardContentProps = {
  setMobileHeaderActions: React.Dispatch<
    React.SetStateAction<ReactNode | null>
  >;
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
  const location = useLocation();
  const path = location.pathname;
  const { isSearch, isProfile, isSaved, isMessaging, isDashboard } =
    pathMatches(path);
  const isPersonalization = isProfile;
  const isMessagingRoute = isMessaging;
  const computedMaxWidthVW = getWidthPercent(path, maxWidth);
  const contentTopMargin = isDashboard || isPersonalization;
  const contentBottomMargin = isDashboard || isPersonalization || isSaved;
  const isMobile = useIsMobile();

  const searchHeightClass = isSearch
    ? isMobile
      ? "flex-1 min-h-0 overflow-hidden md:h-[calc(100dvh-0px)] mx-0"
      : "h-[calc(100dvh-80px)] md:h-[calc(100dvh-0px)] mx-0"
    : "";

  return (
    <div
      className={`dashboard-content w-full max-md:pb-mobile-nav ${
        isSearch
          ? searchHeightClass
          : isMessagingRoute
            ? "relative flex flex-col flex-1 min-h-0 max-h-full w-full mx-0 overflow-hidden"
            : `mx-auto ${MOBILE_SIDE_PX} md:px-0 ${contentTopMargin ? "pt-4 md:pt-8" : ""} ${contentBottomMargin ? "pb-4 sm:pb-6 md:pb-8" : ""}`
      }`}
      style={
        isSearch || isMessagingRoute
          ? ({ "--max-width-desktop": "100" } as React.CSSProperties & {
              "--max-width-desktop": string;
            })
          : ({
              "--max-width-desktop": `${computedMaxWidthVW}`,
            } as React.CSSProperties & { "--max-width-desktop": string })
      }
    >
      {isSearch && (
        <SearchPage
          setMobileHeaderActions={setMobileHeaderActions}
          searchRef={searchPageRef}
        />
      )}
      {isPersonalization && (
        <ProfilePage setMobileHeaderActions={setMobileHeaderActions} />
      )}
      {isSaved && (
        <SavedHomes setMobileHeaderActions={setMobileHeaderActions} />
      )}
      {isMessagingRoute && (
        <AgentPage setMobileHeaderActions={setMobileHeaderActions} />
      )}
      {isDashboard && (
        <DashboardPage setMobileHeaderActions={setMobileHeaderActions} />
      )}
    </div>
  );
}
