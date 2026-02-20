import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Link, useLocation } from "react-router-dom";

import type { UserProfile } from "packages/schemas/app/auth/user";
import { useNotificationStore } from "packages/store";

import {
  SIDEBAR_TABS,
  type SidebarTabKey,
} from "@/app/layouts/sidebar/sidebarTabs.web";
import { NotificationBadge } from "@/components/ui/index.web";
import { SearchNavLink } from "@/features/search/index.web";

const BOTTOM_NAV_KEYS: SidebarTabKey[] = [
  "dashboard",
  "search",
  "decide",
  "agent",
  "profile",
];
const navItems = BOTTOM_NAV_KEYS.map((k) => SIDEBAR_TABS[k]);

const BAR_CLASS =
  "fixed inset-x-0 bottom-0 z-[9999] flex w-full min-h-[4rem] flex-col border-t border-brown-light/20 bg-brown shadow-lg md:hidden";
function linkClass(active: boolean): string {
  return `flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-all duration-200 ${active ? "text-white" : "text-white/80 active:text-white/95"}`;
}
function iconClass(active: boolean): string {
  return `h-6 w-6 transition-all duration-200 ${active ? "scale-110" : ""}`;
}
function labelClass(active: boolean): string {
  return `text-xs font-medium transition-all duration-200 ${active ? "scale-105" : ""}`;
}

type BottomNavItemsProps = {
  items: typeof navItems;
  isActive: (href: string) => boolean;
  unreadCount: number;
  isLoaded: boolean;
};

function BottomNavItems({
  items,
  isActive,
  unreadCount,
  isLoaded,
}: BottomNavItemsProps) {
  return (
    <>
      {items.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        const content = (
          <>
            <div className="relative">
              <Icon
                className={iconClass(active)}
                strokeWidth={active ? 2.5 : 2}
              />
              {item.key === "agent" && isLoaded && (
                <NotificationBadge
                  count={unreadCount}
                  className="absolute -right-1 -top-1 h-4 w-4 text-[10px]"
                />
              )}
            </div>
            <span className={labelClass(active)}>{item.name}</span>
          </>
        );
        return item.key === "search" ? (
          <SearchNavLink
            key={item.key}
            className={linkClass(active)}
            aria-label={item.name}
            aria-current={active ? "page" : undefined}
          >
            {content}
          </SearchNavLink>
        ) : (
          <Link
            key={item.key}
            to={item.href}
            className={linkClass(active)}
            aria-label={item.name}
            aria-current={active ? "page" : undefined}
          >
            {content}
          </Link>
        );
      })}
    </>
  );
}

type MobileBottomNavProps = {
  user?: UserProfile;
  onLogout?: () => void;
};

export default function MobileBottomNav(_props: MobileBottomNavProps) {
  const location = useLocation();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoaded = useNotificationStore((s) => s.isLoaded);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isActive = (href: string) => {
    const path = href.split("?")[0].split("#")[0];
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const nav = (
    <nav
      className={BAR_CLASS}
      style={{
        paddingTop: "max(env(safe-area-inset-bottom), 4px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 4px)",
      }}
      role="navigation"
      aria-label="Primary navigation"
    >
      <div className="flex min-h-16 flex-1 flex-col items-center justify-center">
        <div className="flex w-full items-center justify-around px-2">
          <BottomNavItems
            items={navItems}
            isActive={isActive}
            unreadCount={unreadCount}
            isLoaded={isLoaded}
          />
        </div>
      </div>
    </nav>
  );

  if (!mounted) return null;
  return createPortal(nav, document.body);
}
