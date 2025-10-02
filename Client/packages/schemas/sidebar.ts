import {
  Brain,
  ClipboardList,
  Handshake,
  Home,
  Key,
  Search,
  Split,
  type LucideIcon,
} from "lucide-react";

export type SidebarTabKey =
  | "dashboard"
  | "onboard"
  | "search"
  | "decide"
  | "negotiate"
  | "close";

export type SidebarTab = {
  key: SidebarTabKey;
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
};

export const SIDEBAR_TABS: Record<SidebarTabKey, SidebarTab> = {
  dashboard: {
    key: "dashboard",
    name: "Dashboard",
    description: "Overview and quick access to key actions",
    icon: Home,
    href: "/dashboard",
  },
  onboard: {
    key: "onboard",
    name: "Onboard",
    description: "Set preferences and get ready to search",
    icon: ClipboardList,
    href: "/personalization",
  },
  search: {
    key: "search",
    name: "Search",
    description: "Explore homes and neighborhoods",
    icon: Search,
    href: "/search",
  },
  decide: {
    key: "decide",
    name: "Find the Best Fit",
    description: "Compare and pick your best options",
    icon: Split,
    href: "/saved?view=reports",
  },
  negotiate: {
    key: "negotiate",
    name: "Negotiate",
    description: "Plan strategy and craft compelling offers",
    icon: Handshake,
    href: "/negotiation-strategy",
  },
  close: {
    key: "close",
    name: "Buyer Checklists",
    description: "Track steps to close confidently",
    icon: Key,
    href: "/buyer-checklists",
  },
};

export const getTabByPath = (pathname: string): SidebarTab | undefined => {
  if (pathname.startsWith("/dashboard")) return SIDEBAR_TABS.dashboard;
  if (pathname.startsWith("/personalization")) return SIDEBAR_TABS.onboard;
  if (pathname.startsWith("/search")) return SIDEBAR_TABS.search;
  if (pathname.startsWith("/saved") || pathname.startsWith("/compare-reports"))
    return SIDEBAR_TABS.decide;
  if (pathname.startsWith("/negotiation-strategy"))
    return SIDEBAR_TABS.negotiate;
  if (pathname.startsWith("/buyer-checklists")) return SIDEBAR_TABS.close;
  return undefined;
};


