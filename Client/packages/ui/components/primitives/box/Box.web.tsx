import React, { type CSSProperties, forwardRef } from "react";

import { flattenWebStyle, type WebStyleInput } from "packages/ui/utils/flattenWebStyle";

export type BoxProps = Omit<React.HTMLAttributes<HTMLDivElement>, "style"> & {
  style?: WebStyleInput;
};

/**
 * React Native `View` is a flex container by default. A plain `div` only becomes
 * flex when `display: flex` is set; otherwise `flexDirection` / `flex` children
 * do not lay out and rows collapse (e.g. week calendar columns bunched left).
 */
function withRnAlignedFlexDisplay(flat: CSSProperties): CSSProperties {
  if (flat.display != null) {
    return flat;
  }
  if (flat.flexDirection == null && flat.flexWrap == null) {
    return flat;
  }
  return { display: "flex", ...flat };
}

/**
 * Base Box primitive - one div for React (web).
 * Native uses View. Use this (or the resolved Box) so layout is platform-agnostic.
 */
const Box = forwardRef<HTMLDivElement, BoxProps>(function Box(
  { className = "", style, ...props },
  ref
) {
  const flat = withRnAlignedFlexDisplay(flattenWebStyle(style));
  return (
    <div
      ref={ref}
      className={className}
      style={Object.keys(flat).length > 0 ? flat : undefined}
      {...props}
    />
  );
});

export default Box;
