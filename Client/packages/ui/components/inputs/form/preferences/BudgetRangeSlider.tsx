import React, { useMemo, useState } from "react";

import { spacing } from "packages/design-tokens";
import RangeInput from "packages/ui/components/inputs/form/pickers/RangeInput";
import { Box } from "packages/ui/components/structure/primitives";
import { Text } from "packages/ui/components/structure/primitives";
import { formatCompactNumber, formatNumber } from "packages/utils";

import { RangeSliderTrackRoot, TickMappedRangeSliderChrome } from "./TickMappedRangeSliderFrame";
import { getRangeSliderThumbClass, RANGE_SLIDER_HIT_HEIGHT } from "./tickMappedRangeSliderShared";
import { useSliderTickMapping } from "./useSliderTickMapping";

export type BudgetRangeSliderProps = {
  tickValues: number[];
  minValue: number;
  maxValue: number;
  onChange: (minValue: number, maxValue: number) => void;
  formatValue?: (value: number) => string;
  formatPrefix?: string;
  className?: string;
  disabled?: boolean;
  /** Minimum distance between min and max in tick units. Ignored when allowSingleValue is true. */
  minGap?: number;
  /** When true, min and max may be equal (e.g. exactly 3 baths, not 3–4). */
  allowSingleValue?: boolean;
  showTextHeader?: boolean;
  valueDecimals?: number;
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
  allowSingleValue = false,
  showTextHeader = true,
  valueDecimals,
  variant = "default",
}: BudgetRangeSliderProps) {
  const [activeThumb, setActiveThumb] = useState<"min" | "max">("max");
  const effectiveMinGap = allowSingleValue ? 0 : minGap;

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
    const newSliderPercent = allowSingleValue ? raw : Math.min(raw, maxSliderValue);
    setActiveThumb("min");
    const actualValue = fromSliderPercent(newSliderPercent);
    if (allowSingleValue && actualValue >= maxValue) {
      onChange(actualValue, actualValue);
      return;
    }
    const maxAllowedMin = maxValue - effectiveMinGap;
    if (actualValue <= maxAllowedMin) {
      onChange(actualValue, maxValue);
    }
  };

  const handleMaxSliderChange = (e: { target: { value: string } }) => {
    const raw = parseFloat(e.target.value);
    const newSliderPercent = allowSingleValue ? raw : Math.max(raw, minSliderValue);
    setActiveThumb("max");
    const actualValue = fromSliderPercent(newSliderPercent);
    if (allowSingleValue && actualValue <= minValue) {
      onChange(actualValue, actualValue);
      return;
    }
    const minAllowedMax = minValue + effectiveMinGap;
    if (actualValue >= minAllowedMax) {
      onChange(minValue, actualValue);
    }
  };

  const isBudgetVariant = variant === "budget";
  const trackHeight = isBudgetVariant ? spacing(2.5) : spacing(2);
  const formatTickLabel = (value: number) =>
    value >= tickValues[tickValues.length - 1]
      ? `${formattedValue(value)}+`
      : formattedValue(value);
  const isSingleValue = allowSingleValue && minValue === maxValue;
  const valueBlock = isSingleValue ? (
    <Text className="text-text-primary min-h-5 w-full text-center text-sm font-medium tabular-nums">
      {formatTickLabel(minValue)}
    </Text>
  ) : (
    <Box className="grid min-h-5 w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2">
      <Text className="text-text-primary truncate text-left text-sm font-medium tabular-nums">
        {formattedValue(minValue)}
      </Text>
      <Text className="text-text-disabled flex-shrink-0 text-sm leading-5">–</Text>
      <Text className="text-text-primary truncate text-right text-sm font-medium tabular-nums">
        {formatTickLabel(maxValue)}
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
        <Box
          className="pointer-events-none absolute inset-x-0 top-0 min-w-0 max-w-full"
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
          className="pointer-events-none absolute inset-x-0 top-0 min-w-0 max-w-full"
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
