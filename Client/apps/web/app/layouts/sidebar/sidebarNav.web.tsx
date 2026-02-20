import type React from "react";

import { SIDEBAR_TABS } from "./sidebarTabs.web";

export type SidebarNavItem = {
  name: string;
  href: string;
  icon: React.FC<{ className?: string }>;
};

export type NavCategory = {
  name: string;
  icon: React.FC<{ className?: string }>;
  items: SidebarNavItem[];
};

export type NavigationStructure = Record<string, NavCategory>;

const iconType = (icon: unknown) =>
  icon as unknown as React.FC<{ className?: string }>;

const navigationStructure: NavigationStructure = {
  dashboard: {
    name: SIDEBAR_TABS.dashboard.name,
    icon: iconType(SIDEBAR_TABS.dashboard.icon),
    items: [
      {
        name: SIDEBAR_TABS.dashboard.name,
        href: SIDEBAR_TABS.dashboard.href,
        icon: iconType(SIDEBAR_TABS.dashboard.icon),
      },
    ],
  },
  search: {
    name: SIDEBAR_TABS.search.name,
    icon: iconType(SIDEBAR_TABS.search.icon),
    items: [
      {
        name: SIDEBAR_TABS.search.name,
        href: SIDEBAR_TABS.search.href,
        icon: iconType(SIDEBAR_TABS.search.icon),
      },
    ],
  },
  decide: {
    name: SIDEBAR_TABS.decide.name,
    icon: iconType(SIDEBAR_TABS.decide.icon),
    items: [
      {
        name: SIDEBAR_TABS.decide.name,
        href: SIDEBAR_TABS.decide.href,
        icon: iconType(SIDEBAR_TABS.decide.icon),
      },
    ],
  },
  agent: {
    name: SIDEBAR_TABS.agent.name,
    icon: iconType(SIDEBAR_TABS.agent.icon),
    items: [
      {
        name: SIDEBAR_TABS.agent.name,
        href: SIDEBAR_TABS.agent.href,
        icon: iconType(SIDEBAR_TABS.agent.icon),
      },
    ],
  },
  profile: {
    name: SIDEBAR_TABS.profile.name,
    icon: iconType(SIDEBAR_TABS.profile.icon),
    items: [
      {
        name: SIDEBAR_TABS.profile.name,
        href: SIDEBAR_TABS.profile.href,
        icon: iconType(SIDEBAR_TABS.profile.icon),
      },
    ],
  },
};

/**
 * Build navigation structure for sidebar. Messaging is always available for all users.
 * Profile is hidden on mobile.
 */
export function getNavigation(
  _isAgent: boolean,
  _hasAgent: boolean,
  isMobile: boolean,
): NavigationStructure {
  const navigation: NavigationStructure = {};

  navigation.dashboard = {
    name: navigationStructure.dashboard.name,
    icon: navigationStructure.dashboard.icon,
    items: [...navigationStructure.dashboard.items],
  };

  navigation.search = {
    name: navigationStructure.search.name,
    icon: navigationStructure.search.icon,
    items: [...navigationStructure.search.items],
  };
  navigation.decide = {
    name: navigationStructure.decide.name,
    icon: navigationStructure.decide.icon,
    items: [...navigationStructure.decide.items],
  };

  navigation.agent = {
    name: navigationStructure.agent.name,
    icon: navigationStructure.agent.icon,
    items: [...navigationStructure.agent.items],
  };

  if (!isMobile) {
    navigation.profile = {
      name: navigationStructure.profile.name,
      icon: navigationStructure.profile.icon,
      items: [...navigationStructure.profile.items],
    };
  }

  return navigation;
}
