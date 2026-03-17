import React, { useCallback, useEffect, useState } from "react";

import { spacing } from "packages/design-tokens";
import RangeInput from "packages/ui/components/form/RangeInput";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { formatNumber } from "packages/utils";

type PriceRangeSliderProps = {
  tickValues: number[];
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  formatPrefix?: string;
  className?: string;
  disabled?: boolean;
};

export default function PriceRangeSlider({
  tickValues,
  value,
  onChange,
  formatValue,
  formatPrefix = "$",
  className = "",
  disabled = false,
}: PriceRangeSliderProps) {
  const defaultFormatValue = (val: number) => `${formatPrefix}${formatNumber(val)}`;
  const formattedValue = formatValue ?? defaultFormatValue;
  const [sliderValue, setSliderValue] = useState(0);

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
    setSliderValue(toSliderPercent(value));
  }, [value, tickValues, toSliderPercent]);

  const handleSliderChange = (e: { target: { value: string } }) => {
    const newSliderPercent = parseFloat(e.target.value);
    setSliderValue(newSliderPercent);
    onChange(fromSliderPercent(newSliderPercent));
  };

  const trackHeight = spacing(2);
  const valueBlock = (
    <Box className="flex flex-row items-center justify-center">
      <Text className="text-text-primary text-sm font-medium">{formattedValue(value)}</Text>
    </Box>
  );

  return (
    <Box className={`w-full items-center ${className}`}>
      <Box className="w-full max-w-xl px-2">
        <Box className="flex flex-col items-center gap-2">
          <Box className="relative w-full justify-center" style={{ height: trackHeight }}>
            <Box
              className="bg-border absolute h-2 w-full rounded-lg"
              style={{ height: trackHeight }}
            />
            <Box
              className="bg-accent absolute rounded-lg"
              style={{
                left: spacing(0),
                width: `${sliderValue}%`,
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
                zIndex: 3,
              }}
            >
              <RangeInput
                min={0}
                max={100}
                step={0.5}
                value={sliderValue}
                onChange={disabled ? undefined : handleSliderChange}
                disabled={disabled}
                transparentTrack
                className={`sk-range-slider-thumb pointer-events-none absolute h-2 w-full touch-manipulation appearance-none rounded-lg bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
              />
            </Box>
          </Box>
          {valueBlock}
        </Box>
      </Box>
    </Box>
  );
}
