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
  // Size variants with consistent height scaling
  const sizeStyles = {
    xs: {
      primary: "text-xs sm:text-sm",
      secondary: "text-xs",
      minHeight: "1.5rem", // Minimal space for xs/sm
    },
    sm: {
      primary: "text-sm sm:text-base",
      secondary: "text-xs sm:text-sm",
      minHeight: "1.75rem", // Minimal space for sm/base
    },
    md: {
      primary: "text-base sm:text-lg",
      secondary: "text-sm sm:text-base",
      minHeight: "2rem", // Minimal space for base/lg
    },
    lg: {
      primary: "text-lg sm:text-xl",
      secondary: "text-base sm:text-lg",
      minHeight: "2.25rem", // Minimal space for lg/xl
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
        className={`${currentSizeStyles.primary} overflow-hidden font-medium text-black`}
        title={address}
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as const,
          wordBreak: "break-word",
          hyphens: "auto",
          minHeight: "3rem", // Reserve space for 2 lines at text-sm/base
        }}
      >
        {address}
      </h3>

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
          className={`${currentSizeStyles.secondary} font-medium text-brown ${variant === "detailed" ? "mt-1" : ""} overflow-hidden leading-4`}
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
  );
};

export default CardAddressDisplay;
