import { Fragment, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useNotificationStore } from "../../../../../packages/store/notifications.slice";
import { SIDEBAR_TABS } from "../../../../../packages/schemas/auth/sidebar";
import NotificationBadge from "../../ui/NotificationBadge";
import type { UserProfile } from "../../../../../packages/schemas/auth/user";

type MobileSidebarProps = {
  user?: UserProfile;
  onLogout: () => void;
};

export default function MobileSidebar({
  user: _user,
  onLogout: _onLogout,
}: MobileSidebarProps) {
  const location = useLocation();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoaded = useNotificationStore((s) => s.isLoaded);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => {
    const hrefPathname = href.split("?")[0].split("#")[0];
    return (
      location.pathname === hrefPathname ||
      location.pathname.startsWith(hrefPathname + "/")
    );
  };

  // Navigation items for bottom bar - main tabs only
  const navItems = [
    {
      ...SIDEBAR_TABS.dashboard,
    },
    {
      ...SIDEBAR_TABS.search,
    },
    {
      ...SIDEBAR_TABS.decide,
    },
    {
      ...SIDEBAR_TABS.agent,
    },
    // {
    //   ...SIDEBAR_TABS.settings,
    // },
    {
      ...SIDEBAR_TABS.close,
    },
  ];

  const nav = (
    <nav
      className="fixed inset-x-0 bottom-0 z-[9999] w-screen border-t border-brown-light/20 bg-brown shadow-lg will-change-transform md:hidden"
      role="navigation"
      aria-label="Primary navigation"
    >
      <div className="safe-bottom flex h-16 items-center justify-around px-2">
        {navItems.map((item, index) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const isLast = index === navItems.length - 1;

          return (
            <Fragment key={item.key}>
              <Link
                to={item.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-all duration-200 ${
                  active ? "text-white" : "text-white/80 active:text-white/95"
                }`}
                aria-label={item.name}
                aria-current={active ? "page" : undefined}
              >
                <div className="relative">
                  <Icon
                    className={`h-6 w-6 transition-all duration-200 ${
                      active ? "scale-110" : ""
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {item.key === "agent" && isLoaded && (
                    <NotificationBadge
                      count={unreadCount}
                      className="absolute -right-1 -top-1 h-4 w-4 text-[10px]"
                    />
                  )}
                </div>
                <span
                  className={`text-xs font-medium transition-all duration-200 ${
                    active ? "scale-105" : ""
                  }`}
                >
                  {item.name}
                </span>
              </Link>
              {/* Spacing between items is handled by justify-around; no extra divider needed */}
              {!isLast && null}
            </Fragment>
          );
        })}
      </div>
    </nav>
  );

  // Portal to <body> to avoid route-specific stacking/scroll containers
  // interfering with `position: fixed` behavior on mobile browsers.
  if (!mounted) return null;
  return createPortal(nav, document.body);
}
