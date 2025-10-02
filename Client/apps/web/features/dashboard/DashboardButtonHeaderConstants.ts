import { BadgeCheck, Bookmark, Brain, type LucideIcon, User as UserIcon } from "lucide-react";
import { SIDEBAR_TABS } from "../../../../packages/schemas/sidebar";

import type { NavItem } from "../../../../packages/schemas/navigation";

export type SubStep = Omit<NavItem, "icon"> & {
  icon: LucideIcon;
};

export type Step = {
  key: string;
  name: string;
  icon: LucideIcon;
  subSteps: SubStep[];
};

// Mirrors Sidebar categories
export const TIMELINE_STEPS: Step[] = [
  {
    key: "onboard",
    name: SIDEBAR_TABS.onboard.name,
    icon: SIDEBAR_TABS.onboard.icon,
    subSteps: [
      {
        key: "personalization",
        to: "/personalization",
        label: "Personalization",
        icon: UserIcon,
      },
      {
        key: "get-preapproved",
        to: "/get-preapproved",
        label: "Get Pre-Approved",
        icon: BadgeCheck,
      },
    ],
  },
  {
    key: "search",
    name: SIDEBAR_TABS.search.name,
    icon: SIDEBAR_TABS.search.icon,
    subSteps: [
      {
        key: "search-homes",
        to: "/search",
        label: "Search Homes",
        icon: SIDEBAR_TABS.search.icon,
      },
      {
        key: "saved-homes",
        to: "/saved",
        label: "Saved Homes",
        icon: Bookmark,
      },
    ],
  },
  {
    key: "negotiate",
    name: SIDEBAR_TABS.negotiate.name,
    icon: SIDEBAR_TABS.negotiate.icon,
    subSteps: [
      {
        key: "negotiation-strategy",
        to: "/negotiation-strategy",
        label: "Negotiation Strategy",
        icon: Brain,
      },
    ],
  },
];
