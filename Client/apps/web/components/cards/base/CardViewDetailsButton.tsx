import { Eye } from "lucide-react";
import React, { useState } from "react";

import KeyTurnLoader from "../../ui/loading/KeyTurnLoader";

export type CardViewDetailsButtonProps = {
  /** Click handler - can be async */
  onClick: () => void | Promise<void>;
  /** Button size */
  size?: "sm" | "md" | "lg";
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

  const currentSizeStyles = sizeStyles[size];
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

    try {
      setIsUnlocking(true);
      await onClick();
    } catch (error) {
      console.error("Error during unlock:", error);
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
          <KeyTurnLoader message="Loading..." />
        </div>
      ) : (
        <>
          {showIcon && <Eye className={iconClasses} />}
          {text}
        </>
      )}
    </button>
  );
};

export default CardViewDetailsButton;
