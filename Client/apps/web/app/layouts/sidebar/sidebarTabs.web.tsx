import {
  Bookmark,
  Home,
  type LucideIcon,
  Search,
  Send,
  User,
} from "lucide-react";

export type SidebarTabKey =
  | "dashboard"
  | "search"
  | "decide"
  | "profile"
  | "agent";

export type SidebarSubStep = {
  label: string;
  to: string;
  icon?: LucideIcon;
};

export type SidebarTab = {
  key: SidebarTabKey;
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  subSteps?: SidebarSubStep[];
};

export const SIDEBAR_TABS: Record<SidebarTabKey, SidebarTab> = {
  dashboard: {
    key: "dashboard",
    name: "Dashboard",
    description: "Overview and quick access to key actions",
    icon: Home,
    href: "/dashboard",
    subSteps: [
      {
        label: "Dashboard",
        to: "/dashboard",
        icon: Home,
      },
    ],
  },
  search: {
    key: "search",
    name: "Search",
    description: "Explore homes and neighborhoods",
    icon: Search,
    href: "/search",
    subSteps: [
      {
        label: "Find Homes",
        to: "/search",
        icon: Search,
      },
    ],
  },
  decide: {
    key: "decide",
    name: "Saved",
    description: "Compare and pick your best options",
    icon: Bookmark,
    href: "/saved",
    subSteps: [
      {
        label: "Compare Reports",
        to: "/saved",
        icon: Bookmark,
      },
    ],
  },
  profile: {
    key: "profile",
    name: "Profile",
    description: "Manage your profile and preferences",
    icon: User,
    href: "/profile",
    subSteps: [
      {
        label: "Profile",
        to: "/profile",
        icon: User,
      },
    ],
  },
  agent: {
    key: "agent",
    name: "Messaging",
    description: "Communicate with your agent",
    icon: Send,
    href: "/messaging",
    subSteps: [
      {
        label: "Messaging",
        to: "/messaging",
        icon: Send,
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
  if (pathname.startsWith("/messaging")) return SIDEBAR_TABS.agent;
  return undefined;
};
