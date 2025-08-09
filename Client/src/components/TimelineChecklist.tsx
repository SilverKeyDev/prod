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
  variant?: 'horizontal' | 'vertical'; // New prop to control layout
}

const TimelineChecklist: React.FC<TimelineChecklistProps> = ({ 
  completedStepKey, 
  variant = 'vertical' 
}) => {
  const location = useLocation();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const completedIndex = TIMELINE_STEPS.findIndex((s) => s.key === completedStepKey);

  // Horizontal timeline progress (from TimelineProgress)
  if (variant === 'horizontal') {
    return (
      <div className="w-full">
        {/* Timeline grid: each column contains main + substeps */}
        <div
          className="grid gap-x-2 items-start relative"
          style={{
            gridTemplateColumns: `repeat(${TIMELINE_STEPS.length * 2 - 1}, minmax(0, 1fr))`, // steps + connecting lines
          }}
        >
          {TIMELINE_STEPS.map((step, idx) => {
            const StepIcon: LucideIcon = step.icon;

            return (
              <React.Fragment key={step.key}>
                {/* Step column */}
                <div className="flex flex-col items-center col-span-1">
                  {/* Main icon */}
                  <Link
                    to={step.subSteps[0]?.href || "#"}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-gray-200 text-brown"
                    title={step.name}
                  >
                    <StepIcon size={20} />
                  </Link>

                  {/* Step name */}
                  <span className="text-xs mt-1 text-brown-dark capitalize select-none">
                    {step.name}
                  </span>

                  {/* Substeps container: fixed width for up to 4 icons, centered */}
                  <div className="mt-2 w-[112px] flex justify-center gap-2">
                    {step.subSteps.map((sub) => {
                      const SubIcon: LucideIcon = sub.icon;
                      const isActiveSub = location.pathname === sub.href;
                      const colorStyles = {
                        backgroundColor: "#f3f4f6", // light gray
                        borderColor: "#d1d5db",
                        color: "#5c4b3b",
                      };
                      return (
                        <Link
                          key={sub.href}
                          to={sub.href}
                          title={sub.name}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors border ${
                            isActiveSub ? "ring-2 ring-brown" : ""
                          }`}
                          style={colorStyles}
                        >
                          <SubIcon size={14} />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Connector column */}
                {idx < TIMELINE_STEPS.length - 1 && (
                  <div className="flex items-center justify-center col-span-1 h-10">
                    <div
                      className="w-full h-[2px]"
                      style={{
                        backgroundColor: "#d1d5db", // light gray
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical timeline checklist (original functionality)
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
