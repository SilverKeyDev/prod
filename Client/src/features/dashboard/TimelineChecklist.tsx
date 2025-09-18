import { ChevronDown, ChevronUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
      <div className="mobile-container">
        {/* Timeline grid: each column contains main + substeps */}
        <div
          className="relative grid w-full items-start gap-x-1 sm:gap-x-2 md:gap-x-3 lg:gap-x-4"
          style={{
            gridTemplateColumns: `repeat(${TIMELINE_STEPS.length * 2 - 1}, minmax(0, 1fr))`, // steps + connecting lines
          }}
        >
          {TIMELINE_STEPS.map((step, idx) => {
            const StepIcon: LucideIcon = step.icon;

            return (
              <React.Fragment key={step.key}>
                {/* Step column */}
                <div className="col-span-1 flex min-w-0 flex-col items-center">
                  {/* Main icon */}
                  <Link
                    to={(() => {
                      const first = step.subSteps?.[0] as unknown;
                      if (
                        first &&
                        typeof first === "object" &&
                        "href" in first
                      ) {
                        return (first as { href: string }).href;
                      }
                      return "#";
                    })()}
                    className="flex h-6 w-6 touch-manipulation items-center justify-center rounded-full bg-olive text-white transition-colors sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12"
                    title={step.name}
                  >
                    <StepIcon
                      className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6"
                      color="white"
                    />
                  </Link>

                  {/* Step name - hidden on mobile */}
                  <span className="text-brown-dark mt-0.5 hidden max-w-full select-none truncate px-0.5 text-center text-[8px] capitalize sm:mt-1 sm:inline sm:px-1 sm:text-xs md:text-sm">
                    {step.name}
                  </span>

                  {/* Substeps container: responsive width - hidden on mobile */}
                  <div className="mt-0.5 hidden max-w-full flex-wrap justify-center gap-0.5 sm:mt-1 sm:flex sm:gap-1 md:mt-2 md:gap-2">
                    {step.subSteps.map((sub) => {
                      const subAny = sub as unknown;
                      const SubIcon =
                        subAny && typeof subAny === "object" && "icon" in subAny
                          ? ((subAny as { icon: LucideIcon })
                              .icon)
                          : null;
                      const href =
                        subAny && typeof subAny === "object" && "href" in subAny
                          ? (subAny as { href: string }).href
                          : "#";
                      const name =
                        subAny && typeof subAny === "object" && "name" in subAny
                          ? (subAny as { name: string }).name
                          : "Unknown";
                      const isActiveSub = location.pathname === href;
                      const colorStyles = {
                        backgroundColor: "#f3f4f6", // light gray
                        borderColor: "#d1d5db",
                        color: "#5c4b3b",
                      };
                      return (
                        <Link
                          key={href || "unknown"}
                          to={href}
                          title={name}
                          className={`flex h-4 w-4 touch-manipulation items-center justify-center rounded-full border text-xs transition-colors sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 ${
                            isActiveSub ? "ring-1 ring-brown sm:ring-2" : ""
                          }`}
                          style={colorStyles}
                        >
                          {SubIcon ? (
                            <SubIcon className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 lg:h-3.5 lg:w-3.5" />
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Connector column */}
                {idx < TIMELINE_STEPS.length - 1 && (
                  <div className="col-span-1 flex h-6 items-center justify-center sm:h-8 md:h-10 lg:h-12">
                    <div
                      className="h-[1px] w-full sm:h-[1px] md:h-[2px]"
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
    <div className="mobile-container space-y-3 sm:space-y-4">
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
              className={`ml-2 h-1 border-l-2 sm:ml-3 ${index < TIMELINE_STEPS.length - 1 ? "" : "hidden"}`}
              style={{ borderColor: isCompleted ? "#16a34a" : "#e5e7eb" }}
            />

            {/* Sub-steps */}
            {isOpen && (
              <div className="ml-6 mt-2 w-full space-y-1 sm:ml-8 sm:space-y-2">
                {step.subSteps.map((sub) => {
                  const subAny = sub as unknown;
                  const SubIcon =
                    subAny && typeof subAny === "object" && "icon" in subAny
                      ? ((subAny as { icon: LucideIcon }).icon)
                      : null;
                  const href =
                    subAny && typeof subAny === "object" && "href" in subAny
                      ? (subAny as { href: string }).href
                      : "#";
                  const name =
                    subAny && typeof subAny === "object" && "name" in subAny
                      ? (subAny as { name: string }).name
                      : "";
                  const isSubActive = location.pathname === href;
                  return (
                    <Link
                      key={href || "unknown"}
                      to={href}
                      className={`flex w-full touch-manipulation items-center space-x-2 rounded p-2 transition-colors hover:bg-brown/10 ${
                        isSubActive ? "bg-brown/10" : ""
                      }`}
                    >
                      {SubIcon ? (
                        <SubIcon className="h-3 w-3 flex-shrink-0 text-brown sm:h-4 sm:w-4" />
                      ) : null}
                      <span className="truncate text-[10px] sm:text-sm">
                        {name}
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
