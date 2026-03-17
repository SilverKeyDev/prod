import type { ReactNode } from "react";

import { useSearchViewStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";

import MobileTopBar from "@/app/layouts/mobile/MobileTopBar";

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
  const noPadding = route.isSaved && isMobile;

  return (
    <>
      {showMobileTopBar && (
        <Box className={`md:hidden ${fullWidthLayout ? "w-full" : "mx-auto max-w-[95vw]"}`}>
          <MobileTopBar fullWidth={route.isMessaging} noPadding={noPadding}>
            {route.isMessaging ? (
              mobileHeaderContent
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
