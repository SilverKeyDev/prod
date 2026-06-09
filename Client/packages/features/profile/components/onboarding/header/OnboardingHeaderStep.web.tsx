import React from "react";

import { Box } from "packages/ui/components/structure/primitives";
import {
  AnimatePresence,
  MotionButton,
  MotionSpan,
  MotionView,
} from "packages/ui/components/system/adapters/motion";

import {
  ONBOARDING_HEADER_FADE,
  ONBOARDING_HEADER_INSTANT,
  ONBOARDING_HEADER_SPRING,
} from "./onboardingHeaderMotion";

export type OnboardingHeaderStepData = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string; name?: string }>;
};

type OnboardingHeaderStepProps = {
  step: OnboardingHeaderStepData;
  index: number;
  stepCount: number;
  currentStep: number;
  prevStep: number;
  direction: "forward" | "backward" | "none";
  showConnectors: boolean;
  connectorWidth: string;
  connectorMargin: string;
  onStepClick: (stepIndex: number) => void;
};

function connectorMotion(
  index: number,
  currentStep: number,
  prevStep: number,
  direction: "forward" | "backward" | "none"
) {
  const isCompletedNow = index < currentStep;
  const wasCompletedBefore = index < prevStep;
  const newlyCompleted = direction === "forward" && !wasCompletedBefore && isCompletedNow;
  if (direction === "forward") {
    return {
      initial: {
        width: newlyCompleted ? "0%" : isCompletedNow ? "100%" : "0%",
      },
      animate: { width: isCompletedNow ? "100%" : "0%" },
      transition: newlyCompleted
        ? { ...ONBOARDING_HEADER_SPRING, delay: (index - prevStep) * 0.08 }
        : ONBOARDING_HEADER_INSTANT,
    };
  }
  return {
    initial: { width: isCompletedNow ? "100%" : "0%" },
    animate: { width: isCompletedNow ? "100%" : "0%" },
    transition: ONBOARDING_HEADER_INSTANT,
  };
}

