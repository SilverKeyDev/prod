import { useMemo } from "react";

import { spacing } from "packages/design-tokens";
import RangeInput from "packages/ui/components/inputs/form/pickers/RangeInput";
import {
  RangeSliderTrackRoot,
  TickMappedRangeSliderChrome,
} from "packages/ui/components/inputs/form/preferences/TickMappedRangeSliderFrame";
import {
  getRangeSliderThumbClass,
  RANGE_SLIDER_HIT_HEIGHT,
} from "packages/ui/components/inputs/form/preferences/tickMappedRangeSliderShared";
import { Box } from "packages/ui/components/structure/primitives";
import { Text } from "packages/ui/components/structure/primitives";

type LandingRangeInputProps = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
};

function valueToPercent(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return ((value - min) / (max - min)) * 100;
}

function percentToValue(percent: number, min: number, max: number, step: number): number {
  const raw = min + (percent / 100) * (max - min);
  const stepped = Math.round(raw / step) * step;
  return Math.min(max, Math.max(min, stepped));
}

export function LandingRangeInput({
  id,
  label,
  min,
  max,
  step,
  value,
  formatValue,
  onChange,
}: LandingRangeInputProps) {
  const sliderValue = useMemo(() => valueToPercent(value, min, max), [value, min, max]);
  const displayValue = formatValue ? formatValue(value) : String(value);
  const trackHeight = spacing(2);
  const thumbClass = getRangeSliderThumbClass(false);

  const handleSliderChange = (event: { target: { value: string } }) => {
    const next = percentToValue(parseFloat(event.target.value), min, max, step);
    onChange(next);
  };

  const valueBlock = (
    <Box className="flex min-h-5 w-full min-w-0 flex-row items-center justify-start">
      <Text className="text-text-primary truncate text-sm font-medium tabular-nums">
        {displayValue}
      </Text>
    </Box>
  );

  return (
    <TickMappedRangeSliderChrome header={valueBlock}>
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
            id={id}
            min={0}
            max={100}
            step={0.5}
            value={sliderValue}
            onChange={handleSliderChange}
            label={label}
            transparentTrack
            className={thumbClass}
          />
        </Box>
      </RangeSliderTrackRoot>
    </TickMappedRangeSliderChrome>
  );
}
