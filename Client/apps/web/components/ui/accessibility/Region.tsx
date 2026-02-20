import React, { forwardRef } from "react";

export type RegionProps = {
  /**
   * Unified accessibility label. Maps to aria-label (web) and accessibilityLabel (RN).
   */
  label?: string;
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * Semantic region wrapper. Use for scrollable or landmark areas that need an accessible name.
 * Pass label instead of aria-label so the design system can map per platform.
 */
const Region = forwardRef<HTMLDivElement, RegionProps>(
  ({ label, role = "region", ...props }, ref) => {
    return <div ref={ref} role={role} aria-label={label} {...props} />;
  },
);
Region.displayName = "Region";
export default Region;
