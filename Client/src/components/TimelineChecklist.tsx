import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ClipboardList,
  Search as SearchIcon,
  Split,
  Handshake,
  Key,
  ChevronDown,
  ChevronUp,
  LucideIcon,
  User as UserIcon,
  CreditCard,
  BadgeCheck,
  Bookmark,
  FilePlus,
  FileText,
  BarChart2,
  MessageCircle,
  Brain,
  Scale,
  ShieldCheck,
  Building2,
  KeyRound,
} from "lucide-react";

type SubStep = {
  name: string;
  href: string;
  icon: LucideIcon;
};

type Step = {
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
      { name: "Personalization", href: "/dashboard/personalization", icon: UserIcon },
      { name: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
      { name: "Get Pre-Approved", href: "/dashboard/get-preapproved", icon: BadgeCheck },
    ],
  },
  {
    key: "search",
    name: "Search",
    icon: SearchIcon,
    subSteps: [
      { name: "Search Homes", href: "/dashboard/search", icon: SearchIcon },
      { name: "Saved Homes", href: "/dashboard/saved", icon: Bookmark },
    ],
  },
  {
    key: "decide",
    name: "Decide",
    icon: Split,
    subSteps: [
      { name: "Generate Report", href: "/dashboard/generate-report", icon: FilePlus },
      { name: "Past Reports", href: "/dashboard/reports", icon: FileText },
      { name: "Compare Reports", href: "/dashboard/compare-reports", icon: BarChart2 },
      { name: "AI Assistant", href: "/dashboard/ai-assistant", icon: MessageCircle },
    ],
  },
  {
    key: "negotiate",
    name: "Negotiate",
    icon: Handshake,
    subSteps: [
      { name: "Negotiation Strategy", href: "/dashboard/negotiation-strategy", icon: Brain },
      { name: "Draft Offer", href: "/dashboard/draft-offer", icon: FileText },
    ],
  },
  {
    key: "close",
    name: "Close",
    icon: Key,
    subSteps: [
      { name: "Escrow & Legal", href: "/dashboard/escrow-legal-logistics", icon: Scale },
      { name: "Inspections & Due Diligence", href: "/dashboard/inspections-due-diligence", icon: ShieldCheck },
      { name: "Financing & Insurance", href: "/dashboard/financing-insurance", icon: Building2 },
      { name: "Closing & Move-In", href: "/dashboard/closing-moving-in", icon: KeyRound },
    ],
  },
];

interface TimelineChecklistProps {
  completedStepKey?: string; // inclusive key of last completed step
}

const TimelineChecklist: React.FC<TimelineChecklistProps> = ({ completedStepKey }) => {
  const location = useLocation();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const completedIndex = TIMELINE_STEPS.findIndex((s) => s.key === completedStepKey);

  return (
    <div className="space-y-4">
      {TIMELINE_STEPS.map((step, index) => {
        const StepIcon = step.icon;
        const isCompleted = completedIndex >= index;
        const isActiveCategory = location.pathname.includes(step.key);
        const isOpen = openKey === step.key || isActiveCategory;

        return (
          <div key={step.key}>
            {/* Main Step Row */}
            <button
              onClick={() => setOpenKey(isOpen ? null : step.key)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                isCompleted ? "bg-green-100 border-green-300" : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <StepIcon
                  className={`w-6 h-6 ${isCompleted ? "text-green-600" : "text-brown"}`}
                />
                <span className="font-medium text-brown-dark">{step.name}</span>
              </div>
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {/* Progress bar line */}
            <div
              className={`h-1 ml-3 border-l-2 ${index < TIMELINE_STEPS.length - 1 ? "" : "hidden"}`}
              style={{ borderColor: isCompleted ? "#16a34a" : "#e5e7eb" }}
            />

            {/* Sub-steps */}
            {isOpen && (
              <div className="mt-2 ml-8 space-y-2">
                {step.subSteps.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = location.pathname === sub.href;
                  return (
                    <Link
                      key={sub.href}
                      to={sub.href}
                      className={`flex items-center space-x-2 p-2 rounded hover:bg-brown/10 transition-colors ${
                        isSubActive ? "bg-brown/10" : ""
                      }`}
                    >
                      <SubIcon className="w-4 h-4 text-brown" />
                      <span className="text-sm">{sub.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TimelineChecklist;
