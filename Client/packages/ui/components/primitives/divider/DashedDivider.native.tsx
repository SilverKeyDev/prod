/**
 * Dashed divider — native uses react-native-svg for reliable dashed rendering.
 * CSS border-dashed is unreliable on older iOS/Android.
 */

import React from "react";

import { View } from "react-native";
import Svg, { Line } from "react-native-svg";

import { color as resolveColor } from "packages/design-tokens";

import { DASH_LENGTH, GAP_LENGTH } from "./dividerStyles";
import type { DashedDividerProps } from "./types";

/**
 * Native: Uses react-native-svg Line with strokeDasharray for reliable dashed rendering.
 */
export const DashedDivider: React.FC<DashedDividerProps> = ({
  className = "",
  orientation = "horizontal",
  color = resolveColor("neutral.400"),
}) => {
  const size = 100;
  const strokeWidth = 2;

  const line =
    orientation === "horizontal" ? (
      <Line
        x1={0}
        y1={strokeWidth / 2}
        x2={size}
        y2={strokeWidth / 2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${DASH_LENGTH} ${GAP_LENGTH}`}
      />
    ) : (
      <Line
        x1={strokeWidth / 2}
        y1={0}
        x2={strokeWidth / 2}
        y2={size}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${DASH_LENGTH} ${GAP_LENGTH}`}
      />
    );

  return (
    <View
      className={className}
      style={
        orientation === "horizontal"
          ? { width: "100%", height: strokeWidth }
          : { width: strokeWidth, height: "100%" }
      }
      aria-hidden
    >
      <Svg
        width={orientation === "horizontal" ? "100%" : strokeWidth}
        height={orientation === "horizontal" ? strokeWidth : "100%"}
        viewBox={
          orientation === "horizontal" ? `0 0 ${size} ${strokeWidth}` : `0 0 ${strokeWidth} ${size}`
        }
        preserveAspectRatio="none"
      >
        {line}
      </Svg>
    </View>
  );
};

export default DashedDivider;
