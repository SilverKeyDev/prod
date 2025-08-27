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
  Bookmark,
  ClipboardList,
  Menu,
} from "lucide-react";
import { UserProfile } from "../../context";
import { useState } from "react";
import ConfirmationDialog from "../modals/ConfirmationDialog";
import { useUser } from "../../context";
import MiniLogo from "../ui/MiniLogo";

interface MobileSidebarProps {
  user?: UserProfile;
  onLogout: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
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
        href: "/dashboard/personalization",
        icon: UserIcon,
      },
      {
        name: "Subscription",
        href: "/dashboard/subscription",
        icon: CreditCard,
      },
    ],
  },
  search: {
    name: "Search",
    icon: Search,
    items: [
      { name: "Search", href: "/dashboard/search", icon: Search },
      { name: "Saved Homes", href: "/dashboard/saved", icon: Bookmark },
    ],
  },
  decide: {
    name: "Decide",
    icon: Split,
    items: [
      {
        name: "Generate Report",
        href: "/dashboard/generate-report",
        icon: FilePlus,
      },
      { name: "Past Reports", href: "/dashboard/reports", icon: FileText },
      {
        name: "Compare Reports",
        href: "/dashboard/compare-reports",
        icon: BarChart2,
      },
      {
        name: "AI Assistant",
        href: "/dashboard/ai-assistant",
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
        href: "/dashboard/negotiation-strategy",
        icon: Brain,
      },
    ],
  },
  close: {
    name: "Close",
    icon: Key,
    items: [
      {
        name: "Escrow & Legal",
        href: "/dashboard/escrow-legal-logistics",
        icon: Scale,
      },
      {
        name: "Inspections & Due Diligence",
        href: "/dashboard/inspections-due-diligence",
        icon: ShieldCheck,
      },
      {
        name: "Financing & Insurance",
        href: "/dashboard/financing-insurance",
        icon: Building2,
      },
      {
        name: "Closing & Move-In",
        href: "/dashboard/closing-moving-in",
        icon: KeyRound,
      },
    ],
  },
};

// Function to generate navigation array based on user type
const getNavigation = (isAgent?: boolean): NavigationStructure => {
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
    navigation.onboard.items.push({
      name: "Client Information",
      href: "/dashboard/client-information",
      icon: Users,
    });
  } else {
    navigation.onboard.items.push({
      name: "Agent Connection",
      href: "/dashboard/agent-connection",
      icon: Users,
    });
  }

  return navigation;
};

export default function MobileSidebar({
  onLogout,
  expanded,
  onToggleExpanded,
}: MobileSidebarProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { userProfile, loading: userProfileLoading } = useUser();
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

  // When collapsed, only show the toggle button in top left corner
  if (!expanded) {
    return (
      <button
        onClick={onToggleExpanded}
        className="fixed top-4 left-4 z-50 p-3 bg-brown text-white rounded-lg shadow-lg hover:bg-brown-light hover:text-beige active:text-beige transition-all duration-300 ease-in-out transform hover:scale-105 touch-friendly"
        aria-label="Open sidebar"
        style={{ position: 'fixed', top: '1rem', left: '1rem' }}
      >
        <Menu className="w-6 h-6" />
      </button>
    );
  }

  // When expanded, show full sidebar with backdrop
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black z-40 transition-opacity duration-300 ease-in-out"
        style={{
          opacity: expanded ? 0.5 : 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
        onClick={onToggleExpanded}
      />

      {/* Full Sidebar */}
      <div className="fixed top-0 left-0 h-full bg-brown text-white z-50 w-80 transform transition-all duration-300 ease-in-out safe-top animate-slide-in-left">
        <div
          className="h-full flex flex-col animate-fade-in"
          style={{
            height: "100vh",
            maxHeight: "100vh",
            animationDelay: "150ms"
          }}
        >
          {/* Header with Logo and Toggle Button - Fixed at top */}
          <div className="flex-shrink-0 p-4 flex justify-between items-center border-b border-brown-light sticky top-0 bg-brown z-10">
            {/* User Info */}
            <div className="flex items-center flex-1">
              {isLoading ? (
                <div className="animate-pulse space-y-3 flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-brown-light rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-brown-light rounded w-3/4"></div>
                      <div className="h-3 bg-brown-light rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <div style={{ filter: "brightness(0) invert(1)" }}>
                    <MiniLogo className="w-8 h-8" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">
                      {userProfile?.name ?? "Unknown User"}
                    </p>
                    <p className="text-xs text-white/80">
                      {userProfile?.email ?? "No email"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={onToggleExpanded}
              className="p-2 text-white hover:bg-brown-light hover:text-beige active:text-beige rounded-lg transition-all duration-200 touch-friendly"
              aria-label="Close sidebar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation - Scrollable middle section */}
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
            <nav className="p-4 space-y-2">
              {Object.entries(getNavigation(userProfile?.is_agent)).map(
                ([categoryKey, category]: [string, NavCategory]) => (
                  <div key={categoryKey}>
                    {/* Render dashboard as direct link */}
                    {categoryKey === "dashboard" ? (
                      <Link
                        to={category.items[0]?.href || "/dashboard"}
                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 font-medium touch-friendly ${
                          isActive("/dashboard")
                            ? "bg-brown-light text-white font-semibold hover:text-white"
                            : "text-white/80 hover:bg-brown-light/50 hover:text-beige hover:-translate-y-0.5 active:text-beige"
                        }`}
                        onClick={onToggleExpanded}
                      >
                        <category.icon className="w-6 h-6 mr-3" />
                        <span>{category.name}</span>
                      </Link>
                    ) : (
                      <>
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategory(categoryKey)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 font-medium touch-friendly ${
                            isCategoryActive(category.items)
                              ? "bg-brown-light text-white font-semibold hover:text-white"
                              : "text-white/80 hover:bg-brown-light/50 hover:text-beige hover:-translate-y-0.5 active:text-beige"
                          }`}
                        >
                          <div className="flex items-center">
                            <category.icon className="w-6 h-6 mr-3" />
                            <span>{category.name}</span>
                          </div>
                          {openCategories[categoryKey] ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>

                        {/* Category Items */}
                        {openCategories[categoryKey] && (
                          <div className="ml-4 mt-2 space-y-1">
                            {category.items.map((item) => (
                              <Link
                                key={item.name}
                                to={item.href}
                                onClick={onToggleExpanded}
                                className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 font-medium touch-friendly ${
                                  isActive(item.href)
                                    ? "bg-brown-light text-white font-semibold hover:text-white"
                                    : "text-white/60 hover:bg-brown-light/30 hover:text-beige hover:-translate-y-0.5 active:text-beige"
                                }`}
                              >
                                <item.icon className="w-5 h-5 mr-3" />
                                <span className="text-sm">{item.name}</span>
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

          {/* Logout - Fixed at bottom */}
          <div className="flex-shrink-0 border-t border-brown-light p-4 sticky bottom-0 bg-brown z-10">
            <button
              onClick={handleLogoutClick}
              className="flex items-center px-4 py-3 text-white hover:bg-brown-light/50 hover:text-beige hover:-translate-y-0.5 active:text-beige rounded-lg w-full touch-friendly transition-all duration-200"
            >
              <LogOut className="w-6 h-6 mr-3" />
              <span>Logout</span>
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
