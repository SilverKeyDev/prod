import { useEffect, useState } from "react";

import { Icon } from "@ui/icons";
import { useLocation } from "react-router-dom";

import { SearchNavLink } from "packages/features/search";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Link } from "packages/navigation";
import { useNotificationStore } from "packages/store";
import { Portal } from "packages/ui/components/portal";
import { Box } from "packages/ui/components/primitives";
import { NotificationBadge } from "packages/ui/components/primitives/index.web";
import { tailwindNavChromeNavText } from "packages/ui/styles/theme/navTabTypography";

import { useDashboardShellRoutePrefetch } from "@/app/layouts/dashboard/useDashboardShellRoutePrefetch.web";
import { SIDEBAR_TABS, type SidebarTabKey } from "@/app/layouts/sidebar/sidebarTabs.web";
import type { UserProfile } from "@/features/homeauth/types";

function genNavId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

const BOTTOM_NAV_KEYS: SidebarTabKey[] = ["dashboard", "search", "decide", "agent", "profile"];
const navItems = BOTTOM_NAV_KEYS.map((k) => SIDEBAR_TABS[k]);

const BAR_CLASS =
  "fixed inset-x-0 bottom-0 z-dock flex w-full min-h-[4rem] flex-col border-t border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg md:hidden";
function linkClass(active: boolean): string {
  return `flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-all duration-normal ease-standard ${
    active
      ? "text-sidebar-foreground"
      : "text-sidebar-muted-foreground active:text-sidebar-foreground/95"
  }`;
}
function iconClass(active: boolean): string {
  return `h-6 w-6 transition-all duration-normal ease-standard ${active ? "scale-110" : ""}`;
}
function labelClass(active: boolean): string {
  const { inactive, highlighted } = tailwindNavChromeNavText;
  return `transition-all duration-normal ease-standard ${active ? highlighted : inactive}`;
}

type BottomNavItemsProps = {
  items: typeof navItems;
  isActive: (href: string) => boolean;
  unreadCount: number;
  isLoaded: boolean;
  pathname: string;
  onSearchNavigateClick?: (navId: string) => void;
  onPrefetchHref: (href: string) => void;
};

function BottomNavItems({
  items,
  isActive,
  unreadCount,
  isLoaded,
  pathname,
  onSearchNavigateClick,
  onPrefetchHref,
}: BottomNavItemsProps) {
  return (
    <>
      {items.map((item) => {
        const active = isActive(item.href);
        const content = (
          <>
            <Box className="relative">
              <Icon name={item.icon} className={iconClass(active)} />
              {item.key === "agent" && isLoaded && (
                <NotificationBadge count={unreadCount} className="absolute -right-0.5 -top-0.5" />
              )}
            </Box>
            <span className={labelClass(active)}>{item.name}</span>
          </>
        );
        return item.key === "search" ? (
          <SearchNavLink
            key={item.key}
            className={linkClass(active)}
            aria-label={item.name}
            aria-current={active ? "page" : undefined}
            onNavigateClick={onSearchNavigateClick}
            onMouseEnter={() => onPrefetchHref(item.href)}
            onFocus={() => onPrefetchHref(item.href)}
            onTouchStart={() => onPrefetchHref(item.href)}
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
            onMouseEnter={() => onPrefetchHref(item.href)}
            onFocus={() => onPrefetchHref(item.href)}
            onTouchStart={() => onPrefetchHref(item.href)}
            onClick={() => {
              const navId = genNavId();
              log.info(LOG_CATEGORIES.ROUTING, "[NAV] MobileBottomNav click", {
                navId,
                from: pathname,
                to: item.href,
                categoryKey: item.key,
              });
            }}
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
  const prefetchHref = useDashboardShellRoutePrefetch();

  useEffect(() => setMounted(true), []);

  const isActive = (href: string) => {
    const path = (href.split("?")[0] ?? "").split("#")[0] ?? "";
    const currentPath = location?.pathname ?? "";
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  const handleSearchNavigateClick = (navId: string) => {
    log.info(LOG_CATEGORIES.ROUTING, "[NAV] MobileBottomNav Search click", {
      navId,
      pathname: location.pathname,
    });
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
      <Box className="flex min-h-16 flex-1 flex-col items-center justify-center">
        <Box className="flex w-full items-center justify-around px-2">
          <BottomNavItems
            items={navItems}
            isActive={isActive}
            unreadCount={unreadCount}
            isLoaded={isLoaded}
            pathname={location.pathname}
            onSearchNavigateClick={handleSearchNavigateClick}
            onPrefetchHref={prefetchHref}
          />
        </Box>
      </Box>
    </nav>
  );

  if (!mounted || typeof document === "undefined") return null;
  return <Portal>{nav}</Portal>;
}
