import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  AnimatePresence,
  MotionButton,
  MotionSpan,
  MotionView,
} from "packages/ui/components/adapters/motion";
import { Box } from "packages/ui/components/primitives";
import { getDocument, getWindow } from "packages/utils/platform";

import Card from "@/components/layout/Card.web";
import { Region } from "@/components/ui";

type Step = {
  id: string;
  title: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
};
type OnboardingHeaderProps = {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
};
const spring = {
  type: "spring",
  stiffness: 600,
  damping: 35,
  mass: 0.7,
} as const;
const fade = { type: "tween", ease: "easeOut", duration: 0.22 } as const;
const instant = { type: "tween", duration: 0 } as const;
// Layout scaling constants
const MIN_SCALE = 0.2; // allow icons to get much smaller on narrow screens
const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({ steps, currentStep, onStepClick }) => {
  // Track previous step to detect direction and handle multi-step jumps
  const prevStepRef = useRef(currentStep);
  const prevStep = prevStepRef.current;
  const direction =
    currentStep > prevStep ? "forward" : currentStep < prevStep ? "backward" : "none";
  useEffect(() => {
    prevStepRef.current = currentStep;
  }, [currentStep]);
  // Refs for adaptive scaling so content never exceeds container width
  const outerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    // Capture refs at the beginning of the effect
    const outerElement = outerRef.current;
    const gridElement = gridRef.current;
    const recalc = () => {
      const outer = outerRef.current;
      const grid = gridRef.current;
      if (!outer || !grid) return;
      const available = outer.clientWidth;
      const natural = grid.scrollWidth;
      if (natural <= 0 || available <= 0) {
        setScale(1);
        return;
      }
      const needed = available / natural;
      const newScale = Math.max(MIN_SCALE, Math.min(1, needed));
      setScale(newScale);
    };
    const win = getWindow();
    const doc = getDocument();
    const RO = win
      ? (
          win as unknown as {
            ResizeObserver: unknown;
          }
        ).ResizeObserver
      : undefined;
    const ro =
      RO && typeof RO === "function"
        ? new (RO as new (callback: () => void) => ResizeObserver)(() =>
            requestAnimationFrame(recalc)
          )
        : null;
    recalc();
    if (ro) {
      if (outerElement) ro.observe(outerElement);
      if (gridElement) ro.observe(gridElement);
      if (doc) ro.observe(doc.documentElement);
    } else if (win) {
      win.addEventListener("resize", recalc);
    }
    return () => {
      if (ro) {
        try {
          if (outerElement) ro.unobserve(outerElement);
          if (gridElement) ro.unobserve(gridElement);
          if (doc) ro.unobserve(doc.documentElement);
        } catch {
          // Ignore errors when cleaning up ResizeObserver
        }
      } else if (win) {
        win.removeEventListener("resize", recalc);
      }
    };
  }, [steps.length]);
  // Grid template: auto (icon) / 1fr (connector) / auto / 1fr ... / auto
  const templateCols = useMemo(
    () =>
      Array.from({ length: steps.length * 2 - 1 }, (_, i) => (i % 2 === 0 ? "auto" : "1fr")).join(
        " "
      ),
    [steps.length]
  );
  // Helper: for connector at index (between step i and i+1), compute motion props
  const connectorMotion = (index: number) => {
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
          ? { ...spring, delay: (index - prevStep) * 0.08 } // sequential cascade for multi-step jumps
          : instant,
      };
    }
    // Backward or no movement: snap without animation
    return {
      initial: { width: isCompletedNow ? "100%" : "0%" },
      animate: { width: isCompletedNow ? "100%" : "0%" },
      transition: instant,
    };
  };
  // Helper: choose transition depending on direction (disable on backward)
  const t = direction === "backward" ? instant : fade;
  const tSpring = direction === "backward" ? instant : spring;
  // Calculate connector visibility - uniform spacing and sizing across all screens
  const calculateConnectorLayout = () => {
    const outer = outerRef.current;
    if (!outer)
      return {
        columnGap: 8, // Fixed 8px gap always
        rowGap: 4, // Fixed 4px row gap always
        showConnectors: true,
        connectorWidth: "70%",
        connectorMargin: "15%",
      };
    const availableWidth = outer.clientWidth;
    const stepCount = steps.length;
    // Estimate minimum space needed for icons only (no connectors)
    const minIconWidth = 20; // minimum tappable size
    const minSpaceForIcons = stepCount * minIconWidth;
    // If we don't have enough space for connectors, hide them
    const showConnectors = availableWidth > minSpaceForIcons * 1.5;
    // UNIFORM SPACING: Same gaps and sizing regardless of screen size
    return {
      columnGap: 8, // Always 8px between elements
      rowGap: 4, // Always 4px between rows
      showConnectors,
      connectorWidth: "70%",
      connectorMargin: "15%",
    };
  };
  const { columnGap, rowGap, showConnectors, connectorWidth, connectorMargin } =
    calculateConnectorLayout();
  return (
    // EXTRA WRAPPER to add top spacing and bottom margin
    <Box className="mb-6 mt-6">
      {/* WHITE BOX WRAPPER (never exceed 85% of the viewport width) - removed border */}
      <Box className="bg-background-surface mx-auto max-w-[85vw] overflow-hidden rounded-2xl shadow-sm">
        {/* Scale wrapper to ensure content fits; origin at top-center */}
        <Box
          ref={outerRef}
          className="w-full overflow-visible"
          style={{ transformOrigin: "top center" }}
        >
          <Box
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
            }}
          >
            {/* Keep interior layout centered; no extra bottom margin */}
            <Card border="light" className="flex items-center justify-center overflow-visible py-1 sm:py-3">
              <Box className="w-full max-w-5xl px-0 sm:px-1 xl:max-w-6xl 2xl:max-w-7xl">
                <Region
                  ref={gridRef}
                  role="group"
                  label="Onboarding steps"
                  className="grid items-center justify-items-center"
                  style={{
                    gridTemplateColumns: templateCols,
                    gridAutoRows: "auto",
                    rowGap: `${rowGap}px`,
                    columnGap: `${columnGap}px`,
                    alignItems: "center",
                    justifyItems: "center",
                  }}
                >
                  {/* Row 1: icons + animated connectors */}
                  {steps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    const wasCompleted = index < prevStep;
                    const newlyCompleted = direction === "forward" && !wasCompleted && isCompleted;
                    return (
                      <React.Fragment key={step.id}>
                        {/* Icon cell */}
                        <Box className="relative flex h-full items-center justify-center">
                          {/* Subtle active glow (no animation on backward) */}
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
                            className={`xs:h-6 xs:w-6 relative z-10 flex h-5 w-5 items-center justify-center rounded-full sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-10 lg:w-10 xl:h-12 xl:w-12 2xl:h-14 2xl:w-14 ${
                              isCompleted
                                ? "bg-primary text-white"
                                : isActive
                                  ? "bg-primary text-white"
                                  : "bg-accent-muted text-text-secondary"
                            }`}
                            whileHover={direction === "backward" ? undefined : { scale: 1.04 }} // slightly reduced scale
                            whileTap={direction === "backward" ? undefined : { scale: 0.98 }}
                            animate={{
                              scale: isActive ? 1.03 : 1,
                              rotate: isActive ? 0.0001 : 0, // GPU nudge
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
                                      : instant
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
                                  initial={{ opacity: 0.999, scale: 1 }} // avoid a pop on layout
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0.999, scale: 1 }}
                                  transition={instant}
                                  className="flex"
                                >
                                  <StepIcon className="xs:h-3 xs:w-3 h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 2xl:h-7 2xl:w-7" />
                                </MotionSpan>
                              )}
                            </AnimatePresence>

                            {/* Active ring shadow (disabled when going back) */}
                            <MotionSpan
                              aria-hidden="true"
                              className="absolute inset-0 rounded-full ring-2"
                              style={{
                                boxShadow: "0 0 0 0 rgba(0,0,0,0)",
                                overflow: "visible",
                              }}
                              animate={{
                                boxShadow: isActive
                                  ? "0 8px 18px -6px rgba(88,67,57,0.28)"
                                  : "0 0 0 0 rgba(0,0,0,0)",
                              }}
                              transition={t}
                            />
                          </MotionButton>
                        </Box>

                        {/* Connector cell (only between steps) */}
                        {index < steps.length - 1 && showConnectors && (
                          <Box
                            className="flex h-1 w-full items-center justify-center"
                            aria-hidden="true"
                          >
                            {/* Centered connector line with consistent margins */}
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
                                {...connectorMotion(index)}
                              />
                            </Box>
                          </Box>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Row 2: labels (animate on forward; snap on backward) */}
                  {steps.map((step, index) => {
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
                              transition={direction === "backward" ? instant : fade}
                            >
                              {step.title}
                            </MotionSpan>
                          </AnimatePresence>
                        </Box>
                        {/* Empty cell under each connector to preserve grid structure */}
                        {index < steps.length - 1 && showConnectors && <Box aria-hidden="true" />}
                      </React.Fragment>
                    );
                  })}
                </Region>
              </Box>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
export default OnboardingHeader;
