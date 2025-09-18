import { ChevronRight, ArrowRight } from "lucide-react";
import React from "react";

import KeyTurnLoader from "../loading/KeyTurnLoader";

export type NavigationButtonProps = {
  /** Click handler */
  onClick: () => void;
  /** Loading state */
  loading?: boolean;
  /** Button size */
  size?: "sm" | "md" | "lg";
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
  /** Button title/tooltip */
  title?: string;
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
  title,
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

  return (
    <button
      onClick={onClick}
      disabled={disabled ?? loading}
      className={buttonClasses}
      title={title}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div
            style={{
              transform:
                size === "sm"
                  ? "scale(0.75)"
                  : size === "lg"
                    ? "scale(1.25)"
                    : "scale(1)",
            }}
          >
            <KeyTurnLoader message="" />
          </div>
          <span>Loading...</span>
        </div>
      ) : (
        <>
          <span>{children}</span>
          {showArrow && <ArrowIcon className={currentSizeStyles.icon} />}
        </>
      )}
    </button>
  );
};

export default NavigationButton;
