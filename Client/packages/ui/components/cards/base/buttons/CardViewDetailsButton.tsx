import React, { useState } from "react";

import { Icon } from "@ui/icons";

import { getEnv } from "packages/config";
import { useLocalization } from "packages/contexts";
import { log, LOG_CATEGORIES } from "packages/logger";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import { Box } from "packages/ui/components/primitives";
import type { IconName } from "packages/ui/types/icons";
import { dateNow } from "packages/utils/date";

import { BodyText, Button } from "@/components/ui";
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
  iconName?: IconName;
  /** Show icon */
  showIcon?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
};
function CardViewDetailsButton({
  onClick,
  size = "md",
  variant = "primary",
  fullWidth = false,
  text: textProp,
  iconName = "eye",
  showIcon = true,
  disabled = false,
  className = "",
}: CardViewDetailsButtonProps) {
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
    primary: "bg-primary text-white hover:bg-primary-hover border-primary",
    secondary: "bg-background-surface text-primary border-primary hover:bg-primary-muted",
    muted: "muted-button-primary",
    unlock: "bg-primary text-white hover:bg-primary-hover border-primary",
    negotiate: "border-2 border-black bg-accent text-white hover:bg-accent-hover",
  };
  // Ensure size and variant are valid to avoid undefined style access
  const validSize = sizeStyles[size] ? size : "md";
  const validVariant =
    variant && variantStyles[variant as keyof typeof variantStyles] ? variant : "primary";
  const currentSizeStyles = sizeStyles[validSize];
  const currentVariantStyles =
    variantStyles[validVariant as keyof typeof variantStyles] ?? variantStyles.primary;
  // Filled variants use white text on the button; BodyText defaults to text-gray-900, so we
  // pass text-inherit so the label inherits the button's text color.
  const filledVariants = ["primary", "unlock", "negotiate"];
  const textColorClass = filledVariants.includes(validVariant) ? "!text-inherit" : "";
  const buttonClasses = [
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200",
    "border touch-friendly disabled:bg-disabled disabled:text-text-disabled disabled:cursor-not-allowed",
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
      log.error(LOG_CATEGORIES.SEARCH, "CardViewDetailsButton error during unlock", {
        environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
        text,
        error: error instanceof Error ? error.message : String(error),
        timestamp: dateNow().toISOString(),
      });
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
        <Box className="flex items-center justify-center">
          <Box
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
          </Box>
        </Box>
      ) : (
        <Box className="flex items-center justify-center">
          {showIcon && <Icon name={iconName} className={iconClasses} />}
          <BodyText
            as="span"
            className={["whitespace-nowrap", textColorClass].filter(Boolean).join(" ")}
          >
            {text}
          </BodyText>
        </Box>
      )}
    </Button>
  );
}
export default CardViewDetailsButton;
