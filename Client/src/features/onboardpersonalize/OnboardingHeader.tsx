import React, { useRef, useEffect, useState, useMemo } from "react";
import { Check } from "lucide-react";
import Card from "../../components/layout/Card";
import { motion, AnimatePresence, type Transition } from "framer-motion";

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

const spring: Transition = {
  type: "spring",
  stiffness: 600,
  damping: 35,
  mass: 0.7,
};
const fade: Transition = { type: "tween", ease: "easeOut", duration: 0.22 };
const instant: Transition = { type: "tween", duration: 0 };

// Layout scaling constants
const MIN_SCALE = 0.2; // allow icons to get much smaller on narrow screens

const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  // Track previous step to detect direction and handle multi-step jumps
  const prevStepRef = useRef(currentStep);
  const prevStep = prevStepRef.current;
  const direction =
    currentStep > prevStep
      ? "forward"
      : currentStep < prevStep
        ? "backward"
        : "none";

  useEffect(() => {
    prevStepRef.current = currentStep;
  }, [currentStep]);

  // Refs for adaptive scaling so content never exceeds container width
  const outerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
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

    const RO = (window as any).ResizeObserver;
    const ro = RO ? new RO(() => requestAnimationFrame(recalc)) : null;

    recalc();

    if (ro) {
      if (outerRef.current) ro.observe(outerRef.current);
      if (gridRef.current) ro.observe(gridRef.current);
      ro.observe(document.documentElement);
    } else {
      window.addEventListener("resize", recalc);
    }

    return () => {
      if (ro) {
        try {
          if (outerRef.current) ro.unobserve(outerRef.current);
          if (gridRef.current) ro.unobserve(gridRef.current);
          ro.unobserve(document.documentElement);
        } catch {
          // Ignore observer cleanup errors
        }
      } else {
        window.removeEventListener("resize", recalc);
      }
    };
  }, [steps.length]);

  // Grid template: auto (icon) / 1fr (connector) / auto / 1fr ... / auto
  const templateCols = useMemo(
    () =>
      Array.from({ length: steps.length * 2 - 1 }, (_, i) =>
        i % 2 === 0 ? "auto" : "1fr",
      ).join(" "),
    [steps.length],
  );

  // Helper: for connector at index (between step i and i+1), compute motion props
  const connectorMotion = (index: number) => {
    const isCompletedNow = index < currentStep;
    const wasCompletedBefore = index < prevStep;
    const newlyCompleted =
      direction === "forward" && !wasCompletedBefore && isCompletedNow;

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
    <div className="mt-6 mb-6">
      {/* WHITE BOX WRAPPER (never exceed 85% of the viewport width) - removed border */}
      <div className="bg-white rounded-2xl shadow-sm mx-auto max-w-[85vw] overflow-hidden">
        {/* Scale wrapper to ensure content fits; origin at top-center */}
        <div
          ref={outerRef}
          className="w-full overflow-visible"
          style={{ transformOrigin: "top center" }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
            }}
          >
            {/* Keep interior layout centered; no extra bottom margin */}
            <Card className="flex items-center justify-center py-1 sm:py-3 overflow-visible">
              <div className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl px-0 sm:px-1">
                <div
                  ref={gridRef}
                  className="grid items-center justify-items-center"
                  style={{
                    gridTemplateColumns: templateCols,
                    gridAutoRows: "auto",
                    rowGap: `${rowGap}px`,
                    columnGap: `${columnGap}px`,
                    alignItems: "center",
                    justifyItems: "center",
                  }}
                  role="group"
                  aria-label="Onboarding steps"
                >
                  {/* Row 1: icons + animated connectors */}
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    const wasCompleted = index < prevStep;
                    const newlyCompleted =
                      direction === "forward" && !wasCompleted && isCompleted;

                    return (
                      <React.Fragment key={step.id}>
                        {/* Icon cell */}
                        <div className="flex justify-center items-center h-full relative">
                          {/* Subtle active glow (no animation on backward) */}
                          <AnimatePresence initial={false}>
                            {isActive && (
                              <motion.span
                                key={`${step.id}-glow`}
                                className="absolute rounded-full pointer-events-none -z-0"
                                style={{
                                  width: "150%",
                                  height: "150%",
                                  top: "50%",
                                  left: "50%",
                                  transform: "translate(-50%, -50%)",
                                  background:
                                    "radial-gradient(50% 50% at 50% 50%, rgba(88,67,57,0.22) 0%, rgba(88,67,57,0) 70%)",
                                  filter: "blur(2px)",
                                }}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={t}
                              />
                            )}
                          </AnimatePresence>

                          <motion.button
                            onClick={() => onStepClick(index)}
                            type="button"
                            title={step.title}
                            aria-current={isActive ? "step" : undefined}
                            className={`relative z-10 flex items-center justify-center rounded-full
                          w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 2xl:w-14 2xl:h-14
                          ${
                            isCompleted
                              ? "bg-olive text-white"
                              : isActive
                                ? "bg-brown text-white"
                                : "bg-beige text-black/60"
                          }`}
                            whileHover={
                              direction === "backward"
                                ? undefined
                                : { scale: 1.04 }
                            } // slightly reduced scale
                            whileTap={
                              direction === "backward"
                                ? undefined
                                : { scale: 0.98 }
                            }
                            animate={{
                              scale: isActive ? 1.03 : 1,
                              rotate: isActive ? 0.0001 : 0, // GPU nudge
                            }}
                            transition={tSpring}
                            style={{ overflow: "visible" }}
                          >
                            <AnimatePresence mode="popLayout" initial={false}>
                              {isCompleted ? (
                                <motion.span
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
                                  <Check className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" />
                                </motion.span>
                              ) : (
                                <motion.span
                                  key="icon"
                                  initial={{ opacity: 0.999, scale: 1 }} // avoid a pop on layout
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0.999, scale: 1 }}
                                  transition={instant}
                                  className="flex"
                                >
                                  <Icon className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" />
                                </motion.span>
                              )}
                            </AnimatePresence>

                            {/* Active ring shadow (disabled when going back) */}
                            <motion.span
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
                          </motion.button>
                        </div>

                        {/* Connector cell (only between steps) */}
                        {index < steps.length - 1 && showConnectors && (
                          <div
                            className="w-full h-1 flex items-center justify-center"
                            aria-hidden="true"
                          >
                            {/* Centered connector line with consistent margins */}
                            <div
                              className="h-full rounded-full bg-beige overflow-hidden"
                              style={{
                                width: connectorWidth,
                                marginLeft: connectorMargin,
                                marginRight: connectorMargin,
                              }}
                            >
                              <motion.div
                                className="h-full bg-olive"
                                {...connectorMotion(index)}
                              />
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Row 2: labels (animate on forward; snap on backward) */}
                  {steps.map((step, index) => {
                    const isActive = index === currentStep;
                    return (
                      <React.Fragment key={`${step.id}-label`}>
                        <div className="flex justify-center relative overflow-visible">
                          <AnimatePresence initial={false} mode="wait">
                            <motion.span
                              key={`${step.id}-label-text-${
                                isActive ? "active" : "idle"
                              }`}
                              className={`
                            hidden sm:block text-center text-black/60
                            text-[7px] sm:text-[8px] md:text-[9px] lg:text-[11px] xl:text-[12px] 2xl:text-[12px]
                            leading-tight tracking-tight
                            max-w-[64px] sm:max-w-[72px] md:max-w-[90px] lg:max-w-[110px] xl:max-w-[130px]
                            ${isActive ? "font-medium" : "font-normal"}
                            mt-1.5 sm:mt-2
                          `}
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
                                direction === "backward" ? instant : fade
                              }
                            >
                              {step.title}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                        {/* Empty cell under each connector to preserve grid structure */}
                        {index < steps.length - 1 && showConnectors && (
                          <div aria-hidden="true" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingHeader;
