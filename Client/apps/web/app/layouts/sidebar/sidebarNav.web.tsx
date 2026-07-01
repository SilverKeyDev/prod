import type { IconName } from "packages/ui/types/icons";
import type { Workspace } from "packages/utils/product/workspace";
import { getWorkspaceNavTabs } from "packages/utils/product/workspace/workspaceNavConfig";

import { SIDEBAR_TABS } from "./sidebarTabs.web";

export type SidebarNavItem = {
  key: string;
  name: string;
  href: string;
  icon: IconName;
};

export type NavigationStructure = Record<string, SidebarNavItem>;

const navigationStructure: NavigationStructure = {
  dashboard: {
    key: "dashboard",
    name: SIDEBAR_TABS.dashboard.name,
    href: SIDEBAR_TABS.dashboard.href,
    icon: SIDEBAR_TABS.dashboard.icon,
  },
  search: {
    key: "search",
    name: SIDEBAR_TABS.search.name,
    href: SIDEBAR_TABS.search.href,
    icon: SIDEBAR_TABS.search.icon,
  },
  decide: {
    key: "decide",
    name: SIDEBAR_TABS.decide.name,
    href: SIDEBAR_TABS.decide.href,
    icon: SIDEBAR_TABS.decide.icon,
  },
  agent: {
    key: "agent",
    name: SIDEBAR_TABS.agent.name,
    href: SIDEBAR_TABS.agent.href,
    icon: SIDEBAR_TABS.agent.icon,
  },
  profile: {
    key: "profile",
    name: SIDEBAR_TABS.profile.name,
    href: SIDEBAR_TABS.profile.href,
    icon: SIDEBAR_TABS.profile.icon,
  },
};

/**
 * Build navigation structure for sidebar. Messaging is always available for all users.
 * Profile is hidden on mobile.
 * `activeWorkspace` drives which top-level areas appear and their display labels.
 */
export function getNavigation(
  activeWorkspace: Workspace,
  isMobile: boolean,
  resolveLabel: (labelKey: string, fallback: string) => string
): NavigationStructure {
  const navigation: NavigationStructure = {};
  const tabs = getWorkspaceNavTabs(activeWorkspace, isMobile);

  for (const tab of tabs) {
    const base = navigationStructure[tab.key];
    if (!base) continue;
    const name = resolveLabel(tab.labelKey, base.name);
    navigation[tab.key] = {
      ...base,
      name,
    };
  }

  return navigation;
}
