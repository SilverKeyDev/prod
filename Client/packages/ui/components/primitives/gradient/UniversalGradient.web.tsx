/**
 * Universal gradient - web uses Tailwind gradient classes.
 * Native uses expo-linear-gradient for reliable rendering.
 */

import React from "react";

import { Box } from "packages/ui/components/primitives/box";

import { UNIVERSAL_GRADIENT_VARIANT_CLASSES } from "./gradientVariants";
import type { UniversalGradientProps } from "./types";

export const UniversalGradient: React.FC<UniversalGradientProps> = ({
  variant,
  className = "",
  children,
}) => {
  const gradientClass = UNIVERSAL_GRADIENT_VARIANT_CLASSES[variant];
  return <Box className={`${gradientClass} ${className}`.trim()}>{children}</Box>;
};

export default UniversalGradient;
