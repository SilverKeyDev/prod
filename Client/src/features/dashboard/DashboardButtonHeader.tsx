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
      { name: "Personalization", href: "/personalization", icon: UserIcon },
      { name: "Get Pre-Approved", href: "/get-preapproved", icon: BadgeCheck },
    ],
  },
  {
    key: "search",
    name: "Search",
    icon: SearchIcon,
    subSteps: [
      { name: "Search Homes", href: "/search", icon: SearchIcon },
      { name: "Saved Homes", href: "/saved", icon: Bookmark },
    ],
  },
  {
    key: "decide",
    name: "Decide",
    icon: Split,
    subSteps: [
      { name: "Generate Report", href: "/generate-report", icon: FilePlus },
      { name: "Past Reports", href: "/reports", icon: FileText },
      { name: "Compare Reports", href: "/compare-reports", icon: BarChart2 },
      { name: "AI Assistant", href: "/ai-assistant", icon: MessageCircle },
    ],
  },
  {
    key: "negotiate",
    name: "Negotiate",
    icon: Handshake,
    subSteps: [
      {
        name: "Negotiation Strategy",
        href: "/negotiation-strategy",
        icon: Brain,
      },
    ],
  },
  {
    key: "close",
    name: "Close",
    icon: Key,
    subSteps: [
      { name: "Escrow & Legal", href: "/escrow-legal-logistics", icon: Scale },
      {
        name: "Inspections & Due Diligence",
        href: "/inspections-due-diligence",
        icon: ShieldCheck,
      },
      {
        name: "Financing & Insurance",
        href: "/financing-insurance",
        icon: Building2,
      },
      { name: "Closing & Move-In", href: "/closing-moving-in", icon: KeyRound },
    ],
  },
];

interface TimelineChecklistProps {
  completedStepKey?: string; // inclusive key of last completed step
  variant?: "horizontal" | "vertical"; // New prop to control layout
}

const TimelineChecklist: React.FC<TimelineChecklistProps> = ({
  completedStepKey,
  variant = "vertical",
}) => {
  const location = useLocation();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const completedIndex = TIMELINE_STEPS.findIndex(
    (s) => s.key === completedStepKey
  );

  // Horizontal timeline progress (from TimelineProgress)
  if (variant === "horizontal") {
    return (
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
        {/* Timeline grid: each column contains main + substeps */}
        <div className="flex w-full items-center sm:items-start justify-between">
          {TIMELINE_STEPS.map((step, idx) => {
            const StepIcon: LucideIcon = step.icon;

            return (
              <React.Fragment key={step.key}>
                {/* Step column */}
                <div className="flex flex-col items-center text-center flex-shrink-0">
                  {/* Main icon */}
                  <Link
                    to={step.subSteps[0]?.href || "#"}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-colors bg-olive text-white touch-manipulation sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"
                    title={step.name}
                  >
                    <StepIcon
                      className="w-[1.125rem] h-[1.125rem] sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
                      color="white"
                    />
                  </Link>

                  {/* Step name - compact responsive scaling */}
                  <span className="hidden sm:block text-[8px] sm:text-[10px] md:text-xs lg:text-sm mt-0.5 sm:mt-1 text-gray-600 capitalize select-none text-center px-0.5 sm:px-1 truncate max-w-full font-medium leading-tight">
                    {step.name}
                  </span>

                  {/* Substeps container: responsive width */}
                  <div className="hidden sm:flex mt-1 md:mt-2 justify-center gap-1 flex-wrap max-w-full">
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
                          className={`w-3 h-3 rounded-full flex items-center justify-center text-xs transition-colors border touch-manipulation sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 ${
                            isActiveSub ? "ring-1 sm:ring-2 ring-brown" : ""
                          }`}
                          style={colorStyles}
                        >
                          <SubIcon className="hidden sm:block w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3" />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Connector column */}
                {idx < TIMELINE_STEPS.length - 1 && (
                  <div className="flex-grow flex items-center justify-center h-6 sm:h-8 md:h-10 lg:h-12">
                    <div
                      className="w-[75%] h-[1px] sm:h-[1px] md:h-[2px] lg:h-[2px]"
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
    <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 space-y-3 sm:space-y-4">
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
                isCompleted
                  ? "bg-green-100 border-green-300"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-brown flex-shrink-0">
                  <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" color="white" />
                </span>
                <span className="font-medium text-brown-dark text-xs sm:text-base truncate">
                  {step.name}
                </span>
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              )}
            </button>

            {/* Progress bar line */}
            <div
              className={`h-1 ml-2 sm:ml-3 border-l-2 ${
                index < TIMELINE_STEPS.length - 1 ? "" : "hidden"
              }`}
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
                      <span className="text-[10px] sm:text-sm truncate">
                        {sub.name}
                      </span>
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
