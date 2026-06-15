/**
 * BlurView - native uses expo-blur.
 * CSS backdrop-blur is not supported in React Native.
 */

import React from "react";

import { BlurView as ExpoBlurView } from "expo-blur";
import { View } from "react-native";

import { BLUR_INTENSITY_MAP } from "packages/ui/styles/variants/blurViewVariants";

import type { BlurViewProps } from "./types";

export const BlurView: React.FC<BlurViewProps> = ({
  intensity = "md",
  tint = "default",
  className = "",
  children,
}) => {
  const blurIntensity = BLUR_INTENSITY_MAP[intensity];
  return (
    <View className={className} style={{ overflow: "hidden" }}>
      <ExpoBlurView intensity={blurIntensity} tint={tint} style={{ flex: 1, overflow: "hidden" }}>
        {children}
      </ExpoBlurView>
    </View>
  );
};

export default BlurView;
