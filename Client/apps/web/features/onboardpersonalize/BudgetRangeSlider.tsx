import React, { useState, useEffect, useCallback } from "react";

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
}) => {
  const defaultFormatValue = (val: number) => {
    if (val >= 1000000) {
      return `${formatPrefix}${(val / 1000000).toFixed(1)}M`;
    } else if (val >= 1000) {
      return `${formatPrefix}${(val / 1000).toFixed(0)}K`;
    }
    return `${formatPrefix}${val.toLocaleString()}`;
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
          return (
            segmentStart + percentWithinSegment * (segmentEnd - segmentStart)
          );
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
    const segmentIndex = Math.min(
      Math.floor(percent / segmentSize),
      totalSegments - 1
    );

    const segmentStart = tickValues[segmentIndex];
    const segmentEnd = tickValues[segmentIndex + 1];
    const percentInSegment =
      (percent - segmentIndex * segmentSize) / segmentSize;
    return Math.round(
      segmentStart + percentInSegment * (segmentEnd - segmentStart)
    );
  };

  useEffect(() => {
    setMinSliderValue(toSliderPercent(minValue));
    setMaxSliderValue(toSliderPercent(maxValue));
  }, [minValue, maxValue, tickValues, toSliderPercent]);

  // Validate and correct initial values to maintain minimum gap
  useEffect(() => {
    if (maxValue - minValue < minGap) {
      const correctedMin = Math.max(tickValues[0], maxValue - minGap);
      const correctedMax = Math.min(
        tickValues[tickValues.length - 1],
        minValue + minGap
      );

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

  const renderTickMarks = () => {
    return (
      <div className="relative mt-1 h-6 w-full">
        {tickValues.map((val, index) => {
          const leftPercent = (index / (tickValues.length - 1)) * 100;
          return (
            <div
              key={index}
              className="absolute -translate-x-1/2 transform"
              style={{ left: `${leftPercent}%` }}
            >
              <div className="mx-auto h-2 w-0.5 bg-gray-300"></div>
              <div className="mt-1 whitespace-nowrap text-[5px] text-gray-500 xs:text-[6px] sm:text-[7px] md:text-[8px] lg:text-[9px]">
                {index === tickValues.length - 1
                  ? `${formattedValue(val)}+`
                  : formattedValue(val)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`flex w-full justify-center ${className}`}>
      <div className="w-full max-w-[600px] px-2 sm:px-4">
        <div className="mb-4 sm:mb-6">
          <div className="relative h-2">
            {/* Track background */}
            <div className="absolute h-2 w-full rounded-lg bg-gray-300"></div>

            {/* Active range highlight */}
            <div
              className="absolute h-2 rounded-lg bg-gold"
              style={{
                left: `${minSliderValue}%`,
                width: `${maxSliderValue - minSliderValue}%`,
              }}
            ></div>

            {/* Min slider */}
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={minSliderValue}
              onChange={disabled ? undefined : handleMinSliderChange}
              className={`pointer-events-none absolute h-2 w-full touch-manipulation appearance-none rounded-lg bg-transparent accent-brown [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto ${
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              }`}
              disabled={disabled}
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled}
              aria-label="Minimum price"
              style={{
                zIndex: minSliderValue > 100 - maxSliderValue ? 5 : 3,
              }}
            />

            {/* Max slider */}
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={maxSliderValue}
              onChange={disabled ? undefined : handleMaxSliderChange}
              className={`pointer-events-none absolute h-2 w-full touch-manipulation appearance-none rounded-lg bg-transparent accent-brown [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto ${
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              }`}
              disabled={disabled}
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled}
              aria-label="Maximum price"
              style={{
                zIndex: 4,
              }}
            />
          </div>
          {renderTickMarks()}
        </div>
        <div className="flex items-center justify-between text-center text-sm sm:text-base">
          <div className="flex-1">
            <span className="text-xs text-gray-500 sm:text-sm">Min:</span>{" "}
            <span className="font-medium">{formattedValue(minValue)}</span>
          </div>
          <div className="px-2 text-gray-400">—</div>
          <div className="flex-1">
            <span className="text-xs text-gray-500 sm:text-sm">Max:</span>{" "}
            <span className="font-medium">
              {maxValue >= tickValues[tickValues.length - 1]
                ? `${formattedValue(maxValue)}+`
                : formattedValue(maxValue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetRangeSlider;
