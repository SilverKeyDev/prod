import React from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import Button from "./Button";

export interface NavigationButtonsProps {
  /** Current step index (0-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Function to go to previous step */
  onPrevious: () => void;
  /** Function to go to next step */
  onNext: () => void;
  /** Function to handle final submission */
  onSubmit?: () => void;
  /** Loading state for submission */
  loading?: boolean;
  /** Disable next button */
  disableNext?: boolean;
  /** Disable previous button */
  disablePrevious?: boolean;
  /** Custom text for previous button */
  previousText?: string;
  /** Custom text for next button */
  nextText?: string;
  /** Custom text for submit button */
  submitText?: string;
  /** Layout variant */
  layout?: "centered" | "spaced" | "inline";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Custom class name */
  className?: string;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  loading = false,
  disableNext = false,
  disablePrevious = false,
  previousText = "Previous",
  nextText = "Next",
  submitText = "Complete",
  layout = "centered",
  size = "md",
  className,
}) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  // Layout styles
  const layoutStyles = {
    centered: "relative flex items-center justify-between w-full",
    spaced: "flex items-center justify-between w-full",
    inline: "flex items-center gap-4",
  };

  // Position styles for centered layout
  const getCenteredPositionStyles = () => {
    if (layout !== "centered") return {};

    return {
      previous: "absolute left-1/4 transform -translate-x-1/2",
      next: "absolute left-3/4 transform -translate-x-1/2",
    };
  };

  const positionStyles = getCenteredPositionStyles();

  const renderPreviousButton = () => (
    <div className={layout === "centered" ? positionStyles.previous : ""}>
      <Button
        variant="secondary"
        size={size}
        onClick={onPrevious}
        disabled={isFirstStep || disablePrevious}
        icon={<ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />}
        iconPosition="left"
        className={`w-[100px] sm:w-[110px] ${
          isFirstStep || disablePrevious
            ? "bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        {previousText}
      </Button>
    </div>
  );

  const renderNextButton = () => (
    <div className={layout === "centered" ? positionStyles.next : ""}>
      {isLastStep && onSubmit ? (
        <Button
          variant="olive"
          size={size}
          onClick={onSubmit}
          disabled={loading || disableNext}
          loading={loading}
          icon={
            !loading ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : undefined
          }
          iconPosition="right"
          className="w-[100px] sm:w-[110px] font-bold"
        >
          {loading ? "Saving..." : submitText}
        </Button>
      ) : (
        <Button
          variant="olive"
          size={size}
          onClick={onNext}
          disabled={disableNext}
          icon={<ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />}
          iconPosition="right"
          className="w-[100px] sm:w-[110px] font-bold bg-olive/60 hover:bg-olive/70"
        >
          {nextText}
        </Button>
      )}
    </div>
  );

  return (
    <div className={`${layoutStyles[layout]} ${className || ""}`}>
      {renderPreviousButton()}
      {layout === "inline" && renderNextButton()}
      {layout !== "inline" && renderNextButton()}
    </div>
  );
};

export default NavigationButtons;
