import React from "react";

import { Check, ChevronLeft, ChevronRight, ChevronRight as SkipArrow } from "lucide-react";

import Button from "./Button";

export type NavigationButtonsProps = {
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
};

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
  size = "lg",
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
        disabled={isFirstStep ?? disablePrevious}
        icon={<ChevronLeft />}
        iconPosition="left"
        className={`w-30 xs:w-24 sm:w-36 md:w-40 ${
          (isFirstStep ?? disablePrevious)
            ? "cursor-not-allowed bg-gray-300 text-gray-500 hover:bg-gray-300"
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
          variant="primary"
          size={size}
          onClick={onSubmit}
          disabled={loading ?? disableNext}
          loading={loading}
          icon={!loading ? <Check /> : undefined}
          iconPosition="right"
          className="w-30 font-bold sm:w-36 md:w-40"
        >
          {loading ? "Saving..." : submitText}
        </Button>
      ) : (
        <Button
          variant="primary"
          size={size}
          onClick={onNext}
          disabled={disableNext}
          icon={<ChevronRight />}
          iconPosition="right"
          className="w-30 font-bold sm:w-36 md:w-40"
        >
          {nextText}
        </Button>
      )}
    </div>
  );

  return (
    <div className={`${layoutStyles[layout]} ${className ?? ""}`}>
      {renderPreviousButton()}
      {layout === "inline" && renderNextButton()}
      {layout !== "inline" && renderNextButton()}
    </div>
  );
};

// Export the skip button as a separate component for external use
export const SkipButton: React.FC<{
  onSkip: () => void;
  skipText?: string;
  size?: "sm" | "md" | "lg";
}> = ({ onSkip, skipText = "Skip onboarding for now", size = "md" }) => {
  // Size variants matching NavigationButton
  const sizeStyles = {
    sm: {
      text: "text-sm",
      icon: "w-3 h-3",
      spacing: "gap-1",
    },
    md: {
      text: "text-base",
      icon: "w-4 h-4",
      spacing: "gap-2",
    },
    lg: {
      text: "text-lg",
      icon: "w-5 h-5",
      spacing: "gap-2",
    },
  };

  const currentSizeStyles = sizeStyles[size];

  const buttonClasses = [
    // Base link-like styling matching NavigationButton
    "inline-flex items-center justify-center font-medium transition-all duration-200",
    "text-gray-600 hover:text-gray-800 hover:underline",
    "cursor-pointer touch-friendly",
    // Size styles
    currentSizeStyles.text,
    currentSizeStyles.spacing,
    // Custom classes
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={onSkip}
      icon={<SkipArrow className={currentSizeStyles.icon} />}
      iconPosition="right"
      className={buttonClasses}
    >
      {skipText}
    </Button>
  );
};

export default NavigationButtons;
