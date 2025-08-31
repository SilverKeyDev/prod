import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  BarChart2,
  Split,
  Search,
  Key,
  ChevronDown,
  ChevronRight,
  LogOut,
  User as UserIcon,
  CreditCard,
  MessageCircle,
  Users,
  Brain,
  Handshake,
  Home,
  FilePlus,
  Scale,
  ShieldCheck,
  Building2,
  KeyRound,
  //BadgeCheck,
  Bookmark,
  ClipboardList,
} from "lucide-react";
import { UserProfile } from "../../context";
import { useState } from "react";
import ConfirmationDialog from "../modals/ConfirmationDialog";

import { useUser } from "../../context";
import { useAgent } from "../../context/AgentContext";
import MiniLogo from "../ui/base/MiniLogo";
interface SidebarProps {
  user?: UserProfile; // make user optional to prevent crash
  onLogout: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  isMobile?: boolean;
}

// Define types for navigation items and structure
interface NavItem {
  name: string;
  href: string;
  icon: React.FC<{ className?: string }>;
}

interface NavCategory {
  name: string;
  icon: React.FC<{ className?: string }>;
  items: NavItem[];
}

type NavigationStructure = Record<string, NavCategory>;

// Navigation structure with categories and dropdown items
const navigationStructure: NavigationStructure = {
  dashboard: {
    name: "Dashboard",
    icon: Home,
    items: [{ name: "User Dashboard", href: "/dashboard", icon: UserIcon }],
  },
  onboard: {
    name: "Onboard",
    icon: ClipboardList,
    items: [
      {
        name: "Personalization",
        href: "/personalization",
        icon: UserIcon,
      },
      /*{
        name: "Get PreApproved",
        href: "/get-preapproved",
        icon: BadgeCheck,
      },*/
      {
        name: "Subscription",
        href: "/subscription",
        icon: CreditCard,
      },
    ],
  },
  search: {
    name: "Search",
    icon: Search,
    items: [
      { name: "Search", href: "/search", icon: Search },
      { name: "Saved Homes", href: "/saved", icon: Bookmark },
    ],
  },
  decide: {
    name: "Decide",
    icon: Split,
    items: [
      {
        name: "Generate Report",
        href: "/generate-report",
        icon: FilePlus,
      },
      { name: "Past Reports", href: "/reports", icon: FileText },
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
        name: "Negotiation Strategy",
        href: "/negotiation-strategy",
        icon: Brain,
      },
      /*{ name: "Draft Offer", href: "/dashboard/draft-offer", icon: FileText },*/
    ],
  },
  close: {
    name: "Close",
    icon: Key,
    items: [
      {
        name: "Escrow & Legal",
        href: "/escrow-legal-logistics",
        icon: Scale,
      }, // represents legal/balance
      {
        name: "Inspections & Due Diligence",
        href: "/inspections-due-diligence",
        icon: ShieldCheck,
      }, // safety/verification
      {
        name: "Financing & Insurance",
        href: "/financing-insurance",
        icon: Building2,
      }, // financial institution
      {
        name: "Closing & Move-In",
        href: "/closing-moving-in",
        icon: KeyRound,
      }, // handing over the key
    ],
  },
};

// Function to generate navigation array based on user type
const getNavigation = (isAgent?: boolean): NavigationStructure => {
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

  // Add user-specific items
  if (isAgent) {
    // For agents, show "Client Information"
    navigation.onboard.items.push({
      name: "Client Information",
      href: "/client-information",
      icon: Users,
    });
  } else {
    // For regular users, show "Agent Connection"
    navigation.onboard.items.push({
      name: "Agent Connection",
      href: "/agent-connection",
      icon: Users,
    });
  }

  return navigation;
};

