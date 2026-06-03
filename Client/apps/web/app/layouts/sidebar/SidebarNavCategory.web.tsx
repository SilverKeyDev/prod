import React from "react";

import { Icon } from "@ui/icons";
import { useLocation, useNavigate } from "react-router-dom";

import { log } from "packages/logger";
import { Link } from "packages/navigation";
import AccessibleLink from "packages/ui/components/accessibility/AccessibleLink";
import Region from "packages/ui/components/accessibility/Region";
import Button from "packages/ui/components/button/Button";
import { Box } from "packages/ui/components/primitives";
import {
  getChromeNavButtonStyles,
  getChromeNavSubItemStyles,
} from "packages/ui/components/sidebar/sidebarTheme";

import { type NavCategory, type SidebarNavItem } from "./sidebarNav.web";
import {
  sidebarNavLabelActive,
  sidebarNavLabelInactive,
  SINGLE_LINK_KEYS,
} from "./sidebarNavSections.constants.web";
import { SidebarNavSingleLink } from "./SidebarNavSingleLink.web";

export type SidebarNavCategoryProps = {
  categoryKey: string;
  category: NavCategory;
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

export function SidebarNavCategory({
  categoryKey,
  category,
  expanded,
  isActive,
  isCategoryActive,
  toggleCategory,
  openCategories,
  onLinkClick,
  unreadCount,
  isLoaded,
  onPrefetchHref,
}: SidebarNavCategoryProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isSingleLink = SINGLE_LINK_KEYS.has(categoryKey);
  if (isSingleLink) {
    const firstItem = category.items[0];
    return (
      <SidebarNavSingleLink
        categoryKey={categoryKey}
        firstItem={firstItem!}
        expanded={expanded}
        isActive={isActive(firstItem?.href ?? "/")}
        unreadCount={unreadCount}
        isLoaded={isLoaded}
        onLinkClick={onLinkClick}
        onPrefetchHref={onPrefetchHref}
      />
    );
  }
  const firstItemHref = category.items[0]?.href;
  const handleCategoryHeaderClick = () => {
    if (category.items.length === 1 && firstItemHref) {
      log.info("ROUTING", "[NAV] Sidebar nav click (button)", {
        categoryKey,
        to: firstItemHref,
        currentPathname: location.pathname,
      });
      onLinkClick?.();
      void navigate(firstItemHref);
      return;
    }
    toggleCategory(categoryKey);
  };
  const categoryPanelId = `sidebar-category-${categoryKey}`;
  return (
    <>
      <Button
        onClick={handleCategoryHeaderClick}
        type="button"
        variant="ghost"
        label={category.name}
        className={`${getChromeNavButtonStyles(isCategoryActive(category.items))} group relative ${
          !expanded ? "justify-center" : "justify-between"
        } w-full cursor-pointer`}
        title={!expanded ? category.name : ""}
        aria-expanded={openCategories[categoryKey]}
        aria-controls={categoryPanelId}
      >
        <Box className="flex items-center">
          <Box
            className={`${
              !expanded && openCategories[categoryKey]
                ? "flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-foreground/20"
                : ""
            }`}
          >
            <Icon
              name={category.icon}
              className={`h-6 w-6 transition-all duration-200 ${expanded ? "mr-3" : ""} ${
                !expanded && openCategories[categoryKey] ? "text-sidebar-foreground" : ""
              }`}
            />
          </Box>
          {expanded && (
            <span
              className={
                isCategoryActive(category.items) ? sidebarNavLabelActive : sidebarNavLabelInactive
              }
            >
              {category.name}
            </span>
          )}
        </Box>
        {!expanded && openCategories[categoryKey] && (
          <Box className="absolute right-1 top-1 h-2 w-2 rounded-full bg-sidebar-foreground"></Box>
        )}
        {expanded &&
          (openCategories[categoryKey] ? (
            <Icon name="chevron-down" className="h-5 w-5" />
          ) : (
            <Icon name="chevron-right" className="h-5 w-5" />
          ))}
      </Button>
      {openCategories[categoryKey] && (
        <Region
          id={categoryPanelId}
          label={category.name}
          className={expanded ? "ml-3 mt-2 space-y-1" : ""}
        >
          {category.items.map((item) => {
            const linkClassName = `${getChromeNavSubItemStyles(isActive(item.href))} ${
              !expanded ? "justify-center py-2" : "py-2"
            }`;
            const linkContent = (
              <>
                <Icon
                  name={item.icon}
                  className={`h-6 w-6 transition-all duration-200 ${expanded ? "mr-3" : ""}`}
                />
                {expanded && (
                  <span
                    className={
                      isActive(item.href) ? sidebarNavLabelActive : sidebarNavLabelInactive
                    }
                  >
                    {item.name}
                  </span>
                )}
              </>
            );
            return expanded ? (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => onLinkClick?.()}
                onMouseEnter={() => onPrefetchHref(item.href)}
                onFocus={() => onPrefetchHref(item.href)}
                onTouchStart={() => onPrefetchHref(item.href)}
                className={linkClassName}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {linkContent}
              </Link>
            ) : (
              <AccessibleLink
                key={item.name}
                to={item.href}
                label={item.name}
                onClick={() => onLinkClick?.()}
                onMouseEnter={() => onPrefetchHref(item.href)}
                onFocus={() => onPrefetchHref(item.href)}
                onTouchStart={() => onPrefetchHref(item.href)}
                className={linkClassName}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {linkContent}
              </AccessibleLink>
            );
          })}
        </Region>
      )}
    </>
  );
}
