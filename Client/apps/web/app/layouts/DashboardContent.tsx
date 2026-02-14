import type { ReactNode } from "react";

import BuyerChecklists from "../../pages/BuyerChecklistsPage";
import DashboardPage from "../../pages/DashboardPage";
import PersonalizationPage from "../../pages/SettingsPage";
import SavedHomes from "../../pages/SavedPage";
import SearchPage from "../../pages/SearchPage";
import AgentPage from "../../pages/AgentPage";

type ClosePageHeaderData = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
};

type ChecklistTab = "escrow" | "inspections" | "financing" | "closing";

type DashboardContentProps = {
  isSearch: boolean;
  isBuyerChecklists: boolean;
  isPersonalization: boolean;
  isSaved: boolean;
  isMessagingRoute: boolean;
  isDashboard: boolean;
  computedMaxWidthVW: number;
  /** When true, adds top margin to page content (mobile and desktop). */
  contentTopMargin?: boolean;
  /** When true, adds bottom margin to page content (mobile and desktop). */
  contentBottomMargin?: boolean;
  setMobileHeaderActions: React.Dispatch<
    React.SetStateAction<ReactNode | null>
  >;
  setMobileBottomActions: React.Dispatch<
    React.SetStateAction<ReactNode | null>
  >;
  /** Height of the mobile bottom bar (input bar) in px, used to offset messages so they don't overlap. */
  mobileBottomBarHeight?: number;
  searchPageRef: React.RefObject<{
    triggerSearch: () => Promise<void>;
  }>;
  setClosePageHeaderData: React.Dispatch<
    React.SetStateAction<ClosePageHeaderData | null>
  >;
  buyerChecklistsActiveTab: ChecklistTab;
  onTabChange: React.Dispatch<React.SetStateAction<ChecklistTab>>;
};

const MOBILE_SIDE_PX = "px-4";

export function DashboardContent({
  isSearch,
  isBuyerChecklists,
  isPersonalization,
  isSaved,
  isMessagingRoute,
  isDashboard,
  computedMaxWidthVW,
  contentTopMargin = false,
  contentBottomMargin = false,
  setMobileHeaderActions,
  setMobileBottomActions,
  mobileBottomBarHeight,
  searchPageRef,
  setClosePageHeaderData,
  buyerChecklistsActiveTab,
  onTabChange,
}: DashboardContentProps) {
  return (
    <div
      className={`dashboard-content w-full ${
        isSearch
          ? `h-[calc(100vh-80px)] md:h-[calc(100vh-0px)] mx-0`
          : isBuyerChecklists
            ? `mx-auto ${MOBILE_SIDE_PX} md:px-0 ${contentTopMargin ? "pt-2 md:pt-4" : ""} ${contentBottomMargin ? "pb-[var(--mobile-sidebar-offset,5rem)] md:pb-4" : "pb-[var(--mobile-sidebar-offset,5rem)] md:pb-0"}`
            : isMessagingRoute
              ? `relative flex-1 min-h-0 max-h-full w-full mx-0 overflow-hidden`
              : `mx-auto ${MOBILE_SIDE_PX} md:px-0 ${contentTopMargin ? "pt-4 md:pt-8" : ""} ${contentBottomMargin ? "pb-4 sm:pb-6 md:pb-8" : ""}`
      }`}
      style={
        isSearch
          ? ({
              "--max-width-desktop": "100",
            } as React.CSSProperties & { "--max-width-desktop": string })
          : isMessagingRoute
            ? ({
                "--max-width-desktop": "100",
              } as React.CSSProperties & { "--max-width-desktop": string })
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
        <PersonalizationPage setMobileHeaderActions={setMobileHeaderActions} />
      )}
      {isBuyerChecklists && (
        <BuyerChecklists
          setClosePageHeaderData={setClosePageHeaderData}
          activeTab={buyerChecklistsActiveTab}
          onTabChange={onTabChange}
        />
      )}
      {isSaved && (
        <SavedHomes setMobileHeaderActions={setMobileHeaderActions} />
      )}
      {isMessagingRoute && (
        <AgentPage
          setMobileHeaderActions={setMobileHeaderActions}
          setMobileBottomActions={setMobileBottomActions}
          mobileBottomBarHeight={mobileBottomBarHeight}
        />
      )}
      {isDashboard && (
        <DashboardPage setMobileHeaderActions={setMobileHeaderActions} />
      )}
    </div>
  );
}
