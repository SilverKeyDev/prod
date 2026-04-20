import React from "react";

import { Icon } from "@ui/icons";

import Button from "packages/ui/components/button/Button";
import type { IconName } from "packages/ui/types/icons";
export type CardViewButtonProps = {
  /** Click handler */
  onClick: () => void;
  /** Loading state */
  loading?: boolean;
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Button variant */
  variant?: "primary" | "secondary" | "muted" | "ghost";
  /** Button text */
  text?: string;
  /** Icon type */
  iconType?: "eye" | "external" | "none";
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
};
const SIZE_STYLES = {
  sm: {
    padding: "space-responsive-xs",
    text: "text-responsive-xs",
    icon: "mobile-icon-xs",
  },
  md: {
    padding: "space-responsive-sm",
    text: "text-responsive-sm",
    icon: "mobile-icon-sm",
  },
  lg: {
    padding: "space-responsive-md",
    text: "text-responsive-md",
    icon: "mobile-icon-md",
  },
} as const;
const VARIANT_STYLES = {
  primary: "bg-primary text-white hover:bg-primary-hover border-border",
  secondary: "bg-background-surface text-primary border-border hover:bg-primary-muted",
  muted: "bg-neutral-100 text-text-primary hover:bg-neutral-200 border-border",
  ghost: "text-primary hover:bg-primary-muted border-transparent",
} as const;
const CardViewButton: React.FC<CardViewButtonProps> = ({
  onClick,
  loading = false,
  size = "sm",
  variant = "ghost",
  text = "View",
  iconType = "eye",
  disabled = false,
  className = "",
}) => {
  const currentSizeStyles = SIZE_STYLES[size];
  const currentVariantStyles = VARIANT_STYLES[variant];
  const buttonClasses = [
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200",
    "border touch-friendly disabled:bg-disabled disabled:text-text-disabled disabled:cursor-not-allowed",
    currentSizeStyles.padding,
    currentSizeStyles.text,
    currentVariantStyles,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const iconClasses = `${currentSizeStyles.icon} ${text ? "mr-1" : ""}`;
  const iconName: IconName | null =
    iconType === "external" ? "external-link" : iconType === "eye" ? "eye" : null;
  return (
    <Button
      type="button"
      variant={variant === "primary" ? "primary" : variant === "secondary" ? "secondary" : "ghost"}
      onClick={onClick}
      disabled={disabled ?? loading}
      loading={loading}
      className={buttonClasses}
      title={text}
    >
      <>
        {iconName && <Icon name={iconName} className={iconClasses} />}
        {text && text}
      </>
    </Button>
  );
};
export default CardViewButton;
