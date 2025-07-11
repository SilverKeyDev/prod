
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, FileText, BarChart2, LogOut, CreditCard } from "lucide-react";
import { User } from "../types/index.ts";
import { useEffect, useState } from "react";
import ConfirmationDialog from "./ConfirmationDialog";
import { apiRequest } from "../lib/api";

interface SidebarProps {
  user?: User; // make user optional to prevent crash
  onLogout: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}

const navigation = [
  { name: "Generate Report", href: "/dashboard", icon: Home },
  { name: "Past Reports", href: "/dashboard/reports", icon: FileText },
  { name: "Compare Reports", href: "/dashboard/compare-reports", icon: BarChart2 },
  { name: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
];


export default function Sidebar({
  onLogout,
  expanded,
  onToggleExpanded,
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
        const response = await apiRequest<User>('/api/v1/user/profile', {
          method: 'GET'
        });

        if (response.success && response.data) {
          // The response.data contains the user object
          setUser(response.data);
        } else {
          throw new Error(response.message || 'Failed to load user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        
        if (error instanceof Error) {
          if (error.message.includes('401') || error.message.includes('403')) {
            console.log('Redirecting to login due to auth error');
            navigate('/login');
          } else if (error.message.includes('Failed to fetch')) {
            console.error('Network error - check if the server is running');
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
    <aside
      className={`fixed top-0 bottom-0 left-0 z-50 bg-brown transition-all duration-200 ${
        expanded ? "w-72" : "w-16"
      }`}
    >
      <div className="h-full flex flex-col justify-between overflow-hidden">
        {/* Toggle Button */}
        <div className="p-2 border-b border-brown-light flex justify-end">
          <button
            onClick={onToggleExpanded}
            className="p-2 text-brown-light hover:text-white"
            aria-label="Toggle sidebar"
          >
            <svg
              className={`w-5 h-5 transform ${
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

        {/* Top Section */}
        <div className="flex-1 overflow-y-auto">
          {/* User Info (only when expanded) */}
          {expanded && (
            <div className="p-4 border-b border-brown-light">
              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-brown-light rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-brown-light rounded w-3/4"></div>
                      <div className="h-3 bg-brown-light rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center">
                    <span className="text-brown font-semibold text-sm">
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

          {/* Navigation */}
          <nav className="mt-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 transition-colors font-medium text-white ${
                  isActive(item.href)
                    ? "bg-brown-light text-white font-semibold"
                    : "text-brown-light/50 hover:bg-brown-light/50 hover:text-white"
                }`}
              >
                <item.icon className={`w-5 h-5 ${expanded ? "mr-4" : ""}`} />
                <span className={expanded ? "block" : "hidden"}>
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <div className="border-t border-brown-light">
          <button
            onClick={handleLogoutClick}
            className="flex items-center px-4 py-3 text-brown-light hover:bg-brown-light w-full"
          >
            <LogOut className={`w-5 h-5 ${expanded ? "mr-4" : ""}`} />
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
  );
}
