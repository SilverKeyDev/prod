import { Link, useLocation } from "react-router-dom";
import React from "react";
import { LucideIcon } from "lucide-react";
import { TIMELINE_STEPS } from "./TimelineChecklist";

interface TimelineProgressProps {
  completedStepKey?: string;
  currentStepKey?: string;
}

const TimelineProgress: React.FC<TimelineProgressProps> = ({
  completedStepKey,
  currentStepKey,
}) => {
  const location = useLocation();
  const olive = "#A3B18A";

  const completedIndex = TIMELINE_STEPS.findIndex(
    (s) => s.key === completedStepKey
  );

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
          const isCompleted = idx <= completedIndex;
          const isParentCompleted = isCompleted;

          return (
            <React.Fragment key={step.key}>
              {/* Step column */}
              <div className="flex flex-col items-center col-span-1">
                {/* Main icon */}
                <Link
                  to={step.subSteps[0]?.href || "#"}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted
                      ? "bg-olive text-white"
                      : "bg-gray-200 text-brown"
                  }`}
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
                    const colorStyles = isParentCompleted
                      ? {
                          backgroundColor: olive,
                          borderColor: olive,
                          color: "#ffffff",
                        }
                      : {
                          backgroundColor: "#ffffff",
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
                      backgroundColor:
                        idx < completedIndex ? olive : "#d1d5db",
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
};

export default TimelineProgress;
