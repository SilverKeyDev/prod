import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { pathMatches } from "packages/utils/domain/layout/dashboardLayoutConfig";

import MobileTopBar from "@/app/layouts/mobile/MobileTopBar";

type DashboardHeaderProps = {
  isMobile: boolean;
  mobileHeaderActions: ReactNode | null;
  mobileHeader?: ReactNode;
};

const MOBILE_SIDE_PX = "px-4";

function getMobileHeaderContent(
  isMessagingRoute: boolean,
  isDashboard: boolean,
  isSearch: boolean,
  isMobile: boolean,
  mobileHeaderActions: ReactNode | null,
  mobileHeader: ReactNode | undefined,
): ReactNode {
  if (isMessagingRoute) return mobileHeaderActions;
  if (isDashboard) return null;
  if (isSearch && mobileHeaderActions) return mobileHeaderActions;
  if (isSearch && isMobile && !mobileHeaderActions) return null;
  return mobileHeaderActions ?? mobileHeader ?? null;
}

function getShowMobileTopBar(
  isMessagingRoute: boolean,
  isDashboard: boolean,
  mobileHeaderActions: ReactNode | null,
  isSearchReelsShown: boolean,
  isMobile: boolean,
): boolean {
  const hideForReels = isSearchReelsShown && isMobile;
  if (hideForReels) return false;
  if (isMessagingRoute) return mobileHeaderActions != null;
  if (isDashboard) return false;
  return true;
}

export function DashboardHeader({
  isMobile,
  mobileHeaderActions,
  mobileHeader,
}: DashboardHeaderProps) {
  const location = useLocation();
  const path = location.pathname;
  const {
    isSearch,
    isSaved,
    isMessaging: isMessagingRoute,
    isDashboard,
  } = pathMatches(path);
  const isSearchReelsShown =
    isSearch && new URLSearchParams(location.search).has("reels");

  const mobileHeaderContent = getMobileHeaderContent(
    isMessagingRoute,
    isDashboard,
    isSearch,
    isMobile,
    mobileHeaderActions,
    mobileHeader,
  );
  const showMobileTopBar = getShowMobileTopBar(
    isMessagingRoute,
    isDashboard,
    mobileHeaderActions,
    isSearchReelsShown,
    isMobile,
  );

  const fullWidthLayout = isMessagingRoute || isSearch;
  const wrapperClassName = fullWidthLayout ? "w-full" : "mx-auto";
  const wrapperStyle = fullWidthLayout ? {} : { maxWidth: "95vw" };
  const dynamicHeight =
    isSaved && mobileHeaderActions !== null && !isMessagingRoute;
  const noPadding = isSaved && isMobile;
  const centerPadding = isSaved && isMobile ? "" : MOBILE_SIDE_PX;

  return (
    <>
      {showMobileTopBar && (
        <div className="md:hidden">
          <div className={wrapperClassName} style={wrapperStyle}>
            <MobileTopBar
              dynamicHeight={dynamicHeight}
              fullWidth={isMessagingRoute}
              noPadding={noPadding}
            >
              {isMessagingRoute ? (
                mobileHeaderContent
              ) : (
                <div
                  className={`flex w-full items-center justify-center text-center ${centerPadding}`}
                >
                  {mobileHeaderContent ?? null}
                </div>
              )}
            </MobileTopBar>
          </div>
        </div>
      )}
    </>
  );
}