export default function Sidebar({
  onLogout,
  expanded,
  onToggleExpanded,
  isMobile = false,
}: SidebarProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Consistent hover styles for all sidebar buttons
  const getButtonStyles = (isActive: boolean) => {
    const baseStyles = "w-full flex items-center py-3 transition-all duration-200 font-medium text-white touch-friendly rounded-lg";
    const activeStyles = "bg-brown-light/70 text-white font-semibold hover:bg-brown-light/80";
    const inactiveStyles = "text-white/70 hover:bg-brown-light/30 hover:text-beige hover:-translate-y-0.5 active:bg-brown-light/20 active:text-beige";
    
    return `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
  };
  
  const getSubItemStyles = (isActive: boolean) => {
    const baseStyles = "flex items-center transition-all duration-200 font-medium text-white touch-friendly rounded-lg";
    const activeStyles = "bg-brown-light text-white font-semibold hover:bg-brown-light/80";
    const inactiveStyles = "text-white/50 hover:bg-brown-light/50 hover:text-beige hover:-translate-y-0.5 active:bg-brown-light/30 active:text-beige";
    
    return `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
  };
  // Use userProfile from UserContext for all user info
  const { userProfile, loading: userProfileLoading } = useUser();
  const { isAgent } = useAgent();
  const isLoading = userProfileLoading;
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    {
      onboard: false,
      search: false,
      decide: false,
      negotiate: false,
      close: false,
    }
  );
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
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const isCategoryActive = (items: NavItem[]) => {
    return items.some((item) => isActive(item.href));
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && expanded && (
        <div
          className="mobile-backdrop"
          onClick={onToggleExpanded}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-brown text-white z-sidebar transition-all duration-300 ease-in-out safe-top
          ${isMobile 
            ? `w-80 ${expanded ? 'translate-x-0' : '-translate-x-full'} px-4` 
            : `${expanded ? 'w-64 px-4' : 'w-16 px-2'}`
          }
        `}
      >
        <div
          className="h-full flex flex-col overflow-hidden line-clamp-1"
          style={{
            height: isMobile ? "100vh" : "100%",
            maxHeight: isMobile ? "100vh" : "100%",
          }}
        >
          {/* Header with Logo and Toggle Button */}
          <div className="flex-shrink-0 py-2 flex justify-between items-center">
            {/* Logo */}
            <div
              className="text-white flex items-center"
              style={{ filter: "brightness(0) invert(1)" }}
            >
              {/* User Info (only when expanded) */}
              {expanded && (
                <div className="flex-shrink-0 py-4">
                  {isLoading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="flex items-center space-x-4">
                        <div className="w-6 h-6 bg-brown-light rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-brown-light rounded w-3/4"></div>
                          <div className="h-3 bg-brown-light rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div style={{ filter: "brightness(0) invert(1)" }} className="ml-1">
                        <MiniLogo className="w-6 h-6" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-white line-clamp-1">
                          {userProfile?.name ?? "Unknown User"}
                        </p>
                        <p className="text-xs text-white/80 line-clamp-1">
                          {userProfile?.email ?? "No email"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Toggle Button */}
            <button
              onClick={onToggleExpanded}
              className="p-2 text-white hover:text-white ml-auto touch-friendly"
              aria-label="Toggle sidebar"
            >
              <svg
                className={`w-6 h-6 transform ${
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
          </div>

          {/* Navigation - Scrollable middle section */}
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
            <nav className="mt-4 pb-4">
              {Object.entries(getNavigation(isAgent())).map(
                ([categoryKey, category]: [string, NavCategory]) => (
                  <div key={categoryKey}>
                    {/* Render certain categories as direct links (search, dashboard) */}
                    {categoryKey === "dashboard" ? (
                      <Link
                        to={category.items[0]?.href || "/"}
                        className={`${getButtonStyles(isActive("/"))} ${
                            !expanded ? "justify-center" : ""
                          }`}
                        title={!expanded ? category.name : ""}
                      >
                        <category.icon
                          className={`w-6 h-6 transition-all duration-200 ${
                            expanded ? "mr-3" : ""
                          }`}
                        />
                        <span className={expanded ? "block" : "hidden"}>
                          {category.name}
                        </span>
                      </Link>
                    ) : (
                      <>
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategory(categoryKey)}
                          className={`${getButtonStyles(isCategoryActive(category.items))} relative group ${
                            !expanded ? "justify-center" : "justify-between"
                          }`}
                          title={!expanded ? category.name : ""}
                        >
                          <div className={`flex items-center ${!expanded ? "" : ""}`}>
                            <div className={`${
                              !expanded && openCategories[categoryKey] 
                                ? "w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center" 
                                : ""
                            }`}>
                              <category.icon
                                className={`w-6 h-6 transition-all duration-200 ${
                                  expanded ? "mr-3" : ""
                                } ${
                                  !expanded && openCategories[categoryKey] ? "text-gold" : ""
                                }`}
                              />
                            </div>
                            <span className={expanded ? "block" : "hidden"}>
                              {category.name}
                            </span>
                          </div>
                          {!expanded && openCategories[categoryKey] && (
                            <div className="absolute right-1 top-1 w-2 h-2 bg-gold rounded-full"></div>
                          )}
                          {expanded && !isMobile &&
                            (openCategories[categoryKey] ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            ))}
                        </button>

                        {/* Category Items */}
                        {openCategories[categoryKey] && (
                          <div className={`${expanded ? "ml-3 mt-2 space-y-1" : ""}`}>
                            {category.items.map((item) => (
                              <Link
                                key={item.name}
                                to={item.href}
                                className={`${getSubItemStyles(isActive(item.href))} ${
                                  !expanded ? "justify-center py-2" : "py-2"
                                }`}
                              >
                                <item.icon
                                  className={`${
                                    isActive(item.href) ? "w-6 h-6" : "w-5 h-5"
                                  } transition-all duration-200 ${
                                    expanded ? "mr-3" : ""
                                  }`}
                                />
                                <span
                                  className={
                                    expanded ? "block text-sm" : "hidden"
                                  }
                                >
                                  {item.name}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              )}
            </nav>
          </div>

          {/* Logout - Always visible at bottom */}
          <div className="flex-shrink-0 border-t border-brown-light py-4">
            <button
              onClick={handleLogoutClick}
              className={`${getButtonStyles(false).replace('text-white/70', 'text-white')} ${
                !expanded ? "justify-center py-3" : "py-3"
              }`}
            >
              <LogOut className={`w-6 h-6 ${expanded ? "mr-3" : ""}`} />
              <span className={expanded ? "block" : "hidden"}>Logout</span>
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
