import React, { useCallback, useEffect, useState } from "react";

import { spacing } from "packages/design-tokens";
import RangeInput from "packages/ui/components/form/RangeInput";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { formatCompactNumber, formatNumber } from "packages/utils";

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
  /** When false, hides the min—max value text below the track. Default true. */
  showTextHeader?: boolean;
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
}: BudgetRangeSliderProps) {
  const defaultFormatValue = (val: number) => {
    if (val >= 1000) {
      return `${formatPrefix}${formatCompactNumber(val)}`;
    }
    return `${formatPrefix}${formatNumber(val)}`;
  };
  const formattedValue = formatValue ?? defaultFormatValue;
  const [minSliderValue, setMinSliderValue] = useState(0);
  const [maxSliderValue, setMaxSliderValue] = useState(100);

  const toSliderPercent = useCallback(
    (val: number): number => {
      for (let i = 0; i < tickValues.length - 1; i++) {
        const start = tickValues[i];
        const end = tickValues[i + 1];
        if (val >= start && val <= end) {
          const segmentStart = (i / (tickValues.length - 1)) * 100;
          const segmentEnd = ((i + 1) / (tickValues.length - 1)) * 100;
          const percentWithinSegment = (val - start) / (end - start);
          return segmentStart + percentWithinSegment * (segmentEnd - segmentStart);
        }
      }
      return val <= tickValues[0] ? 0 : 100;
    },
    [tickValues]
  );

  const fromSliderPercent = (percent: number): number => {
    const totalSegments = tickValues.length - 1;
    const segmentSize = 100 / totalSegments;
    const segmentIndex = Math.min(Math.floor(percent / segmentSize), totalSegments - 1);
    const segmentStart = tickValues[segmentIndex];
    const segmentEnd = tickValues[segmentIndex + 1];
    const percentInSegment = (percent - segmentIndex * segmentSize) / segmentSize;
    return Math.round(segmentStart + percentInSegment * (segmentEnd - segmentStart));
  };

  useEffect(() => {
    setMinSliderValue(toSliderPercent(minValue));
    setMaxSliderValue(toSliderPercent(maxValue));
  }, [minValue, maxValue, tickValues, toSliderPercent]);

  useEffect(() => {
    if (maxValue - minValue < minGap) {
      const correctedMin = Math.max(tickValues[0], maxValue - minGap);
      const correctedMax = Math.min(tickValues[tickValues.length - 1], minValue + minGap);
      if (correctedMax - correctedMin >= minGap) {
        onChange(correctedMin, correctedMax);
      }
    }
  }, [minValue, maxValue, minGap, tickValues, onChange]);

  const handleMinSliderChange = (e: { target: { value: string } }) => {
    const newSliderPercent = parseFloat(e.target.value);
    const actualValue = fromSliderPercent(newSliderPercent);
    const maxAllowedMin = maxValue - minGap;
    if (actualValue <= maxAllowedMin) {
      setMinSliderValue(newSliderPercent);
      onChange(actualValue, maxValue);
    }
  };

  const handleMaxSliderChange = (e: { target: { value: string } }) => {
    const newSliderPercent = parseFloat(e.target.value);
    const actualValue = fromSliderPercent(newSliderPercent);
    const minAllowedMax = minValue + minGap;
    if (actualValue >= minAllowedMax) {
      setMaxSliderValue(newSliderPercent);
      onChange(minValue, actualValue);
    }
  };

  const trackHeight = spacing(2);
  const valueBlock = (
    <Box className="flex flex-row items-center justify-center gap-2">
      <Text className="text-text-primary text-sm font-medium">{formattedValue(minValue)}</Text>
      <Text className="text-text-disabled text-sm">—</Text>
      <Text className="text-text-primary text-sm font-medium">
        {maxValue >= tickValues[tickValues.length - 1]
          ? `${formattedValue(maxValue)}+`
          : formattedValue(maxValue)}
      </Text>
    </Box>
  );

  return (
    <Box className={`flex w-full flex-col items-center ${className}`}>
      <Box className="mx-auto w-full max-w-xl px-2">
        <Box className="flex flex-col items-center gap-2">
          <Box className="relative w-full justify-center" style={{ height: trackHeight }}>
            <Box
              className="bg-border absolute h-2 w-full rounded-lg"
              style={{ height: trackHeight }}
            />
            <Box
              className="bg-accent absolute rounded-lg"
              style={{
                left: `${minSliderValue}%`,
                width: `${maxSliderValue - minSliderValue}%`,
                height: trackHeight,
                borderRadius: 4,
              }}
            />
            <Box
              className="absolute"
              style={{
                left: spacing(0),
                right: spacing(0),
                height: trackHeight,
                zIndex: minSliderValue > 100 - maxSliderValue ? 5 : 3,
              }}
            >
              <RangeInput
                min={0}
                max={100}
                step={0.5}
                value={minSliderValue}
                onChange={disabled ? undefined : handleMinSliderChange}
                disabled={disabled}
                label="Minimum price"
                transparentTrack
                className={`sk-range-slider-thumb pointer-events-none absolute h-2 w-full touch-manipulation appearance-none rounded-lg bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                style={{ zIndex: minSliderValue > 100 - maxSliderValue ? 5 : 3 }}
              />
            </Box>
            <Box
              className="absolute"
              style={{
                left: spacing(0),
                right: spacing(0),
                height: trackHeight,
                zIndex: 4,
              }}
            >
              <RangeInput
                min={0}
                max={100}
                step={0.5}
                value={maxSliderValue}
                onChange={disabled ? undefined : handleMaxSliderChange}
                disabled={disabled}
                label="Maximum price"
                transparentTrack
                className={`sk-range-slider-thumb pointer-events-none absolute h-2 w-full touch-manipulation appearance-none rounded-lg bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
              />
            </Box>
          </Box>
          {showTextHeader ? valueBlock : null}
        </Box>
      </Box>
    </Box>
  );
}
