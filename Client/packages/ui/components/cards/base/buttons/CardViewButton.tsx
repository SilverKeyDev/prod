import React from "react";

import { ExternalLink, Eye } from "lucide-react";

import { Button, KeyTurnLoader } from "packages/ui/components/index.web";

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
  primary: "bg-olive text-white hover:bg-olive/90 border-olive",
  secondary: "bg-white text-olive border-olive hover:bg-olive/5",
  muted: "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200",
  ghost: "text-olive hover:bg-olive/10 border-transparent",
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
    "border touch-friendly disabled:opacity-50 disabled:cursor-not-allowed",
    currentSizeStyles.padding,
    currentSizeStyles.text,
    currentVariantStyles,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconClasses = `${currentSizeStyles.icon} ${text ? "mr-1" : ""}`;

  const getIcon = () => {
    if (iconType === "external") return ExternalLink;
    if (iconType === "eye") return Eye;
    return null;
  };

  const Icon = getIcon();

  return (
    <Button
      type="button"
      variant={variant === "primary" ? "primary" : variant === "secondary" ? "secondary" : "ghost"}
      onClick={onClick}
      disabled={disabled ?? loading}
      className={buttonClasses}
      title={text}
    >
      {loading ? (
        <>
          <div className={text ? "mr-1" : ""}>
            <KeyTurnLoader message="" />
          </div>
          {text && text}
        </>
      ) : (
        <>
          {Icon && <Icon className={iconClasses} />}
          {text && text}
        </>
      )}
    </Button>
  );
};

export default CardViewButton;
