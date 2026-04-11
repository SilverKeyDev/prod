/**
 * BlurView - web uses CSS backdrop-blur.
 * This file is .web.tsx so backdrop-blur is allowed (excluded from no-backdrop-blur rule).
 */

import React from "react";

import { Box } from "packages/ui/components/primitives";
import { BLUR_INTENSITY_CLASSES } from "packages/ui/styles/variants/blurViewVariants";

import type { BlurViewProps } from "./types";

export const BlurView: React.FC<BlurViewProps> = ({
  intensity = "md",
  className = "",
  children,
}) => {
  const blurClass = BLUR_INTENSITY_CLASSES[intensity];
  return <Box className={`${blurClass} ${className}`.trim()}>{children}</Box>;
};

export default BlurView;
