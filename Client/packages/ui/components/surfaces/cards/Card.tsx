import React from "react";

import { Box } from "packages/ui/components/structure/primitives";

export type CardBorderVariant = "charcoal" | "medium" | "light" | "dotted" | "none";

/**
 * Card container with optional border variant, padding, and shadow.
 * Callers should not add border classes; use the border prop instead.
 */
type CardProps = {
  children: React.ReactNode;
  /** Border style: charcoal (neutral-700), medium (neutral-400), light (neutral-200), dotted (light gray dashed), or none. Default charcoal. */
  border?: CardBorderVariant;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "sm" | "md" | "lg";
  onClick?: () => void;
  style?: React.CSSProperties;
};

const BORDER_CLASSES: Record<CardBorderVariant, string> = {
  charcoal: "border border-neutral-700",
  medium: "border border-neutral-400",
  light: "border border-neutral-200",
  dotted: "border border-neutral-200 border-dashed",
  none: "",
};

const Card: React.FC<CardProps> = ({
  children,
  border = "charcoal",
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

  const borderClass = BORDER_CLASSES[border];

  const baseClasses = [
    "bg-white",
    "rounded-lg sm:rounded-xl md:rounded-2xl",
    borderClass,
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
