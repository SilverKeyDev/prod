import React, { useState } from "react";

import { useLocation } from "react-router-dom";

import { useIsAgent } from "packages/hooks/store";
import { useViewStore, type ViewState } from "packages/store";
import { useNotificationStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";
import { SIDEBAR_CHROME_SHELL } from "packages/ui/components/sidebar/sidebarTheme";

import { useDashboardShellRoutePrefetch } from "@/app/layouts/dashboard/useDashboardShellRoutePrefetch.web";
import { useAuthStoreIntegration } from "@/features/homeauth/hooks/store/useAuthStoreIntegration";
import type { UserProfile } from "@/features/homeauth/types";
import { useUserData } from "@/features/profile/hooks/data/useUserData";

import { getNavigation, type SidebarNavItem } from "./sidebarNav.web";
import { SidebarFooter, SidebarHeader, SidebarNav } from "./SidebarNavSections.web";

export type SidebarProps = {
  user?: UserProfile;
  onLogout: () => void;
  expanded: boolean;
  isMobile?: boolean;
  onLinkClick?: () => void;
};
function useSidebarLogoutConfirm(onLogout: () => void) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLogoutConfirm(true);
  };
  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };
  const handleCancelLogout = () => setShowLogoutConfirm(false);
  return {
    showLogoutConfirm,
    handleLogoutClick,
    handleConfirmLogout,
    handleCancelLogout,
  };
}
export default function Sidebar({
  onLogout,
  expanded,
  isMobile = false,
  onLinkClick,
}: SidebarProps) {
  const { showLogoutConfirm, handleLogoutClick, handleConfirmLogout, handleCancelLogout } =
    useSidebarLogoutConfirm(onLogout);
  const { user: authUser, authReady, authStatus } = useAuthStoreIntegration();
  const isLoading = authStatus === "checking" || !authReady;
  const { userProfile } = useUserData();
  const _isAgent = useIsAgent();
  const hasAgent = userProfile?.agent_id ? true : false;
  const openCategories = useViewStore((s: ViewState) => s.openCategories);
  const toggleCategoryInStore = useViewStore((s: ViewState) => s.toggleCategory);
  const location = useLocation();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoaded = useNotificationStore((s) => s.isLoaded);
  const isActive = (href: string) => {
    const part = href.split("?")[0];
    const hrefPathname = part?.split("#")[0];
    if (hrefPathname === undefined) return false;
    return location.pathname === hrefPathname || location.pathname.endsWith(hrefPathname);
  };
  const toggleCategory = (category: string) => toggleCategoryInStore(category);
  const isCategoryActive = (items: SidebarNavItem[]) => items.some((item) => isActive(item.href));
  const navigation = getNavigation(_isAgent, hasAgent, isMobile);
  const prefetchHref = useDashboardShellRoutePrefetch();
  return (
    <Box
      className={`safe-top fixed left-0 top-0 z-sidebar h-full ${SIDEBAR_CHROME_SHELL} transition-all duration-300 ease-in-out ${
        expanded ? "w-52 px-4" : "w-16 px-2"
      } `}
    >
      <Box
        className="line-clamp-1 flex h-full flex-col overflow-hidden"
        style={{ height: "100%", maxHeight: "100%" }}
      >
        <SidebarHeader expanded={expanded} isLoading={isLoading} displayUser={authUser} />
        <Box className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
          <SidebarNav
            navigation={navigation}
            expanded={expanded}
            isActive={isActive}
            isCategoryActive={isCategoryActive}
            toggleCategory={toggleCategory}
            openCategories={openCategories}
            onLinkClick={onLinkClick}
            unreadCount={unreadCount}
            isLoaded={isLoaded}
            onPrefetchHref={prefetchHref}
          />
        </Box>
        <SidebarFooter
          expanded={expanded}
          showLogoutConfirm={showLogoutConfirm}
          onLogoutClick={handleLogoutClick}
          onConfirmLogout={handleConfirmLogout}
          onCancelLogout={handleCancelLogout}
        />
      </Box>
    </Box>
  );
}
