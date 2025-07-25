import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, FileText, BarChart2, LogOut, CreditCard, User as UserIcon } from "lucide-react";
import { User } from "../types/index.ts";
import { useEffect, useState } from "react";
import ConfirmationDialog from "./ConfirmationDialog";
import { apiRequest } from "../lib/api";

interface SidebarProps {
  user?: User; // make user optional to prevent crash
  onLogout: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  isMobile?: boolean;
}

const navigation = [
  { name: "Generate Report", href: "/dashboard", icon: Home },
  { name: "Past Reports", href: "/dashboard/reports", icon: FileText },
  {
    name: "Compare Reports",
    href: "/dashboard/compare-reports",
    icon: BarChart2,
  },
  { name: "Personalization", href: "/dashboard/personalization", icon: UserIcon },
  { name: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
];

export default function Sidebar({
  onLogout,
  expanded,
  onToggleExpanded,
  isMobile = false,
}: SidebarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest<User>("/api/v1/user/profile", {
          method: "GET",
        });

        if (response.success && response.data) {
          // The response.data contains the user object
          setUser(response.data);
        } else {
          throw new Error(response.message || "Failed to load user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);

        if (error instanceof Error) {
          if (error.message.includes("401") || error.message.includes("403")) {
            console.log("Redirecting to login due to auth error");
            navigate("/login");
          } else if (error.message.includes("Failed to fetch")) {
            console.error("Network error - check if the server is running");
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.endsWith(href);

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
              ? "w-72 translate-x-0"
              : "w-12 translate-x-0" // Always show collapsed sidebar on mobile
            : expanded
            ? "w-72"
            : "w-16"
        }`}
      >
        <div
          className="h-full flex flex-col overflow-hidden"
          style={{
            height: isMobile ? "100vh" : "100%",
            maxHeight: isMobile ? "100vh" : "100%",
          }}
        >
          {/* Toggle Button */}
          <div className="flex-shrink-0 p-2 border-b border-brown-light flex justify-between items-center">
            {/* Logo/Title for mobile */}
            {isMobile && expanded && (
              <span className="text-white font-bold text-lg">SilverKey</span>
            )}
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

          {/* User Info (only when expanded) */}
          {expanded && (
            <div className="flex-shrink-0 p-4 border-b border-brown-light">
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
                  <div className="w-9 h-9 bg-gold rounded-full flex items-center justify-center">
                    <span className="text-black font-semibold" style={{ fontSize: '16px' }}>
                      {user?.name?.charAt(0).toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-white line-clamp-1">
                      {user?.name ?? "Unknown User"}
                    </p>
                    <p className="text-xs text-white/80 line-clamp-1">
                      {user?.email ?? "No email"}
                    </p>
                    {user?.agencyName && (
                      <p className="text-xs text-white/60 line-clamp-1">
                        {user.agencyName}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation - Scrollable middle section */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <nav className="mt-4 pb-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 transition-colors font-medium text-white touch-friendly ${
                    isActive(item.href)
                      ? "bg-brown-light text-white font-semibold"
                      : "text-white/50 hover:bg-brown-light/50 hover:text-white active:bg-brown-light/30"
                  }`}
                >
                  <item.icon className={`${isActive(item.href) ? "w-8 h-8" : "w-6 h-6"} transition-all duration-200 ${expanded ? "mr-4" : ""}`} />
                  <span className={expanded ? "block" : "hidden"}>
                    {item.name}
                  </span>
                </Link>
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
