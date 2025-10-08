import React from "react";

export type TrianglePointerProps = {
  /** Whether to show the triangle pointer */
  show?: boolean;
  /** Custom className for the container */
  className?: string;
  /** Color of the triangle border (default: brown) */
  borderColor?: string;
  /** Color of the triangle fill (default: white) */
  fillColor?: string;
  /** Size of the triangle (default: 6px) */
  size?: number;
};

/**
 * Triangle pointer component used for map markers and info windows
 * Based on the exact implementation from important location markers
 */
export const TrianglePointer: React.FC<TrianglePointerProps> = ({
  show = true,
  className = "",
  borderColor = "rgba(158, 131, 113, 0.4)", // brown border
  fillColor = "rgba(255, 255, 255, 0.95)", // white fill
  size = 6,
}) => {
  if (!show) return null;

  return (
    <div
      className={`absolute bottom-0 left-1/2 -translate-x-1/2 transform ${className}`}
    >
      {/* Inner triangle (fill) */}
      <div
        style={{
          position: "absolute",
          bottom: `-${size}px`,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: `${size}px solid transparent`,
          borderRight: `${size}px solid transparent`,
          borderTop: `${size}px solid ${fillColor}`,
        }}
      />
      {/* Outer triangle (border) */}
      <div
        style={{
          position: "absolute",
          bottom: `-${size + 1}px`,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: `${size + 1}px solid transparent`,
          borderRight: `${size + 1}px solid transparent`,
          borderTop: `${size + 1}px solid ${borderColor}`,
        }}
      />
    </div>
  );
};

export default TrianglePointer;
