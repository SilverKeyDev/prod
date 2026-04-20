import React, { useMemo, useState } from "react";

import { spacing } from "packages/design-tokens";
import RangeInput from "packages/ui/components/form/RangeInput";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { formatCompactNumber, formatNumber } from "packages/utils";

import { useSliderTickMapping } from "./useSliderTickMapping";

type BudgetRangeSliderProps = {
  tickValues: number[];
  minValue: number;
  maxValue: number;
  onChange: (minValue: number, maxValue: number) => void;
  formatValue?: (value: number) => string;
  formatPrefix?: string;
  className?: string;
  disabled?: boolean;
  minGap?: number;
  /** When false, hides the min-max value text below the track. Default true. */
  showTextHeader?: boolean;
  /** Number of decimal places for computed values (e.g. 2 for lot size in acres). Omit for integers. */
  valueDecimals?: number;
  /** 'budget' = slightly larger track and green fill; 'default' = current gold accent. */
  variant?: "default" | "budget";
};

/** Hit area height must be at least thumb size (1.25rem) so the full thumb is clickable. */
const SLIDER_HIT_HEIGHT = spacing(6); /* 1.5rem = 24px */
const THUMB_CLASS_BASE =
  "sk-range-slider-thumb pointer-events-none absolute h-full w-full touch-manipulation appearance-none rounded-lg bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto";

export default function BudgetRangeSlider({
  tickValues,
  minValue,
  maxValue,
  onChange,
  formatValue,
  formatPrefix = "$",
  className = "",
  disabled = false,
  minGap = 50000,
  showTextHeader = true,
  valueDecimals,
  variant = "default",
}: BudgetRangeSliderProps) {
  const [activeThumb, setActiveThumb] = useState<"min" | "max">("max");

  const defaultFormatValue = (val: number) => {
    if (val >= 1000) {
      return `${formatPrefix}${formatCompactNumber(val)}`;
    }
    return `${formatPrefix}${formatNumber(val)}`;
  };
  const formattedValue = formatValue ?? defaultFormatValue;
  const { toSliderPercent, fromSliderPercent } = useSliderTickMapping(tickValues, valueDecimals);

  const minSliderValue = useMemo(() => toSliderPercent(minValue), [minValue, toSliderPercent]);
  const maxSliderValue = useMemo(() => toSliderPercent(maxValue), [maxValue, toSliderPercent]);

  const handleMinSliderChange = (e: { target: { value: string } }) => {
    const raw = parseFloat(e.target.value);
    const newSliderPercent = Math.min(raw, maxSliderValue);
    setActiveThumb("min");
    const actualValue = fromSliderPercent(newSliderPercent);
    const maxAllowedMin = maxValue - minGap;
    if (actualValue <= maxAllowedMin) {
      onChange(actualValue, maxValue);
    }
  };

  const handleMaxSliderChange = (e: { target: { value: string } }) => {
    const raw = parseFloat(e.target.value);
    const newSliderPercent = Math.max(raw, minSliderValue);
    setActiveThumb("max");
    const actualValue = fromSliderPercent(newSliderPercent);
    const minAllowedMax = minValue + minGap;
    if (actualValue >= minAllowedMax) {
      onChange(minValue, actualValue);
    }
  };

  const isBudgetVariant = variant === "budget";
  const trackHeight = isBudgetVariant ? spacing(2.5) : spacing(2);
  const valueBlock = (
    <Box className="flex flex-row items-center justify-center gap-2">
      <Text className="text-text-primary text-sm font-medium">{formattedValue(minValue)}</Text>
      <Text className="text-text-disabled text-sm">, </Text>
      <Text className="text-text-primary text-sm font-medium">
        {maxValue >= tickValues[tickValues.length - 1]
          ? `${formattedValue(maxValue)}+`
          : formattedValue(maxValue)}
      </Text>
    </Box>
  );

  const thumbClass = `${THUMB_CLASS_BASE} ${
    disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
  }`;

  return (
    <Box className={`flex w-full flex-col items-center ${className}`}>
      <Box className="mx-auto w-full max-w-xl px-2">
        <Box className="flex flex-col items-center gap-2">
          {showTextHeader ? valueBlock : null}
          <Box
            className="sk-range-slider-root relative w-full justify-center"
            style={{ height: SLIDER_HIT_HEIGHT }}
          >
            <Box
              className={
                isBudgetVariant
                  ? "sk-range-track-dual sk-range-track-dual--budget"
                  : "sk-range-track-dual sk-range-track-dual--default"
              }
              style={{
                height: trackHeight,
                ["--sk-range-min" as string]: String(minSliderValue),
                ["--sk-range-max" as string]: String(maxSliderValue),
              }}
            />
            {/* Wrappers use pointer-events-none so thumbs still receive events; activeThumb raises that slider so overlapping thumbs stay usable. */}
            <Box
              className="pointer-events-none absolute inset-x-0 top-0"
              style={{
                height: SLIDER_HIT_HEIGHT,
                zIndex: activeThumb === "min" ? 5 : 4,
              }}
            >
              <RangeInput
                min={0}
                max={100}
                step={0.5}
                value={minSliderValue}
                onChange={disabled ? undefined : handleMinSliderChange}
                disabled={disabled}
                label="Minimum value"
                transparentTrack
                className={thumbClass}
              />
            </Box>
            <Box
              className="pointer-events-none absolute inset-x-0 top-0"
              style={{
                height: SLIDER_HIT_HEIGHT,
                zIndex: activeThumb === "max" ? 5 : 4,
              }}
            >
              <RangeInput
                min={0}
                max={100}
                step={0.5}
                value={maxSliderValue}
                onChange={disabled ? undefined : handleMaxSliderChange}
                disabled={disabled}
                label="Maximum value"
                transparentTrack
                className={thumbClass}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
