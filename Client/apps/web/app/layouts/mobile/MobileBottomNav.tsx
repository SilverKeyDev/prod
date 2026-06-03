import { useEffect, useState } from "react";

import { Icon } from "@ui/icons";
import { useLocation } from "react-router-dom";

import { useLocalization } from "packages/contexts";
import { SearchNavLink } from "packages/features/search";
import { useActiveWorkspace } from "packages/hooks/store";
import { log } from "packages/logger";
import { Link } from "packages/navigation";
import { useNotificationStore } from "packages/store";
import Region from "packages/ui/components/accessibility/Region";
import { Portal } from "packages/ui/components/portal";
import { Box } from "packages/ui/components/primitives";
import { NotificationBadge } from "packages/ui/components/primitives/index.web";
import { tailwindNavChromeNavText } from "packages/ui/styles/theme/navTabTypography";
import { getWorkspaceNavTabs } from "packages/utils/workspace/workspaceNavConfig";

import { useDashboardShellRoutePrefetch } from "@/app/layouts/dashboard/useDashboardShellRoutePrefetch.web";
import { SIDEBAR_TABS, type SidebarTab } from "@/app/layouts/sidebar/sidebarTabs.web";
import type { UserProfile } from "@/features/homeauth/types";

function genNavId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

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

type BottomNavItem = SidebarTab & { name: string };

type BottomNavItemsProps = {
  items: BottomNavItem[];
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
            aria-current={active ? "page" : undefined}
            onMouseEnter={() => onPrefetchHref(item.href)}
            onFocus={() => onPrefetchHref(item.href)}
            onTouchStart={() => onPrefetchHref(item.href)}
            onClick={() => {
              const navId = genNavId();
              log.info("ROUTING", "[NAV] MobileBottomNav click", {
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
  const { t } = useLocalization();
  const activeWorkspace = useActiveWorkspace();
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

  const navItems = getWorkspaceNavTabs(activeWorkspace, true).map((tab) => {
    const base = SIDEBAR_TABS[tab.key];
    return {
      ...base,
      name: t(tab.labelKey, base.name),
    };
  });

  const handleSearchNavigateClick = (navId: string) => {
    log.info("ROUTING", "[NAV] MobileBottomNav Search click", {
      navId,
      pathname: location.pathname,
    });
  };

  const nav = (
    <Region
      as="nav"
      label="Primary navigation"
      className={BAR_CLASS}
      style={{
        paddingTop: "max(env(safe-area-inset-bottom), 4px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 4px)",
      }}
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
    </Region>
  );

  if (!mounted || typeof document === "undefined") return null;
  return <Portal>{nav}</Portal>;
}
