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
          className="grid gap-x-1 sm:gap-x-2 md:gap-x-3 lg:gap-x-4 items-start relative w-full"
          style={{
            gridTemplateColumns: `repeat(${TIMELINE_STEPS.length * 2 - 1}, minmax(0, 1fr))`, // steps + connecting lines
          }}
        >
          {TIMELINE_STEPS.map((step, idx) => {
            const StepIcon: LucideIcon = step.icon;

            return (
              <React.Fragment key={step.key}>
                {/* Step column */}
                <div className="flex flex-col items-center col-span-1 min-w-0">
                  {/* Main icon */}
                  <Link
                    to={step.subSteps[0]?.href || "#"}
                    className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-colors bg-olive text-white touch-manipulation"
                    title={step.name}
                  >
                    <StepIcon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" color="white" />
                  </Link>

                  {/* Step name */}
                  <span className="text-[10px] sm:text-xs md:text-sm mt-0.5 sm:mt-1 text-brown-dark capitalize select-none text-center px-0.5 sm:px-1 truncate max-w-full">
                    {step.name}
                  </span>

                  {/* Substeps container: responsive width */}
                  <div className="mt-0.5 sm:mt-1 md:mt-2 flex justify-center gap-0.5 sm:gap-1 md:gap-2 flex-wrap max-w-full">
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
                          className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center text-xs transition-colors border touch-manipulation ${
                            isActiveSub ? "ring-1 sm:ring-2 ring-brown" : ""
                          }`}
                          style={colorStyles}
                        >
                          <SubIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5" />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Connector column */}
                {idx < TIMELINE_STEPS.length - 1 && (
                  <div className="flex items-center justify-center col-span-1 h-6 sm:h-8 md:h-10 lg:h-12">
                    <div
                      className="w-full h-[1px] sm:h-[1px] md:h-[2px]"
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
    <div className="w-full space-y-3 sm:space-y-4">
      {TIMELINE_STEPS.map((step, index) => {
        const StepIcon = step.icon;
        const isCompleted = completedIndex >= index;
        const isActiveCategory = location.pathname.includes(step.key);
        const isOpen = openKey === step.key || isActiveCategory;

        return (
          <div key={step.key} className="w-full">
            {/* Main Step Row */}
            <button
              onClick={() => setOpenKey(isOpen ? null : step.key)}
              className={`w-full flex items-center justify-between p-2 sm:p-3 rounded-lg border transition-colors touch-manipulation ${
                isCompleted ? "bg-green-100 border-green-300" : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-brown flex-shrink-0">
                  <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" color="white" />
                </span>
                <span className="font-medium text-brown-dark text-sm sm:text-base truncate">{step.name}</span>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />}
            </button>

            {/* Progress bar line */}
            <div
              className={`h-1 ml-2 sm:ml-3 border-l-2 ${index < TIMELINE_STEPS.length - 1 ? "" : "hidden"}`}
              style={{ borderColor: isCompleted ? "#16a34a" : "#e5e7eb" }}
            />

            {/* Sub-steps */}
            {isOpen && (
              <div className="mt-2 ml-6 sm:ml-8 space-y-1 sm:space-y-2 w-full">
                {step.subSteps.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = location.pathname === sub.href;
                  return (
                    <Link
                      key={sub.href}
                      to={sub.href}
                      className={`flex items-center space-x-2 p-2 rounded hover:bg-brown/10 transition-colors touch-manipulation w-full ${
                        isSubActive ? "bg-brown/10" : ""
                      }`}
                    >
                      <SubIcon className="w-3 h-3 sm:w-4 sm:h-4 text-brown flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">{sub.name}</span>
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
