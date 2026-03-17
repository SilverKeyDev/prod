import React from "react";

import { Box } from "packages/ui/components/primitives";

import { BodyText, Title } from "@/components/ui";

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
    onClick ? "cursor-pointer hover:text-brown transition-colors touch-friendly" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Box
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={containerClasses}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
    >
      {/* Primary Address */}
      <Title
        as="h3"
        size="sm"
        className={`${currentSizeStyles.primary} overflow-hidden whitespace-nowrap font-medium text-black`}
        title={address}
        style={{
          textOverflow: "ellipsis",
          minHeight: currentSizeStyles.minHeight,
        }}
      >
        {address}
      </Title>

      {/* Secondary Address */}
      {secondaryAddress && (
        <BodyText
          as="p"
          size="sm"
          className={`${currentSizeStyles.secondary} text-black/60 ${variant === "compact" ? "ml-1" : ""} overflow-hidden whitespace-nowrap`}
          title={secondaryAddress}
          style={{
            textOverflow: "ellipsis",
            minHeight: currentSizeStyles.minHeight,
          }}
        >
          {secondaryAddress}
        </BodyText>
      )}

      {/* Region */}
      {region && (
        <BodyText
          as="p"
          size="sm"
          className={`${currentSizeStyles.secondary} text-brown font-medium ${variant === "detailed" ? "mt-1" : ""} overflow-hidden whitespace-nowrap`}
          title={region}
          style={{
            textOverflow: "ellipsis",
            minHeight: currentSizeStyles.minHeight,
          }}
        >
          {region}
        </BodyText>
      )}
    </Box>
  );
};

export default CardAddressDisplay;
