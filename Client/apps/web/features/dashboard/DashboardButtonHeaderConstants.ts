import {
  BadgeCheck,
  BarChart2,
  Bookmark,
  Brain,
  Building2,
  ClipboardList,
  FilePlus,
  type LucideIcon,
  FileText,
  Handshake,
  Key,
  KeyRound,
  MessageCircle,
  Scale,
  Search as SearchIcon,
  ShieldCheck,
  Split,
  User as UserIcon,
} from "lucide-react";

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
    name: "Onboard",
    icon: ClipboardList,
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
    name: "Search",
    icon: SearchIcon,
    subSteps: [
      {
        key: "search-homes",
        to: "/search",
        label: "Search Homes",
        icon: SearchIcon,
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
    key: "decide",
    name: "Decide",
    icon: Split,
    subSteps: [
      {
        key: "generate-report",
        to: "/generate-report",
        label: "Generate Report",
        icon: FilePlus,
      },
      {
        key: "past-reports",
        to: "/reports",
        label: "Past Reports",
        icon: FileText,
      },
      {
        key: "compare-reports",
        to: "/compare-reports",
        label: "Compare Reports",
        icon: BarChart2,
      },
      {
        key: "ai-assistant",
        to: "/ai-assistant",
        label: "AI Assistant",
        icon: MessageCircle,
      },
    ],
  },
  {
    key: "negotiate",
    name: "Negotiate",
    icon: Handshake,
    subSteps: [
      {
        key: "negotiation-strategy",
        to: "/negotiation-strategy",
        label: "Negotiation Strategy",
        icon: Brain,
      },
    ],
  },
  {
    key: "close",
    name: "Close",
    icon: Key,
    subSteps: [
      {
        key: "escrow-legal",
        to: "/close/escrow-legal-logistics",
        label: "Escrow & Legal",
        icon: Scale,
      },
      {
        key: "inspections-due-diligence",
        to: "/close/inspections-due-diligence",
        label: "Inspections & Due Diligence",
        icon: ShieldCheck,
      },
      {
        key: "financing-insurance",
        to: "/close/financing-insurance",
        label: "Financing & Insurance",
        icon: Building2,
      },
      {
        key: "closing-moving-in",
        to: "/close/closing-moving-in",
        label: "Closing & Move-In",
        icon: KeyRound,
      },
    ],
  },
];
