import { ChevronDown, ChevronRight, LogOut } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAuthStoreIntegration } from "../../../../../packages/hooks/store/auth/useAuthStoreIntegration";
import ConfirmationDialog from "../../modals/dialogs/ConfirmationDialog";
import WhiteLogo from "../../ui/asset/WhiteLogo";
import NotificationBadge from "../../ui/NotificationBadge";

import { getButtonStyles, getSubItemStyles } from "./sidebarStyles";
import {
  useViewStore,
  type ViewState,
} from "../../../../../packages/store/view.slice";
import { useNotificationStore } from "../../../../../packages/store/notifications.slice";
import { SIDEBAR_TABS } from "../../../../../packages/schemas/auth/sidebar";
import type { UserProfile } from "../../../../../packages/schemas/user";
import { useUserData } from "../../../../../packages/hooks/data/auth/useUserData";
import { useIsAgent } from "../../../../../packages/hooks/store/auth/useIsAgent";
type SidebarProps = {
  user?: UserProfile;
  onLogout: () => void;
  expanded: boolean;
  isMobile?: boolean;
  onLinkClick?: () => void;
};

// Define types for navigation items and structure
type SidebarNavItem = {
  name: string;
  href: string;
  icon: React.FC<{ className?: string }>;
};

type NavCategory = {
  name: string;
  icon: React.FC<{ className?: string }>;
  items: SidebarNavItem[];
};

type NavigationStructure = Record<string, NavCategory>;

// Navigation structure with categories and dropdown items based on schema
const navigationStructure: NavigationStructure = {
  dashboard: {
    name: SIDEBAR_TABS.dashboard.name,
    icon: SIDEBAR_TABS.dashboard.icon as unknown as React.FC<{
      className?: string;
    }>,
    items: [
      {
        name: SIDEBAR_TABS.dashboard.name,
        href: SIDEBAR_TABS.dashboard.href,
        icon: SIDEBAR_TABS.dashboard.icon as unknown as React.FC<{
          className?: string;
        }>,
      },
    ],
  },
  search: {
    name: SIDEBAR_TABS.search.name,
    icon: SIDEBAR_TABS.search.icon as unknown as React.FC<{
      className?: string;
    }>,
    items: [
      {
        name: SIDEBAR_TABS.search.name,
        href: SIDEBAR_TABS.search.href,
        icon: SIDEBAR_TABS.search.icon as unknown as React.FC<{
          className?: string;
        }>,
      },
    ],
  },
  decide: {
    name: SIDEBAR_TABS.decide.name,
    icon: SIDEBAR_TABS.decide.icon as unknown as React.FC<{
      className?: string;
    }>,
    items: [
      {
        name: SIDEBAR_TABS.decide.name,
        href: SIDEBAR_TABS.decide.href,
        icon: SIDEBAR_TABS.decide.icon as unknown as React.FC<{
          className?: string;
        }>,
      },
    ],
  },
  agent: {
    name: SIDEBAR_TABS.agent.name,
    icon: SIDEBAR_TABS.agent.icon as unknown as React.FC<{
      className?: string;
    }>,
    items: [
      {
        name: SIDEBAR_TABS.agent.name,
        href: SIDEBAR_TABS.agent.href,
        icon: SIDEBAR_TABS.agent.icon as unknown as React.FC<{
          className?: string;
        }>,
      },
    ],
  },
  profile: {
    name: SIDEBAR_TABS.profile.name,
    icon: SIDEBAR_TABS.profile.icon as unknown as React.FC<{
      className?: string;
    }>,
    items: [
      {
        name: SIDEBAR_TABS.profile.name,
        href: SIDEBAR_TABS.profile.href,
        icon: SIDEBAR_TABS.profile.icon as unknown as React.FC<{
          className?: string;
        }>,
      },
    ],
  },
};

// Function to generate navigation array - messaging always available for all users
const getNavigation = (
  isAgent: boolean,
  _hasAgent: boolean,
  isMobile: boolean,
): NavigationStructure => {
  // Create a proper copy of the navigation structure
  const navigation: NavigationStructure = {};

  // Dashboard (unified calendar experience) for all users
  navigation.dashboard = {
    name: navigationStructure.dashboard.name,
    icon: navigationStructure.dashboard.icon,
    items: [...navigationStructure.dashboard.items],
  };

  // Add navigation items - messaging always available
  navigation.search = {
    name: navigationStructure.search.name,
    icon: navigationStructure.search.icon,
    items: [...navigationStructure.search.items],
  };
  navigation.decide = {
    name: navigationStructure.decide.name,
    icon: navigationStructure.decide.icon,
    items: [...navigationStructure.decide.items],
  };

  // Messaging tab - always available regardless of agent status
  navigation.agent = {
    name: navigationStructure.agent.name,
    icon: navigationStructure.agent.icon,
    items: [...navigationStructure.agent.items],
  };

  // Profile - only show on non-mobile
  if (!isMobile) {
    navigation.profile = {
      name: navigationStructure.profile.name,
      icon: navigationStructure.profile.icon,
      items: [...navigationStructure.profile.items],
    };
  }

  return navigation;
};

