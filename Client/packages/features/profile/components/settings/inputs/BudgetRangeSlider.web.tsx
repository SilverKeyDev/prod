import React, { useCallback, useEffect, useState } from "react";

import { BodyText, RangeInput } from "packages/ui/components/index.web";
import { formatCompactNumber, formatNumber } from "packages/utils";

type BudgetRangeSliderProps = {
  tickValues: number[]; // Ex: [1000000, 2000000, 4000000, 10000000]
  minValue: number;
  maxValue: number;
  onChange: (minValue: number, maxValue: number) => void;
  formatValue?: (value: number) => string;
  formatPrefix?: string;
  className?: string;
  disabled?: boolean;
  minGap?: number; // Minimum gap between min and max values
  /** When false, tick marks and labels underneath the slider are hidden. Default true. */
  showTickMarks?: boolean;
};

const BudgetRangeSlider: React.FC<BudgetRangeSliderProps> = ({
  tickValues,
  minValue,
  maxValue,
  onChange,
  formatValue,
  formatPrefix = "$",
  className = "",
  disabled = false,
  minGap = 50000, // Default minimum gap of $50,000
  showTickMarks = true,
}) => {
  const defaultFormatValue = (val: number) => {
    if (val >= 1000) {
      return `${formatPrefix}${formatCompactNumber(val)}`;
    }
    return `${formatPrefix}${formatNumber(val)}`;
  };
  const formattedValue = formatValue ?? defaultFormatValue;
  const [minSliderValue, setMinSliderValue] = useState(0);
  const [maxSliderValue, setMaxSliderValue] = useState(100);

  // Maps value to slider percent (0-100) based on tickValues as keyframes
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

  // Maps slider percent to value using linear interpolation in each segment
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

  // Validate and correct initial values to maintain minimum gap
  useEffect(() => {
    if (maxValue - minValue < minGap) {
      const correctedMin = Math.max(tickValues[0], maxValue - minGap);
      const correctedMax = Math.min(tickValues[tickValues.length - 1], minValue + minGap);

      // Only correct if we can maintain the gap within the valid range
      if (correctedMax - correctedMin >= minGap) {
        onChange(correctedMin, correctedMax);
      }
    }
  }, [minValue, maxValue, minGap, tickValues, onChange]);

  const handleMinSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSliderPercent = parseFloat(e.target.value);
    const actualValue = fromSliderPercent(newSliderPercent);

    // Ensure min doesn't exceed max and maintains minimum gap
    const maxAllowedMin = maxValue - minGap;
    if (actualValue <= maxAllowedMin) {
      setMinSliderValue(newSliderPercent);
      onChange(actualValue, maxValue);
    }
  };

  const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSliderPercent = parseFloat(e.target.value);
    const actualValue = fromSliderPercent(newSliderPercent);

    // Ensure max doesn't go below min and maintains minimum gap
    const minAllowedMax = minValue + minGap;
    if (actualValue >= minAllowedMax) {
      setMaxSliderValue(newSliderPercent);
      onChange(minValue, actualValue);
    }
  };

  /** Max visible ticks so labels never touch; sample evenly from tickValues. */
  const MAX_VISIBLE_TICKS = 8;

  const renderTickMarks = () => {
    const n = tickValues.length;
    const lastIndex = n - 1;
    const rawIndices =
      n <= MAX_VISIBLE_TICKS
        ? Array.from({ length: n }, (_, i) => i)
        : Array.from({ length: MAX_VISIBLE_TICKS }, (_, i) =>
            Math.round((i * lastIndex) / (MAX_VISIBLE_TICKS - 1))
          );
    const indicesToShow = [...new Set(rawIndices)].sort((a, b) => a - b);
    return (
      <div className="relative mt-1 h-6 w-full overflow-visible">
        {indicesToShow.map((index) => {
          const val = tickValues[index];
          const leftPercent = (index / lastIndex) * 100;
          const isLast = index === lastIndex;
          return (
            <div
              key={index}
              className="absolute transform"
              style={
                isLast
                  ? { right: 0, left: "auto", transform: "none" }
                  : { left: `${leftPercent}%`, transform: "translateX(-50%)" }
              }
            >
              <div className="mx-auto h-2 w-0.5 bg-gray-300" />
              <div className="mt-1 whitespace-nowrap text-xs text-gray-500">
                {isLast ? `${formattedValue(val)}+` : formattedValue(val)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`flex w-full justify-center ${className}`}>
      <div className="w-full max-w-xl px-2 sm:px-4">
        <div className="mb-4 sm:mb-6">
          <div className="relative h-2">
            {/* Track background */}
            <div className="absolute h-2 w-full rounded-lg bg-gray-300"></div>

            {/* Active range highlight */}
            <div
              className="bg-gold absolute h-2 rounded-lg"
              style={{
                left: `${minSliderValue}%`,
                width: `${maxSliderValue - minSliderValue}%`,
              }}
            ></div>

            {/* Min slider */}
            <RangeInput
              min={0}
              max={100}
              step={0.1}
              value={minSliderValue}
              onChange={disabled ? undefined : handleMinSliderChange}
              className={`pointer-events-none absolute h-2 w-full touch-manipulation appearance-none rounded-lg bg-transparent accent-white [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto ${
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              }`}
              disabled={disabled}
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled}
              label="Minimum price"
              style={{
                zIndex: minSliderValue > 100 - maxSliderValue ? 5 : 3,
              }}
            />

            {/* Max slider */}
            <RangeInput
              min={0}
              max={100}
              step={0.1}
              value={maxSliderValue}
              onChange={disabled ? undefined : handleMaxSliderChange}
              className={`pointer-events-none absolute h-2 w-full touch-manipulation appearance-none rounded-lg bg-transparent accent-white [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto ${
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              }`}
              disabled={disabled}
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled}
              label="Maximum price"
              style={{
                zIndex: 4,
              }}
            />
          </div>
          {showTickMarks && renderTickMarks()}
        </div>
        <div className="flex items-center justify-center gap-2 text-center text-sm sm:text-base">
          <BodyText as="span" size="sm" className="font-medium">
            {formattedValue(minValue)}
          </BodyText>
          <BodyText as="span" size="sm" className="text-gray-400">
            —
          </BodyText>
          <BodyText as="span" size="sm" className="font-medium">
            {maxValue >= tickValues[tickValues.length - 1]
              ? `${formattedValue(maxValue)}+`
              : formattedValue(maxValue)}
          </BodyText>
        </div>
      </div>
    </div>
  );
};

export default BudgetRangeSlider;
