import React from "react";

import { Icon } from "@ui/icons";
import { useLocation } from "react-router-dom";

import { SearchNavLink } from "packages/features/search";
import { log } from "packages/logger";
import { Link } from "packages/navigation";
import { Box } from "packages/ui/components/structure/primitives";
import { getChromeNavButtonStyles } from "packages/ui/components/structure/sidebar/sidebarTheme";
import AccessibleLink from "packages/ui/components/system/accessibility/AccessibleLink";

import { NotificationBadge } from "@/components/ui";

import { type SidebarNavItem } from "./sidebarNav.web";
import { sidebarNavLabelActive, sidebarNavLabelInactive } from "./sidebarNavSections.constants.web";

export type SidebarNavSingleLinkProps = {
  categoryKey: string;
  item: SidebarNavItem;
  expanded: boolean;
  isActive: boolean;
  unreadCount: number;
  isLoaded: boolean;
  onLinkClick?: () => void;
  onPrefetchHref: (href: string) => void;
};

export function SidebarNavSingleLink({
  categoryKey,
  item,
  expanded,
  isActive,
  unreadCount,
  isLoaded,
  onLinkClick,
  onPrefetchHref,
}: SidebarNavSingleLinkProps) {
  const location = useLocation();
  const itemIconName = item.icon;
  const buttonClass = `${getChromeNavButtonStyles(isActive)} ${!expanded ? "justify-center" : ""}`;
  const titleAttr = !expanded ? item.name : "";
  const iconEl = (
    <Box className="relative inline-flex items-center">
      <Icon
        name={itemIconName}
        className={`h-6 w-6 transition-all duration-200 ${expanded ? "mr-3" : ""}`}
      />
      {categoryKey === "agent" && isLoaded && (
        <NotificationBadge
          count={unreadCount}
          className="absolute -right-1 -top-1 sm:-right-0.5 sm:-top-0.5"
        />
      )}
    </Box>
  );
  if (categoryKey === "search") {
    return (
      <SearchNavLink
        className={buttonClass}
        title={titleAttr}
        onClick={() => onLinkClick?.()}
        aria-current={isActive ? "page" : undefined}
        onMouseEnter={() => onPrefetchHref("/search")}
        onFocus={() => onPrefetchHref("/search")}
        onTouchStart={() => onPrefetchHref("/search")}
      >
        {iconEl}
        {expanded && (
          <span className={isActive ? sidebarNavLabelActive : sidebarNavLabelInactive}>
            {item.name}
          </span>
        )}
      </SearchNavLink>
    );
  }
  const to = item.href;
  const handleClick = () => {
    const navId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    log.info("ROUTING", "[NAV] Sidebar nav click (link)", {
      navId,
      from: location.pathname,
      to,
      categoryKey,
    });
    onLinkClick?.();
  };
  const linkProps = {
    to,
    className: buttonClass,
    title: titleAttr,
    onClick: handleClick,
    onMouseEnter: () => onPrefetchHref(to),
    onFocus: () => onPrefetchHref(to),
    onTouchStart: () => onPrefetchHref(to),
    "aria-current": isActive ? ("page" as const) : undefined,
  };
  if (expanded) {
    return (
      <Link {...linkProps}>
        {iconEl}
        <span className={isActive ? sidebarNavLabelActive : sidebarNavLabelInactive}>
          {item.name}
        </span>
      </Link>
    );
  }
  return (
    <AccessibleLink {...linkProps} label={item.name}>
      {iconEl}
    </AccessibleLink>
  );
}
