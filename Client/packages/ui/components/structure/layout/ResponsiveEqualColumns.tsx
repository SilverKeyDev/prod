import React from "react";

import { Box } from "packages/ui/components/structure/primitives";

export type ResponsiveEqualColumnsProps = {
  children: React.ReactNode;
  className?: string;
  gap?: "sm" | "md" | "lg";
};

const GAP_CLASSES: Record<NonNullable<ResponsiveEqualColumnsProps["gap"]>, string> = {
  sm: "gap-2 sm:gap-3",
  md: "gap-3 sm:gap-4",
  lg: "gap-4 sm:gap-6",
};

/**
 * Stacks children vertically on narrow widths; distributes them evenly across the row when wide.
 * NativeWind-compatible — use instead of DOM-specific AlignedRow on React Native.
 */
export function ResponsiveEqualColumns({
  children,
  className = "",
  gap = "lg",
}: ResponsiveEqualColumnsProps): React.ReactElement {
  return (
    <Box className={`flex w-full flex-col sm:flex-row ${GAP_CLASSES[gap]} ${className}`.trim()}>
      {React.Children.map(children, (child, index) => (
        <Box key={index} className="min-w-0 flex-1">
          {child}
        </Box>
      ))}
    </Box>
  );
}
