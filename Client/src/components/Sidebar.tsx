import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  BarChart2,
  Settings,
  Search,
  Crosshair,
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
  BadgeCheck,
} from "lucide-react";
import { User } from "../types/index.ts";
import { useState } from "react";
import ConfirmationDialog from "./ConfirmationDialog";

import { useData } from "../contexts/DataContext";
import MiniLogo from "./MiniLogo";
interface SidebarProps {
  user?: User; // make user optional to prevent crash
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
    items: [      { name: "User Dashboard", href: "/dashboard/user-dashboard", icon: UserIcon }
    ],
  },
  onboard: {
    name: "Onboard",
    icon: Settings,
    items: [
      { name: "Personalization", href: "/dashboard/personalization", icon: UserIcon },
      { name: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
      { name: "Get PreApproved", href: "/dashboard/get-preapproved", icon: BadgeCheck },
    ],
  },
  search: {
    name: "Search",
    icon: Search,
    items: [],
  },
  decide: {
    name: "Decide",
    icon: Crosshair,
    items: [
      { name: "Generate Report", href: "/dashboard", icon: FilePlus },
      { name: "Past Reports", href: "/dashboard/reports", icon: FileText },
      { name: "Compare Reports", href: "/dashboard/compare-reports", icon: BarChart2 },
      { name: "AI Assistant", href: "/dashboard/ai-assistant", icon: MessageCircle },
    ],
  },
  negotiate: {
    name: "Negotiate",
    icon: Handshake,
    items: [
      { name: "Negotiation Strategy", href: "/dashboard/negotiation-strategy", icon: Brain },
      { name: "Draft Offer", href: "/dashboard/draft-offer", icon: FileText },
    ],
  },
  close: {
    name: "Close",
    icon: Key,
    items: [
      { name: "Escrow & Legal", href: "/dashboard/escrow-legal-logistics", icon: Scale }, // represents legal/balance
      { name: "Inspections & Due Diligence", href: "/dashboard/inspections-due-diligence", icon: ShieldCheck }, // safety/verification
      { name: "Financing & Insurance", href: "/dashboard/financing-insurance", icon: Building2 }, // financial institution
      { name: "Closing & Move-In", href: "/dashboard/closing-moving-in", icon: KeyRound }, // handing over the key
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
      items: [...navigationStructure.dashboard.items]
    },
    onboard: {
      name: navigationStructure.onboard.name,
      icon: navigationStructure.onboard.icon,
      items: [...navigationStructure.onboard.items]
    },
    search: {
      name: navigationStructure.search.name,
      icon: navigationStructure.search.icon,
      items: [...navigationStructure.search.items]
    },
    decide: {
      name: navigationStructure.decide.name,
      icon: navigationStructure.decide.icon,
      items: [...navigationStructure.decide.items]
    },
    negotiate: {
      name: navigationStructure.negotiate.name,
      icon: navigationStructure.negotiate.icon,
      items: [...navigationStructure.negotiate.items]
    },
    close: {
      name: navigationStructure.close.name,
      icon: navigationStructure.close.icon,
      items: [...navigationStructure.close.items]
    }
  };
  
  // Add user-specific items
  if (isAgent) {
    // For agents, show "Client Information"
    navigation.onboard.items.push({ name: "Client Information", href: "/dashboard/client-information", icon: Users });
  } else {
    // For regular users, show "Agent Connection"
    navigation.onboard.items.push({ name: "Agent Connection", href: "/dashboard/agent-connection", icon: Users });
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
  // Use userProfile from DataContext for all user info
  const { userProfile, userProfileLoading } = useData();
  const isLoading = userProfileLoading;
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    onboard: false,
    search: false,
    decide: false,
    negotiate: false,
    close: false,
  });
  const location = useLocation();

  // Get userProfile from DataContext for agent check
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

  // No local fetchUserData; userProfile is loaded by DataContext on login/app load.

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.endsWith(href);
    
  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  const isCategoryActive = (items: NavItem[]) => {
    return items.some(item => isActive(item.href));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && expanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggleExpanded}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-brown transition-all duration-200 ${
          isMobile
            ? expanded
              ? "w-67 translate-x-0"
              : "w-16 translate-x-0" // Always show collapsed sidebar on mobile
            : expanded
            ? "w-67"
              : "w-16"
        }`}
      >
        <div
          className="h-full flex flex-col overflow-hidden line-clamp-1"
          style={{
            height: isMobile ? "100vh" : "100%",
            maxHeight: isMobile ? "100vh" : "100%",
          }}
        >
          {/* Header with Logo and Toggle Button */}
          <div className="flex-shrink-0 p-2 flex justify-between items-center">
            {/* Logo */}
            <div className="text-white flex items-center" style={{ filter: 'brightness(0) invert(1)' }}>
              {/* User Info (only when expanded) */}
              {expanded && (
                <div className="flex-shrink-0 p-4">
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
                      <div style={{ filter: 'brightness(0) invert(1)' }}>
                        <MiniLogo className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
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
          <div className="flex-1 overflow-y-auto min-h-0">
            <nav className="mt-4 pb-4">
              {Object.entries(getNavigation(userProfile?.is_agent)).map(([categoryKey, category]: [string, NavCategory]) => (
                <div key={categoryKey}>
                  {/* Render certain categories as direct links (search, dashboard) */}
                  {categoryKey === 'search' || categoryKey === 'dashboard' ? (
                    <Link
                      to={categoryKey === 'search' ? "/dashboard/search" : (category.items[0]?.href || "/dashboard") }
                      className={`w-full flex items-center px-4 py-3 transition-colors font-medium text-white touch-friendly ${
                        isActive('/dashboard/search') 
                          ? "bg-brown-light/70 text-white font-semibold" 
                          : "text-white/70 hover:bg-brown-light/30 hover:text-white active:bg-brown-light/20"
                      }`}
                    >
                      <category.icon 
                        className={`w-6 h-6 transition-all duration-200 ${expanded ? "mr-4" : ""}`} 
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
                        className={`w-full flex items-center justify-between px-4 py-3 transition-colors font-medium text-white touch-friendly ${
                          isCategoryActive(category.items) 
                            ? "bg-brown-light/70 text-white font-semibold" 
                            : "text-white/70 hover:bg-brown-light/30 hover:text-white active:bg-brown-light/20"
                        }`}
                      >
                        <div className="flex items-center">
                          <category.icon 
                            className={`w-6 h-6 transition-all duration-200 ${expanded ? "mr-4" : ""}`} 
                          />
                          <span className={expanded ? "block" : "hidden"}>
                            {category.name}
                          </span>
                        </div>
                        {expanded && (
                          openCategories[categoryKey] ? 
                            <ChevronDown className="w-5 h-5" /> : 
                            <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      
                      {/* Category Items */}
                      {openCategories[categoryKey] && (
                        <div className={`${expanded ? "ml-4" : ""}`}>
                          {category.items.map((item) => (
                            <Link
                              key={item.name}
                              to={item.href}
                              className={`flex items-center px-4 py-2 transition-colors font-medium text-white touch-friendly ${
                                isActive(item.href)
                                  ? "bg-brown-light text-white font-semibold"
                                  : "text-white/50 hover:bg-brown-light/50 hover:text-white active:bg-brown-light/30"
                              }`}
                            >
                              <item.icon
                                className={`${
                                  isActive(item.href) ? "w-6 h-6" : "w-5 h-5"
                                } transition-all duration-200 ${expanded ? "mr-3" : ""}`}
                              />
                              <span className={expanded ? "block text-sm" : "hidden"}>
                                {item.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Logout - Always visible at bottom */}
          <div className="flex-shrink-0 border-t border-brown-light mb-4 sm:mb-0">
            <button
              onClick={handleLogoutClick}
              className="flex items-center px-4 py-3 text-white hover:bg-brown-light/50 active:bg-brown-light/30 w-full touch-friendly transition-colors"
            >
              <LogOut className={`w-6 h-6 ${expanded ? "mr-4" : ""}`} />
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
      </aside>
    </>
  );
}
