import React, { useState } from "react";

import { Icon } from "@ui/icons";
import { useLocation, useNavigate } from "react-router-dom";

import { SearchNavLink } from "packages/features/search";
import { useIsAgent } from "packages/hooks/store";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Link } from "packages/navigation";
import { useViewStore, type ViewState } from "packages/store";
import { useNotificationStore } from "packages/store";
import WhiteLogo from "packages/ui/components/asset/WhiteLogo";
import { Box } from "packages/ui/components/primitives";

import ConfirmationDialog from "@/components/modals/dialogs/ConfirmationDialog.web";
import { BodyText, NotificationBadge } from "@/components/ui";
import { useAuthStoreIntegration } from "@/features/homeauth/hooks/store/useAuthStoreIntegration";
import type { UserProfile } from "@/features/homeauth/types";
import { useUserData } from "@/features/profile/hooks/data/useUserData";

import { getNavigation, type NavCategory, type SidebarNavItem } from "./sidebarNav.web";
function getButtonStyles(isActive: boolean): string {
  const baseStyles =
    "w-full flex items-center py-3 transition-all duration-200 font-medium touch-friendly rounded-lg";
  const hoverActiveStyles = "bg-white/10 hover:bg-white/10";
  const activeStyles = `${hoverActiveStyles} text-white font-bold`;
  const inactiveStyles =
    "text-white/80 hover:bg-white/10 hover:text-white hover:-translate-y-0.5 active:bg-white/10 active:text-white";
  return `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
}
function getSubItemStyles(isActive: boolean): string {
  const baseStyles =
    "flex items-center transition-all duration-200 font-medium touch-friendly rounded-lg";
  const hoverActiveStyles = "bg-white/10 hover:bg-white/10";
  const activeStyles = `${hoverActiveStyles} text-white font-bold`;
  const inactiveStyles =
    "text-white/80 hover:bg-white/10 hover:text-white hover:-translate-y-0.5 active:bg-white/10 active:text-white";
  return `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
}
const SINGLE_LINK_KEYS = new Set(["dashboard", "search", "decide", "profile", "agent"]);
type SidebarNavSingleLinkProps = {
  categoryKey: string;
  firstItem: SidebarNavItem;
  expanded: boolean;
  isActive: boolean;
  unreadCount: number;
  isLoaded: boolean;
  onLinkClick?: () => void;
};
function SidebarNavSingleLink({
  categoryKey,
  firstItem,
  expanded,
  isActive,
  unreadCount,
  isLoaded,
  onLinkClick,
}: SidebarNavSingleLinkProps) {
  const location = useLocation();
  const itemIconName = firstItem.icon;
  const buttonClass = `${getButtonStyles(isActive)} ${!expanded ? "justify-center" : ""}`;
  const titleAttr = !expanded ? firstItem?.name : "";
  const iconEl = (
    <Box className="relative inline-flex items-center">
      <Icon
        name={itemIconName}
        className={`h-6 w-6 transition-all duration-200 ${expanded ? "mr-3" : ""}`}
      />
      {categoryKey === "agent" && isLoaded && (
        <NotificationBadge
          count={unreadCount}
          className="absolute -right-1 -top-1 sm:-right-0.5 sm:-top-0.5"
        />
      )}
    </Box>
  );
  if (categoryKey === "search") {
    return (
      <SearchNavLink
        className={buttonClass}
        title={titleAttr}
        onClick={() => onLinkClick?.()}
        aria-current={isActive ? "page" : undefined}
      >
        {iconEl}
        {expanded && (
          <span className={isActive ? "text-base font-bold" : "text-sm font-medium"}>
            {firstItem?.name}
          </span>
        )}
      </SearchNavLink>
    );
  }
  const to = firstItem?.href ?? "/";
  const handleClick = () => {
    const navId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    log.info(LOG_CATEGORIES.ROUTING, "[NAV] Sidebar nav click (link)", {
      navId,
      from: location.pathname,
      to,
      categoryKey,
    });
    onLinkClick?.();
  };
  return (
    <Link
      to={to}
      className={buttonClass}
      title={titleAttr}
      onClick={handleClick}
      aria-label={firstItem?.name}
      aria-current={isActive ? "page" : undefined}
    >
      {iconEl}
      {expanded && (
        <span className={isActive ? "text-base font-bold" : "text-sm font-medium"}>
          {firstItem?.name}
        </span>
      )}
    </Link>
  );
}
type SidebarNavCategoryProps = {
  categoryKey: string;
  category: NavCategory;
  expanded: boolean;
  isActive: (href: string) => boolean;
  isCategoryActive: (items: SidebarNavItem[]) => boolean;
  toggleCategory: (category: string) => void;
  openCategories: Record<string, boolean>;
  onLinkClick?: () => void;
  unreadCount: number;
  isLoaded: boolean;
};
function SidebarNavCategory({
  categoryKey,
  category,
  expanded,
  isActive,
  isCategoryActive,
  toggleCategory,
  openCategories,
  onLinkClick,
  unreadCount,
  isLoaded,
}: SidebarNavCategoryProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isSingleLink = SINGLE_LINK_KEYS.has(categoryKey);
  if (isSingleLink) {
    const firstItem = category.items[0];
    return (
      <SidebarNavSingleLink
        categoryKey={categoryKey}
        firstItem={firstItem!}
        expanded={expanded}
        isActive={isActive(firstItem?.href ?? "/")}
        unreadCount={unreadCount}
        isLoaded={isLoaded}
        onLinkClick={onLinkClick}
      />
    );
  }
  const firstItemHref = category.items[0]?.href;
  const handleCategoryHeaderClick = () => {
    if (category.items.length === 1 && firstItemHref) {
      log.info(LOG_CATEGORIES.ROUTING, "[NAV] Sidebar nav click (button)", {
        categoryKey,
        to: firstItemHref,
        currentPathname: location.pathname,
      });
      onLinkClick?.();
      void navigate(firstItemHref);
      return;
    }
    toggleCategory(categoryKey);
  };
  const categoryPanelId = `sidebar-category-${categoryKey}`;
  return (
    <>
      <button
        onClick={handleCategoryHeaderClick}
        type="button"
        className={`${getButtonStyles(isCategoryActive(category.items))} group relative ${!expanded ? "justify-center" : "justify-between"} cursor-pointer`}
        title={!expanded ? category.name : ""}
        aria-expanded={openCategories[categoryKey]}
        aria-controls={categoryPanelId}
      >
        <Box className="flex items-center">
          <Box
            className={`${!expanded && openCategories[categoryKey] ? "flex h-8 w-8 items-center justify-center rounded-full bg-white/20" : ""}`}
          >
            <Icon
              name={category.icon}
              className={`h-6 w-6 transition-all duration-200 ${expanded ? "mr-3" : ""} ${!expanded && openCategories[categoryKey] ? "text-white" : ""}`}
            />
          </Box>
          {expanded && (
            <span
              className={
                isCategoryActive(category.items) ? "text-base font-bold" : "text-sm font-medium"
              }
            >
              {category.name}
            </span>
          )}
        </Box>
        {!expanded && openCategories[categoryKey] && (
          <Box className="absolute right-1 top-1 h-2 w-2 rounded-full bg-white"></Box>
        )}
        {expanded &&
          (openCategories[categoryKey] ? (
            <Icon name="chevron-down" className="h-5 w-5" />
          ) : (
            <Icon name="chevron-right" className="h-5 w-5" />
          ))}
      </button>
      {openCategories[categoryKey] && (
        <Box
          id={categoryPanelId}
          className={expanded ? "ml-3 mt-2 space-y-1" : ""}
          role="region"
          aria-label={category.name}
        >
          {category.items.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => onLinkClick?.()}
              className={`${getSubItemStyles(isActive(item.href))} ${!expanded ? "justify-center py-2" : "py-2"}`}
              aria-label={item.name}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <Icon
                name={item.icon}
                className={`${isActive(item.href) ? "h-6 w-6" : "h-5 w-5"} transition-all duration-200 ${expanded ? "mr-3" : ""}`}
              />
              {expanded && (
                <span
                  className={isActive(item.href) ? "text-base font-bold" : "text-sm"}
                >
                  {item.name}
                </span>
              )}
            </Link>
          ))}
        </Box>
      )}
    </>
  );
}
function SidebarHeader({
  expanded,
  isLoading,
  displayUser,
}: {
  expanded: boolean;
  isLoading: boolean;
  displayUser: UserProfile | null | undefined;
}) {
  return (
    <Box className="flex flex-shrink-0 items-center justify-between py-2">
      <Box className="flex items-center text-white">
        {expanded && (
          <Box className="flex flex-shrink-0 py-4">
            {isLoading ? (
              <Box className="animate-pulse space-y-3">
                <Box className="flex items-center space-x-4">
                  <Box className="h-6 w-6 rounded-full bg-white/40"></Box>
                  <Box className="flex-1 space-y-2">
                    <Box className="h-4 w-3/4 rounded bg-white/40"></Box>
                    <Box className="h-3 w-1/2 rounded bg-white/40"></Box>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box className="flex items-center">
                <WhiteLogo size="sm" className="ml-1" />
                <Box className="ml-3">
                  <BodyText
                    size="xs"
                    as="span"
                    className="line-clamp-1 text-[11px] text-white/80 sm:text-xs"
                  >
                    {displayUser?.email ?? "No email"}
                  </BodyText>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
function SidebarFooter({
  expanded,
  showLogoutConfirm,
  onLogoutClick,
  onConfirmLogout,
  onCancelLogout,
}: {
  expanded: boolean;
  showLogoutConfirm: boolean;
  onLogoutClick: (e: React.MouseEvent) => void;
  onConfirmLogout: () => void;
  onCancelLogout: () => void;
}) {
  return (
    <Box className="flex-shrink-0 border-t border-white/30 py-4">
      <button
        onClick={onLogoutClick}
        className={`${getButtonStyles(false).replace("text-white/80", "text-white")} cursor-pointer justify-center py-3`}
      >
        <Icon name="log-out" className={`h-6 w-6 ${expanded ? "mr-3" : ""}`} />
        {expanded && <span>Logout</span>}
      </button>
      <ConfirmationDialog
        isOpen={showLogoutConfirm}
        title="Logout Confirmation"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        onConfirm={onConfirmLogout}
        onCancel={onCancelLogout}
      />
    </Box>
  );
}
type SidebarNavProps = {
  navigation: Record<string, NavCategory>;
  expanded: boolean;
  isActive: (href: string) => boolean;
  isCategoryActive: (items: SidebarNavItem[]) => boolean;
  toggleCategory: (category: string) => void;
  openCategories: Record<string, boolean>;
  onLinkClick?: () => void;
  unreadCount: number;
  isLoaded: boolean;
};
function SidebarNav({
  navigation,
  expanded,
  isActive,
  isCategoryActive,
  toggleCategory,
  openCategories,
  onLinkClick,
  unreadCount,
  isLoaded,
}: SidebarNavProps) {
  return (
    <nav className="mt-4 pb-4" aria-label="Primary navigation">
      {Object.entries(navigation).map(([categoryKey, category]) => (
        <Box key={categoryKey}>
          <SidebarNavCategory
            categoryKey={categoryKey}
            category={category}
            expanded={expanded}
            isActive={isActive}
            isCategoryActive={isCategoryActive}
            toggleCategory={toggleCategory}
            openCategories={openCategories}
            onLinkClick={onLinkClick}
            unreadCount={unreadCount}
            isLoaded={isLoaded}
          />
        </Box>
      ))}
    </nav>
  );
}
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
  return (
    <Box
      className={`safe-top fixed left-0 top-0 z-sidebar h-full bg-background-sidebar text-white transition-all duration-300 ease-in-out ${expanded ? "w-52 px-4" : "w-16 px-2"} `}
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
