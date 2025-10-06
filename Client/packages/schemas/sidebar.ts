import {
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
  onboard: {
    key: "onboard",
    name: "Onboard",
    description: "Set preferences and get ready to search",
    icon: ClipboardList,
    href: "/personalization",
    subSteps: [
      {
        label: "Preferences",
        to: "/personalization",
        icon: ClipboardList,
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
    name: "Decide the Best Fit",
    description: "Compare and pick your best options",
    icon: Split,
    href: "/saved?view=reports",
    subSteps: [
      {
        label: "Compare Reports",
        to: "/saved?view=reports",
        icon: Split,
      },
    ],
  },
  negotiate: {
    key: "negotiate",
    name: "Negotiate",
    description: "Plan strategy and craft compelling offers",
    icon: Handshake,
    href: "/negotiation-strategy",
    subSteps: [
      {
        label: "Negotiation Advisor",
        to: "/negotiation-strategy",
        icon: Handshake,
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


