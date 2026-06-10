import React, { forwardRef } from "react";

import { Box } from "packages/ui/components/structure/primitives";

export type RegionProps = {
  /**
   * Unified accessibility label. Maps to aria-label (web) and accessibilityLabel (RN).
   */
  label?: string;
  /** Landmark role (web) / accessibilityRole (native). Defaults to `region`. */
  role?: React.AriaRole;
} & React.ComponentProps<typeof Box>;

/**
 * Semantic region wrapper. Use for scrollable or landmark areas that need an accessible name.
 * Pass label instead of raw aria-label / accessibilityLabel in feature code.
 */
const Region = forwardRef<React.ElementRef<typeof Box>, RegionProps>(
  ({ label, role = "region", ...props }, ref) => {
    return <Box ref={ref} accessibilityRole={role} accessibilityLabel={label} {...props} />;
  }
);
Region.displayName = "Region";
export default Region;
