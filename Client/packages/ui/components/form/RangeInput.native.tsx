import React from "react";

import Slider from "@react-native-community/slider";
import type { ViewStyle } from "react-native";
import { View } from "react-native";

import { color } from "packages/design-tokens";

/**
 * Native range input — same API as web RangeInput so shared slider components
 * (BudgetRangeSlider, PriceRangeSlider) can use one code path.
 * Parent uses parseFloat(e.target.value); we synthesize that from Slider's onValueChange.
 */
export type RangeInputProps = {
  label?: string;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange?: (e: { target: { value: string } }) => void;
  className?: string;
  style?: ViewStyle;
  tabIndex?: number;
  "aria-disabled"?: boolean;
  /** When true, track is transparent (parent draws track; used for dual-thumb overlay). */
  transparentTrack?: boolean;
};

const TRACK_HEIGHT = 8;

export default function RangeInputNative({
  label,
  value = 0,
  min = 0,
  max = 100,
  step = 0.1,
  disabled = false,
  onChange,
  style,
  transparentTrack = false,
}: RangeInputProps) {
  return (
    <View style={[{ height: TRACK_HEIGHT }, style]}>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={(v) => onChange?.({ target: { value: String(v) } })}
        minimumTrackTintColor={transparentTrack ? "transparent" : color("accent")}
        maximumTrackTintColor={transparentTrack ? "transparent" : color("neutral.300")}
        thumbTintColor={color("neutral.50")}
        disabled={disabled}
        accessibilityLabel={label}
        style={{ height: TRACK_HEIGHT }}
      />
    </View>
  );
}
