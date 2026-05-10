import React from "react";

import { Icon } from "@ui/icons";

import { Box } from "packages/ui/components/primitives";

import type { ButtonVariant } from "./Button";
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
  /** Variant for the next (or skip) button when not on last step */
  nextButtonVariant?: ButtonVariant;
  /** Optional class name for the next button (e.g. white background for Skip) */
  nextButtonClassName?: string;
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
  nextButtonVariant = "primary",
  nextButtonClassName,
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
    <Box className={layout === "centered" ? positionStyles.previous : ""}>
      <Button
        variant="secondary"
        size={size}
        onClick={onPrevious}
        disabled={isFirstStep ?? disablePrevious}
        icon={<Icon name="chevron-left" />}
        iconPosition="left"
        className={`w-30 xs:w-24 sm:w-36 md:w-40 ${
          (isFirstStep ?? disablePrevious)
            ? "cursor-not-allowed bg-gray-300 text-gray-500 hover:bg-gray-300"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        {previousText}
      </Button>
    </Box>
  );
  const renderNextButton = () => (
    <Box className={layout === "centered" ? positionStyles.next : ""}>
      {isLastStep && onSubmit ? (
        <Button
          variant="primary"
          size={size}
          onClick={onSubmit}
          disabled={loading ?? disableNext}
          loading={loading}
          iconName="check"
          iconPosition="right"
          className="w-30 font-bold sm:w-36 md:w-40"
        >
          {submitText}
        </Button>
      ) : (
        <Button
          variant={nextButtonVariant}
          size={size}
          onClick={onNext}
          disabled={disableNext}
          icon={<Icon name="chevron-right" />}
          iconPosition="right"
          className={nextButtonClassName ?? "w-30 font-bold sm:w-36 md:w-40"}
        >
          {nextText}
        </Button>
      )}
    </Box>
  );
  return (
    <Box className={`${layoutStyles[layout]} ${className ?? ""}`}>
      {renderPreviousButton()}
      {layout === "inline" && renderNextButton()}
      {layout !== "inline" && renderNextButton()}
    </Box>
  );
};
// Export the skip button as a separate component for external use
export const SkipButton: React.FC<{
  onSkip: () => void;
  skipText?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}> = ({ onSkip, skipText = "Skip onboarding for now", size = "md", disabled = false }) => {
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
    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer touch-friendly",
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
      disabled={disabled}
      icon={<Icon name="chevron-right" className={currentSizeStyles.icon} />}
      iconPosition="right"
      className={buttonClasses}
    >
      {skipText}
    </Button>
  );
};
export default NavigationButtons;
