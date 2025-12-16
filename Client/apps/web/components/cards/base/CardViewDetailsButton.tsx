import { Eye } from "lucide-react";
import React, { useState } from "react";

import KeyTurnLoader from "../../ui/loading/KeyTurnLoader";

export type CardViewDetailsButtonProps = {
  /** Click handler - can be async */
  onClick: () => void | Promise<void>;
  /** Button size */
  size?: "xs" | "sm" | "md" | "lg";
  /** Button variant */
  variant?: "primary" | "secondary" | "muted";
  /** Full width button */
  fullWidth?: boolean;
  /** Button text */
  text?: string;
  /** Show icon */
  showIcon?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
};

const CardViewDetailsButton: React.FC<CardViewDetailsButtonProps> = ({
  onClick,
  size = "md",
  variant = "primary",
  fullWidth = false,
  text = "Unlock",
  showIcon = true,
  disabled = false,
  className = "",
}) => {
  const [isUnlocking, setIsUnlocking] = useState(false);
  // Size variants using utilities.css classes
  const sizeStyles = {
    xs: {
      padding: "px-responsive-xs py-responsive-xs",
      text: "btn-text-responsive",
      icon: "mobile-icon-xs",
    },
    sm: {
      padding: "px-responsive-sm py-responsive-xs",
      text: "btn-text-responsive",
      icon: "mobile-icon-xs",
    },
    md: {
      padding: "px-responsive-md py-responsive-sm",
      text: "btn-text-responsive",
      icon: "mobile-icon-sm",
    },
    lg: {
      padding: "px-responsive-lg py-responsive-md",
      text: "text-responsive-md",
      icon: "mobile-icon-md",
    },
  };

  // Variant styles
  const variantStyles = {
    primary: "bg-brown text-white hover:bg-brown/90 border-brown",
    secondary: "bg-white text-brown border-brown hover:bg-brown/5",
    muted: "muted-button-primary",
  };

  // Ensure size is valid, fallback to "md" if invalid
  const validSize = sizeStyles[size] ? size : "md";
  const currentSizeStyles = sizeStyles[validSize];
  const currentVariantStyles = variantStyles[variant];

  const buttonClasses = [
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200",
    "border touch-friendly disabled:opacity-50 disabled:cursor-not-allowed",
    currentSizeStyles.padding,
    currentSizeStyles.text,
    currentVariantStyles,
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconClasses = `${currentSizeStyles.icon} ${showIcon && text ? "mr-1 sm:mr-2" : ""}`;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up to parent card

    if (disabled || isUnlocking) return;

    const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;

    try {
      setIsUnlocking(true);
      await onClick();

    } catch (error) {
      console.error("🔓 [CARD VIEW DETAILS BUTTON] Error during unlock:", {
        environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
        text,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isUnlocking}
      className={buttonClasses}
    >
      {isUnlocking ? (
        <div className="flex items-center justify-center">
          <div
            className="flex items-center"
            style={{
              transform:
                validSize === "xs"
                  ? "scale(0.65)"
                  : validSize === "sm"
                    ? "scale(0.75)"
                    : validSize === "lg"
                      ? "scale(1.25)"
                      : "scale(1)",
            }}
          >
            <KeyTurnLoader message="Loading..." variant="default" />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          {showIcon && <Eye className={iconClasses} />}
          <span className="whitespace-nowrap">{text}</span>
        </div>
      )}
    </button>
  );
};

export default CardViewDetailsButton;
