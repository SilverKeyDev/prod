import React, { useMemo } from "react";
import { Check } from "lucide-react";

interface Step {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface OnboardingHeaderProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
}

const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  // Grid template: auto (icon) / 1fr (connector) / auto / 1fr ... / auto
  const templateCols = useMemo(
    () =>
      Array.from({ length: steps.length * 2 - 1 }, (_, i) =>
        i % 2 === 0 ? "auto" : "1fr"
      ).join(" "),
    [steps.length]
  );

  return (
    <div className="mobile-card mb-6 flex items-center justify-center py-4">
      <div className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl overflow-x-auto scrollbar-hide px-1 sm:px-2">
        <div
          className="grid items-center justify-items-center"
          style={{
            gridTemplateColumns: templateCols,
            gridAutoRows: "auto",
            rowGap: "0.125rem",
            columnGap: "0.5rem",
            alignItems: "center",
            justifyItems: "center",
          }}
          role="group"
          aria-label="Onboarding steps"
        >
          {/* Row 1: icons + flexible connectors */}
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <React.Fragment key={step.id}>
                {/* Icon cell */}
                <div className="flex justify-center items-center h-full">
                  <button
                    onClick={() => onStepClick(index)}
                    className={`flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 2xl:w-14 2xl:h-14 rounded-full transform transition-transform hover:scale-105 ${
                      isCompleted
                        ? "bg-olive text-white hover:bg-olive/80"
                        : isActive
                        ? "bg-brown text-white hover:bg-brown/80"
                        : "bg-beige text-black/60 hover:bg-beige/80"
                    }`}
                    title={step.title}
                    aria-current={isActive ? "step" : undefined}
                    aria-label={step.title}
                    type="button"
                  >
                    {isCompleted ? (
                      <Check className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" />
                    ) : (
                      <Icon className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" />
                    )}
                  </button>
                </div>

                {/* Connector cell (only between steps) */}
                {index < steps.length - 1 && (
                  <div
                    className={`w-full h-0.5 sm:h-1 rounded-full ${
                      isCompleted ? "bg-olive" : "bg-beige"
                    }`}
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Row 2: labels under their respective icons (sm+), smaller base + more upscale at large screens */}
          {steps.map((step, index) => (
            <React.Fragment key={`${step.id}-label`}>
              <div className="flex justify-center">
                <span
                  className="
                    hidden sm:block
                    text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-sm
                    text-center text-black/60
                    mt-0.5 sm:mt-1
                    leading-tight tracking-tight
                    max-w-[64px] sm:max-w-[72px] md:max-w-[90px] lg:max-w-[110px] xl:max-w-[130px]
                  "
                >
                  {step.title}
                </span>
              </div>
              {/* Empty cell under each connector to preserve grid structure */}
              {index < steps.length - 1 && <div aria-hidden="true" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingHeader;
