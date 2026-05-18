import type { IconName } from "packages/ui/types/icons";
import type { Workspace } from "packages/utils/workspace";

import { SIDEBAR_TABS } from "./sidebarTabs.web";

export type SidebarNavItem = {
  name: string;
  href: string;
  icon: IconName;
};

export type NavCategory = {
  name: string;
  icon: IconName;
  items: SidebarNavItem[];
};

export type NavigationStructure = Record<string, NavCategory>;

const navigationStructure: NavigationStructure = {
  dashboard: {
    name: SIDEBAR_TABS.dashboard.name,
    icon: SIDEBAR_TABS.dashboard.icon,
    items: [
      {
        name: SIDEBAR_TABS.dashboard.name,
        href: SIDEBAR_TABS.dashboard.href,
        icon: SIDEBAR_TABS.dashboard.icon,
      },
    ],
  },
  search: {
    name: SIDEBAR_TABS.search.name,
    icon: SIDEBAR_TABS.search.icon,
    items: [
      {
        name: SIDEBAR_TABS.search.name,
        href: SIDEBAR_TABS.search.href,
        icon: SIDEBAR_TABS.search.icon,
      },
    ],
  },
  decide: {
    name: SIDEBAR_TABS.decide.name,
    icon: SIDEBAR_TABS.decide.icon,
    items: [
      {
        name: SIDEBAR_TABS.decide.name,
        href: SIDEBAR_TABS.decide.href,
        icon: SIDEBAR_TABS.decide.icon,
      },
    ],
  },
  agent: {
    name: SIDEBAR_TABS.agent.name,
    icon: SIDEBAR_TABS.agent.icon,
    items: [
      {
        name: SIDEBAR_TABS.agent.name,
        href: SIDEBAR_TABS.agent.href,
        icon: SIDEBAR_TABS.agent.icon,
      },
    ],
  },
  profile: {
    name: SIDEBAR_TABS.profile.name,
    icon: SIDEBAR_TABS.profile.icon,
    items: [
      {
        name: SIDEBAR_TABS.profile.name,
        href: SIDEBAR_TABS.profile.href,
        icon: SIDEBAR_TABS.profile.icon,
      },
    ],
  },
};

/**
 * Build navigation structure for sidebar. Messaging is always available for all users.
 * Profile is hidden on mobile.
 * `activeWorkspace` drives which top-level areas appear (e.g. brokerage workspace omits consumer search).
 */
export function getNavigation(activeWorkspace: Workspace, isMobile: boolean): NavigationStructure {
  const navigation: NavigationStructure = {};
  const isBrokerageWorkspace = activeWorkspace === "brokerage";

  navigation.dashboard = { ...navigationStructure.dashboard };

  if (!isBrokerageWorkspace) {
    navigation.search = { ...navigationStructure.search };
    navigation.decide = { ...navigationStructure.decide };
  }

  navigation.agent = { ...navigationStructure.agent };

  if (!isMobile) {
    navigation.profile = { ...navigationStructure.profile };
  }

  return navigation;
}
