import React, { useMemo, useState } from "react";

import { spacing } from "packages/design-tokens";
import RangeInput from "packages/ui/components/form/RangeInput";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { formatCompactNumber, formatNumber } from "packages/utils";

import { RangeSliderTrackRoot, TickMappedRangeSliderChrome } from "./TickMappedRangeSliderFrame";
import { getRangeSliderThumbClass, RANGE_SLIDER_HIT_HEIGHT } from "./tickMappedRangeSliderShared";
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
  const maxLabel =
    maxValue >= tickValues[tickValues.length - 1]
      ? `${formattedValue(maxValue)}+`
      : formattedValue(maxValue);
  const valueBlock = (
    <Box className="flex min-h-5 w-full flex-row flex-wrap items-center justify-start gap-2">
      <Text className="text-text-primary whitespace-nowrap text-sm font-medium tabular-nums">
        {formattedValue(minValue)}
      </Text>
      <Text className="text-text-disabled flex-shrink-0 text-sm leading-5">–</Text>
      <Text className="text-text-primary whitespace-nowrap text-sm font-medium tabular-nums">
        {maxLabel}
      </Text>
    </Box>
  );

  const thumbClass = getRangeSliderThumbClass(disabled);

  return (
    <TickMappedRangeSliderChrome
      className={className}
      header={showTextHeader ? valueBlock : undefined}
    >
      <RangeSliderTrackRoot>
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
            height: RANGE_SLIDER_HIT_HEIGHT,
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
            height: RANGE_SLIDER_HIT_HEIGHT,
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
      </RangeSliderTrackRoot>
    </TickMappedRangeSliderChrome>
  );
}
