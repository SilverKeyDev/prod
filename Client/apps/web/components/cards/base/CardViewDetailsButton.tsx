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

    const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;
    console.log("🔓 [CARD VIEW DETAILS BUTTON] Unlock button clicked:", {
      environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
      text,
      disabled,
      isUnlocking,
      timestamp: new Date().toISOString(),
    });

    try {
      console.log(
        "🔓 [CARD VIEW DETAILS BUTTON] Setting isUnlocking to true:",
        {
          environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
          text,
          timestamp: new Date().toISOString(),
        }
      );
      setIsUnlocking(true);

      console.log("🔓 [CARD VIEW DETAILS BUTTON] Calling onClick handler:", {
        environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
        text,
        timestamp: new Date().toISOString(),
      });
      await onClick();

      console.log(
        "🔓 [CARD VIEW DETAILS BUTTON] onClick completed successfully:",
        {
          environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
          text,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("🔓 [CARD VIEW DETAILS BUTTON] Error during unlock:", {
        environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
        text,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    } finally {
      console.log(
        "🔓 [CARD VIEW DETAILS BUTTON] Setting isUnlocking to false:",
        {
          environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
          text,
          timestamp: new Date().toISOString(),
        }
      );
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
                size === "sm"
                  ? "scale(0.75)"
                  : size === "lg"
                    ? "scale(1.25)"
                    : "scale(1)",
            }}
          >
            {(() => {
              const isDev =
                typeof import.meta !== "undefined" && import.meta.env?.DEV;
              console.log(
                "🔓 [CARD VIEW DETAILS BUTTON] Rendering loading state:",
                {
                  environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
                  text,
                  isUnlocking,
                  timestamp: new Date().toISOString(),
                }
              );

              // Create a custom loader that matches the exact dimensions of the normal state
              const keyframeStyles = `
                @keyframes turnKey {
                  0% { transform: rotate(0deg); }
                  2% { transform: rotate(3deg); }
                  4% { transform: rotate(6deg); }
                  6% { transform: rotate(9deg); }
                  8% { transform: rotate(12deg); }
                  10% { transform: rotate(15deg); }
                  12% { transform: rotate(18deg); }
                  14% { transform: rotate(21deg); }
                  16% { transform: rotate(24deg); }
                  18% { transform: rotate(27deg); }
                  20% { transform: rotate(30deg); }
                  22% { transform: rotate(27deg); }
                  24% { transform: rotate(24deg); }
                  26% { transform: rotate(21deg); }
                  28% { transform: rotate(18deg); }
                  30% { transform: rotate(15deg); }
                  32% { transform: rotate(12deg); }
                  34% { transform: rotate(9deg); }
                  36% { transform: rotate(6deg); }
                  38% { transform: rotate(3deg); }
                  40% { transform: rotate(0deg); }
                  42% { transform: rotate(-3deg); }
                  44% { transform: rotate(-6deg); }
                  46% { transform: rotate(-9deg); }
                  48% { transform: rotate(-12deg); }
                  50% { transform: rotate(-15deg); }
                  52% { transform: rotate(-18deg); }
                  54% { transform: rotate(-21deg); }
                  56% { transform: rotate(-24deg); }
                  58% { transform: rotate(-27deg); }
                  60% { transform: rotate(-30deg); }
                  62% { transform: rotate(-27deg); }
                  64% { transform: rotate(-24deg); }
                  66% { transform: rotate(-21deg); }
                  68% { transform: rotate(-18deg); }
                  70% { transform: rotate(-15deg); }
                  72% { transform: rotate(-12deg); }
                  74% { transform: rotate(-9deg); }
                  76% { transform: rotate(-6deg); }
                  78% { transform: rotate(-3deg); }
                  80% { transform: rotate(0deg); }
                  82% { transform: rotate(3deg); }
                  84% { transform: rotate(6deg); }
                  86% { transform: rotate(9deg); }
                  88% { transform: rotate(12deg); }
                  90% { transform: rotate(15deg); }
                  92% { transform: rotate(12deg); }
                  94% { transform: rotate(9deg); }
                  96% { transform: rotate(6deg); }
                  98% { transform: rotate(3deg); }
                  100% { transform: rotate(0deg); }
                }
              `;

              return (
                <>
                  <style>{keyframeStyles}</style>
                  <svg
                    style={{
                      animation:
                        "turnKey 3.6s infinite cubic-bezier(0.25, 0.1, 0.25, 1)",
                      transformOrigin: "20px 32px",
                      willChange: "transform",
                    }}
                    width="16"
                    height="16"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={showIcon ? iconClasses : ""}
                  >
                    {/* Key head */}
                    <circle
                      cx="20"
                      cy="32"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    {/* Shaft */}
                    <rect
                      x="28"
                      y="30"
                      width="24"
                      height="4"
                      fill="currentColor"
                      rx="2"
                    />
                    {/* Teeth */}
                    <rect
                      x="52"
                      y="30"
                      width="4"
                      height="8"
                      fill="currentColor"
                      rx="1"
                    />
                    <rect
                      x="56"
                      y="30"
                      width="4"
                      height="6"
                      fill="currentColor"
                      rx="1"
                    />
                  </svg>
                  {showIcon && <span className="ml-1 sm:ml-2">Loading...</span>}
                </>
              );
            })()}
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
