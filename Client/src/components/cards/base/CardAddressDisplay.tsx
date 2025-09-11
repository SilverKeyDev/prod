import React from "react";
import { MapPin } from "lucide-react";

export interface CardAddressDisplayProps {
  /** Primary address line */
  address: string;
  /** Secondary address line (city, state, zip) */
  secondaryAddress?: string;
  /** Region or neighborhood name */
  region?: string;
  /** Display variant */
  variant?: "default" | "compact" | "detailed";
  /** Text size */
  size?: "xs" | "sm" | "md" | "lg";
  /** Whether to show map pin icon */
  showIcon?: boolean;
  /** Additional className */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

const CardAddressDisplay: React.FC<CardAddressDisplayProps> = ({
  address,
  secondaryAddress,
  region,
  variant = "default",
  size = "sm",
  showIcon = true,
  className = "",
  onClick,
}) => {
  // Size variants with consistent height scaling
  const sizeStyles = {
    xs: {
      primary: "text-xs sm:text-sm",
      secondary: "text-xs",
      icon: "h-3 w-3 sm:h-4 sm:w-4",
      minHeight: "1.5rem", // Minimal space for xs/sm
    },
    sm: {
      primary: "text-sm sm:text-base",
      secondary: "text-xs sm:text-sm",
      icon: "h-3 w-3 sm:h-4 sm:w-4",
      minHeight: "1.75rem", // Minimal space for sm/base
    },
    md: {
      primary: "text-base sm:text-lg",
      secondary: "text-sm sm:text-base",
      icon: "h-4 w-4 sm:h-5 sm:w-5",
      minHeight: "2rem", // Minimal space for base/lg
    },
    lg: {
      primary: "text-lg sm:text-xl",
      secondary: "text-base sm:text-lg",
      icon: "h-5 w-5 sm:h-6 sm:w-6",
      minHeight: "2.25rem", // Minimal space for lg/xl
    },
  };

  // Layout variants
  const layoutStyles = {
    default: "flex items-start gap-1",
    compact: "flex items-center gap-1",
    detailed: "flex items-start gap-1",
  };

  const currentSizeStyles = sizeStyles[size];
  const currentLayoutStyles = layoutStyles[variant];

  const containerClasses = [
    currentLayoutStyles,
    onClick
      ? "cursor-pointer hover:text-brown transition-colors touch-friendly"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconClasses = `${currentSizeStyles.icon} text-brown mt-0.5 flex-shrink-0`;

  return (
    <div className={containerClasses} onClick={onClick}>
      {showIcon && <MapPin className={iconClasses} />}

      <div className="flex-1 min-w-0">
        {/* Primary Address */}
        <div
          className={`${currentSizeStyles.primary} font-medium text-black mb-0 overflow-hidden leading-5`}
          title={address}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: variant === "compact" ? 1 : 2,
            WebkitBoxOrient: "vertical" as const,
            wordBreak: "break-word",
            hyphens: "auto",
            minHeight:
              variant === "compact" ? "auto" : currentSizeStyles.minHeight,
          }}
        >
          {address}
        </div>

        {/* Secondary Address */}
        {secondaryAddress && (
          <p
            className={`${currentSizeStyles.secondary} text-black/60 ${variant === "compact" ? "ml-1" : ""} overflow-hidden leading-4`}
            title={secondaryAddress}
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical" as const,
              wordBreak: "break-word",
              hyphens: "auto",
            }}
          >
            {secondaryAddress}
          </p>
        )}

        {/* Region */}
        {region && (
          <p
            className={`${currentSizeStyles.secondary} text-brown font-medium ${variant === "detailed" ? "mt-1" : ""} overflow-hidden leading-4`}
            title={region}
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical" as const,
              wordBreak: "break-word",
              hyphens: "auto",
            }}
          >
            {region}
          </p>
        )}
      </div>
    </div>
  );
};

export default CardAddressDisplay;
