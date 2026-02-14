import type { ReactNode } from "react";

import ClosePageHeader from "../../features/close/ClosePageHeader";
import MobileTopBar from "../../components/widgets/header/MobileTopBar";
import { SIDEBAR_TABS } from "../../../../packages/schemas/auth/sidebar";

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
  isMessagingRoute: boolean;
  isDashboard: boolean;
  isBuyerChecklists: boolean;
  isPersonalization: boolean;
  mobileHeaderActions: ReactNode | null;
  mobileHeader?: ReactNode;
  closePageHeaderData: ClosePageHeaderData | null;
  buyerChecklistsActiveTab: "escrow" | "inspections" | "financing" | "closing";
  onTabChange: (
    tab: "escrow" | "inspections" | "financing" | "closing",
  ) => void;
  headerContent: ReactNode;
  computedMaxWidthVW: number;
};

const MOBILE_SIDE_PX = "px-4";

export function DashboardHeader({
  isMobile,
  isSearch,
  isSaved,
  isMessagingRoute,
  isDashboard,
  isBuyerChecklists,
  mobileHeaderActions,
  mobileHeader,
  closePageHeaderData,
  buyerChecklistsActiveTab,
  onTabChange,
  headerContent,
  computedMaxWidthVW,
}: DashboardHeaderProps) {
  // Mobile header content: messaging uses mobileHeaderActions (hovering header); others use existing logic
  const mobileHeaderContent = isMessagingRoute
    ? mobileHeaderActions
    : isDashboard
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
                      closePageHeaderData.subtitle ??
                      SIDEBAR_TABS.close.description
                    }
                    completedCount={closePageHeaderData.completedCount ?? 0}
                    totalCount={closePageHeaderData.totalCount ?? 0}
                    loading={closePageHeaderData.loading ?? true}
                    activeTab={buyerChecklistsActiveTab}
                    onTabChange={onTabChange}
                  />
                )
              : (mobileHeader ?? null);

  const showMobileTopBar =
    (isMessagingRoute && mobileHeaderActions != null) ||
    !(isMessagingRoute || isDashboard);

  return (
    <>
      {/* Mobile Header - Fixed, hovers over content on messaging; hidden when desktop sidebar visible (>= 768px) */}
      {showMobileTopBar && (
        <div className="md:hidden">
          <div
            className={isMessagingRoute || isSearch ? "w-full" : "mx-auto"}
            style={isMessagingRoute || isSearch ? {} : { maxWidth: "95vw" }}
          >
            <MobileTopBar
              dynamicHeight={
                isSaved && mobileHeaderActions !== null && !isMessagingRoute
              }
              fullWidth={isMessagingRoute}
              noPadding={isSaved && isMobile}
            >
              {isMessagingRoute ? (
                mobileHeaderContent
              ) : (
                <div
                  className={`flex w-full items-center justify-center text-center ${
                    isSaved && isMobile ? "" : MOBILE_SIDE_PX
                  }`}
                >
                  {mobileHeaderContent ?? null}
                </div>
              )}
            </MobileTopBar>
          </div>
        </div>
      )}

      {/* Desktop Header (consistent width) - Hidden when mobile header is visible (< 768px) */}
      {headerContent ? (
        <div
          className={`hidden md:block mx-auto w-full ${isSaved ? "" : "pt-8"} ${isSearch || isMessagingRoute ? "!hidden" : ""}`}
          style={{
            maxWidth: `calc((100vw - 208px) * ${computedMaxWidthVW} / 100)`,
          }}
        >
          {headerContent}
        </div>
      ) : null}
    </>
  );
}
