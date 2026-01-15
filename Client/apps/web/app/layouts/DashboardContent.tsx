import type { ReactNode } from "react";

import BuyerChecklists from "../../pages/BuyerChecklistsPage";
import DashboardPage from "../../pages/DashboardPage";
import PersonalizationPage from "../../pages/SettingsPage";
import SavedHomes from "../../pages/SavedPage";
import SearchPage from "../../pages/SearchPage";
import AgentPage from "../../pages/AgentPage";
import CalendarPage from "../../pages/CalendarPage";

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
  isAgent: boolean;
  isCalendar: boolean;
  isDashboard: boolean;
  computedMaxWidthVW: number;
  setMobileHeaderActions: React.Dispatch<
    React.SetStateAction<ReactNode | null>
  >;
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
  isAgent,
  isCalendar,
  isDashboard,
  computedMaxWidthVW,
  setMobileHeaderActions,
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
            ? `mx-auto ${MOBILE_SIDE_PX} md:px-0`
            : isAgent
              ? `relative h-full w-full mx-0 overflow-hidden`
              : isCalendar
                ? `mx-auto p-4 sm:p-6 md:p-8 md:pt-8 ${MOBILE_SIDE_PX} md:px-0`
                : `mx-auto p-4 sm:p-6 md:p-8 md:pt-8 ${MOBILE_SIDE_PX} md:px-0`
      }`}
      style={
        isSearch
          ? ({
              "--max-width-desktop": "100",
            } as React.CSSProperties & { "--max-width-desktop": string })
          : isAgent
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
      {isAgent && <AgentPage setMobileHeaderActions={setMobileHeaderActions} />}
      {isCalendar && (
        <CalendarPage setMobileHeaderActions={setMobileHeaderActions} />
      )}
      {isDashboard && <DashboardPage />}
    </div>
  );
}