export function OnboardingHeaderStep({
  step,
  index,
  stepCount,
  currentStep,
  prevStep,
  direction,
  showConnectors,
  connectorWidth,
  connectorMargin,
  onStepClick,
}: OnboardingHeaderStepProps) {
  const StepIcon = step.icon;
  const isActive = index === currentStep;
  const isCompleted = index < currentStep;
  const wasCompleted = index < prevStep;
  const newlyCompleted = direction === "forward" && !wasCompleted && isCompleted;
  const t = direction === "backward" ? ONBOARDING_HEADER_INSTANT : ONBOARDING_HEADER_FADE;
  const tSpring = direction === "backward" ? ONBOARDING_HEADER_INSTANT : ONBOARDING_HEADER_SPRING;

  return (
    <React.Fragment key={step.id}>
      <Box className="relative flex h-full items-center justify-center">
        <AnimatePresence initial={false}>
          {isActive && (
            <MotionSpan
              key={`${step.id}-glow`}
              className="pointer-events-none absolute -z-0 rounded-full"
              style={{
                width: "150%",
                height: "150%",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                filter: "blur(2px)",
              }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={t}
            />
          )}
        </AnimatePresence>

        <MotionButton
          onClick={() => onStepClick(index)}
          type="button"
          title={step.title}
          aria-current={isActive ? "step" : undefined}
          className={`xs:h-6 xs:w-6 z-header relative flex h-5 w-5 items-center justify-center rounded-full sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-10 lg:w-10 xl:h-12 xl:w-12 2xl:h-14 2xl:w-14 ${
            isCompleted
              ? "bg-primary text-white"
              : isActive
                ? "bg-primary text-white"
                : "bg-accent-muted text-text-secondary"
          }`}
          whileHover={direction === "backward" ? undefined : { scale: 1.04 }}
          whileTap={direction === "backward" ? undefined : { scale: 0.98 }}
          animate={{
            scale: isActive ? 1.03 : 1,
            rotate: isActive ? 0.0001 : 0,
          }}
          transition={tSpring}
          style={{ overflow: "visible" }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {isCompleted ? (
              <MotionSpan
                key="check"
                initial={{
                  opacity: newlyCompleted ? 0 : 1,
                  scale: newlyCompleted ? 0.7 : 1,
                  rotate: newlyCompleted ? -10 : 0,
                }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.7, rotate: 8 }}
                transition={
                  newlyCompleted
                    ? {
                        ...t,
                        delay: (index - prevStep) * 0.05,
                      }
                    : ONBOARDING_HEADER_INSTANT
                }
                className="flex"
              >
                <StepIcon
                  name="check"
                  className="xs:h-3 xs:w-3 h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 2xl:h-7 2xl:w-7"
                />
              </MotionSpan>
            ) : (
              <MotionSpan
                key="icon"
                initial={{ opacity: 0.999, scale: 1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.999, scale: 1 }}
                transition={ONBOARDING_HEADER_INSTANT}
                className="flex"
              >
                <StepIcon className="xs:h-3 xs:w-3 h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 2xl:h-7 2xl:w-7" />
              </MotionSpan>
            )}
          </AnimatePresence>

          <MotionSpan
            aria-hidden="true"
            className="absolute inset-0 rounded-full ring-2"
            style={{
              boxShadow: "0 0 0 0 rgba(0,0,0,0)",
              overflow: "visible",
            }}
            animate={{
              boxShadow: isActive ? "0 8px 18px -6px rgba(88,67,57,0.28)" : "0 0 0 0 rgba(0,0,0,0)",
            }}
            transition={t}
          />
        </MotionButton>
      </Box>

      {index < stepCount - 1 && showConnectors && (
        <Box className="flex h-1 w-full items-center justify-center" aria-hidden="true">
          <Box
            className="bg-accent-muted h-full overflow-hidden rounded-full"
            style={{
              width: connectorWidth,
              marginLeft: connectorMargin,
              marginRight: connectorMargin,
            }}
          >
            <MotionView
              className="bg-primary h-full"
              {...connectorMotion(index, currentStep, prevStep, direction)}
            />
          </Box>
        </Box>
      )}
    </React.Fragment>
  );
}

export function OnboardingHeaderStepLabel({
  step,
  index,
  stepCount,
  currentStep,
  direction,
  showConnectors,
}: {
  step: OnboardingHeaderStepData;
  index: number;
  stepCount: number;
  currentStep: number;
  direction: "forward" | "backward" | "none";
  showConnectors: boolean;
}) {
  const isActive = index === currentStep;

  return (
    <React.Fragment key={`${step.id}-label`}>
      <Box className="relative flex justify-center overflow-visible">
        <AnimatePresence initial={false} mode="wait">
          <MotionSpan
            key={`${step.id}-label-text-${isActive ? "active" : "idle"}`}
            className={`sm:max-w-18 text-text-secondary hidden max-w-16 text-center text-xs leading-tight tracking-tight sm:block sm:text-xs md:max-w-24 md:text-xs lg:max-w-28 lg:text-xs xl:max-w-32 xl:text-xs 2xl:text-xs ${isActive ? "font-medium" : "font-normal"} mt-1.5 sm:mt-2`}
            initial={{
              opacity: direction === "backward" ? 1 : 0,
              y: direction === "backward" ? 0 : 2,
            }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: direction === "backward" ? 1 : 0,
              y: direction === "backward" ? 0 : -2,
            }}
            transition={
              direction === "backward" ? ONBOARDING_HEADER_INSTANT : ONBOARDING_HEADER_FADE
            }
          >
            {step.title}
          </MotionSpan>
        </AnimatePresence>
      </Box>
      {index < stepCount - 1 && showConnectors && <Box aria-hidden="true" />}
    </React.Fragment>
  );
}
