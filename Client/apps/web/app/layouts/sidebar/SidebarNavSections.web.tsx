import React from "react";

import { AccountLogoutAction } from "packages/features/homeauth/components/account/AccountLogoutAction";
import Region from "packages/ui/components/accessibility/Region";
import WhiteLogo from "packages/ui/components/asset/WhiteLogo";
import { Box } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";
import type { UserProfile } from "@/features/homeauth/types";

import { type NavCategory, type SidebarNavItem } from "./sidebarNav.web";
import { SidebarNavCategory } from "./SidebarNavCategory.web";

export function SidebarHeader({
  expanded,
  isLoading,
  displayUser,
}: {
  expanded: boolean;
  isLoading: boolean;
  displayUser: UserProfile | null | undefined;
}) {
  return (
    <Box className="flex flex-shrink-0 items-center justify-between py-2">
      <Box className="flex items-center text-sidebar-foreground">
        {expanded && (
          <Box className="flex flex-shrink-0 py-4">
            {isLoading ? (
              <Box className="animate-pulse space-y-3">
                <Box className="flex items-center space-x-4">
                  <Box className="h-6 w-6 rounded-full bg-sidebar-foreground/40"></Box>
                  <Box className="flex-1 space-y-2">
                    <Box className="h-4 w-3/4 rounded bg-sidebar-foreground/40"></Box>
                    <Box className="h-3 w-1/2 rounded bg-sidebar-foreground/40"></Box>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box className="flex items-center">
                <WhiteLogo size="sm" className="ml-1" />
                <Box className="ml-3">
                  <BodyText
                    size="xs"
                    as="span"
                    className="line-clamp-1 text-[11px] text-sidebar-muted-foreground sm:text-xs"
                  >
                    {displayUser?.email ?? "No email"}
                  </BodyText>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
export function SidebarFooter({ expanded, onLogout }: { expanded: boolean; onLogout: () => void }) {
  return <AccountLogoutAction variant="sidebar" expanded={expanded} onLogout={onLogout} />;
}
type SidebarNavProps = {
  navigation: Record<string, NavCategory>;
  expanded: boolean;
  isActive: (href: string) => boolean;
  isCategoryActive: (items: SidebarNavItem[]) => boolean;
  toggleCategory: (category: string) => void;
  openCategories: Record<string, boolean>;
  onLinkClick?: () => void;
  unreadCount: number;
  isLoaded: boolean;
  onPrefetchHref: (href: string) => void;
};
export function SidebarNav({
  navigation,
  expanded,
  isActive,
  isCategoryActive,
  toggleCategory,
  openCategories,
  onLinkClick,
  unreadCount,
  isLoaded,
  onPrefetchHref,
}: SidebarNavProps) {
  return (
    <Region as="nav" label="Primary navigation" className="mt-4 pb-4">
      {Object.entries(navigation).map(([categoryKey, category]) => (
        <Box key={categoryKey}>
          <SidebarNavCategory
            categoryKey={categoryKey}
            category={category}
            expanded={expanded}
            isActive={isActive}
            isCategoryActive={isCategoryActive}
            toggleCategory={toggleCategory}
            openCategories={openCategories}
            onLinkClick={onLinkClick}
            unreadCount={unreadCount}
            isLoaded={isLoaded}
            onPrefetchHref={onPrefetchHref}
          />
        </Box>
      ))}
    </Region>
  );
}
