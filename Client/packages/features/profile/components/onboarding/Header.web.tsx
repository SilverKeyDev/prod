import React, { useEffect, useMemo, useRef } from "react";

import { Box } from "packages/ui/components/structure/primitives";

import Card from "@/components/layout/Card.web";
import { Region } from "@/components/ui";

import {
  OnboardingHeaderStep,
  type OnboardingHeaderStepData,
  OnboardingHeaderStepLabel,
} from "./OnboardingHeaderStep.web";
import {
  getOnboardingHeaderConnectorLayout,
  useOnboardingHeaderScale,
} from "./useOnboardingHeaderScale";

type OnboardingHeaderProps = {
  steps: OnboardingHeaderStepData[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
};

const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({ steps, currentStep, onStepClick }) => {
  const prevStepRef = useRef(currentStep);
  const prevStep = prevStepRef.current;
  const direction =
    currentStep > prevStep ? "forward" : currentStep < prevStep ? "backward" : "none";

  useEffect(() => {
    prevStepRef.current = currentStep;
  }, [currentStep]);

  const { outerRef, gridRef, scale } = useOnboardingHeaderScale(steps.length);

  const templateCols = useMemo(
    () =>
      Array.from({ length: steps.length * 2 - 1 }, (_, i) => (i % 2 === 0 ? "auto" : "1fr")).join(
        " "
      ),
    [steps.length]
  );

  const { columnGap, rowGap, showConnectors, connectorWidth, connectorMargin } =
    getOnboardingHeaderConnectorLayout(outerRef, steps.length);

  return (
    <Box className="mb-6 mt-6">
      <Box className="bg-background-surface mx-auto max-w-[85vw] overflow-hidden rounded-2xl shadow-sm">
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
            <Card
              border="light"
              className="flex items-center justify-center overflow-visible py-1 sm:py-3"
            >
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
                  {steps.map((step, index) => (
                    <OnboardingHeaderStep
                      key={step.id}
                      step={step}
                      index={index}
                      stepCount={steps.length}
                      currentStep={currentStep}
                      prevStep={prevStep}
                      direction={direction}
                      showConnectors={showConnectors}
                      connectorWidth={connectorWidth}
                      connectorMargin={connectorMargin}
                      onStepClick={onStepClick}
                    />
                  ))}

                  {steps.map((step, index) => (
                    <OnboardingHeaderStepLabel
                      key={`${step.id}-label`}
                      step={step}
                      index={index}
                      stepCount={steps.length}
                      currentStep={currentStep}
                      direction={direction}
                      showConnectors={showConnectors}
                    />
                  ))}
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
