import type { ReactNode } from "react";

import ClosePageHeader from "../../features/close/ClosePageHeader";
import MobileTopBar from "../../components/widgets/header/MobileTopBar";
import { SIDEBAR_TABS } from "../../../../packages/schemas/sidebar";

type ClosePageHeaderData = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
};

type DashboardHeaderProps = {
  isMobile: boolean;
  isSearch: boolean;
  isSaved: boolean;
  isAgent: boolean;
  isCalendar: boolean;
  isBuyerChecklists: boolean;
  isPersonalization: boolean;
  mobileHeaderActions: ReactNode | null;
  mobileHeader?: ReactNode;
  closePageHeaderData: ClosePageHeaderData | null;
  buyerChecklistsActiveTab: "escrow" | "inspections" | "financing" | "closing";
  onTabChange: (tab: "escrow" | "inspections" | "financing" | "closing") => void;
  headerContent: ReactNode;
  computedMaxWidthVW: number;
};

const MOBILE_SIDE_PX = "px-4";
const MOBILE_TOP_SPACER_CLASS = "transition-all duration-300 ease-in-out";

export function DashboardHeader({
  isMobile,
  isSearch,
  isSaved,
  isAgent,
  isCalendar,
  isBuyerChecklists,
  mobileHeaderActions,
  mobileHeader,
  closePageHeaderData,
  buyerChecklistsActiveTab,
  onTabChange,
  headerContent,
  computedMaxWidthVW,
}: DashboardHeaderProps) {
  // Mobile header content
  const mobileHeaderContent =
    isAgent || isCalendar
      ? null
      : isSearch && mobileHeaderActions
        ? mobileHeaderActions
        : isSearch && isMobile && !mobileHeaderActions
          ? null
          : mobileHeaderActions
            ? mobileHeaderActions
            : isBuyerChecklists
              ? closePageHeaderData && (
                  <ClosePageHeader
                    title={closePageHeaderData.title ?? SIDEBAR_TABS.close.name}
                    subtitle={
                      closePageHeaderData.subtitle ?? SIDEBAR_TABS.close.description
                    }
                    completedCount={closePageHeaderData.completedCount ?? 0}
                    totalCount={closePageHeaderData.totalCount ?? 0}
                    loading={closePageHeaderData.loading ?? true}
                    activeTab={buyerChecklistsActiveTab}
                    onTabChange={onTabChange}
                  />
                )
              : mobileHeader ?? null;

  return (
    <>
      {/* Mobile Header - Hidden when desktop sidebar is visible (>= 768px) or on messaging/calendar pages */}
      {!(isAgent || isCalendar) && (
        <div className="md:hidden">
          <div
            className={isSearch ? "w-full" : "mx-auto"}
            style={isSearch ? {} : { maxWidth: "95vw" }}
          >
            <MobileTopBar
              dynamicHeight={isSaved && mobileHeaderActions !== null}
            >
              <div
                className={`flex flex-grow items-center justify-center text-center ${MOBILE_SIDE_PX}`}
              >
                {mobileHeaderContent ?? null}
              </div>
            </MobileTopBar>
          </div>

          {/* Spacer to keep content clear of the fixed MobileTopBar */}
          <div
            className={`${MOBILE_TOP_SPACER_CLASS} ${
              isSaved && mobileHeaderActions !== null ? "h-16" : "h-24"
            }`}
          />
        </div>
      )}

      {/* Desktop Header (consistent width) - Hidden when mobile header is visible (< 768px) */}
      <div
        className={`hidden md:block mx-auto w-full ${isSaved ? "" : "pt-8"} ${isSearch ? "!hidden" : ""}`}
        style={{
          maxWidth: `calc((100vw - 208px) * ${computedMaxWidthVW} / 100)`,
        }}
      >
        {headerContent}
      </div>
    </>
  );
}
