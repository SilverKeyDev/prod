import type { IconName } from "packages/ui/types/icons";
import { stripWorkspaceShellPrefix } from "packages/utils/layout/dashboardLayoutConfig";

export type SidebarTabKey = "dashboard" | "search" | "decide" | "profile" | "agent";
export type SidebarSubStep = {
  label: string;
  to: string;
  icon?: IconName;
};
export type SidebarTab = {
  key: SidebarTabKey;
  name: string;
  description: string;
  icon: IconName;
  href: string;
  subSteps?: SidebarSubStep[];
};
export const SIDEBAR_TABS: Record<SidebarTabKey, SidebarTab> = {
  dashboard: {
    key: "dashboard",
    name: "Dashboard",
    description: "Overview and quick access to key actions",
    icon: "home",
    href: "/dashboard",
    subSteps: [
      {
        label: "Dashboard",
        to: "/dashboard",
        icon: "home",
      },
    ],
  },
  search: {
    key: "search",
    name: "Search",
    description: "Explore homes and neighborhoods",
    icon: "search",
    href: "/search",
    subSteps: [
      {
        label: "Find Homes",
        to: "/search",
        icon: "search",
      },
    ],
  },
  decide: {
    key: "decide",
    name: "Library",
    description: "Compare and pick your best options",
    icon: "library",
    href: "/library",
    subSteps: [
      {
        label: "Compare Reports",
        to: "/library",
        icon: "library",
      },
    ],
  },
  profile: {
    key: "profile",
    name: "Profile",
    description: "Manage your profile and preferences",
    icon: "user",
    href: "/profile",
    subSteps: [
      {
        label: "Profile",
        to: "/profile",
        icon: "user",
      },
    ],
  },
  agent: {
    key: "agent",
    name: "Messaging",
    description: "Communicate with your agent",
    icon: "send",
    href: "/messaging",
    subSteps: [
      {
        label: "Messaging",
        to: "/messaging",
        icon: "send",
      },
    ],
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
