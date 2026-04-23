/**
 * Dashed divider - web uses CSS border-dashed.
 * Native uses react-native-svg for reliable dashed rendering.
 */

import React from "react";

import { Box } from "packages/ui/components/primitives/box";

import {
  DASHED_DIVIDER_HORIZONTAL_CLASSES,
  DASHED_DIVIDER_VERTICAL_CLASSES,
} from "./dividerStyles";
import type { DashedDividerProps } from "./types";

/**
 * Web: Uses standard CSS border-dashed for reliable rendering.
 */
export const DashedDivider: React.FC<Omit<DashedDividerProps, "color">> = ({
  className = "",
  orientation = "horizontal",
}) => {
  const baseClass =
    orientation === "horizontal"
      ? DASHED_DIVIDER_HORIZONTAL_CLASSES
      : DASHED_DIVIDER_VERTICAL_CLASSES;

  return <Box className={`${baseClass} ${className}`.trim()} aria-hidden />;
};

export default DashedDivider;
