import { pathFor } from "packages/navigation/router/paths";
import type { IconName } from "packages/ui/types/icons";

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
    href: "/saved",
    subSteps: [
      {
        label: "Compare Reports",
        to: "/saved",
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
      {
        label: "Find agents",
        to: pathFor("FIND_AGENTS"),
        icon: "search",
      },
    ],
  },
};
export const getTabByPath = (pathname: string): SidebarTab | undefined => {
  if (pathname.startsWith("/dashboard")) return SIDEBAR_TABS.dashboard;
  if (pathname.startsWith("/profile")) return SIDEBAR_TABS.profile;
  if (pathname.startsWith("/search")) return SIDEBAR_TABS.search;
  if (pathname.startsWith("/saved") || pathname.startsWith("/compare-reports"))
    return SIDEBAR_TABS.decide;
  if (pathname.startsWith("/messaging") || pathname.startsWith("/find-agents"))
    return SIDEBAR_TABS.agent;
  return undefined;
};
