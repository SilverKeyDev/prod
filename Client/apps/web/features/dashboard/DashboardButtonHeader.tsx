import { ChevronDown, ChevronUp, type LucideIcon } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { TIMELINE_STEPS } from "./DashboardButtonHeaderConstants";

type DashboardButtonHeaderProps = {
  completedStepKey?: string; // inclusive key of last completed step
  variant?: "horizontal" | "vertical"; // New prop to control layout
};

const DashboardButtonHeader: React.FC<DashboardButtonHeaderProps> = ({
  completedStepKey,
  variant = "vertical",
}) => {
  const location = useLocation();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const completedIndex = TIMELINE_STEPS.findIndex(
    (s) => s.key === completedStepKey,
  );

  // Horizontal timeline progress (from TimelineProgress)
  if (variant === "horizontal") {
    return (
      <div className="w-full px-1 sm:px-2 md:px-4 lg:px-6 xl:px-8">
        {/* Timeline grid: each column contains main + substeps */}
        <div className="flex w-full items-center justify-between sm:items-start gap-1 sm:gap-2">
          {TIMELINE_STEPS.map((step, idx) => {
            const StepIcon: LucideIcon = step.icon;

            return (
              <React.Fragment key={step.key}>
                {/* Step column */}
                <div className="flex flex-shrink-0 flex-col items-center text-center min-w-0 flex-1">
                  {/* Main icon */}
                  <Link
                    to={
                      step.subSteps &&
                      step.subSteps.length > 0 &&
                      step.subSteps[0]?.to
                        ? step.subSteps[0].to
                        : "#"
                    }
                    className="flex h-8 w-8 touch-manipulation items-center justify-center rounded-full bg-olive text-white transition-colors sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12"
                    title={step.name}
                  >
                    <StepIcon
                      className="h-3 w-3 sm:h-[1.125rem] sm:w-[1.125rem] md:h-4 md:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6"
                      color="white"
                    />
                  </Link>
                  {/* Step name with responsive text scaling */}
                  <div className="mt-1 w-full px-0.5 sm:px-1">
                    <span
                      className="block font-medium text-gray-700 truncate overflow-hidden"
                      style={{
                        fontSize: "clamp(0.625rem, 1.5vw, 1.125rem)",
                        lineHeight: "1.1",
                      }}
                    >
                      {step.name}
                    </span>
                  </div>
                </div>

                {/* Connector column */}
                {idx < TIMELINE_STEPS.length - 1 && (
                  <div className="flex h-8 flex-grow items-center justify-center sm:h-9 md:h-10 lg:h-12 min-w-0 px-1">
                    <div
                      className="h-[1px] w-[60%] sm:w-[75%] md:h-[1px] lg:h-[2px]"
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
                <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" color="white" />

                {step.name}
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
                  const SubIcon = sub.icon;
                  const isSubActive = location.pathname === sub.to;
                  return (
                    <Link
                      key={sub.to || "unknown"}
                      to={sub.to || "#"}
                      className={`flex w-full touch-manipulation items-center space-x-2 rounded p-2 transition-colors hover:bg-brown/10 ${
                        isSubActive ? "bg-brown/10" : ""
                      }`}
                    >
                      {SubIcon && (
                        <SubIcon className="h-3 w-3 flex-shrink-0 text-brown sm:h-4 sm:w-4" />
                      )}

                      {sub.label}
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

export default DashboardButtonHeader;
