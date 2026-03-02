import React, { useCallback, useEffect, useState } from "react";

import RangeInput from "packages/ui/components/form/RangeInput";
import { formatNumber } from "packages/utils";

type PriceRangeSliderProps = {
  tickValues: number[]; // Ex: [1000000, 2000000, 4000000, 10000000]
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  formatPrefix?: string;
  className?: string;
  disabled?: boolean;
  /** When false, tick marks and labels underneath the slider are hidden. Default true. */
  showTickMarks?: boolean;
};

const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  tickValues,
  value,
  onChange,
  formatValue,
  formatPrefix = "$",
  className = "",
  disabled = false,
  showTickMarks = true,
}) => {
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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSliderPercent = parseFloat(e.target.value);
    setSliderValue(newSliderPercent);
    const actualValue = fromSliderPercent(newSliderPercent);
    onChange(actualValue);
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
              <div className="mt-1 whitespace-nowrap text-xs text-gray-500">
                {index === tickValues.length - 1 ? `${formattedValue(val)}+` : formattedValue(val)}
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
          <RangeInput
            min={0}
            max={100}
            step={0.1}
            value={sliderValue}
            onChange={disabled ? undefined : handleSliderChange}
            className={`bg-beige h-2 w-full touch-manipulation appearance-none rounded-lg accent-white ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
            disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
          />
          {showTickMarks && renderTickMarks()}
        </div>
        <div className="text-center">{formattedValue(value)}</div>
      </div>
    </div>
  );
};

export default PriceRangeSlider;
