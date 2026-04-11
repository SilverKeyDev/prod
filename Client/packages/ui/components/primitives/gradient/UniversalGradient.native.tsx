/**
 * Universal gradient - native uses expo-linear-gradient.
 * CSS gradients are not supported on React Native.
 */

import React from "react";

import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

import { UNIVERSAL_GRADIENT_VARIANT_CONFIG } from "./gradientVariants";
import type { UniversalGradientProps } from "./types";

export const UniversalGradient: React.FC<UniversalGradientProps> = ({
  variant,
  className = "",
  children,
}) => {
  const config = UNIVERSAL_GRADIENT_VARIANT_CONFIG[variant];
  return (
    <View className={className} style={{ overflow: "hidden" }}>
      <LinearGradient
        colors={config.colors}
        start={config.start}
        end={config.end}
        style={{ flex: 1 }}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

export default UniversalGradient;
