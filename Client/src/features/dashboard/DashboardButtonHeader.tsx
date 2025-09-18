import { ChevronDown, ChevronUp, type LucideIcon } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { TIMELINE_STEPS } from "./DashboardButtonHeaderConstants";

type TimelineChecklistProps = {
  completedStepKey?: string; // inclusive key of last completed step
  variant?: "horizontal" | "vertical"; // New prop to control layout
};

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
        <div className="flex w-full items-center justify-between sm:items-start">
          {TIMELINE_STEPS.map((step, idx) => {
            const StepIcon: LucideIcon = step.icon;

            return (
              <React.Fragment key={step.key}>
                {/* Step column */}
                <div className="flex flex-shrink-0 flex-col items-center text-center">
                  {/* Main icon */}
                  <Link
                    to={
                      step.subSteps &&
                      step.subSteps.length > 0 &&
                      step.subSteps[0] &&
                      typeof step.subSteps[0] === "object" &&
                      "to" in step.subSteps[0]
                        ? (step.subSteps[0] as { to: string }).to
                        : "#"
                    }
                    className="flex h-9 w-9 touch-manipulation items-center justify-center rounded-full bg-olive text-white transition-colors sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12"
                    title={step.name}
                  >
                    <StepIcon
                      className="h-[1.125rem] w-[1.125rem] sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6"
                      color="white"
                    />
                  </Link>

                  {/* Step name - compact responsive scaling */}
                  <span className="mt-0.5 hidden max-w-full select-none truncate px-0.5 text-center text-[8px] font-medium capitalize leading-tight text-gray-600 sm:mt-1 sm:block sm:px-1 sm:text-[10px] md:text-xs lg:text-sm">
                    {step.name}
                  </span>

                  {/* Substeps container: responsive width */}
                  <div className="mt-1 hidden max-w-full flex-wrap justify-center gap-1 sm:flex md:mt-2">
                    {step.subSteps.map((sub) => {
                      const SubIcon: LucideIcon = sub.icon;
                      const isActiveSub = location.pathname === sub.to;
                      const colorStyles = {
                        backgroundColor: "#f3f4f6", // light gray
                        borderColor: "#d1d5db",
                        color: "#5c4b3b",
                      };
                      return (
                        <Link
                          key={
                            sub && typeof sub === "object" && "to" in sub
                              ? (sub as { to: string }).to
                              : "unknown"
                          }
                          to={
                            sub && typeof sub === "object" && "to" in sub
                              ? (sub as { to: string }).to
                              : "#"
                          }
                          title={
                            sub && typeof sub === "object" && "label" in sub
                              ? (sub as { label: string }).label
                              : "Unknown"
                          }
                          className={`flex h-3 w-3 touch-manipulation items-center justify-center rounded-full border text-xs transition-colors sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 ${
                            isActiveSub ? "ring-1 ring-brown sm:ring-2" : ""
                          }`}
                          style={colorStyles}
                        >
                          <SubIcon className="hidden h-1.5 w-1.5 sm:block sm:h-2 sm:w-2 md:h-2.5 md:w-2.5 lg:h-3 lg:w-3" />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Connector column */}
                {idx < TIMELINE_STEPS.length - 1 && (
                  <div className="flex h-6 flex-grow items-center justify-center sm:h-8 md:h-10 lg:h-12">
                    <div
                      className="h-[1px] w-[75%] sm:h-[1px] md:h-[2px] lg:h-[2px]"
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
    <div className="w-full space-y-3 px-2 sm:space-y-4 sm:px-4 md:px-6 lg:px-8">
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
              className={`flex w-full touch-manipulation items-center justify-between rounded-lg border p-2 transition-colors sm:p-3 ${
                isCompleted
                  ? "border-green-300 bg-green-100"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center space-x-2 sm:space-x-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brown sm:h-8 sm:w-8">
                  <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" color="white" />
                </span>
                <span className="text-brown-dark truncate text-xs font-medium sm:text-base">
                  {step.name}
                </span>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
              ) : (
                <ChevronDown className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
              )}
            </button>

            {/* Progress bar line */}
            <div
              className={`ml-2 h-1 border-l-2 sm:ml-3 ${
                index < TIMELINE_STEPS.length - 1 ? "" : "hidden"
              }`}
              style={{ borderColor: isCompleted ? "#16a34a" : "#e5e7eb" }}
            />

            {/* Sub-steps */}
            {isOpen && (
              <div className="ml-6 mt-2 w-full space-y-1 sm:ml-8 sm:space-y-2">
                {step.subSteps.map((sub) => {
                  const SubIcon =
                    sub && typeof sub === "object" && "icon" in sub
                      ? (
                          sub as {
                            icon: React.ComponentType<{ className?: string }>;
                          }
                        ).icon
                      : null;
                  const isSubActive =
                    sub && typeof sub === "object" && "to" in sub
                      ? location.pathname === (sub as { to: string }).to
                      : false;
                  return (
                    <Link
                      key={
                        sub && typeof sub === "object" && "to" in sub
                          ? (sub as { to: string }).to
                          : "unknown"
                      }
                      to={
                        sub && typeof sub === "object" && "to" in sub
                          ? (sub as { to: string }).to
                          : "#"
                      }
                      className={`flex w-full touch-manipulation items-center space-x-2 rounded p-2 transition-colors hover:bg-brown/10 ${
                        isSubActive ? "bg-brown/10" : ""
                      }`}
                    >
                      <SubIcon className="h-3 w-3 flex-shrink-0 text-brown sm:h-4 sm:w-4" />
                      <span className="truncate text-[10px] sm:text-sm">
                        {sub.label}
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
