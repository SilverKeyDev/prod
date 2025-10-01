import {
  BarChart2,
  Split,
  Search,
  Key,
  ChevronDown,
  ChevronRight,
  LogOut,
  MessageCircle,
  Brain,
  Handshake,
  Home,
  FilePlus,
  ClipboardList,
  UserPlus,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../../../app/providers/auth/useAuth";
import { useUser } from "../../../../../packages/contexts";
import type { UserProfile } from "../../../../../packages/schemas/user";
import ConfirmationDialog from "../../modals/ConfirmationDialog";
import WhiteLogo from "../../ui/asset/WhiteLogo";

import { getButtonStyles, getSubItemStyles } from "./sidebarStyles";
import { useViewStore } from "../../../../../packages/store/view.slice";
type SidebarProps = {
  user?: UserProfile;
  onLogout: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
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

// Navigation structure with categories and dropdown items
const navigationStructure: NavigationStructure = {
  dashboard: {
    name: "Dashboard",
    icon: Home,
    items: [{ name: "Home", href: "/dashboard", icon: Home }],
  },
  onboard: {
    name: "Onboard",
    icon: ClipboardList,
    items: [
      {
        name: "Preferences",
        href: "/personalization",
        icon: UserPlus,
      },
    ],
  },
  search: {
    name: "Search",
    icon: Search,
    items: [{ name: "Search", href: "/search", icon: Search }],
  },
  decide: {
    name: "Find the Best Fit",
    icon: Split,
    items: [
      {
        name: "Generate Report",
        href: "/generate-report",
        icon: FilePlus,
      },
      {
        name: "Compare Reports",
        href: "/compare-reports",
        icon: BarChart2,
      },
      {
        name: "AI Assistant",
        href: "/ai-assistant",
        icon: MessageCircle,
      },
    ],
  },
  negotiate: {
    name: "Negotiate",
    icon: Handshake,
    items: [
      {
        name: "Negotiation Advisor",
        href: "/negotiation-strategy",
        icon: Brain,
      },
      /*{ name: "Draft Offer", href: "/dashboard/draft-offer", icon: FileText },*/
    ],
  },
  close: {
    name: "Buyer Checklists",
    icon: Key,
    items: [
      {
        name: "Buyer Checklists",
        href: "/buyer-checklists",
        icon: Key,
      },
    ],
  },
};

// Function to generate navigation array based on user type
const getNavigation = (): NavigationStructure => {
  // Create a proper copy of the navigation structure
  const navigation: NavigationStructure = {
    dashboard: {
      name: navigationStructure.dashboard.name,
      icon: navigationStructure.dashboard.icon,
      items: [...navigationStructure.dashboard.items],
    },
    onboard: {
      name: navigationStructure.onboard.name,
      icon: navigationStructure.onboard.icon,
      items: [...navigationStructure.onboard.items],
    },
    search: {
      name: navigationStructure.search.name,
      icon: navigationStructure.search.icon,
      items: [...navigationStructure.search.items],
    },
    decide: {
      name: navigationStructure.decide.name,
      icon: navigationStructure.decide.icon,
      items: [...navigationStructure.decide.items],
    },
    negotiate: {
      name: navigationStructure.negotiate.name,
      icon: navigationStructure.negotiate.icon,
      items: [...navigationStructure.negotiate.items],
    },
    close: {
      name: navigationStructure.close.name,
      icon: navigationStructure.close.icon,
      items: [...navigationStructure.close.items],
    },
  };

  return navigation;
};

export default function Sidebar({
  onLogout,
  expanded,
  onToggleExpanded,
  isMobile,
  onLinkClick,
}: SidebarProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  // Get user data from auth context (already available from login)
  const { user: authUser } = useAuth();
  // Use userProfile from UserContext for all user info
  const { userProfile, userLoading: userProfileLoading } = useUser();

  // Prioritize complete userProfile data over incomplete authUser
  const displayUser = userProfile ?? authUser;
  const isLoading = userProfileLoading && !userProfile;

  const openCategories = useViewStore((s) => s.openCategories);
  const toggleCategoryInStore = useViewStore((s) => s.toggleCategory);
  const location = useLocation();

  // Get userProfile from UserContext for agent check
  // Already destructured above.

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

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.endsWith(href);

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
        className={`safe-top fixed left-0 top-0 z-sidebar h-full bg-brown text-white transition-all duration-300 ease-in-out ${expanded ? "w-64 px-4" : "w-16 px-2"} `}
      >
        <div
          className="line-clamp-1 flex h-full flex-col overflow-hidden"
          style={{
            height: "100%",
            maxHeight: "100%",
          }}
        >
          {/* Header with Logo and Toggle Button */}
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
                        <p className="line-clamp-1 text-sm font-medium text-white">
                          {displayUser?.name ?? "Unknown User"}
                        </p>
                        <p className="line-clamp-1 text-xs text-white/80">
                          {displayUser?.email ?? "No email"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Toggle Button - Hidden on mobile */}
            {!isMobile && (
              <button
                onClick={onToggleExpanded}
                className="touch-friendly ml-auto cursor-pointer rounded-lg p-2 text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brown-light/30 hover:text-beige active:bg-brown-light/20 active:text-beige"
                aria-label="Toggle sidebar"
              >
                <svg
                  className={`h-6 w-6 transform ${
                    expanded ? "rotate-180" : "rotate-0"
                  } transition-transform duration-200`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Navigation - Scrollable middle section */}
          <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
            <nav className="mt-4 pb-4">
              {Object.entries(getNavigation()).map(
                ([categoryKey, category]: [string, NavCategory]) => (
                  <div key={categoryKey}>
                    {/* Render certain categories as direct links (dashboard, onboard, search, negotiate, close) */}
                    {categoryKey === "dashboard" ||
                    categoryKey === "onboard" ||
                    categoryKey === "search" ||
                    categoryKey === "negotiate" ||
                    categoryKey === "close" ? (
                      (() => {
                        const firstItem = category.items[0];
                        const ItemIcon = firstItem?.icon;
                        return (
                          <Link
                            to={firstItem?.href ?? "/"}
                            onClick={() => {
                              console.log(
                                `[SIDEBAR] ${categoryKey === "dashboard" ? "🏠" : categoryKey === "onboard" ? "📋" : categoryKey === "search" ? "🔍" : categoryKey === "negotiate" ? "🤝" : "🔑"} ${firstItem?.name} navigation clicked:`,
                                {
                                  href: firstItem?.href ?? "/",
                                  userProfile: userProfile
                                    ? {
                                        id: userProfile.id,
                                        email: userProfile.email,
                                      }
                                    : null,
                                },
                              );
                              onLinkClick?.();
                            }}
                            className={`${getButtonStyles(isActive(firstItem?.href ?? "/"))} ${
                              !expanded ? "justify-center" : ""
                            }`}
                            title={!expanded ? firstItem?.name : ""}
                          >
                            {ItemIcon && (
                              <ItemIcon
                                className={`h-6 w-6 transition-all duration-200 ${
                                  expanded ? "mr-3" : ""
                                }`}
                              />
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
              Logout
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
