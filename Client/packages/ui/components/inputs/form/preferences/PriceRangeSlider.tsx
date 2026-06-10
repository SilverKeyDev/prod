import React, { useMemo } from "react";

import { spacing } from "packages/design-tokens";
import { RangeInput } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import { Text } from "packages/ui/components/structure/primitives";
import { formatNumber } from "packages/utils";

import { RangeSliderTrackRoot, TickMappedRangeSliderChrome } from "./TickMappedRangeSliderFrame";
import { getRangeSliderThumbClass, RANGE_SLIDER_HIT_HEIGHT } from "./tickMappedRangeSliderShared";
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
    <Box className="flex min-h-5 w-full min-w-0 flex-row items-center justify-start">
      <Text className="text-text-primary truncate text-sm font-medium tabular-nums">
        {formattedValue(value)}
      </Text>
    </Box>
  );

  const thumbClass = getRangeSliderThumbClass(disabled);

  return (
    <TickMappedRangeSliderChrome className={className} header={valueBlock}>
      <RangeSliderTrackRoot>
        <Box
          className="sk-range-track-single"
          style={{
            height: trackHeight,
            ["--sk-range-val" as string]: String(sliderValue),
          }}
        />
        <Box
          className="absolute min-w-0 max-w-full"
          style={{
            left: spacing(0),
            right: spacing(0),
            height: RANGE_SLIDER_HIT_HEIGHT,
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
      </RangeSliderTrackRoot>
    </TickMappedRangeSliderChrome>
  );
}
