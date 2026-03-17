import React from "react";

import { Box } from "packages/ui/components/primitives";

/**
 * Card container with built-in border (border-border-card-subtle), padding, and shadow.
 * Callers should not add border classes; the border is canonical.
 */
type CardProps = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "sm" | "md" | "lg";
  onClick?: () => void;
  style?: React.CSSProperties;
};

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = true,
  padding = "md",
  shadow = "sm",
  onClick,
  style,
}) => {
  const paddingClasses = {
    none: "",
    sm: "p-3 sm:p-4",
    md: "p-3 sm:p-4 md:p-6",
    lg: "p-4 sm:p-6 md:p-8",
  };

  const shadowClasses = {
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  };

  const baseClasses = [
    "bg-white",
    "rounded-lg sm:rounded-xl md:rounded-2xl",
    "border border-border-card-subtle",
    shadowClasses[shadow],
    paddingClasses[padding],
    "transition-all duration-200",
  ];

  if (hover) {
    baseClasses.push("hover:shadow-md");
  }

  if (onClick) {
    baseClasses.push("cursor-pointer");
  }

  const combinedClasses = [...baseClasses, className].filter(Boolean).join(" ");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Box
      className={combinedClasses}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      style={style}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </Box>
  );
};

export default Card;
