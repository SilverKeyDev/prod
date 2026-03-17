import React from "react";

import { spacing } from "packages/design-tokens";
import { Box } from "packages/ui/components/primitives";

export type TrianglePointerProps = {
  /** Whether to show the triangle pointer */
  show?: boolean;
  /** Custom className for the container */
  className?: string;
  /** Color of the triangle border (default: brown) */
  borderColor?: string;
  /** Color of the triangle fill (default: white) */
  fillColor?: string;
  /** Size of the triangle in px (default: 4 for a slight pointer) */
  size?: number;
};

/**
 * Triangle pointer for map property cards. Renders a small downward triangle
 * centered at the bottom of the card; the tip aligns with the marker position
 * (AdvancedMarkerElement uses bottom-center anchor by default).
 */
export const TrianglePointer: React.FC<TrianglePointerProps> = ({
  show = true,
  className = "",
  borderColor = "rgba(158, 131, 113, 0.4)", // brown border
  fillColor = "rgba(255, 255, 255, 0.95)", // white fill
  size = 4,
}) => {
  if (!show) return null;

  return (
    <Box className={`absolute bottom-0 left-1/2 -translate-x-1/2 transform ${className}`}>
      {/* Inner triangle (fill) */}
      <Box
        style={{
          position: "absolute",
          bottom: `-${size}px`,
          left: "50%",
          transform: "translateX(-50%)",
          width: spacing(0),
          height: spacing(0),
          borderLeft: `${size}px solid transparent`,
          borderRight: `${size}px solid transparent`,
          borderTop: `${size}px solid ${fillColor}`,
        }}
      />
      {/* Outer triangle (border) */}
      <Box
        style={{
          position: "absolute",
          bottom: `-${size + 1}px`,
          left: "50%",
          transform: "translateX(-50%)",
          width: spacing(0),
          height: spacing(0),
          borderLeft: `${size + 1}px solid transparent`,
          borderRight: `${size + 1}px solid transparent`,
          borderTop: `${size + 1}px solid ${borderColor}`,
        }}
      />
    </Box>
  );
};

export default TrianglePointer;
