import React from "react";

import { Pressable } from "react-native";

import { Box } from "packages/ui/components/primitives";

/**
 * Card container for React Native. Uses Box (View) with built-in border
 * (border-border-card-subtle), padding, and shadow. Callers should not add border classes.
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

const CardNative: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
  padding = "md",
  shadow = "sm",
  onClick,
  style,
}) => {
  const baseClasses = [
    "bg-white",
    "rounded-lg",
    "border",
    "border-border-card-subtle",
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
