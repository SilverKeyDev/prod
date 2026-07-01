import type { IconName } from "packages/ui/types/icons";
import { stripWorkspaceShellPrefix } from "packages/utils/core/layout/dashboardLayoutConfig";

export type SidebarTabKey = "dashboard" | "search" | "decide" | "profile" | "agent";

export type SidebarTab = {
  key: SidebarTabKey;
  name: string;
  description: string;
  icon: IconName;
  href: string;
};

export const SIDEBAR_TABS: Record<SidebarTabKey, SidebarTab> = {
  dashboard: {
    key: "dashboard",
    name: "Dashboard",
    description: "Overview and quick access to key actions",
    icon: "home",
    href: "/dashboard",
  },
  search: {
    key: "search",
    name: "Search",
    description: "Explore homes and neighborhoods",
    icon: "search",
    href: "/search",
  },
  decide: {
    key: "decide",
    name: "Library",
    description: "Compare and pick your best options",
    icon: "library",
    href: "/library",
  },
  profile: {
    key: "profile",
    name: "Profile",
    description: "Manage your profile and preferences",
    icon: "user",
    href: "/profile",
  },
  agent: {
    key: "agent",
    name: "Messaging",
    description: "Communicate with your agent",
    icon: "send",
    href: "/messaging",
  },
};

export const getTabByPath = (pathname: string): SidebarTab | undefined => {
  const p = stripWorkspaceShellPrefix(pathname);
  if (p.startsWith("/dashboard")) return SIDEBAR_TABS.dashboard;
  if (p.startsWith("/profile")) return SIDEBAR_TABS.profile;
  if (p.startsWith("/search")) return SIDEBAR_TABS.search;
  if (p.startsWith("/library") || p.startsWith("/saved") || p.startsWith("/compare-reports"))
    return SIDEBAR_TABS.decide;
  if (p.startsWith("/messaging")) return SIDEBAR_TABS.agent;
  return undefined;
};
