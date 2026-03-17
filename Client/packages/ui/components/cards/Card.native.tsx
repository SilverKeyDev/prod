import React from "react";

import { Pressable } from "react-native";

import { Box } from "packages/ui/components/primitives";

import type { CardBorderVariant } from "./Card";

/**
 * Card container for React Native. Uses Box (View) with built-in border variant,
 * padding, and shadow. Callers should not add border classes; use the border prop instead.
 */
type CardProps = {
  children: React.ReactNode;
  /** Border style: charcoal, light, dotted, or none. Default charcoal. */
  border?: CardBorderVariant;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "sm" | "md" | "lg";
  onClick?: () => void;
  style?: React.CSSProperties;
};

const paddingClasses: Record<string, string> = {
  none: "",
  sm: "p-3 sm:p-4",
  md: "p-3 sm:p-4 md:p-6",
  lg: "p-4 sm:p-6 md:p-8",
};

const shadowClasses: Record<string, string> = {
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

const BORDER_CLASSES: Record<CardBorderVariant, string> = {
  charcoal: "border border-neutral-700",
  light: "border border-neutral-200",
  dotted: "border border-neutral-200 border-dashed",
  none: "",
};

const CardNative: React.FC<CardProps> = ({
  children,
  border = "charcoal",
  className = "",
  hover = false,
  padding = "md",
  shadow = "sm",
  onClick,
  style,
}) => {
  const borderClass = BORDER_CLASSES[border];
  const baseClasses = [
    "bg-white",
    "rounded-lg",
    ...(borderClass ? [borderClass] : []),
    shadowClasses[shadow],
    paddingClasses[padding],
  ];

  if (hover) {
    baseClasses.push("active:opacity-90");
  }

  const combinedClasses = [...baseClasses, className].filter(Boolean).join(" ");

  const content = (
    <Box className={combinedClasses} style={style}>
      {children}
    </Box>
  );

  if (onClick) {
    return (
      <Pressable onPress={onClick} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return content;
};

export default CardNative;
