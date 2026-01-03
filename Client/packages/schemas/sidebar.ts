import {
  Bookmark,
  Calendar,
  Home,
  Key,
  Search,
  Send,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type SidebarTabKey =
  | "dashboard"
  | "search"
  | "decide"
  | "close"
  | "settings"
  | "agent"
  | "calendar";

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
    name: "Home",
    description: "Overview and quick access to key actions",
    icon: Home,
    href: "/dashboard",
    subSteps: [
      {
        label: "Home",
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
  close: {
    key: "close",
    name: "Buyer Checklists",
    description: "Track steps to close confidently",
    icon: Key,
    href: "/buyer-checklists",
    subSteps: [
      {
        label: "Closing Checklist",
        to: "/buyer-checklists",
        icon: Key,
      },
    ],
  },
  settings: {
    key: "settings",
    name: "Settings",
    description: "Manage your preferences and account settings",
    icon: Settings,
    href: "/settings",
    subSteps: [
      {
        label: "Preferences",
        to: "/settings",
        icon: Settings,
      },
    ],
  },
  agent: {
    key: "agent",
    name: "Messaging",
    description: "Communicate with your agent",
    icon: Send,
    href: "/agent",
    subSteps: [
      {
        label: "Messaging",
        to: "/agent",
        icon: Send,
      },
    ],
  },
  calendar: {
    key: "calendar",
    name: "Calendar",
    description: "View and manage your calendar events",
    icon: Calendar,
    href: "/calendar",
    subSteps: [
      {
        label: "Calendar",
        to: "/calendar",
        icon: Calendar,
      },
    ],
  },
};

export const getTabByPath = (pathname: string): SidebarTab | undefined => {
  if (pathname.startsWith("/dashboard")) return SIDEBAR_TABS.dashboard;
  if (pathname.startsWith("/settings")) return SIDEBAR_TABS.settings;
  if (pathname.startsWith("/search")) return SIDEBAR_TABS.search;
  if (pathname.startsWith("/saved") || pathname.startsWith("/compare-reports"))
    return SIDEBAR_TABS.decide;
  if (pathname.startsWith("/buyer-checklists")) return SIDEBAR_TABS.close;
  if (pathname.startsWith("/agent")) return SIDEBAR_TABS.agent;
  if (pathname.startsWith("/calendar")) return SIDEBAR_TABS.calendar;
  return undefined;
};


