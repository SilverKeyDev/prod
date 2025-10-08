import React from "react";

export type CardAddressDisplayProps = {
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
  /** Additional className */
  className?: string;
  /** Click handler */
  onClick?: () => void;
};

const CardAddressDisplay: React.FC<CardAddressDisplayProps> = ({
  address,
  secondaryAddress,
  region,
  variant = "default",
  size = "sm",
  className = "",
  onClick,
}) => {
  // Size variants with larger fonts and single line display
  const sizeStyles = {
    xs: {
      primary: "text-sm",
      secondary: "text-sm",
      minHeight: "1.25rem", // Single line height
    },
    sm: {
      primary: "text-sm sm:text-base",
      secondary: "text-sm",
      minHeight: "1.25rem", // Single line height
    },
    md: {
      primary: "text-base sm:text-lg",
      secondary: "text-sm sm:text-base",
      minHeight: "1.5rem", // Single line height
    },
    lg: {
      primary: "text-lg sm:text-xl",
      secondary: "text-base sm:text-lg",
      minHeight: "1.75rem", // Single line height
    },
  };

  // Layout variants
  const layoutStyles = {
    default: "block",
    compact: "block",
    detailed: "block",
  };

  const currentSizeStyles = sizeStyles[size];
  const currentLayoutStyles = layoutStyles[variant];

  const containerClasses = [
    currentLayoutStyles,
    "px-1.5", // 6px padding from card edges
    onClick
      ? "cursor-pointer hover:text-brown transition-colors touch-friendly"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses} onClick={onClick}>
      {/* Primary Address */}
      <h3
        className={`${currentSizeStyles.primary} overflow-hidden font-medium text-black whitespace-nowrap`}
        title={address}
        style={{
          textOverflow: "ellipsis",
          minHeight: currentSizeStyles.minHeight,
        }}
      >
        {address}
      </h3>

      {/* Secondary Address */}
      {secondaryAddress && (
        <p
          className={`${currentSizeStyles.secondary} text-black/60 ${variant === "compact" ? "ml-1" : ""} overflow-hidden whitespace-nowrap`}
          title={secondaryAddress}
          style={{
            textOverflow: "ellipsis",
            minHeight: currentSizeStyles.minHeight,
          }}
        >
          {secondaryAddress}
        </p>
      )}

      {/* Region */}
      {region && (
        <p
          className={`${currentSizeStyles.secondary} font-medium text-brown ${variant === "detailed" ? "mt-1" : ""} overflow-hidden whitespace-nowrap`}
          title={region}
          style={{
            textOverflow: "ellipsis",
            minHeight: currentSizeStyles.minHeight,
          }}
        >
          {region}
        </p>
      )}
    </div>
  );
};

export default CardAddressDisplay;
