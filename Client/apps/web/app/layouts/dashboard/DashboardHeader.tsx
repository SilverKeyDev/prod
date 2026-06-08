import type { ReactNode } from "react";

import { useSearchViewStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";

import MobileTopBar, {
  MOBILE_TOP_BAR_COMPACT_HEIGHT_PX,
  MOBILE_TOP_BAR_LIBRARY_HEIGHT_PX,
} from "@/app/layouts/mobile/MobileTopBar";

import { useDashboardRoute } from "./useDashboardRoute";

type DashboardHeaderProps = {
  isMobile: boolean;
  mobileHeaderActions: ReactNode | null;
  mobileHeader?: ReactNode;
};

function getMobileHeaderContent(
  isMessagingRoute: boolean,
  isDashboard: boolean,
  isSearch: boolean,
  isMobile: boolean,
  mobileHeaderActions: ReactNode | null,
  mobileHeader: ReactNode | undefined
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
  isMobile: boolean
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
  const route = useDashboardRoute();
  const searchViewMode = useSearchViewStore((s) => s.mode);
  const isSearchReelsShown = route.isSearch && searchViewMode === "reels";

  const mobileHeaderContent = getMobileHeaderContent(
    route.isMessaging,
    route.isDashboard,
    route.isSearch,
    isMobile,
    mobileHeaderActions,
    mobileHeader
  );
  const showMobileTopBar = getShowMobileTopBar(
    route.isMessaging,
    route.isDashboard,
    mobileHeaderActions,
    isSearchReelsShown,
    isMobile
  );

  const fullWidthLayout = route.isMessaging || route.isSearch;
  const noPadding = route.isLibrary && isMobile;

  return (
    <>
      {showMobileTopBar && (
        <Box className={`md:hidden ${fullWidthLayout ? "w-full" : "mx-auto max-w-[95vw]"}`}>
          <MobileTopBar
            fullWidth={route.isMessaging || route.isSearch || route.isLibrary}
            noPadding={noPadding}
            blurBackground={route.isProfile}
            scrollable={route.isLibrary}
            barHeightPx={
              route.isMessaging
                ? MOBILE_TOP_BAR_COMPACT_HEIGHT_PX
                : route.isLibrary
                  ? MOBILE_TOP_BAR_LIBRARY_HEIGHT_PX
                  : undefined
            }
          >
            {route.isMessaging ? (
              mobileHeaderContent
            ) : route.isSearch || route.isLibrary ? (
              <Box className="box-border w-full min-w-0 px-3 py-2">{mobileHeaderContent}</Box>
            ) : (
              <Box className="flex w-full items-center justify-center">
                {mobileHeaderContent ?? null}
              </Box>
            )}
          </MobileTopBar>
        </Box>
      )}
    </>
  );
}
