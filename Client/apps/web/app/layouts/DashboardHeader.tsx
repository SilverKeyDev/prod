import type { ReactNode } from "react";

import MobileTopBar from "../../components/widgets/header/MobileTopBar";

type DashboardHeaderProps = {
  isMobile: boolean;
  isSearch: boolean;
  isSaved: boolean;
  isMessagingRoute: boolean;
  isDashboard: boolean;
  mobileHeaderActions: ReactNode | null;
  mobileHeader?: ReactNode;
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
  mobileHeaderActions,
  mobileHeader,
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
          : mobileHeaderActions ?? mobileHeader ?? null;

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
