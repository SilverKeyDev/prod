import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { useNotificationStore } from "../../../../../packages/store/notifications.slice";
import { SIDEBAR_TABS } from "../../../../../packages/schemas/sidebar";
import NotificationBadge from "../../ui/NotificationBadge";
import type { UserProfile } from "../../../../../packages/schemas/user";

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
      key: "search",
      ...SIDEBAR_TABS.search,
    },
    {
      key: "decide",
      ...SIDEBAR_TABS.decide,
    },
    {
      key: "agent",
      ...SIDEBAR_TABS.agent,
    },
    {
      key: "close",
      ...SIDEBAR_TABS.close,
    },
    // {
    //   key: "settings",
    //   ...SIDEBAR_TABS.settings,
    // },
    {
      key: "calendar",
      ...SIDEBAR_TABS.calendar,
    },
  ];

  return (
    <>
      {/* Bottom Navigation Bar - Instagram style - Only on mobile (< 768px) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-brown-light/20 bg-brown shadow-lg md:hidden">
        <div className="safe-bottom flex h-16 items-center justify-around px-2">
          {navItems.map((item, index) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const showBadge = item.key === "agent" && unreadCount > 0;
            const isLast = index === navItems.length - 1;

            return (
              <Fragment key={item.key}>
                <Link
                  to={item.href}
                  className={`flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-all duration-200 ${
                    active ? "text-gold" : "text-white/70 active:text-white/90"
                  }`}
                  aria-label={item.name}
                >
                  <div className="relative">
                    <Icon
                      className={`h-6 w-6 transition-all duration-200 ${
                        active ? "scale-110" : ""
                      }`}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    {showBadge && (
                      <NotificationBadge
                        count={unreadCount}
                        className="absolute -right-1 -top-1 h-4 w-4 text-[10px]"
                      />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium transition-all duration-200 ${
                      active ? "scale-105" : ""
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
                {/* Thin off-white divider between items */}
                {!isLast && <div className="h-8 w-px bg-off-white/20" />}
              </Fragment>
            );
          })}
        </div>
      </nav>
    </>
  );
}
