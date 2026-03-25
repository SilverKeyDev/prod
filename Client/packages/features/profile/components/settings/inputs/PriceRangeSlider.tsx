import React, { useMemo } from "react";

import { spacing } from "packages/design-tokens";
import RangeInput from "packages/ui/components/form/RangeInput";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { formatNumber } from "packages/utils";

import { useSliderTickMapping } from "./useSliderTickMapping";

type PriceRangeSliderProps = {
  tickValues: number[];
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  formatPrefix?: string;
  className?: string;
  disabled?: boolean;
};

/** Hit area height must be at least thumb size (1.25rem) so the full thumb is clickable. */
const SLIDER_HIT_HEIGHT = spacing(6); /* 1.5rem = 24px */

const THUMB_CLASS_BASE =
  "sk-range-slider-thumb pointer-events-none absolute h-full w-full touch-manipulation appearance-none rounded-lg bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto";
/** Must match `.sk-range-slider-thumb` in components.css (1.25rem thumb, -0.625rem centering). */
const THUMB_HALF_REM = "0.625rem";
const THUMB_DIAMETER_REM = "1.25rem";

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
  const { toSliderPercent, fromSliderPercent } = useSliderTickMapping(tickValues);

  const sliderValue = useMemo(() => toSliderPercent(value), [value, toSliderPercent]);

  const handleSliderChange = (e: { target: { value: string } }) => {
    const newSliderPercent = parseFloat(e.target.value);
    onChange(fromSliderPercent(newSliderPercent));
  };

  const trackHeight = spacing(2);
  const valueBlock = (
    <Box className="flex flex-row items-center justify-center">
      <Text className="text-text-primary text-sm font-medium">{formattedValue(value)}</Text>
    </Box>
  );

  const thumbClass = `${THUMB_CLASS_BASE} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`;

  const fillWidth = `calc(${THUMB_HALF_REM} + ${sliderValue}% - (${sliderValue} * ${THUMB_DIAMETER_REM} / 100))`;

  return (
    <Box className={`w-full items-center ${className}`}>
      <Box className="w-full max-w-xl px-2">
        <Box className="flex flex-col items-center gap-2">
          {valueBlock}
          <Box className="relative w-full justify-center" style={{ height: SLIDER_HIT_HEIGHT }}>
            <Box
              className="bg-border pointer-events-none absolute left-0 right-0 w-full rounded-lg"
              style={{
                height: trackHeight,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <Box
              className="bg-accent pointer-events-none absolute left-0 rounded-lg"
              style={{
                left: spacing(0),
                width: fillWidth,
                height: trackHeight,
                top: "50%",
                transform: "translateY(-50%)",
                borderRadius: 4,
              }}
            />
            <Box
              className="absolute"
              style={{
                left: spacing(0),
                right: spacing(0),
                height: SLIDER_HIT_HEIGHT,
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
                label="Price"
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
