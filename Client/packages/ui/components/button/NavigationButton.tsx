import React from "react";

import { ArrowRight, ChevronRight } from "lucide-react";

import { log, LOG_CATEGORIES } from "packages/logger";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import { dateNow } from "packages/utils/date";

import Button from "./Button";
export type NavigationButtonProps = {
  /** Click handler */
  onClick: () => void;
  /** Loading state */
  loading?: boolean;
  /** Button size */
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  /** Button text */
  children: React.ReactNode;
  /** Show arrow icon */
  showArrow?: boolean;
  /** Arrow icon type */
  arrowType?: "chevron" | "arrow";
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
  /** Full width button */
  fullWidth?: boolean;
};
const NavigationButton: React.FC<NavigationButtonProps> = ({
  onClick,
  loading = false,
  size = "md",
  children,
  showArrow = true,
  arrowType = "chevron",
  disabled = false,
  className = "",
  fullWidth = false,
}) => {
  // Size variants for link-like styling
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
    xl: {
      text: "text-2xl",
      icon: "w-6 h-6",
      spacing: "gap-3",
    },
    "2xl": {
      text: "text-4xl",
      icon: "w-8 h-8",
      spacing: "gap-4",
    },
    "3xl": {
      text: "text-6xl",
      icon: "w-10 h-10",
      spacing: "gap-5",
    },
    "4xl": {
      text: "text-8xl",
      icon: "w-12 h-12",
      spacing: "gap-6",
    },
  };
  const currentSizeStyles = sizeStyles[size];
  const ArrowIcon = arrowType === "arrow" ? ArrowRight : ChevronRight;
  const buttonClasses = [
    // Base link-like styling
    "inline-flex items-center justify-center font-medium transition-all duration-200",
    "text-gray-600 hover:text-gray-800 hover:underline",
    "cursor-pointer touch-friendly",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:no-underline",
    // Size styles
    currentSizeStyles.text,
    currentSizeStyles.spacing,
    // Width
    fullWidth ? "w-full" : "",
    // Custom classes
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const handleClick = () => {
    log.debug(LOG_CATEGORIES.HOOKS, "NavigationButton clicked", {
      children: typeof children === "string" ? children : "React element",
      disabled,
      loading,
      timestamp: dateNow().toISOString(),
    });
    if (!disabled && !loading) {
      onClick();
    } else {
      log.debug(
        LOG_CATEGORIES.HOOKS,
        "NavigationButton click ignored - button disabled or loading"
      );
    }
  };
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleClick}
      disabled={disabled ?? loading}
      className={buttonClasses}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div
            style={{
              transform: size === "sm" ? "scale(0.75)" : size === "lg" ? "scale(1.25)" : "scale(1)",
            }}
          >
            <KeyTurnLoader message="Loading..." />
          </div>
        </div>
      ) : (
        <>
          {children}
          {showArrow && <ArrowIcon className={`${currentSizeStyles.icon} flex-shrink-0`} />}
        </>
      )}
    </Button>
  );
};
export default NavigationButton;
