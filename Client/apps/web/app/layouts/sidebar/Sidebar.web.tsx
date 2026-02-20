import React, { useState } from "react";

import { ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { useUserData } from "packages/hooks/data/auth/useUserData";
import { useAuthStoreIntegration } from "packages/hooks/store/auth/useAuthStoreIntegration";
import { useIsAgent } from "packages/hooks/store/auth/useIsAgent";
import type { UserProfile } from "packages/schemas/app/auth/user";
import { useViewStore, type ViewState } from "packages/store";
import { useNotificationStore } from "packages/store";

import ConfirmationDialog from "@/components/modals/dialogs/ConfirmationDialog.web";
import WhiteLogo from "@/components/ui/asset/WhiteLogo.web";
import { NotificationBadge } from "@/components/ui/index.web";
import { SearchNavLink } from "@/features/search/index.web";

import {
  getNavigation,
  type NavCategory,
  type SidebarNavItem,
} from "./sidebarNav.web";

function getButtonStyles(isActive: boolean): string {
  const baseStyles =
    "w-full flex items-center py-3 transition-all duration-200 font-medium text-white touch-friendly rounded-lg";
  const activeStyles =
    "bg-brown-light/70 text-white font-semibold hover:bg-brown-light/80";
  const inactiveStyles =
    "text-white/70 hover:bg-brown-light/30 hover:text-beige hover:-translate-y-0.5 active:bg-brown-light/20 active:text-beige";

  return `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
}

function getSubItemStyles(isActive: boolean): string {
  const baseStyles =
    "flex items-center transition-all duration-200 font-medium text-white touch-friendly rounded-lg";
  const activeStyles =
    "bg-brown-light text-white font-semibold hover:bg-brown-light/80";
  const inactiveStyles =
    "text-white/50 hover:bg-brown-light/50 hover:text-beige hover:-translate-y-0.5 active:bg-brown-light/30 active:text-beige";

  return `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
}

const SINGLE_LINK_KEYS = new Set([
  "dashboard",
  "search",
  "decide",
  "profile",
  "agent",
]);

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
  const ItemIcon = firstItem?.icon;
  const buttonClass = `${getButtonStyles(isActive)} ${!expanded ? "justify-center" : ""}`;
  const titleAttr = !expanded ? firstItem?.name : "";
  const iconEl = ItemIcon && (
    <div className="relative inline-flex items-center">
      <ItemIcon
        className={`h-6 w-6 transition-all duration-200 ${expanded ? "mr-3" : ""}`}
      />
      {categoryKey === "agent" && isLoaded && (
        <NotificationBadge
          count={unreadCount}
          className="absolute -top-1 -right-1 sm:-top-0.5 sm:-right-0.5"
        />
      )}
    </div>
  );

  if (categoryKey === "search") {
    return (
      <SearchNavLink
        className={buttonClass}
        title={titleAttr}
        onClick={() => onLinkClick?.()}
      >
        {iconEl}
        {expanded && (
          <span className="text-sm font-medium">{firstItem?.name}</span>
        )}
      </SearchNavLink>
    );
  }
  return (
    <Link
      to={firstItem?.href ?? "/"}
      className={buttonClass}
      title={titleAttr}
      onClick={() => onLinkClick?.()}
    >
      {iconEl}
      {expanded && (
        <span className="text-sm font-medium">{firstItem?.name}</span>
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

  return (
    <>
      <button
        onClick={() => toggleCategory(categoryKey)}
        className={`${getButtonStyles(isCategoryActive(category.items))} group relative ${!expanded ? "justify-center" : "justify-between"} cursor-pointer`}
        title={!expanded ? category.name : ""}
      >
        <div className="flex items-center">
          <div
            className={`${!expanded && openCategories[categoryKey] ? "flex h-8 w-8 items-center justify-center rounded-full bg-gold/20" : ""}`}
          >
            <category.icon
              className={`h-6 w-6 transition-all duration-200 ${expanded ? "mr-3" : ""} ${!expanded && openCategories[categoryKey] ? "text-gold" : ""}`}
            />
          </div>
          {expanded && (
            <span className="text-sm font-medium">{category.name}</span>
          )}
        </div>
        {!expanded && openCategories[categoryKey] && (
          <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-gold"></div>
        )}
        {expanded &&
          (openCategories[categoryKey] ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          ))}
      </button>
      {openCategories[categoryKey] && (
        <div className={expanded ? "ml-3 mt-2 space-y-1" : ""}>
          {category.items.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => onLinkClick?.()}
              className={`${getSubItemStyles(isActive(item.href))} ${!expanded ? "justify-center py-2" : "py-2"}`}
            >
              <item.icon
                className={`${isActive(item.href) ? "h-6 w-6" : "h-5 w-5"} transition-all duration-200 ${expanded ? "mr-3" : ""}`}
              />
              {expanded && <span className="text-sm">{item.name}</span>}
            </Link>
          ))}
        </div>
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
    <div className="flex flex-shrink-0 items-center justify-between py-2">
      <div
        className="flex items-center text-white"
        style={{ filter: "brightness(0) invert(1)" }}
      >
        {expanded && (
          <div className="flex flex-shrink-0 py-4">
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="flex items-center space-x-4">
                  <div className="h-6 w-6 rounded-full bg-brown-light"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-brown-light"></div>
                    <div className="h-3 w-1/2 rounded bg-brown-light"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <WhiteLogo size="sm" className="ml-1" />
                <div className="ml-3">
                  <p className="line-clamp-1 text-xs text-white/80">
                    {displayUser?.email ?? "No email"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
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
    <div className="flex-shrink-0 border-t border-brown-light py-4">
      <button
        onClick={onLogoutClick}
        className={`${getButtonStyles(false).replace(
          "text-white/70",
          "text-white",
        )} ${!expanded ? "justify-center py-3" : "py-3"} cursor-pointer`}
      >
        <LogOut className={`h-6 w-6 ${expanded ? "mr-3" : ""}`} />
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
    </div>
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
    <nav className="mt-4 pb-4">
      {Object.entries(navigation).map(([categoryKey, category]) => (
        <div key={categoryKey}>
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
        </div>
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
  const {
    showLogoutConfirm,
    handleLogoutClick,
    handleConfirmLogout,
    handleCancelLogout,
  } = useSidebarLogoutConfirm(onLogout);
  const { user: authUser, authReady, authStatus } = useAuthStoreIntegration();
  const isLoading = authStatus === "checking" || !authReady;
  const { userProfile } = useUserData();
  const _isAgent = useIsAgent();
  const hasAgent = userProfile?.agent_id ? true : false;
  const openCategories = useViewStore((s: ViewState) => s.openCategories);
  const toggleCategoryInStore = useViewStore(
    (s: ViewState) => s.toggleCategory,
  );
  const location = useLocation();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoaded = useNotificationStore((s) => s.isLoaded);

  const isActive = (href: string) => {
    const hrefPathname = href.split("?")[0].split("#")[0];
    return (
      location.pathname === hrefPathname ||
      location.pathname.endsWith(hrefPathname)
    );
  };
  const toggleCategory = (category: string) => toggleCategoryInStore(category);
  const isCategoryActive = (items: SidebarNavItem[]) =>
    items.some((item) => isActive(item.href));

  const navigation = getNavigation(_isAgent, hasAgent, isMobile);

  return (
    <div
      className={`safe-top fixed left-0 top-0 z-sidebar h-full bg-brown text-white transition-all duration-300 ease-in-out ${expanded ? "w-52 px-4" : "w-16 px-2"} `}
    >
      <div
        className="line-clamp-1 flex h-full flex-col overflow-hidden"
        style={{ height: "100%", maxHeight: "100%" }}
      >
        <SidebarHeader
          expanded={expanded}
          isLoading={isLoading}
          displayUser={authUser}
        />
        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
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
        </div>
        <SidebarFooter
          expanded={expanded}
          showLogoutConfirm={showLogoutConfirm}
          onLogoutClick={handleLogoutClick}
          onConfirmLogout={handleConfirmLogout}
          onCancelLogout={handleCancelLogout}
        />
      </div>
    </div>
  );
}
