import React, { useState } from "react";

import { log, LOG_CATEGORIES } from "logger";
import { Eye, type LucideIcon } from "lucide-react";

import { getEnv } from "packages/config";
import { useLocalization } from "packages/contexts";
import { dateNow } from "packages/utils/core/date";

import { BodyText, Button } from "@/components/ui/index.web";
import KeyTurnLoader from "@/components/ui/loading/KeyTurnLoader.web";

export type CardViewDetailsButtonProps = {
  /** Click handler - can be async */
  onClick: () => void | Promise<void>;
  /** Button size */
  size?: "xs" | "sm" | "md" | "lg";
  /** Button variant */
  variant?: "primary" | "secondary" | "muted" | "unlock" | "negotiate";
  /** Full width button */
  fullWidth?: boolean;
  /** Button text */
  text?: string;
  /** Icon to display (defaults to Eye) */
  icon?: LucideIcon;
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
  text: textProp,
  icon: Icon = Eye,
  showIcon = true,
  disabled = false,
  className = "",
}) => {
  const { t } = useLocalization();
  const text = textProp ?? t("common.unlock");
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
    primary: "bg-olive text-white hover:bg-olive/90 border-olive",
    secondary: "bg-white text-olive border-olive hover:bg-olive/5",
    muted: "muted-button-primary",
    unlock: "bg-olive text-white hover:bg-olive/90 border-olive",
    negotiate: "bg-gold text-white hover:bg-gold/90 border-gold",
  };

  // Ensure size and variant are valid to avoid undefined style access
  const validSize = sizeStyles[size] ? size : "md";
  const validVariant =
    variant && variantStyles[variant as keyof typeof variantStyles]
      ? variant
      : "primary";
  const currentSizeStyles = sizeStyles[validSize];
  const currentVariantStyles =
    variantStyles[validVariant as keyof typeof variantStyles] ??
    variantStyles.primary;

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

    if (disabled || isUnlocking || typeof onClick !== "function") return;

    const isDev = getEnv().isDevelopment;

    try {
      setIsUnlocking(true);
      await onClick();
    } catch (error) {
      log.error(
        LOG_CATEGORIES.SEARCH,
        "CardViewDetailsButton error during unlock",
        {
          environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
          text,
          error: error instanceof Error ? error.message : String(error),
          timestamp: dateNow().toISOString(),
        },
      );
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <Button
      type="button"
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
            <KeyTurnLoader message={t("common.loading")} variant="default" />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          {showIcon && <Icon className={iconClasses} />}
          <BodyText as="span" className="whitespace-nowrap">
            {text}
          </BodyText>
        </div>
      )}
    </Button>
  );
};

export default CardViewDetailsButton;