export default function Sidebar({
  onLogout,
  expanded,
  isMobile = false,
  onLinkClick,
}: SidebarProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  // Get user from auth store integration
  const { user: authUser, authReady, authStatus } = useAuthStoreIntegration();

  const displayUser = authUser;
  const isLoading = authStatus === "checking" || !authReady;

  // Get user profile to check is_agent flag
  const { userProfile } = useUserData();
  const isAgent = useIsAgent();
  const hasAgent = userProfile?.agent_id ? true : false;

  const openCategories = useViewStore((s: ViewState) => s.openCategories);
  const toggleCategoryInStore = useViewStore(
    (s: ViewState) => s.toggleCategory,
  );
  const location = useLocation();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoaded = useNotificationStore((s) => s.isLoaded);

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // No local fetchUserData; userProfile is loaded by UserContext on login/app load.

  const isActive = (href: string) => {
    // Extract pathname from href (remove query parameters and hash)
    const hrefPathname = href.split("?")[0].split("#")[0];
    return (
      location.pathname === hrefPathname ||
      location.pathname.endsWith(hrefPathname)
    );
  };

  const toggleCategory = (category: string) => {
    toggleCategoryInStore(category);
  };

  const isCategoryActive = (items: SidebarNavItem[]) => {
    return items.some((item) => isActive(item.href));
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`safe-top fixed left-0 top-0 z-sidebar h-full bg-brown text-white transition-all duration-300 ease-in-out ${expanded ? "w-52 px-4" : "w-16 px-2"} `}
      >
        <div
          className="line-clamp-1 flex h-full flex-col overflow-hidden"
          style={{
            height: "100%",
            maxHeight: "100%",
          }}
        >
          {/* Header with Logo */}
          <div className="flex flex-shrink-0 items-center justify-between py-2">
            {/* Logo */}
            <div
              className="flex items-center text-white"
              style={{ filter: "brightness(0) invert(1)" }}
            >
              {/* User Info (only when expanded) */}
              {expanded && (
                <div className="flex-shrink-0 py-4">
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

          {/* Navigation - Scrollable middle section */}
          <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
            <nav className="mt-4 pb-4">
              {Object.entries(getNavigation(isAgent, hasAgent, isMobile)).map(
                ([categoryKey, category]: [string, NavCategory]) => (
                  <div key={categoryKey}>
                    {/* Render certain categories as direct links (dashboard, search, decide, profile, agent) */}
                    {/* Agent is always a direct link, never a dropdown */}
                    {categoryKey === "dashboard" ||
                    categoryKey === "search" ||
                    categoryKey === "decide" ||
                    categoryKey === "profile" ||
                    categoryKey === "agent" ? (
                      (() => {
                        const firstItem = category.items[0];
                        const ItemIcon = firstItem?.icon;
                        return (
                          <Link
                            to={firstItem?.href ?? "/"}
                            onClick={() => {
                              onLinkClick?.();
                            }}
                            className={`${getButtonStyles(isActive(firstItem?.href ?? "/"))} ${
                              !expanded ? "justify-center" : ""
                            }`}
                            title={!expanded ? firstItem?.name : ""}
                          >
                            {ItemIcon && (
                              <div className="relative inline-flex items-center">
                                <ItemIcon
                                  className={`h-6 w-6 transition-all duration-200 ${
                                    expanded ? "mr-3" : ""
                                  }`}
                                />
                                {categoryKey === "agent" && isLoaded && (
                                  <NotificationBadge
                                    count={unreadCount}
                                    className="absolute -top-1 -right-1 sm:-top-0.5 sm:-right-0.5"
                                  />
                                )}
                              </div>
                            )}
                            {expanded && (
                              <span className="text-sm font-medium">
                                {firstItem?.name}
                              </span>
                            )}
                          </Link>
                        );
                      })()
                    ) : (
                      <>
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategory(categoryKey)}
                          className={`${getButtonStyles(
                            isCategoryActive(category.items),
                          )} group relative ${
                            !expanded ? "justify-center" : "justify-between"
                          } cursor-pointer`}
                          title={!expanded ? category.name : ""}
                        >
                          <div
                            className={`flex items-center ${!expanded ? "" : ""}`}
                          >
                            <div
                              className={`${
                                !expanded && openCategories[categoryKey]
                                  ? "flex h-8 w-8 items-center justify-center rounded-full bg-gold/20"
                                  : ""
                              }`}
                            >
                              <category.icon
                                className={`h-6 w-6 transition-all duration-200 ${
                                  expanded ? "mr-3" : ""
                                } ${!expanded && openCategories[categoryKey] ? "text-gold" : ""}`}
                              />
                            </div>
                            {expanded && (
                              <span className="text-sm font-medium">
                                {category.name}
                              </span>
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

                        {/* Category Items */}
                        {openCategories[categoryKey] && (
                          <div
                            className={`${expanded ? "ml-3 mt-2 space-y-1" : ""}`}
                          >
                            {category.items.map((item) => (
                              <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => {
                                  onLinkClick?.();
                                }}
                                className={`${getSubItemStyles(isActive(item.href))} ${
                                  !expanded ? "justify-center py-2" : "py-2"
                                }`}
                              >
                                <item.icon
                                  className={`${
                                    isActive(item.href) ? "h-6 w-6" : "h-5 w-5"
                                  } transition-all duration-200 ${expanded ? "mr-3" : ""}`}
                                />
                                {expanded && (
                                  <span className="text-sm">{item.name}</span>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ),
              )}
            </nav>
          </div>

          {/* Logout - Always visible at bottom */}
          <div className="flex-shrink-0 border-t border-brown-light py-4">
            <button
              onClick={handleLogoutClick}
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
              onConfirm={handleConfirmLogout}
              onCancel={handleCancelLogout}
            />
          </div>
        </div>
      </div>
    </>
  );
}
